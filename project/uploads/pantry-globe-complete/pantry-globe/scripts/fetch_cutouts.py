#!/usr/bin/env python3
"""
Build photographic ingredient cut-outs that can still be pulled apart.

A photograph of a finished plate cannot have its pasta removed — the pixels
underneath do not exist. But a plate COMPOSED from one photograph per
ingredient can, which is how the one competitor doing this at all does it.

The licence problem is the real one. Commons is mostly CC BY-SA, which is
attribution plus share-alike and contaminates anything derived from it, so this
filters hard to CC0 and public domain only: about 15% of results, which is thin
but workable. Starting from public-domain sources means the cut-outs produced
here are our own derivative works carrying no attribution obligation.

Every image keeps its provenance in cutouts/manifest.json — source URL, title,
licence, author, fetch date. Nobody indemnifies you for these, and that manifest
is the only defence if a claim ever arrives.
"""
import json, io, os, sys, time, urllib.parse, urllib.request
from PIL import Image

UA = {'User-Agent': 'PantryGlobe/1.0 (ingredient cut-outs; solo developer)'}
OUT = os.path.join(os.path.dirname(__file__), '..', 'cutouts')
NO_CREDIT = ('cc0', 'public domain', 'cc-zero', 'no restrictions')

def licence_ok(lic: str):
    """
    Returns (usable, needs_credit).

    The first pass demanded no-attribution licences only, and that failed for a
    reason worth writing down: on Commons, "public domain" overwhelmingly means
    OLD. Copyright expiry is what puts things there, so the CC0/PD pool for food
    is Victorian seed catalogues, botanical engravings and greyscale scans — not
    one usable colour photograph of a tomato.

    Modern colour food photography on Commons is almost entirely CC BY or
    CC BY-SA. Both are usable; the price is a credits screen, and for share-alike
    the cut-outs derived from them carry the same licence onward. That is a real
    obligation and a cheap one, and it is the only automatable route to actual
    photographs.
    """
    l = (lic or '').lower()
    if any(f in l for f in NO_CREDIT):
        return True, False
    if l.startswith('cc by') or l.startswith('cc-by'):
        return True, True
    return False, False

def search(term, limit=40):
    u = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search"
         f"&gsrsearch={urllib.parse.quote(term)}%20filetype:bitmap&gsrnamespace=6&gsrlimit={limit}"
         "&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=900")
    r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40)
    d = json.load(r)
    out = []
    for p in ((d.get('query') or {}).get('pages') or {}).values():
        ii = (p.get('imageinfo') or [{}])[0]
        em = ii.get('extmetadata') or {}
        lic = (em.get('LicenseShortName') or {}).get('value', '')
        ok, credit = licence_ok(lic)
        if not ok:
            continue
        if not ii.get('thumburl'):
            continue
        out.append({
            'title': p.get('title'),
            'thumb': ii['thumburl'],
            'page': ii.get('descriptionurl'),
            'licence': lic, 'needs_credit': credit,
            'author': (em.get('Artist') or {}).get('value', '')[:160],
            'w': ii.get('thumbwidth', 0), 'h': ii.get('thumbheight', 0),
        })
    # squarish and reasonably large first: a wide landscape shot of a field of
    # tomatoes cuts out badly; a single tomato on a plain ground cuts out well
    out.sort(key=lambda c: (abs((c['w'] or 1) / max(c['h'] or 1, 1) - 1), -min(c['w'], c['h'])))
    return out

_last = [0.0]
def fetch(url, tries=3):
    """
    Throttled and backed off. Commons enforces a robot policy and will return
    429 to anything that hammers it — which is fair, it is a donated resource,
    and the correct response is to slow down rather than to route around it.
    """
    for a in range(tries):
        wait = 1.6 - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)
            return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and a < tries - 1:
                time.sleep(6 * (a + 1)); continue
            raise
    raise RuntimeError('gave up')

def colourfulness(img):
    """
    Reject scans and engravings before wasting a background-removal pass on them.
    A monochrome plate of a tomato is technically a picture of a tomato and is
    useless here, and the whole public-domain pool is full of them.
    """
    small = img.convert('RGB').resize((64, 64))
    px = list(small.getdata())
    sat = [(max(p) - min(p)) / 255.0 for p in px]
    return sum(sat) / len(sat)


def cutout(raw, size=180):
    from rembg import remove
    img = Image.open(io.BytesIO(raw)).convert('RGBA')
    img.thumbnail((640, 640), Image.LANCZOS)
    cut = remove(img)
    bbox = cut.getbbox()
    if not bbox:
        return None, 0
    cut = cut.crop(bbox)
    # how much of the frame survived: a cut-out that kept almost everything
    # usually means the remover failed and left the background in
    alpha = cut.split()[-1]
    kept = sum(alpha.histogram()[200:]) / float(cut.width * cut.height)
    cut.thumbnail((size, size), Image.LANCZOS)
    return cut, kept

def main(spec):
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    mpath = os.path.join(OUT, 'manifest.json')
    if os.path.exists(mpath):
        manifest = json.load(open(mpath))
    for ref, term in spec:
        if ref in manifest:
            print(f'  {ref:22s} already have it'); continue
        time.sleep(1.2)
        try:
            cands = search(term)
        except Exception as e:
            print(f'  {ref:22s} SEARCH FAILED {e}'); continue
        if not cands:
            print(f'  {ref:22s} no CC0/PD candidate'); continue
        done = False
        for c in cands[:8]:
            try:
                raw = fetch(c['thumb'])
                col = colourfulness(Image.open(io.BytesIO(raw)))
                if col < 0.16:
                    print(f'  {ref:22s} .. skipped, monochrome ({col:.2f})'); continue
                cut, kept = cutout(raw)
            except Exception as e:
                print(f'  {ref:22s} .. {e}'); continue
            if cut is None or kept > 0.92 or kept < 0.04:
                print(f'  {ref:22s} .. rejected (kept {kept:.0%})'); continue
            p = os.path.join(OUT, f'{ref}.webp')
            cut.save(p, 'WEBP', quality=72, method=6)
            manifest[ref] = {**c, 'file': f'{ref}.webp', 'bytes': os.path.getsize(p),
                             'kept': round(kept, 3), 'colour': round(col, 3),
                             'fetched': time.strftime('%Y-%m-%d')}
            cr = 'credit needed' if c['needs_credit'] else 'no credit needed'
            print(f'  {ref:22s} OK {os.path.getsize(p):>6d}B  kept {kept:.0%}  colour {col:.2f}  {c["licence"]} ({cr})')
            done = True; break
        if not done:
            print(f'  {ref:22s} nothing usable')
        json.dump(manifest, open(mpath, 'w'), indent=1)
    print(f'\n{len(manifest)} cut-outs, {sum(v["bytes"] for v in manifest.values())/1024:.0f} KB total')

if __name__ == '__main__':
    SPEC = [tuple(x.split('=', 1)) for x in sys.argv[1:]]
    main(SPEC)
