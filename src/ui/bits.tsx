import type { ReactNode } from 'react';
import { Btn } from './Btn';
import { ChevronLeft } from './Icon';

/** The 38px round back control that opens most screens. Its label is the only
 *  thing it says, so it comes from the pack like every other piece of copy —
 *  required, so a screen cannot quietly go back to shipping English. */
export const BackBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Btn
    aria-label={label}
    onClick={onClick}
    css="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center"
    hover="background:#eee7db"
  >
    <ChevronLeft size={20} />
  </Btn>
);

/** Onboarding progress — one filled dot for where you are. */
export const Dots = ({ at, of = 5, width = 22 }: { at: number; of?: number; width?: number }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {Array.from({ length: of }, (_, i) => (
      <span
        key={i}
        style={{
          width,
          height: 5,
          borderRadius: 999,
          background: i === at ? '#c67139' : '#dcd3c4',
        }}
      />
    ))}
  </div>
);

/** The small uppercase section label used across every screen. */
export const Kicker = ({
  children,
  color = '#82796a',
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: '.7px',
      textTransform: 'uppercase',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A dish photograph, washed back into the warm ground the way the system asks.
 *
 *  A real `<img>` rather than the background-image this used to be, purely so
 *  that `loading="lazy"` exists to write. Browse lists all hundred and fifty-
 *  three dishes at once and a background image is fetched the moment its
 *  element is laid out, whether or not it is anywhere near the screen — which
 *  made opening Browse an eight-megabyte download to look at four cards. The
 *  frame keeps the size, the radius and the wash so nothing about it looks any
 *  different; the picture inside it now waits its turn.
 *
 *  The filter stays on the frame rather than moving to the image, because two
 *  screens pass their own through `style` and a filter on the parent applies
 *  to the child anyway — putting one in both places would apply it twice. */
export const DishPic = ({
  src,
  size,
  radius,
  style,
}: {
  src?: string;
  size?: number;
  radius: number;
  style?: React.CSSProperties;
}) => (
  <span
    style={{
      flex: 'none',
      display: 'block',
      width: size ?? '100%',
      height: size ?? '100%',
      borderRadius: radius,
      background: '#eee7db',
      overflow: 'hidden',
      filter: 'saturate(.82) contrast(.94)',
      ...style,
    }}
  >
    {src && (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    )}
  </span>
);
