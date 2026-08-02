import { css } from '../lib/css';
import { Btn } from './Btn';
import type { Pantry } from '../state/usePantry';

export function Nav({ v }: { v: Pantry }) {
  return (
    <nav className="pg-nav">
      <div style={css('display:flex;gap:4px')}>
        {v.nav.map((n) => (
          <Btn
            key={n.key}
            onClick={n.go}
            css={`flex:1;padding:7px 0 5px;border-radius:18px;display:flex;flex-direction:column;align-items:center;gap:4px;color:${n.fg}`}
            hover="background:#eee7db"
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke={n.fg}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={n.d} />
            </svg>
            <span style={css('font-size:10.5px;font-weight:700;letter-spacing:.2px')}>{n.label}</span>
          </Btn>
        ))}
      </div>
    </nav>
  );
}
