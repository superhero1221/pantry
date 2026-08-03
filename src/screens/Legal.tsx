import { css } from '../lib/css';
import { A } from '../ui/Btn';
import { BackBtn, Kicker } from '../ui/bits';
import type { Pantry } from '../state/usePantry';

/**
 * The privacy policy and the terms, as screens rather than a link to a PDF
 * somebody forgot to update. Both render from the same component because they
 * are the same shape: a title, a date, an opening line, and a run of sections.
 *
 * Everything on them is derived in usePantry from the screen you are on, so
 * this file decides nothing about which document it is showing.
 */
export function Legal({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:6px 22px 30px')}>
      <div style={css('margin-inline-start:-6px')}>
        <BackBtn label={v.t.back} onClick={v.back} />
      </div>

      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:8px 0 0;letter-spacing:-.4px")}
      >
        {v.legalTitle}
      </h1>
      <div
        dir="auto"
        style={css('font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#a19786;margin-top:9px')}
      >
        {v.legalUpdated}
      </div>
      <p dir="auto" style={css('font-size:14.5px;line-height:1.55;margin:11px 0 0;color:#645c50;text-wrap:pretty')}>
        {v.legalIntro}
      </p>

      {v.legalSections.map((s) => (
        <section key={s.key}>
          <Kicker style={{ marginTop: 26 }}>{s.heading}</Kicker>
          {s.body.map((para, i) => (
            <p
              key={i}
              dir="auto"
              style={css('font-size:14px;line-height:1.6;margin:9px 0 0;color:#474238;text-wrap:pretty;overflow-wrap:anywhere')}
            >
              {para}
            </p>
          ))}
        </section>
      ))}

      {/* One route out of both documents, and it is a real mailbox or it does
          not belong on the page. */}
      <A
        href={'mailto:' + v.legalContact}
        css="display:block;margin-top:26px;padding:16px 18px;border-radius:26px;background:#fff2eb;font-size:14.5px;font-weight:700;color:#8c491a;text-decoration:none;text-align:center;overflow-wrap:anywhere"
        hover="background:#ffe1d0"
      >
        {v.legalContact}
      </A>
    </div>
  );
}
