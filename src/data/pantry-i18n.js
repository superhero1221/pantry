// Pantry's language table.
//
// Adding a language: copy the `en` block, translate the values, add an entry to
// LANGS with its code, native name and direction. Nothing else in the app needs
// touching — every string is looked up through t(lang, key), and any key a
// translation is missing falls back to English rather than rendering blank.

import { packOf } from './lang-pack';

// LANGS never moves into a chunk. It is 460 bytes, it is all dirOf() reads, and
// dirOf() is what makes an Arabic reader's very first frame right-to-left
// before a single translated word has arrived. Its `|| LANGS[0]` fallback means
// a future bundle audit that "helpfully" moved this would silently answer 'ltr'
// — an English left-to-right frame and then a flip, which is the one thing the
// split is designed to prevent.
export const LANGS = [
  { code: 'en', native: 'English', dir: 'ltr' },
  { code: 'es', native: 'Español', dir: 'ltr' },
  { code: 'fr', native: 'Français', dir: 'ltr' },
  { code: 'pl', native: 'Polski', dir: 'ltr' },
  { code: 'ur', native: 'اردو', dir: 'rtl' },
  { code: 'ar', native: 'العربية', dir: 'rtl' }
];

const en = {
  navTonight: 'Tonight', navKitchen: 'Kitchen', navStats: 'Stats', navPassport: 'Passport', navYou: 'You',

  welcomeTag: "Tell me what you fancy and what's in your pocket. I'll do the deciding.",
  welcome1: 'One decision on screen at a time',
  welcome2: 'Priced where you actually stand',
  welcome3: 'It remembers what you already own',
  welcomeGo: 'Start', welcomeSkip: 'Skip all this',

  tierSkill: 'What can you already do?',
  tierSkillSub: 'Drag each card into a row — or tap one, then tap a row. There is no wrong answer. This just stops me suggesting things that will annoy you.',
  tierTime: 'How much time do you actually have?',
  tierTimeSub: 'Same again. Be honest rather than aspirational.',
  tierNext: 'Next', tierSkip: 'Skip', tierLeft: 'left to place', tierAllPlaced: 'All placed',

  dietTitle: "Anything you don't eat?",
  dietSub: 'Tap all that apply. You can change this later.',
  dietNone: 'No restrictions',

  locFinding: 'Finding you…', locFound: 'Found you',
  locThatsMe: "That's me", locNotMe: 'Somewhere else',
  locUse: 'Use my location', locManual: 'Pick a country instead',
  locWhy: 'Prices and shops change street by street. Nothing leaves this device.',
  locDenied: 'No bother — pick a place and I will work from that.',

  homeWhat: 'What do you fancy?',
  homePlaceholder: 'pad thai, something warm, wingstop…',
  homeMoney: 'Money', homeTime: 'Time', homeFor: 'Feeding',
  homeGo: 'Show me dinner', homeAny: "I don't care — just pick one",
  homeBrowse: 'Browse everything', homeOther: 'Other',
  homeServes1: 'just me', homeServes2: 'two', homeServes4: 'four',

  resServing: 'a serving', resToBuy: 'to buy, for',
  resInstead: 'Instead of buying it', resKeep: 'You keep',
  resCook: 'Cook this', resOthers: 'Two others', resMicro: 'The rest of the label',
  resHide: 'Hide', resUnder: 'under budget', resOver: 'over budget',
  resHard: 'Difficulty', resMins: 'min',

  shopTitle: 'Where to buy it', shopList: 'Your list',
  shopTotal: 'Total to buy', shopGo: 'Start cooking',
  shopHave: 'you have', shopBuy: 'to buy',
  shopCheapest: 'cheapest', shopLive: 'live', shopModelled: 'modelled',
  shopWhere: 'Where these numbers come from',

  cookOf: 'of', cookDone: 'Done', cookNext: 'Next step',
  cookLost: "I've lost the thread", cookGot: 'Got it',
  cookWhere: 'Where you are', cookHob: "What's on the hob",
  cookTimer: 'Start timer', cookStop: 'Stop',

  afterTitle: 'You cooked it.',
  afterSub: 'One last thing and then I will leave you alone.',
  afterPhoto: 'Drop a photo of the finished plate',
  afterOptional: 'Optional — this only exists to teach me your portions.',
  afterSkip: 'Skip the photo',
  afterTell: 'Or just tell me', afterNothing: "Don't log this one",
  afterCleared: 'Cleared it', afterBit: 'A bit left', afterLoads: 'Loads left',
  afterNotRight: 'not right', afterDays: 'days running',

  kitchenTitle: 'Your kitchen', kitchenFirst: 'Use these first',
  kitchenStock: 'Cupboard', kitchenDays: 'days left',

  statsTitle: 'What I know', statsSpend: 'What you spend',
  statsCooked: 'What you cook', statsHard: 'How hard you go',
  statsLearned: "What I've worked out about you",
  statsForget: 'Forget this', statsWeek: 'a week', statsAvg: 'average',

  passTitle: 'Passport', passServing: 'a serving', passCooked: 'cooked',

  setTitle: 'You', setDiet: "What you don't eat", setTier: 'Your tier lists',
  setRedo: 'Redo', setWhere: 'Where you are', setLang: 'Language',
  setSources: 'Where the data comes from', setReset: 'Start over',
  setKey: 'Supermarket price key', setKeyHint: 'Optional. Unlocks named-chain shelf prices.',

  yes: 'Yes', no: 'No', notNow: 'Not now', neverAsk: "Don't ask again",
  back: 'Back', close: 'Close', save: 'Save'
};


