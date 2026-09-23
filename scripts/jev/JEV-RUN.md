# Running the Jev work for real

Copy-paste instructions for a session that **can reach openrouter.ai**. Everything here was built and proven offline with `--dry` and `--mock`. Nothing has touched the network yet.

The key has a **$1 hard cap for everything**. Every command below has its own hard spend guard (`--max-usd`), and the guards add up to well under $1.

| step | estimated (dry run) | hard cap |
|---|---|---|
| tiny live test (diets, 3 recipes) | ~$0.0003 | $0.02 |
| the three checks (diets 153 + picks 40 + translations 724 calls) | ~$0.065 | $0.20 |
| `bench.mjs` (Jev 165 calls + 2 LLMs × 125 calls) | ~$0.12 likely; ~$0.28 if only the dearest small models are listed | $0.30 |
| `usecases.mjs` (Jev, 150 calls) | ~$0.009 | $0.05 |
| optional: moods again, on the real app's top five | ~$0.0005 | $0.02 |
| **total** | **~$0.19 likely; ~$0.35 at the ceiling** | **$0.59** |

**Estimated total cost: about $0.19 (at most ~$0.35 by the dry-run ceiling, never more than the $0.59 sum of the hard caps, optional step included). That is well under the $1 cap.**

Run the steps in order. Stop if a step says STOPPING or exits non-zero, and read the message before you go on.

## 0. Get the branch

```sh
git fetch origin jev-bench            # in a single-branch clone the tip lands only in FETCH_HEAD
git checkout -B jev-bench FETCH_HEAD
git log --oneline -1                  # the jev-bench commit
```

## 1. Install

```sh
npm ci
npm install --no-save playwright@1.62.1     # only the picks check needs it; same version as .github/workflows/jev.yml
npx playwright install --with-deps chromium
```

## 2. The key: environment only

```sh
read -rs OPENROUTER_API_KEY && export OPENROUTER_API_KEY    # paste, press Enter; nothing is echoed
node -e "const k=process.env.OPENROUTER_API_KEY||''; console.log(k.startsWith('sk-or-') ? 'key set, ' + k.length + ' chars' : 'NOT SET')"
```

Never put the key in a file, in `src/`, in a `VITE_*` variable, or in a commit. The scripts read `process.env.OPENROUTER_API_KEY` only and print it masked (`sk-or-v1-…abcd (73 chars)`).

## 3. Tiny live test: check the envelope before spending more

```sh
node scripts/jev/run.mjs diets --limit=3 --max-usd=0.02
cat jev-results/raw-first-response.json | head -80
```

You want `answered 3` and a report `jev-results/diets.md` where rows have real `noul` numbers. The Jev response envelope is known only from public examples. `findAnswers()` in `scripts/jev/lib.mjs` tries `answers`, `results`, `decisions`, `outputs`, `output`, `data.answers`, `data`, then the top level, plus arrays of `{name|question|key|id, answer|result}`.

**If every answer is an error** (the run says `three paid responses in a row had no readable answers`, or `diets.md` lists only ERROR rows):

1. Open `jev-results/raw-first-response.json` and find where the per-question answers are under `response`. Say they are at `response.payload.items`, keyed by question name.
2. In `scripts/jev/lib.mjs`, add that path to the `candidates` list at the top of `findAnswers()`, e.g. `json?.payload?.items,`.
3. If each answer uses a field name the parser does not know, add it in `normaliseAnswer()`. A noul reads `noul`, `value`, `probability` or `p`. A choice reads `choice`, `value` or `label`. A score reads `score` or `value`.
4. Add a test with the real shape to `scripts/jev/lib.test.mjs` (copy the `reads answers from any of the envelopes it knows` test), then run `node --test scripts/jev/*.test.mjs`.
5. Re-run the tiny test above. It costs a fraction of a cent.

If the run stops with **401/403**, the key was refused, or the network refused the host (the message says which). **402** means out of credits. **404** means the endpoint or model id changed: check `ENDPOINT` and `MODEL` at the top of `lib.mjs` against OpenRouter's docs.

## 4. The three checks

