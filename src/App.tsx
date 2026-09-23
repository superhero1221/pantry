import { Suspense, useEffect } from 'react';
import { css } from './lib/css';
import { usePantry } from './state/usePantry';
import { Boundary } from './ui/Boundary';
import { Mascot } from './ui/Mascot';
import { Nav } from './ui/Nav';
import { Home } from './screens/Home';
import { Welcome } from './screens/Welcome';

/* Two screens ship in the first chunk, because between them they are every
   possible first paint: Welcome if you have never been here, Tonight if you
   have. The other fifteen follow once that first screen is up.

   This is the whole reason screens were built to hold no state — a screen is a
   pure function of the one object the hook returns, so it can be code-split
   without a single other line changing. The service worker keeps each one after
   its first visit, so the cost is paid once and never offline.

   The fifteen live in lazy-screens.tsx, and are fetched in the idle time
   after the first paint, so the walk to one finds it already here. */
import {
  After, Browse, Cook, Diet, Goal, Kitchen, Legal, Level, Locate, Passport,
  Plan, Results, Settings, Shop, Stats, WARM_SETUP, WARM_TABS,
} from './lazy-screens';

export default function App() {
  const v = usePantry();

  /* Every split screen, fetched while nothing else is happening. A few
     kilobytes each, about 25kB for the lot, and the worker keeps them — but
     not on a connection that has asked to save data, where a screen is
     fetched when it is walked to, as before. All asked for in the first idle
     moment rather than one per idle moment, in the order people walk, so an
     early tap is not queued behind fourteen idle waits. Never reportStale(): a
     background fetch failing must not reload the page under someone
     mid-recipe. The real visit meets any failure the way it always did. */
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn && conn.saveData) return;
    // Booting into the setup means the setup is what comes next.
    const list = v.isWelcome || v.isGoal || v.isTier || v.isDiet || v.isLocate ? WARM_SETUP : WARM_TABS;
    const warm = () => {
      for (const s of list) s.preload().catch(() => {});
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(warm, 300);
    return () => globalThis.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per boot
  }, []);

  useEffect(() => {
    document.documentElement.lang = v.lang;
    document.documentElement.dir = v.dir;
  }, [v.lang, v.dir]);
  /* Keyed on the words, not the language: the pack for a language lands a
     beat after the switch, and a title set on the switch stayed English. */
  const docTitle = v.xt('docTitle');
  useEffect(() => {
    document.title = docTitle;
  }, [docTitle]);

  return (
    <div className="pg-page">
      <div className="pg-shell" dir={v.dir} style={css(v.showNav ? '' : '--pg-bottom:10px')}>
        {/* Placement lives in .pg-toast: on a desktop the banner has to clear
            the nav rail, and an inline inset would beat any media query. */}
        {v.notif && (
          <div
            className="pg-toast"
            role="status"
            style={css('animation:pgDrop .34s cubic-bezier(.2,.9,.3,1.2) both')}
          >
            <div style={css('display:flex;gap:11px;align-items:flex-start;padding:13px 14px;border-radius:22px;background:rgba(255,255,255,.93);backdrop-filter:blur(18px);box-shadow:0 12px 32px rgba(46,43,37,.24)')}>
              <div style={css("flex:none;width:34px;height:34px;border-radius:11px;background:#e85d04;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;color:#fff;font-size:17px")}>
                P
              </div>
              <div style={css('min-width:0')}>
                <div style={css('font-size:11.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#847462')}>
                  Pantry · {v.u.nowTag}
                </div>
                <div style={css('font-size:13.5px;line-height:1.4;font-weight:600;margin-top:2px')}>{v.notif}</div>
              </div>
            </div>
          </div>
        )}

        <main className="pg-main pg-scroll" style={css('text-align:start')}>
          {/* One screen throwing takes the screen, not the shell: the nav rail
              below stays tappable, and because the key is the screen, walking
              to another tab is itself the recovery — the boundary remounts and
              the error clears. Screens hold no state of their own, so a
              remount costs nothing. Rendering nothing but its children, this
              adds no element between .pg-main and the screen, so the desktop
              measure rule still lands. */}
          <Boundary lang={v.lang} dir={v.dir} resetKey={v.screen + '/' + v.pickId}>
            {/* Nothing rather than a spinner. Reached now only on the second
                try after a screen's chunk failed to arrive (lazy-screens.tsx);
                a flash of loading furniture would be more disruptive than the
                wait it describes, on an app built for people who lose their
                thread. */}
            <Suspense fallback={null}>
            {v.isWelcome && <Welcome v={v} />}
          {v.isGoal && <Goal v={v} />}
          {v.isTier && <Level v={v} />}
          {v.isDiet && <Diet v={v} />}
          {v.isLocate && <Locate v={v} />}
          {v.isHome && <Home v={v} />}
          {v.isBrowse && <Browse v={v} />}
          {v.isResults && <Results v={v} />}
          {v.isShop && <Shop v={v} />}
          {v.isCook && <Cook v={v} />}
          {v.isAfter && <After v={v} />}
          {v.isKitchen && <Kitchen v={v} />}
          {v.isStats && <Stats v={v} />}
          {v.isPassport && <Passport v={v} />}
          {v.isPlan && <Plan v={v} />}
            {v.isSettings && <Settings v={v} />}
          {v.isLegal && <Legal v={v} />}
            </Suspense>
          </Boundary>
        </main>

        {/* Keyed on the screen so the hop replays every time you arrive
            somewhere: React tears the old one down and mounts a new one, which
            is the only way to restart a CSS animation without a class dance.
            It costs nothing — the character holds no state. */}
        {v.mascot && <Mascot key={v.screen} pose={v.mascotPose} />}

        {v.showNav && <Nav v={v} />}
      </div>

    </div>
  );
}
