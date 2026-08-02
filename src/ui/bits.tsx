import type { ReactNode } from 'react';
import { Btn } from './Btn';
import { ChevronLeft } from './Icon';

/** The 38px round back control that opens most screens. */
export const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <Btn
    aria-label="Back"
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

/** A dish photograph, washed back into the warm ground the way the system asks. */
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
      width: size ?? '100%',
      height: size ?? '100%',
      borderRadius: radius,
      background: '#eee7db',
      backgroundImage: src ? `url(${src})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'saturate(.82) contrast(.94)',
      ...style,
    }}
  />
);
