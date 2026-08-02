import { useEffect } from 'react';
import { css } from './lib/css';
import { usePantry } from './state/usePantry';
import { Nav } from './ui/Nav';
import { After } from './screens/After';
import { Browse } from './screens/Browse';
import { Cook } from './screens/Cook';
import { Diet } from './screens/Diet';
import { Goal } from './screens/Goal';
import { Home } from './screens/Home';
import { Kitchen } from './screens/Kitchen';
import { Locate } from './screens/Locate';
import { Passport } from './screens/Passport';
import { Plan } from './screens/Plan';
import { Results } from './screens/Results';
import { Settings } from './screens/Settings';
import { Shop } from './screens/Shop';
import { Stats } from './screens/Stats';
import { Tier } from './screens/Tier';
import { Welcome } from './screens/Welcome';

export default function App() {
  const v = usePantry();

  useEffect(() => {
    document.documentElement.lang = v.lang;
    document.documentElement.dir = v.dir;
  }, [v.lang, v.dir]);

  return (
    <div className="pg-page">
      <div className="pg-shell" dir={v.dir}>
        {/* Placement lives in .pg-toast: on a desktop the banner has to clear
            the nav rail, and an inline inset would beat any media query. */}
        {v.notif && (
          <div
            className="pg-toast"
            role="status"
            style={css('animation:pgDrop .34s cubic-bezier(.2,.9,.3,1.2) both')}
          >
            <div style={css('display:flex;gap:11px;align-items:flex-start;padding:13px 14px;border-radius:22px;background:rgba(255,255,255,.93);backdrop-filter:blur(18px);box-shadow:0 12px 32px rgba(46,43,37,.24)')}>
              <div style={css("flex:none;width:34px;height:34px;border-radius:11px;background:#c67139;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;color:#fff;font-size:17px")}>
                P
              </div>
              <div style={css('min-width:0')}>
                <div style={css('font-size:11.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#82796a')}>
                  Pantry · {v.u.nowTag}
                </div>
                <div style={css('font-size:13.5px;line-height:1.4;font-weight:600;margin-top:2px')}>{v.notif}</div>
              </div>
            </div>
          </div>
        )}

        <main className="pg-main pg-scroll" style={css('text-align:start')}>
          {v.isWelcome && <Welcome v={v} />}
          {v.isGoal && <Goal v={v} />}
          {v.isTier && <Tier v={v} />}
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
        </main>

        {v.showNav && <Nav v={v} />}
      </div>

      {/* The card that follows your finger while you drag it into a tier row. */}
      {v.dragging && <div style={css(v.ghostStyle)}>{v.dragLabel}</div>}
    </div>
  );
}
