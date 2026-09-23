import { css } from '../lib/css';
import { Btn } from './Btn';
import type { Pantry } from '../state/usePantry';

export function Nav({ v }: { v: Pantry }) {
  return (
    <nav className="pg-nav">
      <div className="pg-navlist" style={css('display:flex;gap:4px')}>
        {v.nav.map((n) => (
          <Btn
            key={n.key}
            onClick={n.go}
            aria-current={n.on ? 'page' : undefined}
            css={n.style}
            hover={n.hover}
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
