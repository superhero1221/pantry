import type { Technique } from '../lib/technique';

/**
 * A drawing of what this step is doing, in the design system's own language:
 * flat warm shapes, terracotta against sage, the same 2.75 stroke the icons
 * use. Not photographs — these are diagrams, and a diagram of "toss it hard"
 * reads at arm's length across a kitchen in a way a photograph of someone
 * else's wok does not.
 *
 * When a step carries a real photograph (`step.pic`), that wins and this is
 * never drawn. The hook is there for when the dishes get shot properly.
 */

const ACCENT = '#c67139';
const ACCENT_D = '#8c491a';
const SAGE = '#8fa073';
const SAGE_D = '#56633f';
const CREAM = '#f5ead8';
const SAND = '#ebddc5';
const INK = '#474238';

const stroke = {
  fill: 'none',
  strokeWidth: 2.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Steam, used by everything that is hot. */
const Steam = ({ x = 0, delay = 0 }: { x?: number; delay?: number }) => (
  <g opacity="0.55" transform={`translate(${x} 0)`}>
    <path d="M52 30c4-5-4-9 0-14" stroke={ACCENT_D} {...stroke} strokeWidth={2.4}>
      <animate
        attributeName="opacity"
        values="0.15;0.7;0.15"
        dur="3.2s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </path>
  </g>
);

const Pan = ({ children }: { children?: React.ReactNode }) => (
  <>
    <path d="M22 56h56a4 4 0 0 1 4 4c0 12-11 20-32 20S18 72 18 60a4 4 0 0 1 4-4z" fill={INK} />
    <path d="M82 60h18a5 5 0 0 1 0 10h-4" stroke={INK} {...stroke} />
    {children}
  </>
);

const Pot = ({ children }: { children?: React.ReactNode }) => (
  <>
    <path d="M24 48h52v22a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10V48z" fill={INK} />
    <rect x="18" y="42" width="64" height="7" rx="3.5" fill={INK} />
    {children}
  </>
);

const scenes: Record<Technique, React.ReactNode> = {
  prep: (
    <>
      <path d="M12 74h76" stroke={SAND} {...stroke} strokeWidth={6} />
      <circle cx="34" cy="60" r="12" fill={SAGE} />
      <circle cx="34" cy="60" r="6" fill={CREAM} opacity=".55" />
      <circle cx="56" cy="63" r="9" fill={ACCENT} opacity=".9" />
      <path d="M64 26l18 18-8 8-18-18z" fill={INK} />
      <path d="M56 34l8-8" stroke={CREAM} {...stroke} strokeWidth={2} />
      <path d="M46 52l10 10" stroke={INK} {...stroke} />
    </>
  ),
  soak: (
    <>
      <path d="M20 40h60v30a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V40z" fill={SAND} />
      <path d="M20 56c8-5 12 5 20 0s12 5 20 0 12 5 20 0v14a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V56z" fill={SAGE} opacity=".85" />
      <path d="M34 62c6 4 10-2 16 2s10-2 16 2" stroke={CREAM} {...stroke} strokeWidth={2.2} opacity=".7" />
      <circle cx="66" cy="30" r="3" fill={ACCENT} opacity=".8">
        <animate attributeName="cy" values="30;44;30" dur="3s" repeatCount="indefinite" />
      </circle>
    </>
  ),
  boil: (
    <Pot>
      <path d="M30 54c7-4 11 4 18 0s11 4 18 0" stroke={CREAM} {...stroke} strokeWidth={2.4} opacity=".75" />
      <circle cx="42" cy="64" r="3.5" fill={CREAM} opacity=".55" />
      <circle cx="58" cy="70" r="2.5" fill={CREAM} opacity=".45" />
      <Steam x={-8} />
      <Steam x={10} delay={1.1} />
    </Pot>
  ),
  simmer: (
    <Pot>
      <rect x="22" y="38" width="56" height="6" rx="3" fill={ACCENT} />
      <path d="M34 62c6 3 10-3 16 0s10-3 16 0" stroke={CREAM} {...stroke} strokeWidth={2.2} opacity=".6" />
      <Steam x={2} delay={0.4} />
    </Pot>
  ),
  fry: (
    <Pan>
      <ellipse cx="45" cy="63" rx="11" ry="7" fill={ACCENT} />
      <ellipse cx="62" cy="66" rx="9" ry="6" fill={ACCENT_D} opacity=".85" />
      <path d="M38 60c3-2 6 1 9-1" stroke={CREAM} {...stroke} strokeWidth={2} opacity=".6" />
      <Steam x={-4} />
    </Pan>
  ),
  toss: (
    <Pan>
      <ellipse cx="50" cy="64" rx="20" ry="8" fill={SAGE} opacity=".9" />
      <circle cx="42" cy="40" r="4.5" fill={ACCENT} />
      <circle cx="56" cy="32" r="3.5" fill={SAGE_D} />
      <circle cx="66" cy="42" r="4" fill={ACCENT_D} />
      <path d="M34 44c4-9 14-14 24-14" stroke={ACCENT} {...stroke} strokeWidth={2.2} opacity=".55" strokeDasharray="4 6" />
    </Pan>
  ),
  oven: (
    <>
      <rect x="16" y="22" width="68" height="58" rx="9" fill={INK} />
      <rect x="24" y="34" width="52" height="34" rx="6" fill={ACCENT_D} />
      <rect x="24" y="34" width="52" height="34" rx="6" fill={ACCENT} opacity=".55">
        <animate attributeName="opacity" values="0.35;0.75;0.35" dur="3.6s" repeatCount="indefinite" />
      </rect>
      <rect x="30" y="52" width="40" height="7" rx="3.5" fill={CREAM} opacity=".75" />
      <circle cx="70" cy="27" r="2.6" fill={CREAM} opacity=".8" />
      <rect x="24" y="72" width="52" height="4" rx="2" fill={CREAM} opacity=".3" />
    </>
  ),
  whisk: (
    <>
      <path d="M26 50h48v18a12 12 0 0 1-12 12H38a12 12 0 0 1-12-12V50z" fill={SAND} />
      <ellipse cx="50" cy="50" rx="24" ry="7" fill={ACCENT} opacity=".9" />
      <path d="M62 14v22" stroke={INK} {...stroke} />
      <path d="M62 36c-6 4-6 12 0 16 6-4 6-12 0-16z" fill={INK} />
      <path d="M56 40c0 6 3 10 6 12M68 40c0 6-3 10-6 12" stroke={CREAM} {...stroke} strokeWidth={1.8} opacity=".55" />
      <animateTransform
        attributeName="transform"
        type="rotate"
        values="-6 62 20;6 62 20;-6 62 20"
        dur="1.6s"
        repeatCount="indefinite"
      />
    </>
  ),
  blend: (
    <>
      <path d="M32 24h36l-4 44a10 10 0 0 1-10 9H46a10 10 0 0 1-10-9L32 24z" fill={SAND} />
      <path d="M36 46h28l-2 22a10 10 0 0 1-10 9h-4a10 10 0 0 1-10-9l-2-22z" fill={ACCENT} />
      <rect x="28" y="18" width="44" height="7" rx="3.5" fill={INK} />
      <rect x="30" y="80" width="40" height="8" rx="4" fill={INK} />
      <path d="M44 58l12-8M44 50l12 8" stroke={CREAM} {...stroke} strokeWidth={2} opacity=".65">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 50 54;360 50 54"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </path>
    </>
  ),
  drain: (
    <>
      <path d="M22 34h56c0 18-12 30-28 30S22 52 22 34z" fill={SAND} />
      <circle cx="38" cy="44" r="2.6" fill={CREAM} />
      <circle cx="50" cy="48" r="2.6" fill={CREAM} />
      <circle cx="62" cy="44" r="2.6" fill={CREAM} />
      <path d="M40 70v6M50 70v10M60 70v6" stroke={SAGE} {...stroke} strokeWidth={2.6}>
        <animate attributeName="opacity" values="0.25;1;0.25" dur="1.4s" repeatCount="indefinite" />
      </path>
      <ellipse cx="50" cy="30" rx="28" ry="6" fill={ACCENT} opacity=".85" />
    </>
  ),
  rest: (
    <>
      <circle cx="50" cy="52" r="28" fill={SAND} />
      <circle cx="50" cy="52" r="22" fill={CREAM} />
      <path d="M50 36v16l11 7" stroke={ACCENT_D} {...stroke} />
      <circle cx="50" cy="52" r="3" fill={ACCENT} />
      <path d="M50 24v-6M78 52h6M50 80v6M22 52h-6" stroke={SAGE_D} {...stroke} strokeWidth={2.4} opacity=".6" />
    </>
  ),
  plate: (
    <>
      <ellipse cx="50" cy="58" rx="34" ry="20" fill={SAND} />
      <ellipse cx="50" cy="55" rx="25" ry="14" fill={CREAM} />
      <ellipse cx="46" cy="53" rx="13" ry="7" fill={ACCENT} />
      <circle cx="58" cy="50" r="4" fill={SAGE} />
      <circle cx="52" cy="60" r="3" fill={SAGE_D} opacity=".8" />
      <path d="M14 30c0 8 3 12 6 14M20 30v14M86 30c0 10-4 12-6 14M80 44v20" stroke={INK} {...stroke} strokeWidth={2.4} opacity=".7" />
    </>
  ),
};

export function StepArt({ technique, size = 96 }: { technique: Technique; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden="true"
      style={{ display: 'block', flex: 'none' }}
    >
      {scenes[technique]}
    </svg>
  );
}
