'use client';

import { useEffect, useState } from 'react';
import type { DietTag, Recipe } from '@/lib/types';
import type { ParsedIntent } from '@/lib/ai';

interface Props {
  diets: DietTag[];
  onIntent: (i: ParsedIntent) => void;
  onRecipe: (r: Recipe, dropped: string[], problems: string[]) => void;
}

export default function AiBar({ diets, onIntent, onRecipe }: Props) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      setKey(window.localStorage.getItem('or_key') ?? '');
      setModel(window.localStorage.getItem('or_model') ?? '');
    } catch { /* ignore */ }
    fetch('/api/ai').then((r) => r.json()).then((j) => {
      setModels(j.models ?? []);
      setModel((m) => m || j.models?.[0]?.id || '');
    }).catch(() => { /* fallbacks are server-side */ });
  }, []);

  const save = (k: string, m: string) => {
    setKey(k); setModel(m);
    try {
      window.localStorage.setItem('or_key', k);
      window.localStorage.setItem('or_model', m);
    } catch { /* ignore */ }
  };

  const ask = async () => {
    if (!text.trim()) return;
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, model, mode: 'intent', text }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.message || j.error); setBusy(false); if (j.error === 'no_key') setOpen(true); return; }

      const intent: ParsedIntent = j.intent;
      if (intent.kind === 'invent' && intent.dishName) {
        setMsg(`Not on the menu — writing “${intent.dishName}” from scratch…`);
        const r2 = await fetch('/api/ai', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, model, mode: 'invent', text: intent.dishName, diets }),
        });
        const j2 = await r2.json();
        if (!r2.ok) { setErr(j2.message || j2.error); setBusy(false); return; }
        onRecipe(j2.recipe, j2.dropped ?? [], j2.problems ?? []);
        setMsg(null); setText('');
      } else {
        if (intent.reply) setMsg(intent.reply);
        onIntent(intent);
        setText('');
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
          placeholder={key ? 'Ask for anything — “5 days, 150g protein, no dairy”' : 'Ask in your own words (needs a free key)'}
          className="panel2 flex-1 px-4 py-3 text-[15px] outline-none placeholder:text-[var(--muted)]"
          style={{ color: 'var(--text)' }}
        />
        <button onClick={ask} disabled={busy} className="btn btn-primary px-4">
          {busy ? '…' : '✦'}
        </button>
        <button onClick={() => setOpen(!open)} className="btn btn-ghost px-3" title="AI settings">⚙</button>
      </div>

      {msg && <p className="text-[13px]" style={{ color: 'var(--accent2)' }}>{msg}</p>}
      {err && <p className="text-[13px]" style={{ color: 'var(--warn)' }}>{err}</p>}

      {open && (
        <div className="panel space-y-3 p-4">
          <div>
            <p className="text-[14px] font-semibold">Optional AI layer</p>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>
              Everything else in this app — planning, pricing, nutrition, substitutions — is plain arithmetic and
              needs no key. This adds two things a language model is better at: understanding a free-text request,
              and writing a dish that isn't in the menu.
            </p>
          </div>

          <label className="block">
            <span className="lbl">OpenRouter API key</span>
            <input
              type="password" value={key} onChange={(e) => save(e.target.value, model)}
              placeholder="sk-or-v1-…"
              className="panel2 mt-1 w-full px-3 py-2 text-[14px] outline-none"
              style={{ color: 'var(--text)' }}
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="lbl">Model — free tiers only</span>
            <select
              value={model} onChange={(e) => save(key, e.target.value)}
              className="panel2 mt-1 w-full px-3 py-2 text-[14px] outline-none"
              style={{ color: 'var(--text)' }}
            >
              {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>

          <p className="text-[11.5px] leading-snug" style={{ color: 'var(--muted)' }}>
            Get a key at <span style={{ color: 'var(--accent)' }}>openrouter.ai/keys</span>. The models listed above
            cost nothing to call. Your key is stored only in this browser and sent with each request — it is never
            saved on the server or logged. Free tiers are rate-limited; if you hit one, wait a minute or switch model.
          </p>

          <p className="rounded-lg p-2.5 text-[11.5px] leading-snug"
            style={{ background: 'rgba(240,180,41,.1)', color: 'var(--warn)' }}>
            A generated dish is checked against the real ingredient table before it's used — anything the engine
            can't price or compute is dropped and reported, so an invented recipe can't quietly fake its macros.
            The cooking instructions themselves are the model's, and are not verified.
          </p>
        </div>
      )}
    </div>
  );
}
