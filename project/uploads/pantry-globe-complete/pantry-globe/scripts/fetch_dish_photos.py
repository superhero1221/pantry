#!/usr/bin/env python3
"""
A real photograph of each dish, from its own Wikipedia article.

Everything before this searched an image library for a noun and got back
whatever matched the word: a coin for "lemon", an eighteenth-century painting
for "chicken breast", profiteroles for "spinach". Search was the wrong tool.

A Wikipedia article has ONE lead image, chosen by editors who care about the
subject, and it is by definition a picture of that subject. Ask the Shakshouka
article for its lead image and you get shakshuka. There is no ambiguity to lose.

Only dishes whose photograph honestly depicts them are mapped. Several recipes
here are generic inventions with no article, and rather than dressing them in a
picture of something else they keep their illustration — a photo of a different
dish is a lie in a way a drawing is not.

Licences are almost all CC BY-SA: attribution and share-alike. That is a credits
screen, which the app already has.
"""
import io, json, os, sys, time, urllib.parse, urllib.request
from PIL import Image

UA = {'User-Agent': 'PantryGlobe/1.0 (dish photographs for a meal planner; solo developer)'}
OUT = os.path.join(os.path.dirname(__file__), '..', 'dishpix')

# recipe id -> Wikipedia article whose lead image genuinely IS this dish.
# Left out on purpose: generic bowls and traybakes with no article, where any
# photograph would be of something else.
MAP = {
    'buffalo_wings_baked': 'Buffalo wing',
    'shakshuka': 'Shakshouka',
    'butter_chicken': 'Butter chicken',
    'pad_thai': 'Pad thai',
    'chicken_biryani': 'Biryani',
    'jollof_rice': 'Jollof rice',
    'falafel_bowl': 'Falafel',
    'machboos_dajaj': 'Machboos',
    'dal_tadka': 'Dal',
    'spaghetti_carbonara': 'Carbonara',
    'swedish_meatballs': 'Swedish meatballs',
    'beef_pho': 'Pho',
    'beef_chilli': 'Chili con carne',
    'lentil_bolognese': 'Bolognese sauce',
    'chicken_tacos': 'Taco',
    'moroccan_couscous': 'Couscous',
    'tuna_pasta_bake': 'Tuna casserole',
    'omelette_cheese_herb': 'Omelette',
    'poached_eggs_avocado': 'Avocado toast',
    'red_lentil_soup': 'Lentil soup',
    'chickpea_feta_salad': 'Greek salad',
    'greek_yogurt_bowl': 'Yogurt',
    'chicken_stir_fry': 'Stir frying',
    'salmon_traybake': 'Salmon as food',
    'veg_curry_coconut': 'Vegetable curry',
    'spinach_feta_eggs': 'Fried egg',
    'chicken_salad_bowl': 'Chicken salad',
    'roast_chicken_traybake': 'Roast chicken',
}

_last = [0.0]
def call(url, tries=4):
    """Wikipedia throttles hard and is right to. Space the calls out."""
    for a in range(tries):
        wait = 1.9 - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40)
        except urllib.error.HTTPError as e:
            if e.code == 429 and a < tries - 1:
                time.sleep(8 * (a + 1)); continue
            raise
    raise RuntimeError('gave up')

def lead_image(title):
    u = 'https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'format': 'json', 'titles': title,
        'prop': 'pageimages', 'piprop': 'original', 'redirects': 1})
    d = json.load(call(u))
    for p in (d.get('query') or {}).get('pages', {}).values():
        if 'original' in p:
            return p['title'], p['original']['source']
    return None, None

def credit(file_url):
    fn = 'File:' + urllib.parse.unquote(file_url.rsplit('/', 1)[-1])
    u = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'format': 'json', 'titles': fn,
        'prop': 'imageinfo', 'iiprop': 'extmetadata|url'})
    d = json.load(call(u))
    for p in (d.get('query') or {}).get('pages', {}).values():
        ii = (p.get('imageinfo') or [{}])[0]
        em = ii.get('extmetadata') or {}
        import re
        artist = re.sub('<[^>]*>', '', (em.get('Artist') or {}).get('value', '')).strip()
        return {
            'licence': (em.get('LicenseShortName') or {}).get('value', 'unknown'),
            'author': artist[:70],
            'page': ii.get('descriptionurl', ''),
            'file': fn,
        }
    return {'licence': 'unknown', 'author': '', 'page': '', 'file': fn}

def main(only=None):
    os.makedirs(OUT, exist_ok=True)
    mpath = os.path.join(OUT, 'manifest.json')
    man = json.load(open(mpath)) if os.path.exists(mpath) else {}
    for rid, title in MAP.items():
        if only and rid not in only:
            continue
        if rid in man:
            print(f'  {rid:26s} already have it'); continue
        try:
            page, url = lead_image(title)
            if not url:
                print(f'  {rid:26s} no lead image on "{title}"'); continue
            c = credit(url)
            # 900 px wide is plenty for a phone hero and keeps the bundle sane
            raw = call(url).read()
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            w, h = im.size
            # centre-crop to 4:3 so every dish card is the same shape
            target = 4 / 3
            if w / h > target:
                nw = int(h * target); im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
            else:
                nh = int(w / target); im = im.crop((0, (h - nh) // 2, w, (h + nh) // 2))
            im.thumbnail((760, 570), Image.LANCZOS)
            p = os.path.join(OUT, f'{rid}.webp')
            im.save(p, 'WEBP', quality=70, method=6)
            man[rid] = {**c, 'article': page, 'source': url, 'img': f'{rid}.webp',
                        'bytes': os.path.getsize(p), 'fetched': time.strftime('%Y-%m-%d')}
            print(f'  {rid:26s} OK {os.path.getsize(p):>7d}B  {c["licence"]:16s} {page}')
            json.dump(man, open(mpath, 'w'), indent=1)
        except Exception as e:
            print(f'  {rid:26s} FAILED {e}')
    json.dump(man, open(mpath, 'w'), indent=1)
    print(f'\n{len(man)} dish photographs, {sum(v["bytes"] for v in man.values())/1024:.0f} KB')

if __name__ == '__main__':
    main(set(sys.argv[1:]) or None)
