import { NextResponse } from 'next/server';
import { RECIPES, applyVariant, nutrition, priceBasket } from '@/lib/engine';
import { NUTRIENTS } from '@/lib/nutrients';
import { getCountry } from '@/lib/countries';
import { buildPlan } from '@/lib/planner';
import type { DietTag } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const missing: string[] = [];
  const out: any[] = [];
  for (const r of RECIPES) {
    for (const it of r.items) if (!NUTRIENTS[it.ref]) missing.push(`${r.id}:${it.ref}`);
    for (const v of r.variants) for (const s of v.swaps) {
      if (!NUTRIENTS[s.from]) missing.push(`${r.id}/${v.id}:from:${s.from}`);
      if (s.to && !NUTRIENTS[s.to]) missing.push(`${r.id}/${v.id}:to:${s.to}`);
    }
    const base = nutrition(r.items, r.servings);
    const gb = priceBasket(r.items, getCountry('GB'), 1, 2, r.servings, new Set());
    out.push({
      id: r.id, items: r.items.length, steps: r.method.length,
      kcal: Math.round(base.kcal), protein: Math.round(base.protein),
      firstCookGBP: +gb.firstCook.toFixed(2), marginalGBP: +gb.marginal.toFixed(2),
      variants: r.variants.map((v) => ({ id: v.id, deltas: v.methodDeltas.length })),
    });
  }

  // ---- planner behaviour across configurations ----
  const gbp = getCountry('GB');
  const plans: any[] = [];
  const configs: { label: string; mealsPerDay: number; days: number; kcal: number; protein: number; diets: DietTag[] }[] = [
    { label: '5d x2 meals, 2000/150', days: 5, mealsPerDay: 2, kcal: 2000, protein: 150, diets: [] },
    { label: '5d x3 meals, 2000/150', days: 5, mealsPerDay: 3, kcal: 2000, protein: 150, diets: [] },
    { label: '7d x3 meals, 2400/180', days: 7, mealsPerDay: 3, kcal: 2400, protein: 180, diets: [] },
    { label: '5d x2 meals, vegan', days: 5, mealsPerDay: 2, kcal: 2000, protein: 120, diets: ['vegan'] },
    { label: '5d x2 meals, halal+gf', days: 5, mealsPerDay: 2, kcal: 2000, protein: 140, diets: ['halal', 'gluten_free'] },
  ];
  for (const c of configs) {
    const p = buildPlan(
      { days: c.days, mealsPerDay: c.mealsPerDay, servings: 2, kcalPerDay: c.kcal, proteinPerDay: c.protein, diets: c.diets, maxRepeats: 2 },
      gbp, 1, new Set(), 7,
    );
    if (!p) { plans.push({ label: c.label, ok: false }); continue; }
    const daily = p.days.map((d) => Math.round(d.totals.kcal));
    const dailyP = p.days.map((d) => Math.round(d.totals.protein));
    plans.push({
      label: c.label, ok: true,
      target: `${c.kcal}kcal/${c.protein}p`,
      avgKcal: Math.round(p.avg.kcal), avgProtein: Math.round(p.avg.protein),
      spread: Math.max(...daily) - Math.min(...daily),
      minDay: Math.min(...daily), maxDay: Math.max(...daily),
      minProtein: Math.min(...dailyP),
      firstCook: +p.firstCook.toFixed(2), naive: +p.naiveFirstCook.toFixed(2),
      overlapSaving: +p.overlapSaving.toFixed(2), shared: p.sharedItems,
      perMeal: +p.perMeal.toFixed(2),
      b12: +p.avg.b12.toFixed(2),
      notes: p.notes.length,
    });
  }

  return NextResponse.json({ recipes: out.length, missingRefs: missing, out, plans });
}
