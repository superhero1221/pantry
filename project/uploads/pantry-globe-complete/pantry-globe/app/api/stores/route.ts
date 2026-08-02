import { NextRequest, NextResponse } from 'next/server';
import { classify, haversineKm } from '@/lib/stores';
import { statusFrom } from '@/lib/hours';
import type { Store } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Global mirrors only. Regional instances (e.g. overpass.osm.ch, which serves
// Switzerland alone) answer 200 with zero elements for the rest of the world and
// would silently look like "no shops here" — so they are deliberately excluded.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const SHOPS = 'supermarket|convenience|grocery|greengrocer|butcher|seafood|deli|health_food|wholesale|general';

/**
 * Race every mirror at once and take the first useful answer.
 * Overpass instances vary from ~1 s to ~30 s under load, so querying them in
 * series makes the worst mirror set the latency. Racing costs three cheap
 * requests and returns at the speed of the fastest.
 */
async function overpass(q: string): Promise<any> {
  const errors: string[] = [];
  const empties: any[] = [];

  const attempt = (url: string) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'PantryGlobe/1.0' },
      body: 'data=' + encodeURIComponent(q),
      signal: AbortSignal.timeout(14000),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`${new URL(url).host} -> ${r.status}`);
      const j = await r.json();
      // A 200 with no elements can be a genuinely empty area OR a mirror with
      // partial coverage. Reject it here so the race keeps waiting for a real
      // answer, but keep it as a last resort.
      if (!j?.elements?.length) { empties.push(j); throw new Error(`${new URL(url).host} -> empty`); }
      return j;
    });

  try {
    return await Promise.any(
      ENDPOINTS.map((u) => attempt(u).catch((e) => { errors.push(String(e?.message ?? e)); throw e; })),
    );
  } catch {
    if (empties.length) return empties[0];
    throw new Error(errors.join('; ') || 'all overpass mirrors failed');
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = parseFloat(sp.get('lat') ?? '');
  const lon = parseFloat(sp.get('lon') ?? '');
  const radius = Math.min(parseInt(sp.get('radius') ?? '4000', 10) || 4000, 15000);
  const tzOffsetMin = parseInt(sp.get('tz') ?? '0', 10) || 0;

  if (!isFinite(lat) || !isFinite(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  const q = `[out:json][timeout:20];
(
  nwr["shop"~"^(${SHOPS})$"](around:${radius},${lat},${lon});
  nwr["amenity"="marketplace"](around:${radius},${lat},${lon});
);
out center tags 120;`;

  try {
    const data = await overpass(q);
    // Store-local "now" from a UTC baseline plus the caller's offset.
    const nowUtc = Date.now();
    const localNow = new Date(nowUtc + tzOffsetMin * 60000);
    // statusFrom() reads getDay()/getHours(), which are host-local. Normalise via UTC getters.
    const shifted = new Date(
      localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(),
      localNow.getUTCHours(), localNow.getUTCMinutes(),
    );

    const seen = new Set<string>();
    const stores: Store[] = [];

    for (const el of data.elements ?? []) {
      const t = el.tags ?? {};
      const name: string = t.name || t.brand || t.operator || '';
      if (!name) continue;
      const eLat = el.lat ?? el.center?.lat;
      const eLon = el.lon ?? el.center?.lon;
      if (typeof eLat !== 'number' || typeof eLon !== 'number') continue;

      const key = `${name.toLowerCase()}|${eLat.toFixed(3)}|${eLon.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const kind = t.shop || (t.amenity === 'marketplace' ? 'marketplace' : 'grocery');
      const { tier, tierLabel } = classify(name + ' ' + (t.brand ?? ''), kind);
      const st = statusFrom(t.opening_hours, shifted);

      stores.push({
        id: `${el.type}/${el.id}`,
        name,
        kind,
        brand: t.brand,
        lat: eLat,
        lon: eLon,
        distanceKm: Math.round(haversineKm(lat, lon, eLat, eLon) * 100) / 100,
        openNow: st.openNow,
        hoursRaw: t.opening_hours,
        closesAt: st.closesAt,
        minutesUntilClose: st.minutesUntilClose,
        tier,
        tierLabel,
      });
    }

    stores.sort((a, b) => a.distanceKm - b.distanceKm);
    return NextResponse.json(
      { stores: stores.slice(0, 60), count: stores.length, source: 'OpenStreetMap via Overpass' },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=900' } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'store lookup failed', detail: String(e?.message ?? e) }, { status: 502 });
  }
}
