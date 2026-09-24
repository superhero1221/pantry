import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJev, decide, jevEnabled, JEV_TIMEOUT_MS, readAnswers } from './jev';

const URL = 'https://fakeproj.supabase.co';
const ANON = 'anon-public-key';

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const craving = {
  ok: true,
  task: 'craving',
  answers: {
    cuisine: 'italian',
    cuisine_confidence: 0.9,
    intents: { quick: 0.95, cheap: 0.1, comforting: 0.9, light: 0.05, high_protein: 0.1, spicy: 0.02, vegetarian_leaning: 0.2 },
  },
  confidence: 0.9,
  ms: 420,
};

afterEach(() => vi.useRealTimers());

describe('the Jev client', () => {
  it('is off in this test build (no VITE_JEV), and off means null with no request', async () => {
    expect(jevEnabled).toBe(false);
    const spy = vi.spyOn(globalThis, 'fetch');
    expect(await decide('craving', 'something cosy')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('needs both the flag and a Supabase project', async () => {
    const fetchImpl = vi.fn(async () => reply(craving));
    for (const cfg of [
      { url: URL, anonKey: ANON },
      { url: URL, anonKey: ANON, flag: '0' },
      { anonKey: ANON, flag: '1' },
      { url: URL, flag: '1' },
      { url: '', anonKey: '', flag: '1' },
    ]) {
      const j = createJev({ ...cfg, fetchImpl });
      expect(j.enabled).toBe(false);
      expect(await j.decide('craving', 'pasta')).toBeNull();
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(createJev({ url: URL, anonKey: ANON, flag: '1', fetchImpl }).enabled).toBe(true);
  });

  it('posts task, input and lang to the function with the anon key, and reads the answers', async () => {
    const fetchImpl = vi.fn(async () => reply(craving));
    const j = createJev({ url: URL + '/', anonKey: ANON, flag: '1', fetchImpl });
    const a = await j.decide('craving', 'something cosy and quick', 'es');
    expect(a).toEqual(craving.answers);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(URL + '/functions/v1/jev-decide');
    expect(JSON.parse(init.body as string)).toEqual({ task: 'craving', input: 'something cosy and quick', lang: 'es' });
    expect((init.headers as Record<string, string>).apikey).toBe(ANON);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('answers from memory the second time, and asks again after a failure', async () => {
    const fetchImpl = vi.fn(async () => reply(craving));
    const j = createJev({ url: URL, anonKey: ANON, flag: '1', fetchImpl });
    await j.decide('craving', 'cosy');
    await j.decide('craving', 'cosy');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const failing = vi.fn(async () => reply({ ok: false, reason: 'timeout' }, 504));
    const k = createJev({ url: URL, anonKey: ANON, flag: '1', fetchImpl: failing });
    expect(await k.decide('craving', 'cosy')).toBeNull();
    expect(await k.decide('craving', 'cosy')).toBeNull();
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it('gives up after 1500 ms with null', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_u: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init!.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
    );
    const j = createJev({ url: URL, anonKey: ANON, flag: '1', fetchImpl: fetchImpl as unknown as typeof fetch });
    let out: unknown = 'pending';
    j.decide('craving', 'slow').then((r) => (out = r));
    await vi.advanceTimersByTimeAsync(JEV_TIMEOUT_MS - 10);
    expect(out).toBe('pending');
    await vi.advanceTimersByTimeAsync(20);
    expect(out).toBeNull();
  });

  it('is null — never a throw — on every kind of failure', async () => {
    const bad: (() => Promise<Response>)[] = [
      async () => {
        throw new TypeError('Failed to fetch');
      },
      async () => reply({ ok: false, reason: 'rate_limited' }, 429),
      async () => new Response('<html>502</html>', { status: 200 }),
      async () => reply({ ok: true, task: 'pantry_item', answers: { vegan: 0.9 } }), // wrong task
      async () => reply({ ok: true, task: 'craving', answers: { cuisine: 42, intents: { quick: 7 } } }),
    ];
    for (const f of bad) {
      const j = createJev({ url: URL, anonKey: ANON, flag: '1', fetchImpl: vi.fn(f) as unknown as typeof fetch });
      await expect(j.decide('craving', 'x')).resolves.toBeNull();
    }
    const throwsSync = (() => {
      throw new Error('sync');
    }) as unknown as typeof fetch;
    await expect(createJev({ url: URL, anonKey: ANON, flag: '1', fetchImpl: throwsSync }).decide('craving', 'y')).resolves.toBeNull();
  });
});

describe('readAnswers', () => {
  it('keeps only values of the promised shape', () => {
    expect(readAnswers('pantry_item', { ok: true, task: 'pantry_item', answers: { vegan: 0.93, halal: 2, kosher: 'no' } })).toMatchObject({
      vegan: 0.93,
      halal: null,
      kosher: null,
    });
    expect(
      readAnswers('price_report', { ok: true, task: 'price_report', answers: { plausible: 0.02, error: 'drop table', error_confidence: 0.9 } }),
    ).toEqual({ plausible: 0.02, error: null, error_confidence: 0.9 });
    expect(readAnswers('craving', { ok: false, reason: 'origin' })).toBeNull();
  });
});
