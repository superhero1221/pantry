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
node scripts/jev/run.mjs all --max-usd=0.25

# The harness's own tests (offline, not part of the app's vitest run)
node --test scripts/jev/lib.test.mjs scripts/jev/gate.test.mjs
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

## CI gate

`gate.mjs` runs on every push and pull request that touches `src/data/**`, `src/lib/diets.ts`, `src/lib/diet-audit.js` or `scripts/jev/**` (workflow **Jev gate**, `.github/workflows/jev-gate.yml`). Every Monday it also does a full run.

**What it checks.** It imports the app's own data at the base commit and at HEAD (`snapshot.mjs`, one process each) and compares canonical JSON, so a comment or a moved line counts as no change and a price-only edit is not sent to Jev. The base is the pull request's merge base, or the commit before the push, or `HEAD~1`. Jev is asked only about:
- recipes whose name, ingredients, method or tags changed, or whose `meetsDiet()` answer changed. It is asked only about the diets the app says the dish **meets**, because Jev can add a caution but never remove one. If `diets.ts`, `diet-audit.js` or the `DIETS` list changed, every recipe is re-checked.
- translations that changed, per language. If the English changed, all five languages are asked.

These free checks run over everything, every time: `{placeholder}` mismatches, pork or alcohol words in any recipe's ingredients or method (the word lists are read from `src/data/nopork.test.ts`), and the app's own diet-tag audit.

**What blocks.** Thresholds are in `gate.config.json`:

| finding | block | warn |
|---|---|---|
| the app says a recipe meets a diet, Jev's P(yes) | below 0.10 | 0.10–0.80 |
| a changed translation, Jev's P(same meaning) | below 0.20 | 0.20–0.80 |
| a deterministic failure | always | — |

A finding listed in `gate-baseline.json` with a reason does not block.

**Jev being down never blocks.** No key (a fork, or the secret is not added yet) skips Jev with a notice, and the free checks still run. Network errors and 5xx, after retries, give a warning. The gate stops trying after 10 failures in a row. 401 and 402 give a loud warning ("rotate the key" / "top up credits").

**Cost.** Each run is capped at `--max-usd` (default $0.03). Estimates from real diffs: one recipe plus one translation came to ~$0.0001, and commit `9c7c44f` (40 translation keys) to ~$0.0023. `node scripts/jev/gate.mjs --dry` shows the estimate for your branch and makes no calls. On this branch a full run (every recipe and key) was estimated at ~$0.056, and the weekly run is capped at $0.10.

```sh
node scripts/jev/gate.mjs --dry                   # what would be asked, and the price
node scripts/jev/gate.mjs --mock                  # the whole gate, against the offline fake
node scripts/jev/gate.mjs --base=main --mode=block
node scripts/jev/gate.mjs --mock --base-dir=/tmp/old-copy --head-dir=/tmp/new-copy   # two trees, no git
```

The results are written to `jev-results/gate-summary.md` (the same table the Actions run shows as its job summary) and `jev-results/gate.json`. The workflow uploads both as the `jev-results` artifact.

**Turning Jev on.** Go to Settings → Secrets and variables → Actions → New repository secret. Name it `OPENROUTER_API_KEY` and paste the key. The workflow passes it to the script only as an environment variable. Pull requests from forks never receive it, so they get the free checks only.

**Accepting an exception.** When a block is wrong, or is a deliberate choice:
1. Run `node scripts/jev/gate.mjs --update-baseline` locally (with the key, or `--mock` to see only the deterministic ones). It adds each current block to `gate-baseline.json` with `"reason": "TODO: …"`.
2. Replace every `TODO` with a sentence saying why the finding is acceptable. An entry still marked TODO does not count.
3. Commit it, so the exception is reviewed in the pull request like any other change.

Each entry stores a fingerprint of the content it was accepted for. If that recipe or translation is edited later, the finding comes back. The summary also lists entries that no longer match anything, so they can be removed.

**Report mode and block mode.** `gate.config.json` starts in `"mode": "report"`. In that mode the job never fails, and the summary heading says **WOULD BLOCK** when something would. After a few runs, when every would-block has been fixed or accepted in the baseline, change it to `"mode": "block"`. From then on, a block fails the job. `--mode=report|block` overrides the setting for a single local run.

## How the pick check reads the app

Home's pick comes from `ranked()` inside the `usePantry` hook. That function closes over the cupboard, the extras, the store multiplier, the profile and the level. It cannot be imported, and the harness does not refactor app code, so `app-driver.mjs` asks the app directly:
1. It builds the app into `node_modules/.cache/jev-app` (never `dist/`).
2. It serves the build on 127.0.0.1, with every other host aborted and service workers blocked. The run uses the bundled exchange rates.
3. It seeds `localStorage['pantry.v1']` through `addInitScript`, before the app's first script runs.
4. It reads the `<h1>`, then presses "Show me another" four times.

The seed only takes effect if it goes in before boot and every key passes `SHAPE` in `usePantry.ts`: budget a finite number between 0 and 1000 GBP, level an integer from 1 to 4, diets an array. `seen: true` is what routes boot to Home. After boot, the driver checks that the app kept the diets, time, budget, level and country it was sent, and fails the scenario loudly if it did not.

## The key

- It is read from `process.env.OPENROUTER_API_KEY` **only**. The harness never writes it to disk, and when it prints the key it masks it (`sk-or-v1-…abcd (73 chars)`). Logs and the raw response are scrubbed of anything shaped like a key.
- **Never put it in `src/`**, in a `VITE_*` variable or anywhere else the build can reach. Pantry is a static client-side app, and everything in the bundle is public. The bundle's own licence banner says as much.
- On GitHub, add it as the repository secret `OPENROUTER_API_KEY` and run the **Jev second opinions** workflow from the Actions tab. It only runs when started by hand. The **Jev gate** workflow uses the same secret on every relevant push (see [CI gate](#ci-gate)).
- A key that has been pasted into a chat, an issue or a commit should be treated as exposed. Rotate it on openrouter.ai and put the new one in the secret.
