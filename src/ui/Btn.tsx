import { useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { css } from '../lib/css';

/**
 * The design gives every interactive element a themed hover tint (the exported
 * markup carries it as `style-hover`). These wrappers take the base and hover
 * declarations as strings and swap between them, so no rule has to be lifted
 * out into a stylesheet to get a `:hover`.
 */
function useHover() {
  const [on, setOn] = useState(false);
  return [
    on,
    {
      onPointerEnter: () => setOn(true),
      onPointerLeave: () => setOn(false),
      onPointerCancel: () => setOn(false),
    },
  ] as const;
}

type BtnProps = {
  css?: string;
  hover?: string;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'>;

export function Btn({ css: base, hover, children, type = 'button', ...rest }: BtnProps) {
  const [on, handlers] = useHover();
  return (
    <button type={type} style={css(on && hover ? base + ';' + hover : base)} {...handlers} {...rest}>
      {children}
    </button>
  );
}

type AProps = {
  css?: string;
  hover?: string;
  children?: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'style'>;

export function A({ css: base, hover, children, ...rest }: AProps) {
  const [on, handlers] = useHover();
  return (
    <a style={css(on && hover ? base + ';' + hover : base)} {...handlers} {...rest}>
      {children}
    </a>
  );
}