```sh
node scripts/jev/run.mjs all --max-usd=0.20
```

This writes `diets.md`, `picks.md`, `translations.md` (+ `.json`) and `summary.json` to `jev-results/`. The picks check builds the app into `node_modules/.cache/jev-app` and drives it with Playwright.

## 5. The benchmark: is Jev worth it versus a normal LLM?

```sh
node scripts/jev/bench.mjs --dry                 # free: re-check the plan and the worst case
node scripts/jev/bench.mjs --max-usd=0.30
```

It lists OpenRouter's models (`GET /api/v1/models`), picks the cheapest listed `anthropic/claude-*haiku*` and the cheapest `openai/gpt-*-mini` / `google/gemini-*-flash*`, and prints both with their prices. It runs the cheaper model first. A model whose worst case for the whole plan does not fit in what is left of the budget falls back to the **gold-only subset** (56 calls). If even that does not fit, the model is **skipped**. The report says which happened. If a group has no usable match (no Haiku listed, say, or only "thinking" models such as gpt-5-mini, whose hidden reasoning would eat the small `max_tokens`), the run prints `WARNING: no model for group ...` and the report names the group; only the other LLM runs. To choose models yourself: `--models=anthropic/claude-3.5-haiku,openai/gpt-4o-mini` (exact ids or `*` globs, one model per entry).

Then read `jev-results/raw-first-llm-*.json` (the first raw reply per model). If a model's answers are all errors in `bench.md`, its replies were not JSON the parser could read (`parseLlmAnswers()` in `llm.mjs`). The rest of the report is still valid.

Output: `jev-results/bench.md` (tables and verdict) and `bench.json`.

## 6. The product use cases

```sh
node scripts/jev/usecases.mjs --dry
node scripts/jev/usecases.mjs --max-usd=0.05
# optional: judge moods against the real app's top five from step 4 instead of the approximation
# node scripts/jev/usecases.mjs --only=moods --max-usd=0.02 --picks-facts=jev-results/picks.json --out=jev-results/moods-real
```

Output: `jev-results/usecases.md` and `usecases.json`.

## 7. Key-leak check: before anything is committed

```sh
# Must print nothing but "clean" three times.
grep -rIlF -- "$OPENROUTER_API_KEY" . --exclude-dir=node_modules --exclude-dir=.git || echo clean
grep -rIlE 'sk-or-v1-[A-Za-z0-9]{20,}' jev-results scripts src || echo clean
git log -p --all | grep -cF -- "$OPENROUTER_API_KEY" | grep -qx 0 && echo clean
```

If any of these prints a file name, **do not commit**. Delete that file, rotate the key on openrouter.ai, and ask why the scrubber missed it.

## 8. Commit the results on their own branch

`jev-results/` is git-ignored on purpose, so it is added with `-f`, on a separate branch cut from `jev-bench`.

```sh
git checkout -b jev-results jev-bench
git add -f jev-results
git status --short | head -40            # only jev-results/ files
git commit -F - <<'EOF'
Add live Jev results: three checks, the LLM benchmark and six use cases

Reports from running scripts/jev (run.mjs all, bench.mjs, usecases.mjs)
against OpenRouter, per scripts/jev/JEV-RUN.md.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016WAVT9RXUvpMQZdHh9kEce
EOF
for d in 0 2 4 8 16; do sleep $d; git push -u origin jev-results && break; done
```

Never push to `implement-pantry-design`.

## What each step spends, and why it cannot run away

- Every client reserves a call's worst case **before** sending it. For Jev that is the estimated input tokens at $0.042/M (output is free). For an LLM it is estimated input at the listed input price plus `max_tokens` at the output price. A call that would take the total past `--max-usd` is not sent. The run stops cleanly and still writes its report. Questions that were never asked are counted as **not run**, never as wrong: a job the guard stopped before gets the verdict "not run", and a partly run one says how many were not run.
- After the first real response, estimates scale up to the worst tokens-per-estimate ratio seen, so an underestimate corrects itself after one call.
- 429/5xx are retried with backoff. 401/402/403/404 stop the run: every later call would fail the same way.
