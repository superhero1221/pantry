'use client';

import { useMemo, useState } from 'react';
import { buildPlan, type MealPlan, type PlanTargets } from '@/lib/planner';
import { RNI } from '@/lib/engine';
import { fmtMoney } from '@/lib/countries';
import type { CountryProfile, DietTag, Recipe, Store } from '@/lib/types';

interface Props {
  initial?: Partial<{ days: number; mealsPerDay: number; servings: number; kcalPerDay: number; proteinPerDay: number; budget: number }>;
  country: CountryProfile;
  store: Store | null;
  pantry: Set<string>;
  togglePantry: (ref: string) => void;
  diets: DietTag[];
  extraRecipes: Recipe[];
  allById: (id: string) => Recipe | undefined;
  onOpenDish: (recipeId: string, variantId: string | null) => void;
}

export default function MealPlanner(p: Props) {
  const init = p.initial ?? {};
  const [days, setDays] = useState(init.days ?? 5);
  const [mealsPerDay, setMeals] = useState(init.mealsPerDay ?? 2);
  const [servings, setServings] = useState(init.servings ?? 2);
  const [kcal, setKcal] = useState<number | ''>(init.kcalPerDay ?? 2000);
  const [protein, setProtein] = useState<number | ''>(init.proteinPerDay ?? 150);
  const [budget, setBudget] = useState<number | ''>(init.budget ?? '');
  const [maxRepeats, setMaxRepeats] = useState(2);
  const [seed, setSeed] = useState(7);
  const [tab, setTab] = useState<'days' | 'shop' | 'nutrition'>('days');

  const targets: PlanTargets = useMemo(() => ({
    days, mealsPerDay, servings,
    kcalPerDay: kcal === '' ? undefined : Number(kcal),
    proteinPerDay: protein === '' ? undefined : Number(protein),
    budget: budget === '' ? undefined : Number(budget),
    diets: p.diets, maxRepeats,
  }), [days, mealsPerDay, servings, kcal, protein, budget, p.diets, maxRepeats]);

  const plan: MealPlan | null = useMemo(
    () => buildPlan(targets, p.country, p.store?.tier ?? 1, p.pantry, seed, p.extraRecipes),
    [targets, p.country, p.store, p.pantry, seed, p.extraRecipes],
  );

  return (
    <div className="space-y-4">
      {/* -------- targets -------- */}
      <div className="panel space-y-4 p-4">
        <Stepper label="Days" value={days} min={1} max={14} set={setDays} />
        <Stepper label="Meals per day" value={mealsPerDay} min={1} max={3} set={setMeals} />
        <Stepper label="Servings per meal" value={servings} min={1} max={8} set={setServings} />
        <Stepper label="Repeats allowed" value={maxRepeats} min={1} max={5} set={setMaxRepeats} />

        <div className="grid grid-cols-3 gap-2 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <Field label="kcal / day" value={kcal} set={setKcal} placeholder="any" />
          <Field label="protein g" value={protein} set={setProtein} placeholder="any" />
          <Field label={`budget ${p.country.symbol}`} value={budget} set={setBudget} placeholder="any" />
        </div>

        <button onClick={() => setSeed((s) => s + 1)} className="btn btn-ghost w-full !py-2.5 !text-[14px]">
          🎲 Different plan, same targets
        </button>
      </div>

      {!plan && (
        <p className="panel p-4 text-[14px]" style={{ color: 'var(--warn)' }}>
          No dishes satisfy those diet filters. Remove one and try again.
        </p>
      )}

      {plan && (
        <>
          {/* -------- headline -------- */}
          <div className="panel p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="lbl">Whole shop</span>
                <p className="num text-[24px] font-bold leading-tight">{fmtMoney(plan.firstCook, p.country)}</p>
              </div>
              <div className="text-right">
                <span className="lbl">Per meal</span>
                <p className="num text-[24px] font-bold leading-tight" style={{ color: 'var(--accent2)' }}>
                  {fmtMoney(plan.perMeal, p.country)}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1 border-t pt-3 text-[13px]" style={{ borderColor: 'var(--line)' }}>
              <Row l="Meals covered" r={`${plan.days.length * mealsPerDay} × ${servings} servings`} muted />
              <Row l="Average per day" r={`${Math.round(plan.avg.kcal)} kcal · ${Math.round(plan.avg.protein)} g protein`} />
              {plan.overlapSaving > 0.5 && (
                <Row
                  l={`Saved by sharing ${plan.sharedItems} ingredients`}
                  r={fmtMoney(plan.overlapSaving, p.country)}
                  strong accent
                />
              )}
            </div>

            {plan.overlapSaving > 0.5 && (
              <p className="mt-3 rounded-lg p-3 text-[12px] leading-snug"
                style={{ background: 'rgba(76,195,138,.09)', color: 'var(--accent2)' }}>
                Buying these {plan.days.length * mealsPerDay} meals separately would cost{' '}
                {fmtMoney(plan.naiveFirstCook, p.country)}. Planned together they share {plan.sharedItems} ingredients —
                one bag of rice, one jar of cumin — so the same food costs {fmtMoney(plan.firstCook, p.country)}.
                Planning ahead is worth more than switching supermarket.
              </p>
            )}

            {plan.notes.map((n, i) => (
              <p key={i} className="mt-2 rounded-lg p-3 text-[12px] leading-snug"
                style={n.kind === 'good'
                  ? { background: 'rgba(76,195,138,.09)', color: 'var(--accent2)' }
                  : { background: 'rgba(240,180,41,.1)', color: 'var(--warn)' }}>{n.text}</p>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['days', 'shop', 'nutrition'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} !py-2.5 !text-[14px] capitalize`}>
                {t === 'shop' ? 'Shopping' : t}
              </button>
            ))}
          </div>

          {/* -------- days -------- */}
          {tab === 'days' && (
            <div className="space-y-3">
              {plan.days.map((d, i) => (
                <div key={i} className="panel p-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="text-[15px] font-semibold">Day {i + 1}</h3>
                    <span className="num text-[12px]" style={{ color: 'var(--muted)' }}>
                      {Math.round(d.totals.kcal)} kcal · {Math.round(d.totals.protein)} g P
                    </span>
                  </div>
                  <div className="space-y-2">
                    {d.meals.map((m, j) => {
                      const r = p.allById(m.recipeId);
                      if (!r) return null;
                      const v = m.variantId ? r.variants.find((x) => x.id === m.variantId) : null;
                      return (
                        <button key={j} onClick={() => p.onOpenDish(m.recipeId, m.variantId)}
                          className="panel2 flex w-full items-center gap-3 p-3 text-left">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium">{r.name}</span>
                            <span className="block truncate text-[12px]" style={{ color: 'var(--muted)' }}>
                              {v ? `${v.label} · ` : ''}{r.cuisine} · {r.totalMin >= 120 ? `${Math.round(r.totalMin / 60)} h` : `${r.totalMin} min`}
                            </span>
                          </span>
                          <span className="shrink-0 text-[13px]" style={{ color: 'var(--accent)' }}>›</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* -------- shopping -------- */}
          {tab === 'shop' && (
            <div className="panel p-4">
              <div className="mb-1 flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold">One shop, {plan.shopping.length} items</h3>
                <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
                  {p.store ? p.store.name : `${p.country.name} baseline`}
                </span>
              </div>
              <p className="mb-3 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
                Quantities are summed across every meal, so pack sizes are worked out once for the whole plan.
                Tap anything you already own.
              </p>
              <div className="space-y-1.5">
                {plan.shopping.map((it) => {
                  const owned = p.pantry.has(it.ref);
                  return (
                    <button key={it.ref} onClick={() => p.togglePantry(it.ref)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5">
                      <span className="text-[13px]">{owned ? '✅' : '⬜️'}</span>
                      <span className={`min-w-0 flex-1 truncate text-[13.5px] ${owned ? 'line-through opacity-45' : ''}`}>
                        {it.name}
                      </span>
                      <span className="num shrink-0 text-[12px]" style={{ color: 'var(--muted)' }}>
                        {it.grams < 1 ? '<1' : Math.round(it.grams)} g
                      </span>
                      <span className={`num w-16 shrink-0 text-right text-[13px] font-medium ${owned ? 'opacity-40' : ''}`}>
                        {fmtMoney(it.packPrice, p.country)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1 border-t pt-3 text-[13px]" style={{ borderColor: 'var(--line)' }}>
                <Row l="Packs to buy" r={fmtMoney(plan.firstCook, p.country)} strong />
                <Row l="Value actually consumed" r={fmtMoney(plan.marginal, p.country)} muted />
              </div>
            </div>
          )}

          {/* -------- nutrition -------- */}
          {tab === 'nutrition' && (
            <div className="space-y-4">
              <div className="panel p-4">
                <span className="lbl">Daily average across {plan.days.length} days</span>
                <p className="num mt-1 text-[32px] font-bold leading-none">
                  {Math.round(plan.avg.kcal)}
                  <span className="ml-1 text-[15px] font-medium" style={{ color: 'var(--muted)' }}>kcal</span>
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {([['Protein', plan.avg.protein, 'var(--accent2)'], ['Carbs', plan.avg.carb, 'var(--accent)'], ['Fat', plan.avg.fat, 'var(--warn)']] as const).map(
                    ([label, v, c]) => (
                      <div key={label} className="panel2 p-3">
                        <span className="lbl">{label}</span>
                        <p className="num text-[20px] font-bold leading-tight" style={{ color: c }}>
                          {Math.round(v)}<span className="text-[13px]">g</span>
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="panel p-4">
                <h3 className="mb-3 text-[15px] font-semibold">Micronutrients, daily average</h3>
                <div className="space-y-3">
                  {([
                    ['Fibre', plan.avg.fibre, RNI.fibre, 'g'],
                    ['Iron', plan.avg.iron, RNI.iron, 'mg'],
                    ['Calcium', plan.avg.calcium, RNI.calcium, 'mg'],
                    ['Vitamin B12', plan.avg.b12, RNI.b12, 'µg'],
                    ['Zinc', plan.avg.zinc, RNI.zinc, 'mg'],
                    ['Vitamin A', plan.avg.vitA, RNI.vitA, 'µg'],
                    ['Vitamin C', plan.avg.vitC, RNI.vitC, 'mg'],
                    ['Potassium', plan.avg.potassium, RNI.potassium, 'mg'],
                  ] as [string, number, number, string][]).map(([label, val, rni, unit]) => {
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
                </div>
                <p className="mt-4 text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                  A daily average hides bad days. Check the per-day figures on the Days tab if you're tracking closely.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- small controls ---------------- */
function Stepper({ label, value, min, max, set }: { label: string; value: number; min: number; max: number; set: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="lbl">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => set(Math.max(min, value - 1))} className="btn btn-ghost h-9 w-9 !px-0">−</button>
        <span className="num w-7 text-center text-[17px] font-semibold">{value}</span>
        <button onClick={() => set(Math.min(max, value + 1))} className="btn btn-ghost h-9 w-9 !px-0">+</button>
      </div>
    </div>
  );
}

function Field({ label, value, set, placeholder }: {
  label: string; value: number | ''; set: (v: number | '') => void; placeholder: string;
}) {
  return (
    <label className="block">
      <span className="lbl">{label}</span>
      <input
        type="number" inputMode="numeric" placeholder={placeholder}
        value={value}
        onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))}
        className="panel2 num mt-1 w-full px-3 py-2 text-[15px] outline-none"
        style={{ color: 'var(--text)' }}
      />
    </label>
  );
}

function Row({ l, r, strong, muted, accent }: { l: string; r: string; strong?: boolean; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ color: muted ? 'var(--muted)' : 'var(--text)' }}>{l}</span>
      <span className={`num shrink-0 ${strong ? 'font-semibold' : ''}`}
        style={{ color: accent ? 'var(--accent2)' : muted ? 'var(--muted)' : 'var(--text)' }}>{r}</span>
    </div>
  );
}
