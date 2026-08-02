#!/usr/bin/env python3
"""
Real photographic ingredient cut-outs, from each ingredient's own article.

The same correction that fixed the dish photographs. Searching an image library
for "lemon" returns whatever matches the word — famously, a coin. Asking the
Lemon article for its lead image returns a lemon, because that is what the
article is about.

Background removed with rembg on U-2-Net so each one is a transparent cut-out
that can be stacked, floated and separated in space. That is the point: a
photograph of a finished dish cannot be taken apart, but a stack of photographed
ingredients can.
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image

UA = {'User-Agent': 'PantryGlobe/1.0 (ingredient cut-outs; solo developer)'}
OUT = os.path.join(os.path.dirname(__file__), '..', 'ingpix')

MAP = {
    'tomato_fresh': 'Tomato', 'onion': 'Onion', 'red_onion': 'Red onion', 'garlic': 'Garlic',
    'potato': 'Potato', 'carrot': 'Carrot', 'cucumber': 'Cucumber', 'lemon': 'Lemon',
    'lime': 'Lime (fruit)', 'red_pepper': 'Bell pepper', 'courgette': 'Zucchini',
    'aubergine': 'Eggplant', 'mushroom': 'Edible mushroom', 'spinach_fresh': 'Spinach',
    'lettuce': 'Lettuce', 'white_cabbage': 'Cabbage', 'avocado': 'Avocado', 'ginger': 'Ginger',
    'green_chilli': 'Chili pepper', 'spring_onion': 'Scallion',
    'egg': 'Egg as food', 'chicken_breast': 'Chicken as food', 'beef_mince_5': 'Ground beef',
    'salmon': 'Salmon as food', 'prawns_raw': 'Prawn', 'tofu_firm': 'Tofu',
    'basmati_rice': 'Basmati', 'spaghetti': 'Spaghetti', 'couscous': 'Couscous',
    'bread_sourdough': 'Sourdough', 'flatbread': 'Flatbread',
    'red_lentils': 'Lentil', 'chickpeas_tinned': 'Chickpea', 'kidney_beans_tinned': 'Kidney bean',
    'peas_frozen': 'Pea', 'sweetcorn': 'Maize', 'olives_black': 'Olive',
    'feta': 'Feta', 'cheddar': 'Cheddar cheese', 'greek_yogurt': 'Strained yogurt',
    'butter': 'Butter', 'olive_oil': 'Olive oil', 'honey': 'Honey',
    'almonds': 'Almond', 'cashews': 'Cashew', 'peanuts': 'Peanut', 'sesame_seeds': 'Sesame',
    'coriander_fresh': 'Coriander', 'parsley_fresh': 'Parsley', 'basil_fresh': 'Basil',
    'mint_fresh': 'Mint', 'turmeric': 'Turmeric', 'cumin_ground': 'Cumin',
    'cinnamon_ground': 'Cinnamon', 'black_pepper': 'Black pepper', 'salt': 'Salt',
    'paprika_smoked': 'Paprika', 'bay_leaf': 'Bay leaf',
}

_last = [0.0]
def call(url, tries=4):
    for a in range(tries):
        w = 1.9 - (time.time() - _last[0])
        if w > 0:
            time.sleep(w)
        _last[0] = time.time()
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40)
        except urllib.error.HTTPError as e:
            if e.code == 429 and a < tries - 1:
                time.sleep(8 * (a + 1)); continue
            raise
    raise RuntimeError('gave up')

def lead(title):
    u = 'https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode(
        {'action': 'query', 'format': 'json', 'titles': title,
         'prop': 'pageimages', 'piprop': 'original', 'redirects': 1})
    d = json.load(call(u))
    for p in (d.get('query') or {}).get('pages', {}).values():
        if 'original' in p:
            return p['title'], p['original']['source']
    return None, None

def credit(url):
    fn = 'File:' + urllib.parse.unquote(url.rsplit('/', 1)[-1])
    d = json.load(call('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(
        {'action': 'query', 'format': 'json', 'titles': fn,
         'prop': 'imageinfo', 'iiprop': 'extmetadata|url'})))
    for p in (d.get('query') or {}).get('pages', {}).values():
        ii = (p.get('imageinfo') or [{}])[0]
        em = ii.get('extmetadata') or {}
        return {'licence': (em.get('LicenseShortName') or {}).get('value', 'unknown'),
                'author': re.sub('<[^>]*>', '', (em.get('Artist') or {}).get('value', '')).strip()[:70],
                'page': ii.get('descriptionurl', '')}
    return {'licence': 'unknown', 'author': '', 'page': ''}

def main(only=None):
    os.makedirs(OUT, exist_ok=True)
    mp = os.path.join(OUT, 'manifest.json')
    man = json.load(open(mp)) if os.path.exists(mp) else {}
    from rembg import remove
    for ref, title in MAP.items():
        if only and ref not in only:
            continue
        if ref in man:
            continue
        try:
            page, url = lead(title)
            if not url:
                print(f'  {ref:20s} no image on "{title}"', flush=True); continue
            c = credit(url)
            img = Image.open(io.BytesIO(call(url).read())).convert('RGBA')
            img.thumbnail((520, 520), Image.LANCZOS)
            cut = remove(img)
            bb = cut.getbbox()
            if not bb:
                print(f'  {ref:20s} nothing left after cut-out', flush=True); continue
            cut = cut.crop(bb)
            kept = sum(cut.split()[-1].histogram()[200:]) / float(cut.width * cut.height)
            if kept > 0.95:
                print(f'  {ref:20s} background removal failed (kept {kept:.0%})', flush=True); continue
            cut.thumbnail((200, 200), Image.LANCZOS)
            p = os.path.join(OUT, f'{ref}.webp')
            cut.save(p, 'WEBP', quality=76, method=6)
            man[ref] = {**c, 'article': page, 'img': f'{ref}.webp',
                        'bytes': os.path.getsize(p), 'kept': round(kept, 3),
                        'fetched': time.strftime('%Y-%m-%d')}
            print(f'  {ref:20s} OK {os.path.getsize(p):>6d}B  kept {kept:.0%}  {c["licence"]}', flush=True)
            json.dump(man, open(mp, 'w'), indent=1)
        except Exception as e:
            print(f'  {ref:20s} FAILED {e}', flush=True)
    json.dump(man, open(mp, 'w'), indent=1)
    print(f'\n{len(man)} ingredient cut-outs, {sum(v["bytes"] for v in man.values())/1024:.0f} KB', flush=True)

if __name__ == '__main__':
    main(set(sys.argv[1:]) or None)
