import { Component, type ErrorInfo, type ReactNode } from 'react';
import { css } from '../lib/css';
import { Btn } from './Btn';
import { xt } from '../data/extra-copy';
import { dirOf } from '../data/pantry-i18n';
import { langOf } from '../lib/crash';
import { exportBackup, readStore } from '../lib/backup';

/**
 * The one class component in Pantry, and it is here because React ships no
 * hook form of this: getDerivedStateFromError is a static method and
 * componentDidCatch an instance method of a class, full stop. Everything else
 * in this app is a function. This is the single exception, not a precedent —
 * if you find yourself reaching for a class anywhere else, you do not need one.
 *
 * It is mounted twice on purpose:
 *
 *   App.tsx   wraps the screen router, so a screen that throws loses the
 *             screen and keeps the shell, the toast and the nav rail. Because
 *             the nav is outside it, walking to another tab is itself the
 *             recovery — resetKey changes and the boundary clears.
 *   main.tsx  wraps App with `shell`, because usePantry() runs inside App's
 *             own render: if the state layer throws there is no .pg-shell yet
 *             to render into, so that copy brings its own.
 *
 * When it is not erroring it renders its children and no element of its own,
 * so the desktop `.pg-main > *` measure rule still selects the screens.
 *
 * It never writes to storage. Not a reset, not a repair, not a helpful clean
 * start. The whole promise of this screen is that your data is still there
 * afterwards, and the surest way to keep it is to have no code here that could
 * break it. The one thing it offers besides a reload is a copy of the file,
 * which is a read.
 */

type Props = {
  children: ReactNode;
  /** Bring your own .pg-page/.pg-shell — for the copy around App, where there
   *  is not one yet. */
  shell?: boolean;
  /** Change this and the error clears. App passes the screen and the dish. */
  resetKey?: string;
  /** From the bag when there is one. Absent means work it out from storage. */
  lang?: string;
  dir?: 'ltr' | 'rtl';
};

type State = { err: Error | null };

export class Boundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    // The component stack goes to the console, not to the screen. It is the
    // one thing here that would help me and mean nothing to you.
    console.error('pantry: a render threw', err, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.err && prev.resetKey !== this.props.resetKey) this.setState({ err: null });
  }

  render() {
    const { err } = this.state;
    if (!err) return this.props.children;

    // If the state layer is what threw, its language never reached us — so
    // fall back to storage, then the browser, then English. Someone crashing
    // on their first ever render has none of the first two, and still gets a
    // page in a language they can probably read.
    const lang = this.props.lang || langOf();
    const dir = this.props.dir || dirOf(lang);
    const x = (k: string) => xt(lang, k);

    const card = (
      <div dir={dir} lang={lang} role="alert" style={css('padding:32px 22px 26px;text-align:start')}>
        <h1
          dir="auto"
          style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:30px;line-height:1.06;margin:0;letter-spacing:-.4px")}
        >
          {x('crashTitle')}
        </h1>
        <p
          dir="auto"
          style={css('margin:12px 0 0;font-size:14.5px;line-height:1.55;color:#6a5c4c;text-wrap:pretty')}
        >
          {x('crashBody')}
        </p>

        <Btn
          onClick={() => window.location.reload()}
          css="width:100%;height:54px;border-radius:999px;background:#a83f06;color:#fff;font-size:16px;font-weight:700;margin-top:20px"
          hover="background:#c04a03"
        >
          {x('crashReload')}
        </Btn>
        {/* A read, never a write. This is the way out of a broken app with
            everything you told it still in your hand. */}
        <Btn
          onClick={() => exportBackup(readStore())}
          css="width:100%;height:48px;border-radius:999px;background:#ffe9d2;color:#3b3229;font-size:14.5px;font-weight:700;margin-top:9px"
          hover="background:#efdcc8"
        >
          {x('crashSave')}
        </Btn>

        <div style={css('margin-top:20px;padding:14px 16px;border-radius:22px;background:#ffffff')}>
          <div style={css('font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#6a5c4c')}>
            {x('crashWhat')}
          </div>
          {/* One line, in the direction the runtime wrote it, wrapping rather
              than overflowing. The stack is in the console. */}
          <div
            dir="ltr"
            style={css('margin-top:6px;font-size:12.5px;line-height:1.5;color:#6a5c4c;overflow-wrap:anywhere')}
          >
            {err.message || String(err)}
          </div>
        </div>
      </div>
    );

    if (!this.props.shell) return card;

    return (
      <div className="pg-page">
        <div className="pg-shell" dir={dir}>
          <main className="pg-main pg-scroll">{card}</main>
        </div>
      </div>
    );
  }
}
