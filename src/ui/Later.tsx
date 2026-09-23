import { useDeferredValue, type ReactNode } from 'react';

/**
 * Nothing on the first commit; its children in a deferred render straight
 * after, which React may interrupt if a tap comes in first. Lets a long list
 * paint its top before its tail without the screen holding any state.
 *
 * Renders no element of its own, so what it wraps stays a direct child of the
 * parent — a grid or a `> *` rule sees the same children as before.
 */
export function Later({ children }: { children: ReactNode }) {
  const now = useDeferredValue(true, false);
  return now ? <>{children}</> : null;
}
