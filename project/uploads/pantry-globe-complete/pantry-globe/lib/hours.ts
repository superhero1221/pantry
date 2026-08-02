// Pragmatic OSM `opening_hours` parser.
// Handles the ~90% of real-world tags that matter; returns null when it can't be sure.
// Honesty rule: never guess "open" — unknown stays unknown.

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Span { day: number; from: number; to: number } // minutes from midnight

function parseDayToken(tok: string): number[] {
  const t = tok.trim();
  if (!t) return [];
  if (/^(PH|SH)$/i.test(t)) return [];
  const range = t.match(/^([A-Za-z]{2})\s*-\s*([A-Za-z]{2})$/);
  if (range) {
    const a = DAYS.findIndex((d) => d.toLowerCase() === range[1].toLowerCase());
    const b = DAYS.findIndex((d) => d.toLowerCase() === range[2].toLowerCase());
    if (a < 0 || b < 0) return [];
    const out: number[] = [];
    for (let i = a; ; i = (i + 1) % 7) { out.push(i); if (i === b) break; if (out.length > 7) break; }
    return out;
  }
  const idx = DAYS.findIndex((d) => d.toLowerCase() === t.toLowerCase());
  return idx >= 0 ? [idx] : [];
}

function parseTime(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2}):?(\d{2})?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mi = m[2] ? parseInt(m[2], 10) : 0;
  if (h > 48 || mi > 59) return null;
  return h * 60 + mi;
}

export function parseOpeningHours(raw?: string): Span[] | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^24\/7$/.test(s)) return [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, from: 0, to: 1440 }));
  if (/sunrise|sunset|dawn|dusk|week|easter/i.test(s)) return null;

  const spans: Span[] = [];
  let sawRule = false;

  for (const rule of s.split(';')) {
    const r = rule.trim();
    if (!r) continue;
    if (/^(off|closed)$/i.test(r)) continue;

    // "Mo-Sa 08:00-22:00,13:00-18:00"  |  "08:00-22:00"  |  "Su off"
    const m = r.match(/^([A-Za-z,\s-]*?)\s*((?:\d{1,2}:?\d{0,2}\s*-\s*\d{1,2}:?\d{0,2})(?:\s*,\s*\d{1,2}:?\d{0,2}\s*-\s*\d{1,2}:?\d{0,2})*|off|closed)$/i);
    if (!m) continue;

    const dayPart = m[1].trim();
    const timePart = m[2].trim();

    let days: number[] = [];
    if (!dayPart) days = [0, 1, 2, 3, 4, 5, 6];
    else for (const tok of dayPart.split(',')) days.push(...parseDayToken(tok));
    if (!days.length) continue;

    if (/^(off|closed)$/i.test(timePart)) { sawRule = true; continue; }

    for (const tr of timePart.split(',')) {
      const [a, b] = tr.split('-');
      const from = parseTime(a);
      let to = parseTime(b);
      if (from === null || to === null) continue;
      if (to <= from) to += 1440; // crosses midnight
      sawRule = true;
      for (const d of days) spans.push({ day: d, from, to });
    }
  }
  return sawRule ? spans : null;
}

export interface HoursStatus {
  openNow: boolean | null;
  closesAt?: string;
  minutesUntilClose?: number;
  opensAt?: string;
}

const hhmm = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** `now` must already be in the STORE's local time. */
export function statusFrom(raw: string | undefined, now: Date): HoursStatus {
  const spans = parseOpeningHours(raw);
  if (!spans) return { openNow: null };

  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();

  for (const sp of spans) {
    // today's spans, plus yesterday's spans that ran past midnight
    const starts = [
      { d: sp.day, off: 0 },
      { d: (sp.day + 1) % 7, off: 1440 },
    ];
    for (const st of starts) {
      if (st.d !== day) continue;
      const from = sp.from - st.off;
      const to = sp.to - st.off;
      if (mins >= from && mins < to) {
        return { openNow: true, closesAt: hhmm(sp.to), minutesUntilClose: to - mins };
      }
    }
  }

  // find the next opening today
  const todays = spans.filter((sp) => sp.day === day && sp.from > mins).sort((a, b) => a.from - b.from);
  if (todays.length) return { openNow: false, opensAt: hhmm(todays[0].from) };

  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const next = spans.filter((sp) => sp.day === d).sort((a, b) => a.from - b.from)[0];
    if (next) return { openNow: false, opensAt: `${DAYS[d]} ${hhmm(next.from)}` };
  }
  return { openNow: false };
}
