export type Technique =
  | 'prep'
  | 'soak'
  | 'boil'
  | 'simmer'
  | 'fry'
  | 'toss'
  | 'oven'
  | 'whisk'
  | 'blend'
  | 'drain'
  | 'rest'
  | 'plate';

/**
 * What a step is actually asking you to do, read off its own words.
 *
 * The point is not decoration. On the cook screen you look up from the pan and
 * have to find your place again, and a picture is a faster anchor than a
 * paragraph — which is the whole reason this app shows one step at a time.
 *
 * Matched by POSITION, not by rule order: a step's real action is the verb it
 * opens with. "Soak the noodles … drain them well" is a soak — the draining is
 * an afterthought in the last four words. Taking the first rule that matches
 * anywhere gets that exactly backwards, which is the bug this replaced.
 */
const RULES: [Technique, RegExp][] = [
  ['plate', /\b(serve|onto (two )?(warm )?(plates|bowls)|plate up|straight into (warm )?bowls|slide onto|eat standing|garnish|build them|crumble .* over|scatter the)\b/i],
  ['drain', /\b(drain|strain|tip .* into a colander)\b/i],
  ['soak', /\b(soak|steep|marinate|rehydrate)\b/i],
  ['oven', /\b(oven to|oven for|bake|roast|grill|gas mark|crank the oven|in(to)? the oven|\d+\s*°c)\b/i],
  ['blend', /\b(blend|blitz|process|purée|puree|liquidise)\b/i],
  ['whisk', /\b(whisk|beat the eggs|beat .* with a fork|whip|egg mixture in)\b/i],
  ['boil', /\b(boil|blanch|water on to|pasta (on|into) the water|rice on)\b/i],
  [
    'fry',
    /\b(fry|sear|sauté|saute|sizzle|toast|char|heat (your|the|a) .*(pan|wok)|hottest pan|pan properly hot|frying pan|dry pan|oil in|butter foaming|brown the|in (a|one) (single )?layer|a side|non-stick pan|soften it in|pour the beaten egg|eggs in\b|cook \d+ minutes)\b/i,
  ],
  [
    'toss',
    /\b(toss|stir[- ]fry|keep .* moving|fold |push everything aside|drag the set edges|stir(red)? (it |them )?(constantly|through|for)|combine)\b/i,
  ],
  [
    'simmer',
    /\b(simmer|reduce|thicken|warm the|lid on|lowest heat|low heat|until the sugar dissolves|uncovered \d+ minutes)\b/i,
  ],
  ['rest', /\b(rest|set aside|fridge|chill|uncovered for \d+|nothing will appear to happen|off the heat entirely)\b/i],
  [
    'prep',
    /\b(chop|dice|slice|cut|peel|grate|mince|rinse|line everything up|pat .* dry|season|taste (one|it|before)|lay them|toss them with)\b/i,
  ],
];

/** Best guess at what a step is, falling back to preparation. */
export function techniqueOf(text: string): Technique {
  let best: Technique = 'prep';
  let earliest = Infinity;
  for (const [name, pattern] of RULES) {
    const hit = pattern.exec(text);
    // Strictly earlier, so RULES order still breaks ties between two verbs
    // that open the sentence together.
    if (hit && hit.index < earliest) {
      earliest = hit.index;
      best = name;
    }
  }
  return best;
}
