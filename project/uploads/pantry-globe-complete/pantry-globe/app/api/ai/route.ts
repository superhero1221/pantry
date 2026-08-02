import { NextRequest, NextResponse } from 'next/server';
import { intentPrompt, inventPrompt, extractJson, validateRecipe, FALLBACK_FREE_MODELS } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Thin proxy to OpenRouter.
 *
 * The API key arrives from the user's browser on each request and is used once.
 * It is never persisted, never written to a log line, and no key of ours is
 * involved — this endpoint is useless without one the user supplied.
 *
 * We proxy rather than calling OpenRouter directly from the browser only because
 * OpenRouter's CORS rules make direct browser calls unreliable.
 */

const OR = 'https://openrouter.ai/api/v1';

async function chat(key: string, model: string, system: string, user: string, maxTokens: number) {
  const r = await fetch(`${OR}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'X-Title': 'Pantry Globe',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(90000),
  });
  const text = await r.text();
  if (!r.ok) {
    let msg = text.slice(0, 300);
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch { /* keep raw */ }
    throw new Error(`${r.status}: ${msg}`);
  }
  const j = JSON.parse(text);
  const content = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error('model returned an empty response');
  return content as string;
}

export async function GET() {
  // List the free models currently available, so the picker never goes stale.
  try {
    const r = await fetch(`${OR}/models`, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const free = (j.data ?? [])
      .filter((m: any) => {
        const isFree = m?.id?.endsWith(':free') || (Number(m?.pricing?.prompt) === 0 && Number(m?.pricing?.completion) === 0);
        if (!isFree) return false;
        // Free does not mean usable. OpenRouter's free tier includes image, audio
        // and music models — Lyria will happily be listed and cannot answer a
        // question. Keep only models that emit text.
        const arch = m?.architecture ?? {};
        const outs: string[] = arch.output_modalities ?? [];
        const modality: string = arch.modality ?? '';
        // Must emit text AND NOTHING ELSE. Music and image models list "text" among
        // their outputs too — Google's Lyria declares ["text","audio"] and will
        // happily appear in a chat model picker while being unable to answer.
        if (outs.length) return outs.length === 1 && outs[0] === 'text';
        return /->\s*text$/.test(modality);
      })
      .map((m: any) => ({
        id: m.id as string,
        name: (m.name ?? m.id) as string,
        context: m.context_length ?? 0,
        structured: (m.supported_parameters ?? []).includes('structured_outputs'),
      }))
      // Bigger context is not better here; the prompts are small. What matters is
      // whether the model can reliably return JSON, so rank on declared support
      // for structured output rather than on size or a hardcoded list that goes
      // stale every few months.
      .sort((a: any, b: any) => (b.structured ? 1 : 0) - (a.structured ? 1 : 0) || b.context - a.context)
      .slice(0, 40);
    return NextResponse.json({ models: free.length ? free : FALLBACK_FREE_MODELS.map((id: string) => ({ id, name: id, context: 0 })) });
  } catch {
    return NextResponse.json({ models: FALLBACK_FREE_MODELS.map((id) => ({ id, name: id, context: 0 })) });
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad JSON body' }, { status: 400 }); }

  const key: string = body?.key ?? '';
  const model: string = body?.model || FALLBACK_FREE_MODELS[0];
  const mode: string = body?.mode ?? 'intent';
  const text: string = body?.text ?? '';

  if (!key || !key.startsWith('sk-')) {
    return NextResponse.json({ error: 'no_key', message: 'Add an OpenRouter key in settings. The planner works without it.' }, { status: 400 });
  }
  if (!text.trim()) return NextResponse.json({ error: 'empty request' }, { status: 400 });

  try {
    if (mode === 'intent') {
      const { system, user } = intentPrompt(text);
      const out = await chat(key, model, system, user, 700);
      return NextResponse.json({ intent: extractJson(out) });
    }

    if (mode === 'invent') {
      const { system, user } = inventPrompt(text, Array.isArray(body?.diets) ? body.diets : []);
      const out = await chat(key, model, system, user, 4000);
      const { recipe, dropped, problems } = validateRecipe(extractJson(out));
      if (!recipe) {
        return NextResponse.json(
          { error: 'invalid_recipe', problems, message: 'The model returned something the engine could not price or compute. Try again, or a different model.' },
          { status: 422 },
        );
      }
      return NextResponse.json({ recipe, dropped, problems });
    }

    return NextResponse.json({ error: 'unknown mode' }, { status: 400 });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    const status = /401|403|invalid.*key|No auth/i.test(msg) ? 401 : /429|rate/i.test(msg) ? 429 : 502;
    return NextResponse.json(
      {
        error: 'model_call_failed',
        message:
          status === 401 ? 'OpenRouter rejected that key.'
          : status === 429 ? 'Free-tier rate limit hit. Wait a minute or pick a different free model.'
          : msg,
      },
      { status },
    );
  }
}
