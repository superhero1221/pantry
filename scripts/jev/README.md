# Jev second opinions

Three checks that ask TypeSafe's **Jev** decision model (`typesafe/jev-1.13` on OpenRouter) for a second opinion on Pantry. Each one compares Jev's answers with the app's own logic and writes a report for a person to read. None of them changes the app.

| check | what the app says | what Jev is asked | calls (full run) |
|---|---|---|---|
| `diets` | `meetsDiet(recipe, diet)` for 153 recipes × 9 diets | one yes/no per diet, worded to mean what the app means by that diet | 153 |
| `picks` | the real Home screen's pick and the next four, for 40 people | does the pick keep every hard constraint? which of the five fits best? (asked in two orders) | 40 |
| `translations` | every key in `strings`, `pack` and `extra` that exists in all six languages | does each translation say what the English says? | ~668 |

Jev answers with numbers rather than prose: a `noul` is a probability from 0 to 1 (0.5 means it can't tell), and a `choice` is a label with a probability for each option and a confidence. That is what makes the answers sortable.

## Running it

Node 22.18 or newer. No dependencies. Plain `node` runs the app's own TypeScript: Node strips the types, and `ts-hooks.mjs` adds the extensionless imports that Vite normally resolves. The `picks` check also needs Playwright. It is in `node_modules` on the dev machine but **not in package.json** (see the workflow for how CI gets it).

```sh
# No network, no key. Counts calls, estimates tokens and cost, writes three
# sample payloads per check to jev-results/samples/.
node scripts/jev/run.mjs all --dry

# The whole pipeline against a deterministic offline fake of Jev.
node scripts/jev/run.mjs all --mock --limit=5

# For real. The key goes in the environment and nowhere else.
export OPENROUTER_API_KEY=...        # never in a file under src/
node scripts/jev/run.mjs diets --limit=3 --max-usd=0.02   # first: a tiny run
node scripts/jev/run.mjs all --max-usd=0.20

# The harness's own tests (offline, not part of the app's vitest run)
node --test scripts/jev/*.test.mjs
```

Flags: `--dry`, `--mock`, `--limit=N` (the first N calls of each check), `--max-usd=0.5` (for the whole run, all checks together), `--out=jev-results`, `--concurrency=4`, `--no-build` (picks: reuse the last build in `node_modules/.cache/jev-app`).

**Start with a tiny live run.** The response envelope is known only from public examples. The first raw response is saved to `jev-results/raw-first-response.json`. Read it before paying for a full run. The parser (`findAnswers` in `lib.mjs`) tries several envelope shapes. If none of them matches, every answer is recorded as an error and nothing is misread as an opinion.

## Cost

$0.042 per million input tokens. Output tokens are free. A dry run on this branch estimated:

| check | calls | est. input tokens | est. cost |
|---|---|---|---|
| diets | 153 | ~384k | ~$0.016 |
| picks | 40 | ~85k | ~$0.004 |
| translations | 668 | ~988k | ~$0.042 |
| **all** | **861** | **~1.46M** | **~$0.06** |

The estimate is deliberately high: characters ÷ 3.2, plus an allowance per question. After the first live response reports its real usage, the client scales every later estimate by the worst ratio it has seen, for both tokens and price. The key has a **$1 hard cap**. The spend guard defaults to $0.50 and stops the run cleanly *before* a call would take the estimated or reported total past `--max-usd`. The reports are still written, and they mark unanswered calls as skipped.

Failures: 429 and 5xx are retried with exponential backoff (honouring `Retry-After`), up to 5 attempts. The whole run stops on 401/403 (the key was refused, or a proxy refused the host — the message says which), three calls in a row that cannot reach the host at all, 402 (out of credits), 404 (wrong endpoint or model) and five 400s in a row (the request shape is wrong). In each of those cases every later call would fail the same way.

## Reading the reports

Everything goes to `jev-results/` (git-ignored): `<check>.md` for people, `<check>.json` for scripts, `run.log.jsonl` with one line per HTTP response, `raw-first-response.json` (the first successful answer, verbatim), `raw-first-error.json` (the first refusal, if any) and `summary.json`. A dry run also writes `picks-facts.json` and `translations-placeholders.json`, the deterministic parts, which need no Jev.

A mock report opens with a **MOCK RUN** banner. Its answers are hash-derived and mean nothing.

**diets.md** is sorted by severity:
- **APP_SAYS_SAFE_JEV_DISAGREES** means the app says the dish fits and Jev puts it below 0.2. This is the dangerous case: someone who ticked that diet is shown the dish. Check these first.
- **APP_SAYS_UNSAFE_JEV_DISAGREES** means the app says no and Jev puts it above 0.8. It only hides a dish.
- **UNSURE** covers 0.2–0.8. It usually means an ingredient whose status depends on the brand: stock cubes, "Sausages", curry paste.

Every flagged row lists the recipe's full ingredient list and its tags, so a person can settle it. Diet tags are hand-set and authoritative. Jev's answer is evidence for a human decision, not a correction to apply. The wording of each diet is in `DEFS` in `check-diets.mjs` and follows the app's own definitions:
- halal and kosher mean nothing on the list is forbidden, assuming the right butcher
- nut free counts coconut and tahini
- gluten free counts ordinary soy sauce, stock cubes and miso
- vinegar is not alcohol

**picks.md** starts with the deterministic findings, judged by the app's own rules:
- whether the #1 pick breaks a diet or the time limit, or costs more than the budget at the cheapest shop shown
- whether it was *avoidable*: a compliant dish was in the top five
- whether the red diet-clash banner on Home describes the dish actually on the card

Then come Jev's results:
- `pick_ok`, the probability that the #1 pick keeps every hard constraint
- the choice among the top five plus `none`, asked twice with the options in opposite orders. If the two answers differ, that is an **order flip**, and the scenario counts as no opinion. Agreement is measured only on stable answers.
- choice confidences, grouped into TypeSafe's bands: above 0.9 act, 0.5–0.9 confirm, below 0.5 escalate

**translations.md** has one table per language, sorted lowest first. Flagged means below 0.5. Rows from 0.5 to 0.8 are listed as unsure. The placeholder section is deterministic: the set of `{tokens}` in each translation must equal the English set exactly, so every row there is a real bug. Skipped keys are listed with the reason:
- `identical`: all five translations equal the English
- `no-words`: fewer than two letters

## How the pick check reads the app

Home's pick comes from `ranked()` inside the `usePantry` hook. That function closes over the cupboard, the extras, the store multiplier, the profile and the level. It cannot be imported, and the harness does not refactor app code, so `app-driver.mjs` asks the app directly:
1. It builds the app into `node_modules/.cache/jev-app` (never `dist/`).
2. It serves the build on 127.0.0.1, with every other host aborted and service workers blocked. The run uses the bundled exchange rates.
3. It seeds `localStorage['pantry.v1']` through `addInitScript`, before the app's first script runs.
4. It reads the `<h1>`, then presses "Show me another" four times.

The seed only takes effect if it goes in before boot and every key passes `SHAPE` in `usePantry.ts`: budget a finite number between 0 and 1000 GBP, level an integer from 1 to 4, diets an array. `seen: true` is what routes boot to Home. After boot, the driver checks that the app kept the diets, time, budget, level and country it was sent, and fails the scenario loudly if it did not.

## Benchmark and use cases

Two more scripts ask whether Jev is worth using at all. Neither needs a browser. **`JEV-RUN.md`** has the exact order to run everything live, with the cost of each step.

- **`bench.mjs`: Jev vs a normal LLM.** The same states and questions go to Jev and to one or two cheap general models on OpenRouter's chat completions endpoint. The questions come from the checks' own builders, word for word. The models are chosen at run time from `GET /models`: by default the cheapest listed Anthropic Haiku and the cheapest OpenAI `-mini` / Google `-flash`. There are three tasks:
  - diets: 40 seeded recipes × 9 diets
  - picks-style constraint check: 20 scenarios built from pure modules in `bench-tasks.mjs`, where every candidate but the gold one clearly breaks a hard constraint (a coconut-only nut-free break is not counted as clear) and the gold one is a proper dinner for the person's goal and cooking level, so the right answer is exact by construction
  - translations: 60 seeded keys × 5 languages

  Both kinds of model are scored against the app's own diet labels and against hand-verified gold cases in `gold.mjs`: 25 diet cases, and 15 translation cases of which 5 are deliberately broken. The report also covers confident-and-wrong answers, median and p90 latency, tokens, cost, and cost per 1,000 questions. For Jev alone it measures consistency (diets asked twice) and choice order flips. Output goes to `bench.md` and `bench.json`. Flags: `--dry`, `--mock`, `--max-usd=0.30`, `--models=a,b`, `--only=diets|translations|picks`, `--out`.
- **`usecases.mjs`: what Jev could do inside Pantry.** It tests six product jobs against hand-labelled sets in `usecases-data.mjs`:
  - the craving box
  - price-report sanity
  - ingredient-swap safety
  - hidden allergens in cupboard items
  - mood-to-dish
  - feedback triage

  Each job gets an accuracy, a confident-and-wrong count, latency, cost per 1,000 uses, a verdict, and a note on how it would plug in. Every job would run server-side, in a Supabase Edge Function. Output goes to `usecases.md` and `usecases.json`. Flags: `--dry`, `--mock`, `--max-usd=0.05`, `--only=<job>`, `--picks-facts=path`, `--out`.

`llm.mjs` is the OpenRouter chat client (model selection, strict JSON schema, a tolerant reply parser, cost from `usage.cost` or listed prices, and a spend guard shared with Jev). `score.mjs` holds the scoring functions, which do no I/O. Their tests are in `bench.test.mjs`. `--mock` runs everything against fakes, including a fake OpenRouter that serves `/models`. It also lists two made-up dear models, so the "gold-only subset" and "skipped: over budget" paths run too.

## The key

- It is read from `process.env.OPENROUTER_API_KEY` **only**. The harness never writes it to disk, and when it prints the key it masks it (`sk-or-v1-…abcd (73 chars)`). Logs and the raw response are scrubbed of anything shaped like a key.
- **Never put it in `src/`**, in a `VITE_*` variable or anywhere else the build can reach. Pantry is a static client-side app, and everything in the bundle is public. The bundle's own licence banner says as much.
- On GitHub, add it as the repository secret `OPENROUTER_API_KEY` and run the **Jev second opinions** workflow from the Actions tab. It only runs when started by hand.
- A key that has been pasted into a chat, an issue or a commit should be treated as exposed. Rotate it on openrouter.ai and put the new one in the secret.
