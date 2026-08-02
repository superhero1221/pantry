'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RECIPES, applyVariant, nutrition, priceBasket, rankStores,
  recipeMatches, restaurantPrice, RNI,
} from '@/lib/engine';
import { getCountry, fmtMoney } from '@/lib/countries';
import type { DietTag, Store, Recipe } from '@/lib/types';
import type { ParsedIntent } from '@/lib/ai';
import MealPlanner from './MealPlanner';
import AiBar from './AiBar';

type Place = { label: string; lat: number; lon: number; country: string; city?: string };
type Step = 'where' | 'what' | 'plan';

const DIETS: { id: DietTag; label: string }[] = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'halal', label: 'Halal' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'dairy_free', label: 'Dairy-free' },
  { id: 'nut_free', label: 'Nut-free' },
];

const TIER_LABEL: Record<string, string> = {
  discount: 'Discounter',
  standard: 'Supermarket',
  convenience: 'Convenience',
  premium: 'Premium',
  independent: 'Independent',
};

export default function Page() {
  const [step, setStep] = useState<Step>('where');
  const [place, setPlace] = useState<Place | null>(null);
  const [deviceTime, setDeviceTime] = useState(true);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  const [stores, setStores] = useState<Store[] | null>(null);
  const [storeBusy, setStoreBusy] = useState(false);
  const [storeErr, setStoreErr] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);

  const [diets, setDiets] = useState<DietTag[]>([]);
  const [dishId, setDishId] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [servings, setServings] = useState(2);
  const [pantry, setPantry] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'shop' | 'nutrition' | 'cook'>('shop');

  const [mode, setMode] = useState<'dish' | 'plan'>('dish');
  const [extraRecipes, setExtra] = useState<Recipe[]>([]);
  const [planInit, setPlanInit] = useState<Partial<{ days: number; mealsPerDay: number; servings: number; kcalPerDay: number; proteinPerDay: number; budget: number }>>({});
  const [planKey, setPlanKey] = useState(0);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const allRecipes = useMemo(() => [...RECIPES, ...extraRecipes], [extraRecipes]);
  const allById = useCallback((id: string) => allRecipes.find((r) => r.id === id), [allRecipes]);

  // ---- pantry persistence + PWA ------------------------------------------
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('pantry');
      if (raw) setPantry(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* offline shell is optional */ });
    }
  }, []);
  const togglePantry = (ref: string) => {
    setPantry((prev) => {
      const n = new Set(prev);
      n.has(ref) ? n.delete(ref) : n.add(ref);
      try { window.localStorage.setItem('pantry', JSON.stringify([...n])); } catch { /* ignore */ }
      return n;
    });
  };

  // ---- location -----------------------------------------------------------
  const useMyLocation = useCallback(() => {
    setGeoErr(null);
    if (!('geolocation' in navigator)) { setGeoErr('This browser has no location support. Search for a city instead.'); return; }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const r = await fetch(`/api/geo?lat=${lat}&lon=${lon}`);
          const j = await r.json();
          setPlace({ label: j.label ?? 'Your location', lat, lon, country: j.country ?? '', city: j.city });
        } catch {
          setPlace({ label: 'Your location', lat, lon, country: '' });
        }
        setDeviceTime(true);
        setGeoBusy(false);
        setStep('what');
      },
      (err) => {
        setGeoBusy(false);
        setGeoErr(
          err.code === 1
            ? 'Location permission denied. Search for a city instead.'
            : 'Could not get a location fix. Search for a city instead.',
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setGeoBusy(true); setGeoErr(null);
    try {
      const r = await fetch(`/api/geo?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setResults(j.results ?? []);
      if (!j.results?.length) setGeoErr('Nothing found. Try "Stockholm" or "Kuwait City".');
    } catch { setGeoErr('Search failed. Check your connection.'); }
    setGeoBusy(false);
  }, []);

  // ---- stores -------------------------------------------------------------
  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    setStoreBusy(true); setStoreErr(null); setStores(null); setStoreId(null);
    // Store-local clock: device offset when we're actually here, else estimate from longitude.
    const tz = deviceTime ? -new Date().getTimezoneOffset() : Math.round((place.lon / 15) * 60);
    fetch(`/api/stores?lat=${place.lat}&lon=${place.lon}&radius=5000&tz=${tz}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) { setStoreErr(j.detail || j.error); setStores([]); }
        else {
          const ranked = rankStores(j.stores ?? []);
          setStores(ranked);
          setStoreId(ranked[0]?.id ?? null);
        }
        setStoreBusy(false);
      })
      .catch((e) => { if (!cancelled) { setStoreErr(String(e)); setStores([]); setStoreBusy(false); } });
    return () => { cancelled = true; };
  }, [place, deviceTime]);

  // ---- derived ------------------------------------------------------------
  const country = useMemo(() => getCountry(place?.country), [place]);
  const dish = useMemo(() => (dishId ? allById(dishId) ?? null : null), [dishId, allById]);
  const store = useMemo(() => stores?.find((s) => s.id === storeId) ?? null, [stores, storeId]);
  const variant = useMemo(
    () => (dish && variantId ? dish.variants.find((v) => v.id === variantId) ?? null : null),
    [dish, variantId],
  );

  const items = useMemo(() => (dish ? applyVariant(dish, variantId) : []), [dish, variantId]);
  const nutri = useMemo(() => (dish ? nutrition(items, dish.servings) : null), [items, dish]);
  const basket = useMemo(
    () => (dish ? priceBasket(items, country, store?.tier ?? 1, servings, dish.servings, pantry) : null),
    [items, dish, country, store, servings, pantry],
  );

  const visible = useMemo(
    () => allRecipes.map((r) => ({ r, m: recipeMatches(r, diets) })).filter((x) => x.m.ok),
    [diets, allRecipes],
  );

  // ---- AI handlers (optional layer; nothing below depends on it) -----------
  const handleIntent = useCallback((i: ParsedIntent) => {
    if (i.diets?.length) setDiets(i.diets.filter((d): d is DietTag => typeof d === 'string') as DietTag[]);
    if (i.servings) setServings(Math.min(12, Math.max(1, i.servings)));
    if (i.kind === 'plan') {
      setPlanInit({
        days: i.days, mealsPerDay: i.mealsPerDay, servings: i.servings,
        kcalPerDay: i.kcalPerDay, proteinPerDay: i.proteinPerDay, budget: i.budget,
      });
      setPlanKey((k) => k + 1);
      setMode('plan');
      setStep('what');
    } else if (i.kind === 'dish' && i.recipeId && allById(i.recipeId)) {
      setDishId(i.recipeId);
      setVariantId(i.variantId ?? null);
      setTab('shop');
      setStep('plan');
    }
  }, [allById]);

  const handleRecipe = useCallback((r: Recipe, dropped: string[], problems: string[]) => {
    setExtra((prev) => [r, ...prev.filter((x) => x.id !== r.id)]);
    setDishId(r.id); setVariantId(null); setTab('shop'); setStep('plan');
    const bits: string[] = [];
    if (dropped.length) bits.push(`dropped ${dropped.length} ingredient${dropped.length === 1 ? '' : 's'} the engine can't price (${dropped.slice(0, 3).join(', ')})`);
    if (problems.length) bits.push(problems[0]);
    setAiNote(bits.length ? `Generated dish — ${bits.join('; ')}. Costs and macros below are computed from the ingredients that survived validation.` : 'Generated dish. Costs and macros are computed by the engine; the cooking steps are the model\u2019s and are not verified.');
  }, []);

  const restaurantTotal = dish ? restaurantPrice(dish, country) * servings : 0;
  const saved = basket ? restaurantTotal - basket.firstCook : 0;
  const savedRepeat = basket ? restaurantTotal - basket.marginal : 0;

  // ---------------------------------------------------------------- render
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-24 pt-5">
      <Header step={step} setStep={setStep} place={place} country={country.code} />

      {step === 'where' && (
        <Where
          busy={geoBusy} err={geoErr} query={query} setQuery={setQuery} results={results}
          onLocate={useMyLocation} onSearch={search}
          onPick={(p) => { setPlace(p); setDeviceTime(false); setResults([]); setQuery(''); setStep('what'); }}
        />
      )}

      {step === 'what' && (
        <div className="space-y-4">
          <AiBar diets={diets} onIntent={handleIntent} onRecipe={handleRecipe} />

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode('dish')}
              className={`btn ${mode === 'dish' ? 'btn-primary' : 'btn-ghost'} !py-2.5 !text-[14px]`}>One dish</button>
            <button onClick={() => setMode('plan')}
              className={`btn ${mode === 'plan' ? 'btn-primary' : 'btn-ghost'} !py-2.5 !text-[14px]`}>Meal plan</button>
          </div>

          {mode === 'dish' ? (
            <What
              diets={diets} setDiets={setDiets} visible={visible}
              onPick={(r, forcedVariant) => {
                setAiNote(null);
                setDishId(r.id);
                setVariantId(forcedVariant);
                setTab('shop');
                setStep('plan');
              }}
            />
          ) : (
            <>
              <div className="scroll-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {DIETS.map((d) => (
                  <button key={d.id}
                    onClick={() => setDiets(diets.includes(d.id) ? diets.filter((x) => x !== d.id) : [...diets, d.id])}
                    className={`chip whitespace-nowrap ${diets.includes(d.id) ? 'chip-on' : ''}`}>{d.label}</button>
                ))}
              </div>
              <MealPlanner
                key={planKey}
                initial={planInit}
                country={country}
                store={store}
                pantry={pantry}
                togglePantry={togglePantry}
                diets={diets}
                extraRecipes={extraRecipes}
                allById={allById}
                onOpenDish={(rid, vid) => {
                  setAiNote(null);
                  setDishId(rid); setVariantId(vid); setTab('shop'); setStep('plan');
                }}
              />
            </>
          )}
        </div>
      )}

      {step === 'plan' && dish && aiNote && (
        <div className="panel mb-4 p-4" style={{ borderColor: 'var(--warn)' }}>
          <p className="text-[12.5px] leading-snug" style={{ color: 'var(--warn)' }}>✦ {aiNote}</p>
        </div>
      )}

      {step === 'plan' && dish && basket && nutri && (
        <Plan
          dish={dish} variant={variant} variantId={variantId} setVariantId={setVariantId}
          servings={servings} setServings={setServings}
          stores={stores} storeBusy={storeBusy} storeErr={storeErr}
          store={store} setStoreId={setStoreId}
          country={country} basket={basket} nutri={nutri}
          pantry={pantry} togglePantry={togglePantry}
          tab={tab} setTab={setTab}
          restaurantTotal={restaurantTotal} saved={saved} savedRepeat={savedRepeat}
          deviceTime={deviceTime}
          onBack={() => setStep('what')}
        />
      )}

      <footer className="mt-10 space-y-1 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        <p>Shops and opening hours: live from OpenStreetMap. Nutrition: standard food-composition tables.</p>
        <p><strong style={{ color: 'var(--warn)' }}>Prices are estimates</strong>, not live retail data — a UK reference price adjusted by country cost index, store type and exchange rate. Treat them as a guide, not a quote.</p>
      </footer>
    </main>
  );
}

