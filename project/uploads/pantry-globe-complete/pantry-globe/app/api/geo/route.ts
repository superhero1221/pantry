import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA = { 'User-Agent': 'PantryGlobe/1.0 (grocery meal planner)', 'Accept-Language': 'en' };

/**
 * GET /api/geo?lat=&lon=          -> reverse geocode
 * GET /api/geo?q=Stockholm        -> forward search
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q');
  const lat = sp.get('lat');
  const lon = sp.get('lon');

  try {
    if (q) {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error(`nominatim ${r.status}`);
      const j = await r.json();
      const results = (j as any[]).map((x) => ({
        label: x.display_name as string,
        lat: parseFloat(x.lat),
        lon: parseFloat(x.lon),
        country: (x.address?.country_code ?? '').toUpperCase(),
        city: x.address?.city || x.address?.town || x.address?.village || x.address?.municipality || x.name,
      }));
      return NextResponse.json({ results }, { headers: { 'Cache-Control': 's-maxage=86400' } });
    }

    if (lat && lon) {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`;
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error(`nominatim ${r.status}`);
      const x = await r.json();
      return NextResponse.json(
        {
          label: x.display_name,
          country: (x.address?.country_code ?? '').toUpperCase(),
          city: x.address?.city || x.address?.town || x.address?.village || x.address?.suburb || x.address?.county,
        },
        { headers: { 'Cache-Control': 's-maxage=86400' } },
      );
    }

    return NextResponse.json({ error: 'q or lat+lon required' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: 'geocode failed', detail: String(e?.message ?? e) }, { status: 502 });
  }
}