const DIET_WORDS = {
  "en": {
    "vegan": "Vegan",
    "vegetarian": "Vegetarian",
    "halal": "Halal",
    "kosher": "Kosher",
    "gluten_free": "Gluten free",
    "dairy_free": "Dairy free",
    "nut_free": "Nut free",
    "no_pork": "No pork",
    "no_alcohol": "No alcohol"
  },
  "es": {
    "vegan": "Vegano",
    "vegetarian": "Vegetariano",
    "halal": "Halal",
    "kosher": "Kosher",
    "gluten_free": "Sin gluten",
    "dairy_free": "Sin lácteos",
    "nut_free": "Sin frutos secos",
    "no_pork": "Sin cerdo",
    "no_alcohol": "Sin alcohol"
  },
  "fr": {
    "vegan": "Végan",
    "vegetarian": "Végétarien",
    "halal": "Halal",
    "kosher": "Casher",
    "gluten_free": "Sans gluten",
    "dairy_free": "Sans lactose",
    "nut_free": "Sans fruits à coque",
    "no_pork": "Sans porc",
    "no_alcohol": "Sans alcool"
  },
  "pl": {
    "vegan": "Wegańskie",
    "vegetarian": "Wegetariańskie",
    "halal": "Halal",
    "kosher": "Koszerne",
    "gluten_free": "Bez glutenu",
    "dairy_free": "Bez nabiału",
    "nut_free": "Bez orzechów",
    "no_pork": "Bez wieprzowiny",
    "no_alcohol": "Bez alkoholu"
  },
  "ur": {
    "vegan": "ویگن",
    "vegetarian": "سبزی خور",
    "halal": "حلال",
    "kosher": "کوشر",
    "gluten_free": "گلوٹن کے بغیر",
    "dairy_free": "ڈیری کے بغیر",
    "nut_free": "خشک میوے کے بغیر",
    "no_pork": "سؤر کا گوشت نہیں",
    "no_alcohol": "الکحل نہیں"
  },
  "ar": {
    "vegan": "نباتي صرف",
    "vegetarian": "نباتي",
    "halal": "حلال",
    "kosher": "كوشر",
    "gluten_free": "خالٍ من الغلوتين",
    "dairy_free": "خالٍ من الألبان",
    "nut_free": "خالٍ من المكسرات",
    "no_pork": "بلا لحم خنزير",
    "no_alcohol": "بلا كحول"
  }
};

