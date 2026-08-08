/**
 * Copy for everything added after the design handoff: accounts, price
 * reporting, the cupboard toggles, the planner, and the install and
 * notification prompts.
 *
 * The six-language pack in pantry-i18n.js covers the designed screens; this
 * covers what came after, in the same six. Anything that already had a key
 * (Save, Change, Next, Start over, a serving, minutes) goes through the real
 * pack instead of appearing here.
 *
 * Recipe methods remain the one deliberate English holdout, for the reason the
 * cook screen gives in your own language: a mistranslated instruction about
 * when to pull prawns off the heat is worse than an English one. Interface
 * copy carries no such risk, so it is translated.
 *
 * These translations have not been reviewed by native speakers. `xt` falls
 * back per key, so a correction to one string never breaks the rest.
 *
 * Only English lives here now. The other five ship in data/lang/<code>.ts and
 * arrive on the boot of somebody reading one — see data/lang-pack.ts. The
 * parity audit moved with them, into data.test.ts, where it reads the modules
 * directly: anything going through xt() compares English to English and passes
 * whatever has gone missing.
 */
import { CRASH } from './crash-copy';
import { packOf } from './lang-pack';

export const EXTRA: Record<string, Record<string, string>> = {
  en: {
    /* ── Account ── */
    account: 'Account',
    accountTitle: 'Keep this across your devices',
    accountBody:
      'Optional. Your goal, how much cooking you have done, diets, cook log and cupboard follow you to another phone or a laptop. Everything works the same signed out — this only decides where it is kept.',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    sendLink: 'Send me a link',
    linkSent: 'Check your email. The link signs you in — no password to remember.',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
    syncing: 'Syncing…',
    cloudOff: 'Cloud sync is not configured in this build, so everything stays on this device.',
    localOnly: 'On this device only',
    cloudUnreachable:
      'Could not reach the sign-in service — usually that is no signal. Everything else carries on working on this device.',

    /* ── You ── */
    statsRowSub: 'The patterns I have spotted, and the switch to forget any of them',
    langOffline: 'That language needs a download and the signal is not there. Still in {n}.',

    /* ── Tonight, answered ── */
    /* The home screen opens on a dish rather than on a form. These are
       the words around it: what it is offering, how to take it, how to
       decline it, and how to say all that to a screen reader when the
       name changes in place. */
    tonightId: 'Tonight, I\'d cook',
    cookThis: 'Cook this',
    another: 'Show me another',
    refine: 'Something else in mind?',
    nowShowing: 'Now showing: {d}',

    /* ── The one question ── */
    /* Lifted from each language's own tierSkillSub with the sentence about
       dragging cut off the front, so these are real translations rather
       than six new ones. */
    levelSub: 'There is no wrong answer. This just stops me suggesting things that will annoy you.',
    stepOf: 'Step {n} of {of}',
    resLevel: 'for your level',

    /* ── Mascot ── */
    mascotN: 'Pantry, in the corner',
    mascotS: 'The little pot with the spoon. Turn it off if it pulls at you.',

    /* ── Prices ── */
    priceAsk: 'Saw a different price?',
    priceAskBody:
      'Tell me what it actually cost and everyone shopping here gets a real number instead of my estimate.',
    priceWhat: 'What did it cost?',
    pricePack: 'Pack size',
    priceSend: 'Add this price',
    priceThanks: 'Logged. That is one more real price in the basket.',
    priceNeedsAccount: 'Sign in first — prices are attributed to an account so they can be removed.',
    priceCommunity: 'people shopping here',
    priceReported: 'reported',
    legCommunity: 'Reported by people shopping here',
    legOpenPrices: 'Open Prices, logged by shoppers in this country',
    priceOpen: 'logged on Open Prices',

    /* ── The cupboard ── */
    haveIt: 'in your kitchen',
    tapToToggle: 'Tap anything you already have — it comes off the total and stays off.',
    tapPrice: 'Tap a price to correct it.',
    totalMeans: 'What this meal’s share of each ingredient costs',
    totalMeansBody:
      'Not your till receipt. You buy whole packets, not the exact amount a dish needs — so the first shop is dearer and the rest carries into the next meal.',
    extraAdd: 'optional — tap to add it',
    copycatKeep:
      '{who} charge {a} for a portion. Yours comes to {b} — you keep {c} every time you cook it instead of ordering it.',

    /* ── The time budget ── */
    timeOver: 'over your {m}',
    timeOverWhy:
      'Longer than the {m} minutes you asked for. I am showing it rather than pretending it is quicker: {t} minutes is the real number.',

    /* ── The cupboard, honestly ── */
    sampleKitchen:
      'This cupboard is sample data, so the screen has something to show before you have added anything. The counts, the days and the value are not a measure of your kitchen — your shopping list only takes off what each recipe assumes and what you tick yourself.',
    assumedHave:
      'The lines already crossed off are what this recipe assumes most kitchens have, not something you have told me — tap one to put it back on the list.',
    dietDerived:
      'Nut free, no pork and no alcohol are worked out by reading each recipe\'s ingredients — I cannot see what a factory put in a jar, or what shared a production line. Check the label if it matters.',

    /* ── Sample data ── */
    sampleStats:
      'These eight weeks are sample data, so this screen has something to show before you have cooked anything. They are not yours, they never leave this device, and your first real cook replaces them.',
    samplePassport: 'The flags and dishes below are sample data — your first real cook replaces them. The money kept out of takeaways is real, and comes from your own log.',

    /* ── Planner ── */
    planTitle: 'The week',
    planSub:
      'A few days of dinners in one go, and one shopping list for the lot. Anything already in your cupboard comes off it.',
    planDays: 'How many days',
    planMeals: 'Meals a day',
    planServings: 'Feeding',
    planBuild: 'Build me a week',
    planRebuild: 'Shuffle it',
    planSave: 'Save this week',
    planSaved: 'Saved to your account.',
    planEmpty: 'Nothing planned yet. Pick your days and I will fill them.',
    planSwap: 'Swap',
    planList: 'Everything you need',
    planTotal: 'The whole week',
    planPerDay: 'a day',
    planCook: 'Cook it',
    planDay: 'Day',
    planNeedsAccount: 'Sign in to keep a week across devices. It works here either way.',

    /* ── Install and notifications ── */
    installTitle: 'Put it on your home screen',
    installBody:
      'It opens like an app and the recipes, steps and timers all work with no signal — which is what a kitchen usually has.',
    install: 'Install',
    installed: 'Installed. Look for it on your home screen.',
    installIos: 'On iPhone: tap Share, then Add to Home Screen.',
    notifyTitle: 'Let me nudge you',
    notifyBody:
      'One notification the day after you cook something that keeps, and nothing else. No marketing, no streak nagging.',
    notifyOn: 'Turn nudges on',
    notifyGranted: 'Done. I will only use it for the leftover nudge.',
    notifyDenied: 'Notifications are blocked for this site in your browser settings.',
    notifyNeedsAccount: 'Sign in first — a reminder has to be attached to an account to be sent.',
    offlineReady: 'Ready to use offline',
    sourceIdle: 'not connected yet',
    sourceFx: 'today’s rate between pounds and your currency',
    sourceFxBundled: 'no rate published',
    liveLook: 'Tap to look for shops near you',

    /* ── Getting around without a mouse ── */
    stepBack: 'Previous step',
    passportNudgeReal:
      '{n} countries in here you have never cooked from. The cheapest you are missing is {c} — {d} lands at {a} a serving.',
    streakCleanReal: 'Nothing binned tonight — the plate came back clean.',
    locStart: 'Where are you cooking?',
    storeModelled: 'typical prices for this kind of shop here',
    pantryLineSample: '{n} things a kitchen usually has',
    pantrySubSample: 'A starting assumption, not a scan of your shelves',
    morning: 'Morning',
    afternoon: 'Afternoon',
    planSaveFailed: 'Could not save the plan — check your connection and try again.',
    savedAssumes: 'That assumes about nine shops a month.',
    streakGoOn: 'Cook again tomorrow and the flame keeps counting.',

    /* ── Attribution ──
       Not credits chosen out of politeness. The shop names, the opening
       hours, the place names and the real prices are used under ODbL and
       CC BY, both of which require the notice to be visible where the data
       is — so `creditShort` renders on Locate and on Shop, and the full
       three sit in Settings. The names and the licence codes read the same
       in all six languages: they are what the licence names. */
    creditsLabel: 'Attribution',
    creditShort: 'Shops and prices: © OpenStreetMap contributors · Open Food Facts — ODbL',
    creditOsm:
      'Place names, shops and opening hours come from OpenStreetMap. © OpenStreetMap contributors, available under the Open Database Licence (ODbL).',
    creditOpenFood:
      'Real prices and pack weights come from Open Prices and Open Food Facts, available under the Open Database Licence (ODbL).',
    creditOther:
      'The measured baseline is the WFP food price monitor, by way of HDX (CC BY). Exchange rates are the European Central Bank’s daily reference rates.',

    /* ── When a price will not go in ──
       Every one of these used to be silence: the panel closed, the fields
       cleared, and nothing had been saved. */
    priceOutOfRange:
      'That does not look like a shelf price. Give me what one pack cost, and the pack size in grams.',
    priceAlready: 'You already logged this one today. Tomorrow’s price is the useful one.',
    priceTooMany: 'That is a lot of prices at once. Come back in an hour and the rest will go through.',
    priceFailed: 'That price did not save. Usually that is no signal — try again in a moment.',

    /* ── When something breaks, and your data ── */
    crashTitle: "Something in here broke",
    crashBody: "My fault, not yours. Nothing you have told me has been touched — it is all still on this device. Reloading usually puts you back where you were.",
    crashWhat: "What went wrong",
    crashReload: "Reload Pantry",
    crashSave: "Save a copy of my data first",
    dataTitle: "Your data",
    dataExport: "Save a copy",
    dataExportSub: "One file with how much cooking you have done, diets, budget, cupboard and every cook you have logged. It goes to your device and nowhere else.",
    dataImport: "Load a copy back",
    dataImportSub: "Pick a file you saved here. It replaces what is on this device, and Pantry restarts.",
    dataImportCloud: "You are signed in: your cook log will merge, but your account’s settings win the next time it syncs. Sign out first if this file should replace them.",
    dataImported: "Loaded. {n} cooks came back with it.",
    dataBadFile: "That is not a Pantry file. Nothing has changed.",
    dataFutureFile: "That file comes from a newer Pantry than this one. I will not open half of it and quietly drop the rest, so nothing has changed.",
    budgetRange: "Give me a number between {a} and {b}.",
    pricesChecking: "checking real prices…",
    priceSending: "Adding…",
    planSaving: "Saving…",
    sendingLink: "Sending…",

    /* ── The small print ── */
    someMeasured: "{n} of the {of} lines here are real prices somebody paid and reported — the dots beside them say which. The rest are modelled, and are a good estimate rather than a receipt.",
    whyTitle: "Why this one",
    whyBudget: "Inside the {b} you set",
    whyTime: "{t} minutes, under the {m} you asked for",
    whyDiet: "{d} — checked against every ingredient",
    whyOwned: "{n} of these are already in your kitchen",
    whyLevel: "{l} — about where you are",
    pctDearer: "{n}% dearer",
    priceRange: "{a} – {b}",
    rangeShops: "{a} to {b}",
    storeKinds: "kinds of shop you will find in",
    storeEstimate: "Estimates, not Aldi's or Tesco's own prices — no supermarket publishes those. Each figure is what that kind of shop typically charges near you.",
    legalKicker: "The small print",
    privacyRow: "Privacy",
    privacyRowSub: "What is kept, where, and what leaves this device",
    termsRow: "Terms",
    termsRowSub: "What this app promises, and what it does not",
    legalUpdated: "Last updated 5 August 2026",
    ownCopy: "© 2026 Pantry. All rights reserved.",
    ownMark: "Pantry™ and the character are trade marks. The recipes, the writing, the artwork and the code belong to the Pantry authors. The data, the photographs and the typefaces belong to the sources named above and keep their own licences.",
    privTitle: "Privacy",
    privIntro: "Pantry runs on your phone. Most of what you do here never leaves it. This page says exactly what does, when it goes, and who sees it — no more than that, and no less.",
    privLocalH: "Signed out, nothing leaves this device",
    privLocalB: "Everything you tell Pantry is written to your browser's local storage under one key: pantry.v1. It holds whether you have been through the setup, how much cooking you have done, your diets, your country, your budget, your time limit, your language, the leftover nudge toggle, your cook log, the answers you gave the questions on Stats, your saved week, and what you have ticked as already in your cupboard.\nThere is one other key, pantry.fx.v1, holding the day's exchange rate. That is a fact about money, not about you.\nNone of it is sent anywhere. There is no account, no server, no request. Clear this site's data in your browser and it is gone, and so is everything the app knew.",
    privAccountH: "Signed in, and only then",
    privAccountB: "Signing in is optional and the app works the same without it. You type an email address and get a link back. There is no password, so there is none to store.\nYour email address and your sign-in session are held by Supabase, the database and sign-in service this app uses.\nFrom there: profiles holds the settings listed above, so the same account works on your laptop. cook_log holds what you cooked — the dish, the date, what it cost, servings, calories, protein, carbs, difficulty, and how much went in the bin. saved_plans and plan_meals hold a week, if you save one. price_reports holds a price, if you report one. push_subscriptions and reminders hold the notification, if you turn it on.\nNothing is written to any of them until you do the thing that writes to it. The sample eight weeks on the Stats screen are never uploaded — they are a stage set, not your history. What you have ticked as already in your cupboard stays on this device; it is not synced.",
    privDietH: "Diets, and the thing worth knowing about them",
    privDietB: "Your diets are a setting like any other, and signed in they go on your profile row with everything else.\nSome of them — halal, kosher — say something about you that is not really about dinner. I would rather tell you plainly than be clever about it. If you sign in, that list is in a database. If you would rather it stayed on your phone, use Pantry signed out. Everything works.",
    privWhereH: "Where you are",
    privWhereB: "Location is off until you tap the button that asks for it, and your browser asks you again before anything happens.\nIf you allow it, your coordinates go to two places: Nominatim, run by the OpenStreetMap Foundation, to turn them into a place name, and Overpass, also OpenStreetMap, to find supermarkets near you. Both are public services with no key and no account behind them.\nPantry never stores your coordinates. What it keeps is the city name and the country, on this device — and the country goes to your profile row if you are signed in. A country is not a location.",
    privPhotoH: "The photo of your plate",
    privPhotoB: "It never leaves the device. The After screen reads the file into an object URL — a pointer your browser holds in memory — and throws it away when you leave the screen.\nIt is not uploaded, not stored, and not in your cook log. Nothing here could ever show you that picture again, because nothing here ever had it.",
    privPushH: "The one notification",
    privPushB: "If you turn nudges on, your browser makes a push subscription and Pantry keeps three things: the endpoint your browser hands it, two keys that let a message be encrypted for you, and a shortened copy of your browser's user-agent string so a dead subscription can be told from a live one.\nThey exist to send one kind of message: the day after you cook something that keeps, one reminder that it is still good. Nothing else is ever sent to them, by anyone. Turn notifications off in your browser and the endpoint stops working.",
    privPriceH: "Prices you report",
    privPriceB: "When you tell Pantry what something actually cost, it saves the ingredient, the price, the currency, the pack size, the shop's name if you gave one, the country, and your account.\nYour account is on it so it can be taken off again. A price you reported is a price you can have removed.\nNobody else can read your report. Reading prices goes through a function that returns aggregates only: the middle price per kilo, how many reports there were, and how recent the newest one is. Never who reported it, never where they shop.",
    privOthersH: "Who else your device talks to",
    privOthersB: "api.frankfurter.app, for the European Central Bank's daily rate between pounds and your currency.\nnominatim.openstreetmap.org and overpass-api.de, only once you have allowed location, as above.\nprices.openfoodfacts.org — Open Prices, part of Open Food Facts — for prices people have photographed on a shelf in your country. It is asked for an ingredient category and a country code, and nothing about you.\nYour Supabase project, only while you are signing in or signed in.\nThe site itself is served by Netlify, which — like any web host — sees the request for the page in its ordinary server logs. Nothing in the app reports to it.\nThe source list in Settings links out to OpenStreetMap, Open Food Facts and the ECB. Opening one of those is you visiting their site, and they see you the way any site sees a visitor.",
    privNeverH: "What Pantry does not do",
    privNeverB: "No advertising. Nothing here is sold, rented or handed to anyone for money.\nNo third-party analytics. There is no tracking script on this site — not one. The two typefaces are served from this domain rather than a font CDN, so reading a recipe does not send your address to Google.\nNo profiling beyond what is on the screen. The questions on the Stats screen are the whole of it, you answered them out loud, and every one of them has a Forget button beside it.",
    privRightsH: "What you can ask for",
    privRightsB: "See it. Signed out, everything is the one value under pantry.v1 in your browser's storage, and your browser's own tools will show it to you. Signed in, ask and I will send you what the tables hold about you.\nTake it with you. There is no export button yet. That is a gap, not a policy, and it should be built.\nDelete it. Settings → Start over clears pantry.v1 from this device straight away; it leaves the exchange rate behind, because that was never yours. Deleting the account has no button yet either — email the address below and the account goes, and the profile, cook log, saved weeks, reminders and push subscriptions go with it. Say the word and any prices you reported go too.\nIf you are in the UK or the EU these are your rights under the UK GDPR and the GDPR, and you can complain to your data protection authority — in the UK, the ICO.",
    privContactH: "Asking",
    privContactB: "One address, below, for anything on this page: a question, a correction, a deletion — or a line here that does not match what the app actually does. That last one is the one I most want to hear about.",
    termTitle: "Terms",
    termIntro: "Short, because it should be. Pantry is a free cooking app. Using it means you accept what is on this page.",
    termWhatH: "What Pantry is",
    termWhatB: "A recipe book that prices itself where you are standing and tries to fit what you can cook, what you have got, and how long you have.\nIt is a tool for deciding what is for dinner. It is not nutrition advice, medical advice or financial advice, and it is not a shop — nothing here sells you anything.",
    termPriceH: "Prices are estimates",
    termPriceB: "Almost every number in Pantry is modelled: a typical price for that ingredient, in that kind of shop, in that country, converted at a central bank rate. The Shop screen labels which prices are measured and which are modelled, because the difference matters.\nEven a measured price is what somebody paid somewhere in the last six months. Your till receipt will differ. Nothing here is an offer, a quote, or a guarantee of what anything costs.",
    termAllergenH: "Not an allergen guarantee",
    termAllergenB: "Nut free, no pork and no alcohol are worked out by reading each recipe's ingredients. The app cannot see what a factory put in a jar, or what shared a production line. Check the label if it matters.\nIf an allergy is serious, do not let this app make the call. It is filtering a list of words. It is not reading your packet.",
    termCookH: "The cooking is yours",
    termCookB: "Times and temperatures are a guide. Ovens differ, pans differ, and only you can see whether the chicken is done. Cook to safe temperatures, chill leftovers properly, and use your own judgement on how long something keeps — the leftover nudge is a reminder to check, not a verdict that it is safe.\nPantry is provided as it is, with no warranty of any kind. It will sometimes be wrong, and it is not liable for what happens in your kitchen.",
    termAccountH: "Your account",
    termAccountB: "Sign in with an email address you control. One person, one account.\nReport prices honestly. A price report is meant to help the next person standing in that aisle, and reports that are invented can be removed, along with the account that made them.\nYou can leave whenever you like. Privacy says how.",
    termLicenceH: "Who owns what",
    termLicenceB: "The recipes, the writing, the artwork and the code of Pantry belong to the Pantry authors. Cook from them, print one for the kitchen wall, feed people — including people who pay you for dinner.\nDo not republish the collection as your own, and do not host a copy. Pantry is not open source. Your browser is handed the whole of this app because that is how the web works, and being able to read it is not permission to take it. If you want to do something this paragraph forbids, ask; the address is below.\n\"Pantry\" and the character — the cream canister with the wooden spoon — are trade marks. Using the app is not permission to use either.\nThe map, shop and price data comes from OpenStreetMap and Open Food Facts under the Open Database Licence, and the exchange rates from the European Central Bank. Settings names every source and its licence.\nA price you report stays yours to remove, and you allow Pantry to publish it as part of an aggregate — a median with no name on it, which is the only form anyone else ever sees.",
    termChangeH: "If this changes",
    termChangeB: "These terms and the privacy policy carry a date at the top. If either changes in a way that matters, the date changes with it and the app says so.\nCarrying on using Pantry after that is accepting the new version. Questions go to the address below.",
  },





  /* The five languages that are not English ship their copy in their own
     chunk. What stays here is the handful of strings the crash net and the
     error boundary say — because the moment those are read is the moment a
     chunk did not arrive. */
  ...CRASH,
};

/* The order is load-bearing: the eager crash strings win, then the language
   chunk, then English, then the key itself. A crash string is answered without
   the registry being touched at all. */
export const xt = (lang: string, key: string): string =>
  EXTRA[lang]?.[key] ?? packOf(lang)?.extra?.[key] ?? EXTRA.en[key] ?? key;

/** Keys a translation has that English does not — these would never render. */
