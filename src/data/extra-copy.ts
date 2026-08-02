/**
 * Copy for everything added after the design handoff: accounts, price
 * reporting, the planner, and the install/notification prompts.
 *
 * The six-language pack in pantry-i18n.js covers the designed screens. These
 * strings are new, and they are ENGLISH ONLY for now — deliberately, rather
 * than machine-translated, on the same reasoning the design used for recipe
 * methods. Anything that already had a key (Save, Change, Next, Start over,
 * a serving, minutes) goes through the real pack instead of appearing here.
 *
 * To translate: add a sibling block keyed by language code with the same keys.
 * `xt` falls back to English per-key, so a partial translation never renders
 * blank. The audit is the same one-liner the pack uses:
 *   Object.keys(EXTRA[l]).filter(k => !(k in EXTRA.en))  // must be empty
 */
export const EXTRA: Record<string, Record<string, string>> = {
  en: {
    /* ── Account ── */
    account: 'Account',
    accountTitle: 'Keep this across your devices',
    accountBody:
      'Optional. Your goal, tier lists, diets, cook log and cupboard follow you to another phone or a laptop. Everything works the same signed out — this only decides where it is kept.',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    sendLink: 'Send me a link',
    linkSent: 'Check your email. The link signs you in — no password to remember.',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
    syncing: 'Syncing…',
    cloudOff: 'Cloud sync is not configured in this build, so everything stays on this device.',
    localOnly: 'On this device only',

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

    /* ── The cupboard ── */
    haveIt: 'in your kitchen',
    tapToToggle: 'Tap anything you already have — it comes off the total and stays off.',
    tapPrice: 'Tap a price to correct it.',

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
    planSaved: 'Saved. It will be here on your other devices too.',
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
  },
};

export const xt = (lang: string, key: string): string =>
  EXTRA[lang]?.[key] ?? EXTRA.en[key] ?? key;

/** Every key that has no translation in `lang` yet. */
export const untranslated = (lang: string): string[] =>
  lang === 'en' ? [] : Object.keys(EXTRA.en).filter((k) => !(EXTRA[lang]?.[k]));