/** Diet-filter labels for a language, English-backed. */
export const diets = code => ({ ...DIET_WORDS.en, ...(DIET_WORDS[code] || {}) });

/* pack() whitelists by Object.keys(PACKS.en) — a key missing from "en" is silently
   dropped for every language. Always add a new key to "en" first.
   Audit: Object.keys(PACKS[l]).filter(k => !(k in PACKS.en)) must be empty for all l. */
const PACKS = {
 "en": {
  "lo": {"mango_wings":"Baked, not fried","stir_fry":"with rice","omelette":"on toast","veg_curry":"with coconut","tuna_bake":"four tins and a bag"},
  "us": ["turns your coordinates into a place name","the actual shops around you, with opening hours","real prices people have photographed on the shelf","product weights and nutrition","the measured baseline in 62 countries"],
  "plans": ["I'll keep it to five ingredients and no knife work you haven't done.","I'll stretch you a little, never past one new thing a meal.","Nothing here will bore you and nothing will catch you out.","Nothing is off the table."],
  "pc": {"IN":"India","GB":"United Kingdom","IT":"Italy","FR":"France","CN":"China","NG":"Nigeria","TH":"Thailand"},
  "am": {"a1":"180 g left of a 300 g bag","a2":"most of a 30 g packet","a3":"4 of 8","a4":"180 g, opened","a5":"270 g block","cooked":"cooked","time":"time","times":"times"},
  "h": {"daysWord":"days","forServings":"for {n} servings","otherChip":"Other","findMe":"Find me {q}","inKitchen":"{n} things already in your kitchen","passportNudge":"84 countries you have never cooked from. The cheapest one you are missing is Ethiopia — misir wot lands at {a} a serving.","liveShops":"{n} shops within walking distance, straight off OpenStreetMap","week":["M","T","W","T","F","S","S"]},
  "v": {
   "recapDone": "You have done {a} of {b} steps. The last thing you did: {t}.","plan1":"I’ll keep it to five ingredients and no knife work you haven’t done.","plan2":"I’ll stretch you a little, never past one new thing a meal.","plan3":"Nothing here will bore you and nothing will catch you out.","plan4":"Nothing is off the table.","tierSkillSub":"Drag each card into a row — or tap one, then tap a row. There is no wrong answer. This just stops me suggesting things that will annoy you.","tierTimeSub":"Same again. Be honest rather than aspirational — I would rather cook you something in twenty minutes than watch you not cook something in fifty.","readsLike":"Reads like: {w}. {p}","placeFew":"Place a few and I will tell you what I make of it.","timeRead":"Right — I will keep everything under {m} minutes on a normal day, and only offer the long ones at the weekend.","dietSome":"Noted. Nothing that breaks one of these gets offered to you. They sort to the bottom rather than vanishing, so you can still see what you are ruling out.","dietNone":"Nothing selected, so nothing is filtered. You can come back to this the first time I suggest something you’d never eat.","wasteNone":"Clean plate, nothing binned. That portion size is right — I will leave it exactly where it is.","wasteSome":"The photo reads roughly 20% still on the plate. Not a disaster, but it is money you cooked and did not eat.","wasteLots":"Looks like half of it is still there. Either the portion is too big or the dish was not what you wanted — both are worth knowing.","hob0":"You have just started. Nothing is on the heat yet — you cannot have got it wrong.","hobNone":"Nothing on the hob.","hobPrep":"Nothing on the hob yet — this is all prep.","hobHot":"On the hob right now: the pan, hot. Do not walk away from it.","nudge":"Beansprouts and coriander want using in the next 3 days","remind":"Nudge me at 12:30 tomorrow","remindPing":"Tomorrow 12:30 — {d} is still good. Reheat it rather than buy lunch.","shrinkBig":"Shall I cook a third less next time?","shrinkSmall":"Shall I cook 15% less next time?","shrinkBody":"Same dish, smaller pan. Saves about {a} a cook and stops the bit you never eat going in the bin. You can undo it any time.","shrinkPing":"Portion trimmed. Next {d} is sized for what you actually eat.","shrinkYesText":"Done. Next time this comes up it is sized for what you actually eat, and the shopping list shrinks with it.","shrinkNoText":"Fair enough — leftovers on purpose is not waste. I will leave the portion where it is and stop asking.","streakClean":"Nothing binned all week. That is roughly {a} saved.","streakKeep":"Keep a clean plate tomorrow and it is a week.","receiptPing":"Receipt scanning is a sketch for now — the price engine is what is real.","keyOn":"Key saved. Named-chain prices are on.","keyOff":"Key cleared.","looking":"Looking for shops near you…"},
  "u": {"setMe":"Set me up — 4 quick screens","thatsLot":"That’s the lot.","dietSub":"Tap all that apply, or none. This is a filter, not a judgement — and you can change it any time in Settings.","lookTitle":"Or let me actually look.","noBother":"No bother — pick a city below and everything reprices to it.","coverage":"8 countries carry their own prices. In 4 of them the numbers come from real market surveys; in the rest — Britain included — they’re modelled from pack prices and aged forward with food inflation. I’ll always tell you which you’re looking at.","thatsMe":"That’s me — let’s eat","setBtn":"Set","barsNote":"Bars are share of an adult daily reference intake, per serving.","legMeasured":"Measured at markets in this country","legEurope":"Measured in Europe, scaled to here","legModelled":"Modelled from a pack price, aged with food inflation","timerLabel":"Timer","stopBtn":"Stop","whereYouAre":"Where you are","noPhoto":"No photo. That is completely fine — tap if you change your mind.","notRight":"not right","shrinkYes":"Yes, shrink it","shrinkNo":"No, I like leftovers","doneThanks":"Done — thanks","redoTier":"Redo the tier list","changeBtn":"Change","resTier":"for your tier list","gotIt":"Got it, close this","timerStart":"Start a {m} minute timer","langNote":"The interface switches immediately, right-to-left included. Recipe methods stay in English for now — I would rather leave them untranslated than machine-translate a step that tells you when to take prawns off the heat.","apiNote":"No UK, US or EU supermarket publishes a public price API — not Tesco, not Sainsbury’s, not Kroger. Without a key I use Open Prices, which is real but crowdsourced and patchy. With one, named-chain shelf prices replace the estimate and every line says which it is.","picNote":"Dish photographs are the lead image of each dish’s own Wikipedia article, almost all CC BY-SA.","nowTag":"now"},
  "cn": {"GB":"United Kingdom","US":"the United States","IN":"India","NG":"Nigeria","PK":"Pakistan","DE":"Germany","AE":"the UAE","TR":"Türkiye"},
  "sl": {"saved":"Remembering your cupboard took {a} off this shop. Over a month of cooking that is roughly {b} you did not spend twice.","measured":"Most of this basket is measured — enumerators visit markets in {c} monthly. That is unusually good coverage.","modelled":"Being straight with you: in {c} most of this basket is modelled, not measured. No grocery chain publishes prices at this scale. Treat it as a good estimate, not a receipt.","listEnglish":"Ingredient names follow the packet","listWhy":"Shop shelves are labelled in the local language. I show you the name you will actually read on the packet."},
  "q": {"training":{"q":"You have gone high-protein {k} times out of {n}.","why":"If there is a reason for that I can aim properly instead of guessing. Do you train?","o":["I lift","I run or cycle","No, I just like it"]},"calorieGoal":{"q":"{k} of your last {n} were under 500 calories.","why":"That is a pattern, not an accident. What is it in aid of?","o":["Losing weight","Body composition","Just how it landed"]},"cuisine":{"q":"{k} of your last {n} cooks were {c}.","why":"Shall I lean that way when I have nothing better to go on, or keep mixing it up?","o":["Lean {c}","Keep it varied"]},"push":{"q":"Nothing you have cooked in a month was harder than a two.","why":"I can keep it easy, or start slipping in one harder dish a week.","o":["Push me a bit","Keep it easy"]},"budget":{"q":"You are averaging {a} a serving against a {b} basket.","why":"That is tighter than it looks. Want the default budget moved up so I stop hiding things from you?","o":["Move it up","Leave it"]},"empty":"Nothing yet. I only keep something when you have answered a question about it out loud — I do not infer a goal from your cooking and act on it quietly.","forget":"Forget this","noted":"Noted"},
  "L": {"training:strength":["You lift","Meals are ranked on protein first, and I will not suggest anything under 30 g a serving on a training day."],"training:endurance":["You run or cycle","I keep carbohydrate up rather than cutting it, and I stopped hiding the higher-calorie dishes from you."],"calorieGoal:cut":["You are cutting","Calories sit at the front of every card and anything over 600 a serving gets a flag, not a hide."],"calorieGoal:recomp":["You are recomping","I rank on protein per calorie rather than calories alone, which changes the order quite a lot."],"push:yes":["You want pushing","One dish a week now sits a notch above your tier list, and I tell you which one it is."],"budget:up":["Budget raised","You were consistently spending above the number you set, so I stopped filtering things out at the old one."],"goal":["Your goal: {v}","You told me this on the way in. It only reorders what I show first — everything is still there, and you can delete this line."],"cuisine":["Leaning {v}","When I have nothing better to go on I nudge {v} dishes up the list. It hides nothing and it is off the moment you forget it."]},
  "x": {
   "plate": "Drop a photo of the finished plate",
   "onLast": "on last week",
   "nowW": "now","insteadOf":"Instead of buying it","youKeep":"You keep","everyTime":"every time you cook this instead of ordering it.","fourTimes":"Four times a month is","anOrderOf":"order of these is","forEight":"for eight. You get twelve for","andYouKeep":"and you keep","aPortion":"a portion.","microShow":"Iron, B12, fibre, salt …","microHide":"Hide the small print","twoOthers":"Two others that fit","browseSub":"Every dish costed for {city} at the cheapest shop near you, per serving. Nothing here is filtered by your budget — this is the lot.","statsSub":"{n} cooks logged. All of it worked out on this phone — nothing here has been sent anywhere, and you can delete any of it.","kitchenSub":"Everything here comes off your next shopping list automatically. You will not be asked to buy cumin again.","passportSub":"Every country you have cooked from, cheapest per serving first.","nudges":"Nudges","leftoverN":"Leftover nudges","leftoverS":"A reminder the day after, only when it keeps","shrinkN":"Portion learning","shrinkS":"Ask before shrinking a recipe you keep wasting","shopN":"Shop closing alerts","shopS":"Tell me when the cheapest shop is about to shut","carbs":"carbs","fat":"fat"},
  "s": {"shopSub":"shops within walking distance of","sameBasket":"Same basket, three prices.","openTill":"open till","hoursUnknown":"hours unknown"},
  "levels": ["","brand new, and that is completely fine","you can feed yourself","a confident home cook","you know exactly what you are doing"],
  "r": {"reads":"Reads like","placeFew":"Place a few and I will tell you what I make of it.","keepUnder":"Right — I will keep everything under","minsNormal":"minutes on a normal day, and only offer the long ones at the weekend.","underYour":"under your","overYour":"over your","andIncludes":"— and that includes nothing you already own","switchCheapest":"Switch to the cheapest shop below and it fits.","noRush":"No rush","underMins":"under"},
  "dishes": {
   "pad_thai": "Pad Thai",
   "mango_wings": "Mango Habanero Wings",
   "stir_fry": "Chicken Stir Fry",
   "veg_curry": "Sweet Potato and Chickpea Curry",
   "omelette": "Cheese and Herb Omelette",
   "tuna_bake": "Tuna Pasta Bake",
   "shakshuka": "Shakshuka",
   "chicken_tacos": "Chicken Tacos",
   "beef_pho": "Beef Pho",
   "jollof_rice": "Jollof Rice",
   "lentil_bolognese": "Lentil Bolognese",
   "butter_chicken": "Butter Chicken",
   "dal_tadka": "Dal Tadka",
   "carbonara": "Spaghetti Carbonara"
  },
  "cuisines": {
   "Thai": "Thai",
   "American": "American",
   "Chinese": "Chinese",
   "Indian": "Indian",
   "French": "French",
   "British": "British",
   "North African": "North African",
   "Mexican": "Mexican",
   "Vietnamese": "Vietnamese",
   "West African": "West African",
   "Italian": "Italian"
  },
  "diff": {
   "1": "Very easy",
   "2": "Easy enough",
   "3": "A stretch",
   "4": "A proper project"
  },
  "skill": {
   "onion": "Chop an onion",
   "rice": "Cook rice properly",
   "sear": "Sear meat hard",
   "sauce": "Make a pan sauce",
   "temp": "Use a thermometer",
   "fry": "Deep fry",
   "dough": "Knead dough",
   "fish": "Fillet a fish"
  },
  "times": {
   "t10": "10 minutes",
   "t20": "20 minutes",
   "t30": "30 minutes",
   "t45": "45 minutes",
   "t60": "An hour or more"
  },
  "sTiers": {
   "S": "Done it loads",
   "A": "I've done it once or twice",
   "B": "Makes me nervous",
   "C": "Never, and not today"
  },
  "tTiers": {
   "S": "Any day of the week",
   "A": "Most days",
   "B": "Weekends only",
   "C": "Not happening"
  },
  "cravings": [
   "Pad thai",
   "Wingstop mango habanero",
   "Something with eggs",
   "Curry",
   "Pasta",
   "Stir fry"
  ],
  "shops": {
   "discount": "discount",
   "standard": "standard",
   "convenience": "convenience",
   "premium": "premium",
   "wholesale": "wholesale"
  },
  "goals": {
   "lose": "Lose weight",
   "gain": "Gain weight",
   "muscle": "Build muscle",
   "recomp": "Body composition",
   "cheap": "Spend less",
   "energy": "More energy",
   "none": "No goal, just feed me"
  },
  "w": {
   "goalTitle": "What are you after?",
   "goalSub": "Optional, and you can change or delete it later. It changes what I put in front of you, not what I let you cook.",
   "goalSkip": "No goal for now",
   "goalNote": "Whatever you pick, nothing gets hidden. I reorder the list and tell you why.",
   "evening": "Evening",
   "browseAll": "Browse everything",
   "minutes": "min",
   "anHour": "Godzina",
   "noRush": "Bez pośpiechu",
   "anHour": "Une heure",
   "noRush": "Pas pressé",
   "anHour": "Una hora",
   "noRush": "Sin prisa",
   "anHour": "An hour",
   "noRush": "No rush",
   "activeMins": "of them are you",
   "ofThem": "of",
   "toBuyFor": "to buy, for",
   "servings": "servings",
   "underBudget": "under budget",
   "overBudget": "over budget",
   "cheaperThan": "cheaper than the takeaway",
   "youHave": "you have",
   "toBuy": "to buy",
   "already": "already in your kitchen",
   "optional": "optional",
   "stepOf": "of",
   "doneNext": "Done, next",
   "thatsIt": "That’s it — done",
   "nothingHob": "Nothing on the hob.",
   "prepOnly": "Nothing on the hob yet — this is all prep.",
   "panHot": "On the hob right now: the pan, hot. Do not walk away from it.",
   "justStarted": "You have just started. Nothing is on the heat yet — you cannot have got it wrong.",
   "youHaveDone": "You have done",
   "ofSteps": "steps. The last thing you did:",
   "clearedIt": "Nothing left. That is exactly right.",
   "someLeft": "About a fifth left.",
   "lotsLeft": "About half of it left.",
   "daysRunning": "days running",
   "keepClean": "Keep a clean plate tomorrow and it is a week.",
   "nothingBinned": "Nothing binned all week.",
   "goingOff": "going off soon",
   "cupboard": "cupboard stock",
   "keepsMonths": "Keeps for months",
   "useIt": "Use it",
   "days": "DAYS",
   "scanReceipt": "Scan a receipt to add more",
   "ofCountries": "of 37 countries",
   "keptOut": "kept out of takeaways",
   "cookedTimes": "cooked",
   "time": "time",
   "timesWord": "times",
   "skillIs": "Skill",
   "timeIs": "Time",
   "upTo": "up to",
   "minutesNormal": "minutes on a normal day",
   "cardsPlaced": "technique cards placed",
   "redoTier": "Redo the tier list",
   "leftToPlace": "left to place",
   "allPlaced": "All placed",
   "thatsTheLot": "That's the lot.",
   "theCards": "The cards",
   "aWeek": "a week",
   "average": "average",
   "aServingAvg": "a serving, average",
   "notSpent": "not spent on takeaway",
   "leftOnPlate": "left on the plate",
   "eightWeeks": "Eight weeks, oldest on the left",
   "aCook": "a cook",
   "wholeMenu": "The whole menu",
   "dishesWord": "dishes",
   "everything": "Everything",
   "under30": "Under 30 min",
   "cheapest": "Cheapest",
   "highProtein": "High protein",
   "vegetarianCat": "Vegetarian",
   "easiest": "Easiest",
   "kcal": "kcal",
   "protein": "protein",
   "carbs": "carbs",
   "fat": "fat",
   "patternMaybe": "A pattern, maybe",
   "forgetAll": "Forget everything and start the questions again",
   "stepsEnglish": "Steps are in English",
   "stepsWhy": "I have not translated the method. A mistranslated instruction about when to take prawns off the heat is worse than an English one."
  }
 },
};

