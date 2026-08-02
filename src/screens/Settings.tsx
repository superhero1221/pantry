import { css } from '../lib/css';
import { A, Btn } from '../ui/Btn';
import { Kicker } from '../ui/bits';
import { Globe, Pin } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

export function Settings({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:14px 22px 26px')}>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:0;letter-spacing:-.4px")}
      >
        {v.t.setTitle}
      </h1>

      <Kicker style={{ marginTop: 18 }}>{v.t.setDiet}</Kicker>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:10px')}>
        {v.dietChips.map((d) => (
          <Btn key={d.key} onClick={d.toggle} css={d.style}>
            {d.label}
          </Btn>
        ))}
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.setTier}</Kicker>
      <div style={css('margin-top:10px;padding:18px 20px;border-radius:28px;background:#f9f4ed')}>
        <div dir="auto" style={css('font-size:15px;font-weight:700;line-height:1.35')}>
          {v.skillSummary}
        </div>
        <p dir="auto" style={css('margin:7px 0 0;font-size:13.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}>
          {v.timeSummary}
        </p>
        <Btn
          onClick={v.redoTier}
          css="height:42px;padding:0 20px;border-radius:999px;background:#ebddc5;font-size:14px;font-weight:700;color:#474238;margin-top:13px"
          hover="background:#dcd3c4"
        >
          {v.u.redoTier}
        </Btn>
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.setLang}</Kicker>
      <Btn
        onClick={v.toggleLang}
        css="width:100%;margin-top:10px;padding:16px 18px;border-radius:26px;background:#f9f4ed;display:flex;gap:12px;align-items:center;text-align:start"
        hover="background:#eee7db"
      >
        <Globe size={22} stroke="#645c50" style={{ flex: 'none' }} />
        <span style={css('flex:1;min-width:0;font-size:15.5px;font-weight:700')}>{v.langNative}</span>
        <span style={css('flex:none;font-size:13px;font-weight:600;color:#8c491a')}>{v.u.changeBtn}</span>
      </Btn>
      {v.langOpen && (
        <>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;animation:pgUp .26s ease-out both')}>
            {v.langOptions.map((l) => (
              <Btn key={l.key} onClick={l.pick} css={l.style} lang={l.key}>
                {l.native}
              </Btn>
            ))}
          </div>
          <p dir="auto" style={css('font-size:12.5px;line-height:1.55;color:#82796a;margin:11px 2px 0;text-wrap:pretty')}>
            {v.u.langNote}
          </p>
        </>
      )}

      <Kicker style={{ marginTop: 24 }}>{v.t.setWhere}</Kicker>
      <Btn
        onClick={v.useLocation}
        css="width:100%;margin-top:10px;padding:16px 18px;border-radius:26px;background:#fff2eb;display:flex;gap:12px;align-items:center;text-align:start"
        hover="background:#ffe1d0"
      >
        <Pin size={22} stroke="#b2622d" style={{ flex: 'none' }} />
        <span style={css('flex:1;min-width:0')}>
          <span style={css('display:block;font-size:15px;font-weight:700;color:#643312')}>{v.liveAreaLine}</span>
          <span style={css('display:block;font-size:12.5px;color:#8c491a;margin-top:3px')}>{v.liveShopLine}</span>
        </span>
      </Btn>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:10px')}>
        {v.countryChips.map((c) => (
          <Btn key={c.key} onClick={c.pick} css={c.style}>
            {c.label}
          </Btn>
        ))}
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.setKey}</Kicker>
      <div style={css('margin-top:10px;display:flex;align-items:center;gap:9px;padding-inline:16px 6px;height:54px;border-radius:999px;border:2px solid #dcd3c4;background:#fff')}>
        <input
          value={v.vendorDraft}
          onChange={v.onVendorDraft}
          placeholder={v.t.setKeyHint}
          aria-label={v.t.setKey}
          style={css('flex:1;min-width:0;border:0;outline:none;background:none;font-size:14.5px;font-weight:600')}
        />
        <Btn
          onClick={v.saveVendor}
          css="height:42px;padding:0 18px;border-radius:999px;background:#c67139;color:#fff;font-size:14px;font-weight:700"
          hover="background:#b2622d"
        >
          {v.t.save}
        </Btn>
      </div>
      <p dir="auto" style={css('font-size:12.5px;line-height:1.55;color:#82796a;margin:9px 2px 0;text-wrap:pretty')}>
        {v.u.apiNote}
      </p>

      <Kicker style={{ marginTop: 24 }}>{v.nudgesLabel}</Kicker>
      <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:10px')}>
        {v.toggles.map((t) => (
          <Btn
            key={t.key}
            onClick={t.flip}
            css="display:flex;align-items:center;gap:13px;padding:15px 17px;border-radius:24px;background:#f9f4ed;width:100%;text-align:start"
            hover="background:#eee7db"
          >
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:14.5px;font-weight:700')}>{t.label}</span>
              <span style={css('display:block;font-size:12.5px;color:#82796a;margin-top:3px')}>{t.sub}</span>
            </span>
            <span
              style={css(`flex:none;width:50px;height:30px;border-radius:999px;background:${t.trackBg};position:relative;transition:background .2s`)}
            >
              <span
                style={css(`position:absolute;top:3px;inset-inline-start:${t.knobX};width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(46,43,37,.24);transition:inset-inline-start .2s`)}
              />
            </span>
          </Btn>
        ))}
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.setSources}</Kicker>
      <div style={css('display:flex;flex-direction:column;gap:7px;margin-top:11px')}>
        {v.sources.map((s) => (
          <A
            key={s.key}
            href={s.url}
            target="_blank"
            rel="noopener"
            css="display:flex;gap:11px;align-items:center;padding:14px 16px;border-radius:24px;background:#f9f4ed;text-decoration:none"
            hover="background:#eee7db"
          >
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:14px;font-weight:700;color:#201e1d')}>{s.name}</span>
              <span style={css('display:block;font-size:12px;color:#82796a;margin-top:3px')}>{s.use}</span>
            </span>
            <span style={css('flex:none;padding:4px 10px;border-radius:999px;background:#ebddc5;font-size:10.5px;font-weight:700;color:#645c50')}>
              {s.licence}
            </span>
          </A>
        ))}
      </div>
      <p dir="auto" style={css('font-size:12px;line-height:1.55;color:#82796a;margin:12px 2px 0;text-wrap:pretty')}>
        {v.u.picNote}
      </p>

      <Btn
        onClick={v.restart}
        css="width:100%;height:50px;border-radius:999px;font-size:14.5px;font-weight:700;color:#8c491a;margin-top:14px"
        hover="background:#ffe1d0"
      >
        {v.t.setReset}
      </Btn>
    </div>
  );
}
