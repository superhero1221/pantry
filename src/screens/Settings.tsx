import { css } from '../lib/css';
import { A, Btn } from '../ui/Btn';
import { Kicker } from '../ui/bits';
import { ChevronRight, Download, Globe, Pin, Upload } from '../ui/Icon';
import { Account } from '../ui/Account';
import { Device } from '../ui/Device';
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

      <Account v={v} />

      {/* Stats stopped being a tab. It is a readout you land on rather than a
          place you launch from — but it is also where the app tells you what
          it has worked out about you and lets you delete any of it, so it goes
          near the top of You rather than at the bottom with the small print. */}
      <Btn
        onClick={v.statsRow.go}
        css="display:flex;gap:11px;align-items:center;padding:14px 16px;border-radius:24px;background:#f9f4ed;width:100%;text-align:start;margin-top:16px"
        hover="background:#eee7db"
      >
        <span style={css('flex:1;min-width:0')}>
          <span dir="auto" style={css('display:block;font-size:14px;font-weight:700;color:#201e1d')}>
            {v.statsRow.name}
          </span>
          <span dir="auto" style={css('display:block;font-size:12px;color:#645c50;margin-top:3px')}>
            {v.statsRow.sub}
          </span>
        </span>
        <ChevronRight size={18} stroke="#a19786" style={{ flex: 'none' }} />
      </Btn>

      <Kicker style={{ marginTop: 24 }}>{v.t.setDiet}</Kicker>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:10px')}>
        {v.dietChips.map((d) => (
          <Btn key={d.key} onClick={d.toggle} aria-pressed={d.on} css={d.style}>
            {d.label}
          </Btn>
        ))}
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.tierSkill}</Kicker>
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
          {v.t.setRedo}
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
          <p dir="auto" style={css('font-size:12.5px;line-height:1.55;color:#645c50;margin:11px 2px 0;text-wrap:pretty')}>
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
          <span style={css('display:block;font-size:12.5px;color:#8c491a;margin-top:3px')}>{v.liveWhereLine}</span>
        </span>
      </Btn>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:10px')}>
        {v.countryChips.map((c) => (
          <Btn key={c.key} onClick={c.pick} css={c.style}>
            {c.label}
          </Btn>
        ))}
      </div>

      {/* The supermarket price key that used to sit here promised that
          "named-chain shelf prices replace the estimate" — and no code ever
          read the key. A field that stores a secret and changes nothing is
          worse than no field. The three real price sources are on the Shop
          screen, each labelled. */}

      <Kicker style={{ marginTop: 24 }}>{v.nudgesLabel}</Kicker>
      <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:10px')}>
        {v.toggles.map((t) => (
          <Btn
            key={t.key}
            onClick={t.flip}
            aria-pressed={t.on}
            css="display:flex;align-items:center;gap:13px;padding:15px 17px;border-radius:24px;background:#f9f4ed;width:100%;text-align:start"
            hover="background:#eee7db"
          >
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:14.5px;font-weight:700')}>{t.label}</span>
              <span style={css('display:block;font-size:12.5px;color:#645c50;margin-top:3px')}>{t.sub}</span>
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

      <Device v={v} />

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
              <span style={css('display:block;font-size:12px;color:#645c50;margin-top:3px')}>{s.use}</span>
            </span>
            <span style={css('flex:none;display:flex;align-items:center;gap:6px')}>
              {s.note && (
                <span style={css('font-size:10.5px;font-weight:700;color:#a19786;white-space:nowrap')}>
                  {s.note}
                </span>
              )}
              <span style={css('padding:4px 10px;border-radius:999px;background:#ebddc5;font-size:10.5px;font-weight:700;color:#645c50')}>
                {s.licence}
              </span>
            </span>
          </A>
        ))}
      </div>
      {/* The pills above say which licence each source carries. That is a
          label, not a notice: ODbL §4.3 wants it said that the app contains
          information from the source and under what terms, and OpenStreetMap's
          attribution guideline wants the literal words "© OpenStreetMap
          contributors" where a reader will see them. This is that, in the
          reader's own language, and `creditShort` repeats the shortest form of
          it on Locate and on Shop where the data is actually on screen. */}
      <Kicker style={{ marginTop: 24 }}>{v.xt('creditsLabel')}</Kicker>
      <div style={css('margin-top:10px;padding:16px 18px;border-radius:26px;background:#f9f4ed;display:flex;flex-direction:column;gap:9px')}>
        <p dir="auto" style={css('margin:0;font-size:12.5px;line-height:1.55;color:#645c50;text-wrap:pretty')}>
          {v.xt('creditOsm')}
        </p>
        <p dir="auto" style={css('margin:0;font-size:12.5px;line-height:1.55;color:#645c50;text-wrap:pretty')}>
          {v.xt('creditOpenFood')}
        </p>
        <p dir="auto" style={css('margin:0;font-size:12.5px;line-height:1.55;color:#645c50;text-wrap:pretty')}>
          {v.xt('creditOther')}
        </p>
        <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:3px')}>
          <A
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener"
            css="padding:6px 13px;border-radius:999px;background:#ebddc5;font-size:11.5px;font-weight:700;color:#645c50;text-decoration:none"
            hover="background:#dcd3c4"
          >
            openstreetmap.org/copyright
          </A>
          <A
            href="https://opendatacommons.org/licenses/odbl/1-0/"
            target="_blank"
            rel="noopener"
            css="padding:6px 13px;border-radius:999px;background:#ebddc5;font-size:11.5px;font-weight:700;color:#645c50;text-decoration:none"
            hover="background:#dcd3c4"
          >
            ODbL 1.0
          </A>
        </div>
      </div>

      <p dir="auto" style={css('font-size:12px;line-height:1.55;color:#645c50;margin:12px 2px 0;text-wrap:pretty')}>
        {v.u.picNote}
      </p>

      {/* Everything Pantry knows about you is one key in this browser. Clear
          the browser and it is gone — there is no copy anywhere else unless
          you asked for one. These two rows are the way out and the way back,
          and they sit here rather than anywhere else because the row below
          them is the one that throws it all away. */}
      <Kicker style={{ marginTop: 24 }}>{v.xt('dataTitle')}</Kicker>
      <Btn
        onClick={v.exportData}
        css="width:100%;margin-top:10px;padding:16px 18px;border-radius:26px;background:#f9f4ed;display:flex;gap:12px;align-items:center;text-align:start"
        hover="background:#eee7db"
      >
        <Download size={22} stroke="#645c50" style={{ flex: 'none' }} />
        <span style={css('flex:1;min-width:0')}>
          <span style={css('display:block;font-size:15px;font-weight:700')}>{v.xt('dataExport')}</span>
          <span dir="auto" style={css('display:block;font-size:12.5px;line-height:1.45;color:#645c50;margin-top:3px;text-wrap:pretty')}>
            {v.xt('dataExportSub')}
          </span>
        </span>
      </Btn>

      {/* A label, not a Btn: the control that opens a file picker is the file
          input itself, and Btn is a <button>. The input is clipped rather than
          display:none, so it keeps its place in the tab order and gives the row
          its accessible name — this row has to be reachable without a mouse
          like every other one on this screen. */}
      <label style={css('width:100%;margin-top:8px;padding:16px 18px;border-radius:26px;background:#f9f4ed;display:flex;gap:12px;align-items:center;text-align:start;cursor:pointer')}>
        <input
          type="file"
          accept="application/json,.json"
          onChange={v.importData}
          style={css('position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0')}
        />
        <Upload size={22} stroke="#645c50" style={{ flex: 'none' }} />
        <span style={css('flex:1;min-width:0')}>
          <span style={css('display:block;font-size:15px;font-weight:700')}>{v.xt('dataImport')}</span>
          <span dir="auto" style={css('display:block;font-size:12.5px;line-height:1.45;color:#645c50;margin-top:3px;text-wrap:pretty')}>
            {v.xt('dataImportSub')}
          </span>
        </span>
      </label>
      {v.importCloudNote && (
        <p dir="auto" style={css('font-size:12px;line-height:1.55;color:#645c50;margin:9px 2px 0;text-wrap:pretty')}>
          {v.importCloudNote}
        </p>
      )}

      {/* Deliberately directly above Start over: the policy's deletion section
          is about that button, so the reader meets the explanation first. */}
      <Kicker style={{ marginTop: 24 }}>{v.legalKicker}</Kicker>
      <div style={css('display:flex;flex-direction:column;gap:7px;margin-top:11px')}>
        {v.legalLinks.map((l) => (
          <Btn
            key={l.key}
            onClick={l.go}
            css="display:flex;gap:11px;align-items:center;padding:14px 16px;border-radius:24px;background:#f9f4ed;width:100%;text-align:start"
            hover="background:#eee7db"
          >
            <span style={css('flex:1;min-width:0')}>
              <span dir="auto" style={css('display:block;font-size:14px;font-weight:700;color:#201e1d')}>
                {l.name}
              </span>
              <span dir="auto" style={css('display:block;font-size:12px;color:#645c50;margin-top:3px')}>
                {l.sub}
              </span>
            </span>
            <ChevronRight size={18} stroke="#a19786" style={{ flex: 'none' }} />
          </Btn>
        ))}
      </div>

      <Btn
        onClick={v.restart}
        css="width:100%;height:50px;border-radius:999px;font-size:14.5px;font-weight:700;color:#8c491a;margin-top:14px"
        hover="background:#ffe1d0"
      >
        {v.t.setReset}
      </Btn>

      {/* The last thing on the last screen, which is where a copyright line
          belongs: it is a claim rather than an instruction, and nobody came
          here to read it.
          #645c50 rather than the lighter #a19786 the other small print uses —
          at 11.5px this is below the 18.66px the AA large-text rule needs, so
          it is held to 4.5:1 like body text. A notice nobody can read asserts
          nothing.
          Deliberately placed BELOW Start over. It is the one control on this
          screen that throws work away, and it should be the last thing in the
          tab order that does anything.
          The 104px of padding under it is the mascot. .pg-mascot is absolutely
          positioned against the shell rather than the scroller, so it does not
          scroll away — it stands in the trailing corner above the tab bar and
          the last screenful of any long screen passes underneath it. At 41px
          of jar it renders about 92px tall, and without this the last two
          lines of the notice came to rest behind a wooden spoon. Padding is
          the fix rather than a narrower column, because the character is on
          the trailing side and the line is centred: shrinking the text to
          clear it would leave the notice visibly off-centre in English and
          off-centre the other way in Arabic. */}
      <div style={css('margin-top:26px;text-align:center;padding-bottom:104px')}>
        <div dir="auto" style={css('font-size:12px;font-weight:700;color:#645c50')}>
          {v.xt('ownCopy')}
        </div>
        <p
          dir="auto"
          style={css('margin:7px 0 0;font-size:11.5px;line-height:1.55;color:#645c50;text-wrap:pretty')}
        >
          {v.xt('ownMark')}
        </p>
      </div>
    </div>
  );
}