/* ============================ HEADER ============================ */
function Header({ step, setStep, place, country }: {
  step: Step; setStep: (s: Step) => void; place: Place | null; country: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setStep('where')} className="text-left">
          <h1 className="text-[22px] font-bold tracking-tight">
            Pantry<span style={{ color: 'var(--accent)' }}>Globe</span>
          </h1>
        </button>
        {place && (
          <button
            onClick={() => setStep('where')}
            className="chip max-w-[62%] truncate"
            title={place.label}
          >
            📍 {place.city || place.label.split(',')[0]}{country && country !== 'XX' ? ` · ${country}` : ''}
          </button>
        )}
      </div>
      {step === 'where' && (
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Name a dish and a place. Get the shops that are actually open, what the ingredients cost, the full
          macro and micro breakdown, and how to cook it.
        </p>
      )}
    </div>
  );
}

/* ============================ WHERE ============================ */
function Where({ busy, err, query, setQuery, results, onLocate, onSearch, onPick }: {
  busy: boolean; err: string | null; query: string; setQuery: (s: string) => void;
  results: Place[]; onLocate: () => void; onSearch: (q: string) => void; onPick: (p: Place) => void;
}) {
  return (
    <div className="space-y-4">
      <button onClick={onLocate} disabled={busy} className="btn btn-primary w-full">
        {busy ? 'Locating…' : '📍 Use my location'}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
        <span className="lbl">or search a city</span>
        <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); onSearch(query); }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Stockholm, Kuwait City, Mexico City…"
          className="panel2 flex-1 px-4 py-3 text-[15px] outline-none placeholder:text-[var(--muted)]"
          style={{ color: 'var(--text)' }}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-ghost px-5">Go</button>
      </form>

      {err && <p className="text-[13px]" style={{ color: 'var(--warn)' }}>{err}</p>}

      {results.length > 0 && (
        <div className="panel divide-y" style={{ borderColor: 'var(--line)' }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onPick(r)}
              className="block w-full px-4 py-3 text-left text-[14px] hover:bg-white/5"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className="font-medium">{r.city || r.label.split(',')[0]}</span>
              <span className="ml-2 text-[12px]" style={{ color: 'var(--muted)' }}>{r.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="panel p-4 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        <p className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>Works anywhere</p>
        Shop data comes from OpenStreetMap, so any city on earth with mapped shops will return results —
        Stockholm, Lagos, Osaka, Kuwait City. Opening hours are read from the map too, which means a shop
        that is closed right now shows as closed.
      </div>
    </div>
  );
}

/* ============================ WHAT ============================ */
function What({ diets, setDiets, visible, onPick }: {
  diets: DietTag[]; setDiets: (d: DietTag[]) => void;
  visible: { r: Recipe; m: { ok: boolean; via: any } }[];
  onPick: (r: Recipe, variantId: string | null) => void;
}) {
  const toggle = (d: DietTag) =>
    setDiets(diets.includes(d) ? diets.filter((x) => x !== d) : [...diets, d]);

  return (
    <div className="space-y-4">
      <div className="scroll-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {DIETS.map((d) => (
          <button key={d.id} onClick={() => toggle(d.id)}
            className={`chip whitespace-nowrap ${diets.includes(d.id) ? 'chip-on' : ''}`}>
            {d.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="panel p-4 text-[14px]" style={{ color: 'var(--muted)' }}>
          Nothing in the current menu satisfies all of those filters at once. Try removing one.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map(({ r, m }) => (
          <button
            key={r.id}
            onClick={() => onPick(r, m.via?.id ?? null)}
            className="panel p-4 text-left transition hover:border-[var(--accent)] active:scale-[.99]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[16px] font-semibold leading-tight">{r.name}</h3>
              <span className="lbl shrink-0">{r.cuisine}</span>
            </div>
            {r.localName && (
              <p className="mt-0.5 text-[13px]" style={{ color: 'var(--accent)' }}>{r.localName}</p>
            )}
            <p className="mt-2 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>{r.blurb}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
              <span>⏱ {r.totalMin >= 120 ? `${Math.round(r.totalMin / 60)} h` : `${r.totalMin} min`}</span>
              <span>· {r.difficulty}</span>
              <span>· {r.variants.length} variants</span>
            </div>
            {m.via && (
              <p className="mt-2 text-[12px]" style={{ color: 'var(--accent2)' }}>
                ↳ via “{m.via.label}”
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================ PLAN ============================ */
function Plan(p: any) {
  const {
    dish, variant, variantId, setVariantId, servings, setServings,
    stores, storeBusy, storeErr, store, setStoreId, country, basket, nutri,
    pantry, togglePantry, tab, setTab, restaurantTotal, saved, savedRepeat, deviceTime, onBack,
  } = p;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-[13px]" style={{ color: 'var(--muted)' }}>← all dishes</button>

      <div className="panel p-4">
        <h2 className="text-[19px] font-bold leading-tight">{dish.name}</h2>
        {dish.localName && <p className="text-[13px]" style={{ color: 'var(--accent)' }}>{dish.localName}</p>}

        <div className="mt-3 flex items-center justify-between">
          <span className="lbl">Servings</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setServings(Math.max(1, servings - 1))} className="btn btn-ghost h-9 w-9 !px-0">−</button>
            <span className="num w-6 text-center text-[17px] font-semibold">{servings}</span>
            <button onClick={() => setServings(Math.min(12, servings + 1))} className="btn btn-ghost h-9 w-9 !px-0">+</button>
          </div>
        </div>

        {dish.variants.length > 0 && (
          <div className="mt-3">
            <span className="lbl">Version</span>
            <div className="scroll-x mt-2 flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setVariantId(null)}
                className={`chip whitespace-nowrap ${!variantId ? 'chip-on' : ''}`}>Original</button>
              {dish.variants.map((v: any) => (
                <button key={v.id} onClick={() => setVariantId(v.id)}
                  className={`chip whitespace-nowrap ${variantId === v.id ? 'chip-on' : ''}`}>{v.label}</button>
              ))}
            </div>
            {variant?.note && (
              <p className="mt-2 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>{variant.note}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['shop', 'nutrition', 'cook'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} !py-2.5 !text-[14px] capitalize`}>{t}</button>
        ))}
      </div>

      {tab === 'shop' && (
        <Shop
          stores={stores} storeBusy={storeBusy} storeErr={storeErr} store={store} setStoreId={setStoreId}
          country={country} basket={basket} pantry={pantry} togglePantry={togglePantry}
          restaurantTotal={restaurantTotal} saved={saved} savedRepeat={savedRepeat}
          servings={servings} deviceTime={deviceTime}
        />
      )}
      {tab === 'nutrition' && <Nutrition n={nutri} dish={dish} variant={variant} />}
      {tab === 'cook' && <Cook dish={dish} variant={variant} />}
    </div>
  );
}

/* ============================ SHOP ============================ */
function Shop({
  stores, storeBusy, storeErr, store, setStoreId, country, basket, pantry, togglePantry,
  restaurantTotal, saved, savedRepeat, servings, deviceTime,
}: any) {
  const [showAll, setShowAll] = useState(false);
  const open = (stores ?? []).filter((s: Store) => s.openNow === true);
  const shown = showAll ? stores ?? [] : (stores ?? []).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* ---- savings ---- */}
      <div className="panel p-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="lbl">Cook it — buying every pack</span>
            <p className="num text-[26px] font-bold leading-tight">{fmtMoney(basket.firstCook, country)}</p>
          </div>
          <div className="text-right">
            <span className="lbl">Once stocked</span>
            <p className="num text-[26px] font-bold leading-tight" style={{ color: 'var(--accent2)' }}>
              {fmtMoney(basket.marginal, country)}
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-1 border-t pt-3 text-[13px]" style={{ borderColor: 'var(--line)' }}>
          <Row l={`Ordering in (${servings} portion${servings > 1 ? 's' : ''})`} r={fmtMoney(restaurantTotal, country)} muted />
          {saved > 0
            ? <Row l="You save tonight" r={fmtMoney(saved, country)} strong />
            : <Row l="Costs more than ordering in" r={`+${fmtMoney(-saved, country)}`} strong />}
          <Row l="You save every repeat cook" r={fmtMoney(Math.max(0, savedRepeat), country)} strong accent />
          <Row l="Cost per serving, stocked" r={fmtMoney(basket.perServing, country)} muted />
        </div>

        {saved <= 0 && savedRepeat > 0 && (
          <p className="mt-3 rounded-lg p-3 text-[12px] leading-snug"
            style={{ background: 'rgba(76,195,138,.09)', color: 'var(--accent2)' }}>
            Tonight this is more expensive than ordering in — you’re buying a spice rack, not a meal.
            It pays back on the second cook, and every one after that saves about{' '}
            {fmtMoney(savedRepeat, country)}. Roughly{' '}
            {Math.ceil(basket.firstCook / Math.max(savedRepeat, 1))} cook
            {Math.ceil(basket.firstCook / Math.max(savedRepeat, 1)) === 1 ? '' : 's'} to break even.
          </p>
        )}
      </div>

      {/* ---- stores ---- */}
      <div className="panel p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[15px] font-semibold">Where to buy</h3>
          {stores && stores.length > 0 && (
            <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
              {open.length} open · {stores.filter((s: Store) => s.openNow === null).length} unlisted hours
            </span>
          )}
        </div>

        {storeBusy && <p className="loading text-[14px]" style={{ color: 'var(--muted)' }}>Reading the map…</p>}
        {storeErr && <p className="text-[13px]" style={{ color: 'var(--warn)' }}>Shop lookup failed: {storeErr}</p>}
        {stores && stores.length === 0 && !storeBusy && (
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
            No shops mapped within 5 km. Prices below use a standard-supermarket baseline for {country.name}.
          </p>
        )}

        <div className="space-y-2">
          {shown.map((s: Store) => {
            const on = s.id === store?.id;
            return (
              <button key={s.id} onClick={() => setStoreId(s.id)}
                className={`panel2 flex w-full items-center gap-3 p-3 text-left transition ${on ? 'border-[var(--accent)]' : ''}`}>
                <span className="text-[15px]">
                  {s.openNow === true ? '🟢' : s.openNow === false ? '🔴' : '⚪'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{s.name}</span>
                  <span className="block text-[12px]" style={{ color: 'var(--muted)' }}>
                    {TIER_LABEL[s.tierLabel]} · {s.distanceKm.toFixed(1)} km
                    {s.openNow === true && s.minutesUntilClose !== undefined && s.minutesUntilClose < 120 &&
                      ` · closes ${s.closesAt} (${s.minutesUntilClose} min)`}
                    {s.openNow === false && ' · closed now'}
                    {s.openNow === null && ' · hours unknown'}
                  </span>
                </span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=18/${s.lat}/${s.lon}`}
                  target="_blank" rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="chip shrink-0 !px-2.5 !py-1 !text-[11px]"
                >map</a>
              </button>
            );
          })}
        </div>

        {stores && stores.length > 6 && (
          <button onClick={() => setShowAll(!showAll)} className="mt-3 text-[13px]" style={{ color: 'var(--accent)' }}>
            {showAll ? 'Show fewer' : `Show all ${stores.length}`}
          </button>
        )}

        {stores && stores.length > 0 && stores.filter((s: Store) => s.openNow === null).length > stores.length * 0.6 && (
          <p className="mt-3 text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
            Most shops here have no opening hours recorded on OpenStreetMap, so they show as unknown rather
            than being guessed at. Grey means “nobody has mapped it”, not “closed”.
          </p>
        )}

        {!deviceTime && stores && stores.length > 0 && (
          <p className="mt-3 text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
            You searched a place you aren’t in, so opening hours use a time zone estimated from longitude —
            it can be an hour out.
          </p>
        )}
      </div>

      {/* ---- basket ---- */}
      <div className="panel p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h3 className="text-[15px] font-semibold">Basket</h3>
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
            {store ? store.name : `${country.name} baseline`}
          </span>
        </div>
        <p className="mb-3 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
          Tap an item you already own — it drops out of the total and stays remembered.
        </p>

        <div className="space-y-1.5">
          {basket.items.map((it: any) => {
            const owned = pantry.has(it.ref);
            return (
              <button key={it.ref} onClick={() => togglePantry(it.ref)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5">
                <span className="text-[13px]">{owned ? '✅' : '⬜️'}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13.5px] ${owned ? 'line-through opacity-45' : ''}`}>
                    {it.name}{it.optional ? ' (optional)' : ''}
                  </span>
                  {it.note && <span className="block truncate text-[11px]" style={{ color: 'var(--muted)' }}>{it.note}</span>}
                </span>
                <span className="num shrink-0 text-right text-[12px]" style={{ color: 'var(--muted)' }}>
                  {it.grams < 1 ? '<1' : Math.round(it.grams)} g
                </span>
                <span className={`num w-16 shrink-0 text-right text-[13px] font-medium ${owned ? 'opacity-40' : ''}`}>
                  {fmtMoney(it.packPrice, country)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 space-y-1 border-t pt-3 text-[13px]" style={{ borderColor: 'var(--line)' }}>
          <Row l="Packs to buy" r={fmtMoney(basket.firstCook, country)} strong />
          <Row l="Value actually consumed" r={fmtMoney(basket.marginal, country)} muted />
        </div>
        {basket.firstCook > basket.marginal * 1.8 && (
          <p className="mt-3 rounded-lg p-3 text-[12px] leading-snug"
            style={{ background: 'rgba(240,180,41,.1)', color: 'var(--warn)' }}>
            Pack sizes are doing most of the damage here — you’re buying {fmtMoney(basket.firstCook, country)} of
            groceries to consume {fmtMoney(basket.marginal, country)} of them. Most of the difference is spices and
            staples you’ll still have next month.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ l, r, strong, muted, accent }: { l: string; r: string; strong?: boolean; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: muted ? 'var(--muted)' : 'var(--text)' }}>{l}</span>
      <span className={`num ${strong ? 'font-semibold' : ''}`}
        style={{ color: accent ? 'var(--accent2)' : muted ? 'var(--muted)' : 'var(--text)' }}>{r}</span>
    </div>
  );
}

/* ============================ NUTRITION ============================ */
function Nutrition({ n, dish, variant }: any) {
  const micros: [string, number, number, string][] = [
    ['Fibre', n.fibre, RNI.fibre, 'g'],
    ['Iron', n.iron, RNI.iron, 'mg'],
    ['Calcium', n.calcium, RNI.calcium, 'mg'],
    ['Vitamin B12', n.b12, RNI.b12, 'µg'],
    ['Zinc', n.zinc, RNI.zinc, 'mg'],
    ['Vitamin A', n.vitA, RNI.vitA, 'µg'],
    ['Vitamin C', n.vitC, RNI.vitC, 'mg'],
    ['Potassium', n.potassium, RNI.potassium, 'mg'],
  ];
  const sodiumPct = (n.sodium / RNI.sodium) * 100;
  const pE = (n.protein * 4 / Math.max(n.kcal, 1)) * 100;

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <span className="lbl">Per serving{variant ? ` · ${variant.label}` : ''}</span>
        <p className="num mt-1 text-[34px] font-bold leading-none">{Math.round(n.kcal)}<span className="ml-1 text-[15px] font-medium" style={{ color: 'var(--muted)' }}>kcal</span></p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[['Protein', n.protein, 'var(--accent2)'], ['Carbs', n.carb, 'var(--accent)'], ['Fat', n.fat, 'var(--warn)']].map(
            ([label, v, c]: any) => (
              <div key={label} className="panel2 p-3">
                <span className="lbl">{label}</span>
                <p className="num text-[20px] font-bold leading-tight" style={{ color: c }}>{Math.round(v)}<span className="text-[13px]">g</span></p>
              </div>
            ),
          )}
        </div>
        <p className="mt-3 text-[12px]" style={{ color: 'var(--muted)' }}>
          Protein is {Math.round(pE)}% of calories.
          {pE >= 30 ? ' Strong for muscle retention in a deficit.' : pE >= 20 ? ' Reasonable, not high.' : ' Low — pick a higher-protein version if that matters.'}
        </p>
      </div>

      <div className="panel p-4">
        <h3 className="mb-3 text-[15px] font-semibold">Micronutrients</h3>
        <div className="space-y-3">
          {micros.map(([label, val, rni, unit]) => {
            const pct = (val / rni) * 100;
            const col = pct >= 50 ? 'var(--accent2)' : pct >= 20 ? 'var(--warn)' : 'var(--bad)';
            return (
              <div key={label}>
                <div className="mb-1 flex items-baseline justify-between text-[13px]">
                  <span>{label}</span>
                  <span className="num" style={{ color: 'var(--muted)' }}>
                    {val < 10 ? val.toFixed(1) : Math.round(val)} {unit} · <span style={{ color: col }}>{Math.round(pct)}%</span>
                  </span>
                </div>
                <div className="bar"><i style={{ width: `${Math.min(100, pct)}%`, background: col }} /></div>
              </div>
            );
          })}
          <div>
            <div className="mb-1 flex items-baseline justify-between text-[13px]">
              <span>Sodium</span>
              <span className="num" style={{ color: 'var(--muted)' }}>
                {Math.round(n.sodium)} mg · <span style={{ color: sodiumPct > 75 ? 'var(--bad)' : 'var(--muted)' }}>{Math.round(sodiumPct)}% of limit</span>
              </span>
            </div>
            <div className="bar"><i style={{ width: `${Math.min(100, sodiumPct)}%`, background: sodiumPct > 75 ? 'var(--bad)' : 'var(--muted)' }} /></div>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
          Percentages are of UK adult reference intakes. Sodium is shown against the 2.4 g daily limit, not a target.
        </p>
      </div>

      {n.b12 < 0.4 && (
        <div className="panel p-4" style={{ borderColor: 'var(--bad)' }}>
          <p className="text-[13px] leading-snug" style={{ color: 'var(--bad)' }}>
            <strong>B12 warning.</strong> This version delivers {n.b12.toFixed(1)} µg — effectively none.
            Plant-only versions of this dish carry B12 solely from fortified products. If yours isn’t fortified,
            it’s zero, and B12 is the one nutrient a plant-based diet cannot improvise.
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================ COOK ============================ */
function Cook({ dish, variant }: any) {
  const deltas = new Map<number, string[]>();
  if (variant) for (const d of variant.methodDeltas) {
    deltas.set(d.step, [...(deltas.get(d.step) ?? []), d.change]);
  }

  return (
    <div className="space-y-4">
      <div className="panel flex items-center justify-around p-4 text-center">
        {[['Active', `${dish.activeMin} min`], ['Total', dish.totalMin >= 120 ? `${(dish.totalMin / 60).toFixed(1)} h` : `${dish.totalMin} min`], ['Level', dish.difficulty]].map(
          ([l, v]: any) => (
            <div key={l}><span className="lbl">{l}</span><p className="text-[15px] font-semibold">{v}</p></div>
          ),
        )}
      </div>

      {variant && (
        <div className="panel p-4" style={{ borderColor: 'var(--accent)' }}>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
            Cooking “{variant.label}” — {variant.methodDeltas.length} step{variant.methodDeltas.length === 1 ? '' : 's'} change
          </p>
          <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
            Swapping an ingredient without changing the method is how people end up with dry chicken and split
            sauces. The changes are marked in orange below.
          </p>
        </div>
      )}

      <div className="panel divide-y p-0" style={{ borderColor: 'var(--line)' }}>
        {dish.method.map((s: any) => (
          <div key={s.n} className="p-4" style={{ borderColor: 'var(--line)' }}>
            <div className="flex gap-3">
              <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: 'var(--panel2)', color: 'var(--accent)' }}>{s.n}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] leading-relaxed">{s.text}</p>
                {s.minutes && <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>≈ {s.minutes} min</p>}
                {s.tip && (
                  <p className="mt-2 rounded-lg p-2.5 text-[12.5px] leading-snug"
                    style={{ background: 'rgba(76,195,138,.08)', color: 'var(--accent2)' }}>💡 {s.tip}</p>
                )}
                {deltas.get(s.n)?.map((d, i) => (
                  <p key={i} className="mt-2 rounded-lg p-2.5 text-[12.5px] font-medium leading-snug"
                    style={{ background: 'rgba(255,138,76,.12)', color: 'var(--accent)' }}>🔀 {d}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-4">
        <h3 className="mb-3 text-[15px] font-semibold">If it goes wrong</h3>
        <div className="space-y-3">
          {dish.failures.map((f: any, i: number) => (
            <div key={i}>
              <p className="text-[13.5px] font-medium">{f.symptom}</p>
              <p className="text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>{f.cause}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
