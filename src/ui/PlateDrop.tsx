import { useEffect, useRef, useState } from 'react';
import { css } from '../lib/css';

/**
 * The plate slot from the After screen — drop a photo on it, or tap to browse.
 * The image never leaves the device; it is read into an object URL and thrown
 * away when the component goes, which is the whole promise the copy makes.
 */
export function PlateDrop({
  src,
  placeholder,
  onPick,
}: {
  src: string | null;
  placeholder: string;
  onPick: (url: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const owned = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (owned.current) URL.revokeObjectURL(owned.current);
    },
    [],
  );

  const take = (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (owned.current) URL.revokeObjectURL(owned.current);
    owned.current = URL.createObjectURL(file);
    onPick(owned.current);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files?.[0]);
      }}
      style={css(
        'width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s;background:' +
          (over ? '#ffe4cd' : '#fdf0e3'),
      )}
      onClick={() => input.current?.click()}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={css('width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.92)')}
        />
      ) : (
        <div style={css('display:flex;flex-direction:column;align-items:center;gap:10px;padding:0 26px;text-align:center')}>
          <span style={css('width:46px;height:46px;border-radius:50%;background:#efdcc8;display:flex;align-items:center;justify-content:center')}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#847462"
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15V6a2 2 0 0 0-2-2h-3l-1.5-2h-5L8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14" />
              <circle cx="12" cy="12" r="3.4" />
            </svg>
          </span>
          <span dir="auto" style={css('font-size:13.5px;font-weight:600;color:#6a5c4c;line-height:1.45;text-wrap:pretty')}>
            {placeholder}
          </span>
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={(e) => take(e.target.files?.[0])}
        style={css('position:absolute;width:1px;height:1px;opacity:0;pointer-events:none')}
      />
    </div>
  );
}