/** Everything beyond the flat UI strings: dish names, cuisines, card labels,
 *  difficulty words and the fragments the app assembles sentences from.
 *  English-backed at every level, so a partial translation never renders blank. */
export const pack = (code) => {
  const b = PACKS.en, o = PACKS[code] || packOf(code)?.pack || {};
  const out = {};
  Object.keys(b).forEach((k) => {
    // Arrays were taken wholesale, which is English-backing per KEY rather than
    // per ENTRY: a `levels` array that is short or has a hole in one language
    // yielded undefined, and undefined is now the label on a button rather than
    // a fragment in a 13.5px readout — and .charAt on it takes the app down
    // inside App's own render, past the error boundary. Backed per entry now.
    out[k] = Array.isArray(b[k])
      ? b[k].map((v, i) => (o[k] && o[k][i]) || v)
      : { ...b[k], ...(o[k] || {}) };
  });
  return out;
};

const TABLE = { en };

export const dirOf = code => (LANGS.find(l => l.code === code) || LANGS[0]).dir;
export const nativeOf = code => (LANGS.find(l => l.code === code) || LANGS[0]).native;

/** Whole dictionary for a language, English-backed so no key can render blank. */
export const strings = code => ({ ...en, ...(TABLE[code] || packOf(code)?.strings || {}) });

/** Best guess from the browser, falling back to English. */
export const detect = () => {
  const want = (navigator.languages || [navigator.language || 'en']).map(l => l.slice(0, 2).toLowerCase());
  // Membership is LANGS, not TABLE. The five tables that are not English move
  // behind a dynamic import, and a browser guess that consulted them would
  // answer 'en' for every non-English visitor, for ever, with nothing in the
  // console. LANGS is the list of languages this app has — which is what the
  // question was. Byte-identical answers today; the point is that it stays
  // correct after the split.
  return want.find(w => LANGS.some(l => l.code === w)) || 'en';
};
