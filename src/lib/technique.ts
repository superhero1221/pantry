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
  ['plate', /\b(serve|onto (two )?(warm )?(plates|bowls)|plate up|straight into (warm )?bowls|slide onto|eat standing|garnish|build them|crumble .* over|scatter the|on the side so|over the top|to the table|into warm bowls|build (it |them )?in a dish|assemble)\b/i],
  ['drain', /\b(drain|strain|tip .* into a colander)\b/i],
  ['soak', /\b(soak|steep|marinate|rehydrate|cover .{0,40} with (warm |hot |cold )?water|leave it to swell)\b/i],
  ['oven', /\b(oven to|oven for|bake|roast|grill|gas mark|crank the oven|in(to)? the oven|\d+\s*°c)\b/i],
  ['blend', /\b(blend|blitz|process|purée|puree|liquidise)\b/i],
  ['whisk', /\b(whisk|beat( the| in)?\b|whip|egg mixture in|work it into a .*paste|mix (the|it)|loosen|slack the|make a (smooth )?(paste|batter))\b/i],
  ['boil', /\b(boil|blanch|water on to|pasta (on|into) the water|rice on|pan of (salted |lightly salted )?water on|into the (boiling|salted) water|bring .* to (the|a) boil|cover(ed)? with water)\b/i],
  [
    'fry',
    /\b(fry|sear|sauté|saute|sizzle|toast|char|render|caramelise|heat (your|the|a) .*(pan|wok)|hottest pan|pan properly hot|frying pan|dry pan|oil in|oil into|butter foaming|melt the (butter|ghee|oil)|brown the|in (a|one) (single )?layer|a side|non-stick pan|soften it in|pour the beaten egg|eggs in\b|cook \d+ minutes|in,? \d+ (minutes?|seconds?)|in for (a|\d+) (minute|second)|until (deep |pale )?gold|,\s*\d+ (minutes?|seconds?)\b|heat (down|up) to|back on the heat|get (a|the) .{0,24}(pan|wok).{0,16}hot|pour in a .{0,12}ladle)\b/i,
  ],
  [
    'toss',
    /\b(toss|stir[- ]fry|keep .* moving|fold |push everything aside|drag the set edges|stir(red)? (it |them )?(constantly|through|for|back|once)|stir (the |in )?\w+ into|combine|mash|coat(ed)? )\b/i,
  ],
  [
    'simmer',
    /\b(simmer|reduce|thicken|warm the|lid (on|slightly ajar)|lowest heat|low heat|until the sugar dissolves|uncovered \d+ minutes|ladle(ful)? of stock|a ladle at a time|stock (in|at a time)|cook (it )?(gently|slowly)|bubble|bring it up|start tasting|tremble)\b/i,
  ],
  // These three cannot live inside the \b(...)\b alternations above: a
  // trailing \b after a full stop or comma never matches, because the position
  // between "." and a space is not a word boundary. "Wine in. Stir until the
  // pan is almost dry" was silently falling through to the chopping board.
  ['fry', /\b\w+ in[.,]\s/i],
  ['boil', /into a (big |large )?pan of (boiling|salted|well-salted) water/i],
  ['plate', /\b(over rice|alongside|in the bottom of|tell whoever is eating|any glaze left)/i],
  ['toss', /\bstir it in one direction/i],
  ['rest', /\b(rest|set aside|fridge|chill|uncovered for \d+|nothing will appear to happen|off the heat|leave it (sealed|alone|to sit|to bleed|to swell|to dissolve|somewhere warm|\d+)|leave (that|them) |at room temperature|stand(ing)? for \d+|cover it)\b/i],
  [
    'prep',
    /\b(chop|dice|slice|cut|peel|grate|mince|rinse|crush|pound|trim|shred|squeeze|halve|line everything up|pat .* dry|season|taste (one|it|before)|lay them|toss them with)\b/i,
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
