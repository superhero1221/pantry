import type { CSSProperties } from 'react';

/**
 * Lucide geometry at the system's stroke-width of 2.75. Every icon in the
 * design is one of these, so they live together rather than being re-inlined
 * at each call site.
 */
type IconProps = {
  size?: number;
  stroke?: string;
  width?: number;
  style?: CSSProperties;
};

const base = ({ size = 20, stroke = '#201e1d', width = 2.75, style }: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style,
});

/** Directional icons carry .pg-dir so they mirror in right-to-left layouts. */
export const ChevronLeft = (p: IconProps) => (
  <svg {...base(p)} className="pg-dir">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)} className="pg-dir">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const X = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const Info = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const Clock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const Pin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const Search = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const Flame = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const Fridge = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M3 10h18" />
    <path d="M7 6.5v1" />
    <path d="M7 14v2" />
  </svg>
);

export const Bulb = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const Receipt = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2" y="7" width="20" height="14" rx="3" />
    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    <path d="M12 11v6" />
    <path d="M9 14h6" />
  </svg>
);

export const Globe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const CameraOff = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 2l20 20" />
    <path d="M21 15V6a2 2 0 0 0-2-2H9" />
    <path d="M3 6.5V18a2 2 0 0 0 2 2h13" />
  </svg>
);

/** Out of the app and onto your disk, and back again. Neither carries .pg-dir:
 *  down is down in every script. */
export const Download = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <path d="M12 15V3" />
  </svg>
);

export const Upload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <path d="M12 3v12" />
  </svg>
);
