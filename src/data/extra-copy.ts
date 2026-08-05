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
 * back per-key, so a correction to one string never breaks the rest. The audit
 * is the same one-liner the pack uses:
 *   Object.keys(EXTRA[l]).filter(k => !(k in EXTRA.en))  // must be empty
 */
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
    legalKicker: "The small print",
    privacyRow: "Privacy",
    privacyRowSub: "What is kept, where, and what leaves this device",
    termsRow: "Terms",
    termsRowSub: "What this app promises, and what it does not",
    legalUpdated: "Last updated 3 August 2026",
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
    termLicenceB: "The recipes, the writing, the artwork and the code of Pantry belong to Pantry. Cook from them, print them, feed people. Do not republish the collection as your own.\nThe map, shop and price data comes from OpenStreetMap and Open Food Facts under the Open Database Licence, and the exchange rates from the European Central Bank. Settings names every source and its licence.\nA price you report stays yours to remove, and you allow Pantry to publish it as part of an aggregate — a median with no name on it, which is the only form anyone else ever sees.",
    termChangeH: "If this changes",
    termChangeB: "These terms and the privacy policy carry a date at the top. If either changes in a way that matters, the date changes with it and the app says so.\nCarrying on using Pantry after that is accepting the new version. Questions go to the address below.",
  },

  es: {
    account: 'Cuenta',
    accountTitle: 'Consérvalo en todos tus dispositivos',
    accountBody:
      'Opcional. Tu objetivo, cuánto has cocinado, tus dietas, tu registro de cocina y tu despensa te siguen a otro móvil o a un portátil. Todo funciona igual sin sesión: esto solo decide dónde se guarda.',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@ejemplo.com',
    sendLink: 'Envíame un enlace',
    linkSent: 'Mira tu correo. El enlace te da acceso, sin contraseña que recordar.',
    signedInAs: 'Sesión iniciada como',
    signOut: 'Cerrar sesión',
    syncing: 'Sincronizando…',
    cloudOff:
      'La sincronización no está configurada en esta versión, así que todo se queda en este dispositivo.',
    localOnly: 'Solo en este dispositivo',
    cloudUnreachable:
      'No he podido conectar con el servicio de acceso; casi siempre es falta de señal. Todo lo demás sigue funcionando en este dispositivo.',

    /* ── The one question ── */
    /* Lifted from each language's own tierSkillSub with the sentence about
       dragging cut off the front, so these are real translations rather
       than six new ones. */
    levelSub: 'No hay respuesta incorrecta. Esto solo evita que te sugiera cosas que te van a fastidiar.',
    stepOf: 'Paso {n} de {of}',
    resLevel: 'para tu nivel',

    /* ── Mascot ── */
    mascotN: 'Pantry, en la esquina',
    mascotS: 'La ollita de la cuchara. Quítala si te distrae.',

    priceAsk: '¿Has visto otro precio?',
    priceAskBody:
      'Dime lo que costó de verdad y todo el que compre aquí verá un número real en vez de mi estimación.',
    priceWhat: '¿Cuánto costó?',
    pricePack: 'Tamaño del envase',
    priceSend: 'Añadir este precio',
    priceThanks: 'Registrado. Un precio real más en la cesta.',
    priceNeedsAccount:
      'Inicia sesión primero: los precios se asocian a una cuenta para poder retirarlos.',
    priceCommunity: 'personas que compran aquí',
    priceReported: 'reportado',
    legCommunity: 'Reportado por gente que compra aquí',
    legOpenPrices: 'Open Prices, registrados por compradores de este país',
    priceOpen: 'registrados en Open Prices',

    haveIt: 'en tu cocina',
    tapToToggle: 'Toca lo que ya tengas: sale del total y se queda fuera.',
    tapPrice: 'Toca un precio para corregirlo.',
    totalMeans: 'Lo que cuesta la parte de cada ingrediente que usa esta comida',
    totalMeansBody:
      'No es tu tique. Compras los paquetes enteros, no la cantidad exacta que pide el plato, así que la primera compra sale más cara y el resto pasa a la comida siguiente.',
    extraAdd: 'opcional: tócalo para añadirlo',
    copycatKeep:
      '{who} cobra {a} por una ración. La tuya sale por {b}: te ahorras {c} cada vez que la cocinas en lugar de pedirla.',

    /* ── The time budget ── */
    timeOver: 'por encima de tus {m}',
    timeOverWhy:
      'Más de los {m} minutos que pediste. Te lo enseño en vez de fingir que es más rápido: {t} minutos es el número real.',

    /* ── The cupboard, honestly ── */
    sampleKitchen:
      'Esta despensa son datos de ejemplo, para que la pantalla tenga algo que mostrar antes de que añadas nada. Las cantidades, los días y el valor no miden tu cocina: tu lista de la compra solo descuenta lo que cada receta da por supuesto y lo que marcas tú.',
    assumedHave:
      'Las líneas ya tachadas son lo que esta receta da por supuesto que hay en casi todas las cocinas, no algo que me hayas dicho tú: toca una para devolverla a la lista.',
    dietDerived:
      'Sin frutos secos, sin cerdo y sin alcohol se deducen leyendo los ingredientes de cada receta: no puedo ver qué metió una fábrica en un bote ni qué compartió línea de producción. Mira la etiqueta si es importante.',

    sampleStats:
      'Estas ocho semanas son datos de ejemplo, para que esta pantalla tenga algo que mostrar antes de que cocines nada. No son tuyos, no salen de este dispositivo, y tu primera comida real los sustituye.',
    samplePassport: 'Las banderas y los platos de abajo son datos de ejemplo: tu primera comida real los sustituye. El dinero que no fue a comida a domicilio sí es real, y sale de tu propio registro.',

    planTitle: 'La semana',
    planSub:
      'Varios días de cenas de una vez, y una sola lista de la compra para todo. Lo que ya tienes en la despensa se descuenta.',
    planDays: 'Cuántos días',
    planMeals: 'Comidas al día',
    planServings: 'Para cuántos',
    planBuild: 'Prepárame una semana',
    planRebuild: 'Cambiar',
    planSave: 'Guardar esta semana',
    planSaved: 'Guardado en tu cuenta.',
    planEmpty: 'Nada planeado aún. Elige tus días y yo los relleno.',
    planSwap: 'Cambiar',
    planList: 'Todo lo que necesitas',
    planTotal: 'La semana entera',
    planPerDay: 'al día',
    planCook: 'Cocinarlo',
    planDay: 'Día',
    planNeedsAccount:
      'Inicia sesión para conservar una semana entre dispositivos. Aquí funciona igual.',

    installTitle: 'Ponlo en tu pantalla de inicio',
    installBody:
      'Se abre como una aplicación y las recetas, los pasos y los temporizadores funcionan sin cobertura, que es lo que suele haber en una cocina.',
    install: 'Instalar',
    installed: 'Instalado. Búscalo en tu pantalla de inicio.',
    installIos: 'En iPhone: toca Compartir y luego Añadir a pantalla de inicio.',
    notifyTitle: 'Deja que te avise',
    notifyBody:
      'Un aviso el día después de cocinar algo que se conserva, y nada más. Sin publicidad ni insistencia con la racha.',
    notifyOn: 'Activar los avisos',
    notifyGranted: 'Hecho. Solo lo usaré para el aviso de las sobras.',
    notifyDenied: 'Las notificaciones están bloqueadas para este sitio en tu navegador.',
    notifyNeedsAccount:
      'Inicia sesión primero: un recordatorio tiene que ir asociado a una cuenta para poder enviarse.',
    offlineReady: 'Listo para usar sin conexión',
    sourceIdle: 'aún no conectado',
    sourceFx: 'el cambio de hoy entre la libra y tu moneda',
    sourceFxBundled: 'sin tipo publicado',
    liveLook: 'Toca para buscar tiendas cerca de ti',

    /* ── Getting around without a mouse ── */
    stepBack: 'Paso anterior',
    passportNudgeReal:
      '{n} países de este recetario de los que nunca has cocinado. El más barato que te falta es {c}: {d} sale a {a} la ración.',
    streakCleanReal: 'Nada a la basura esta noche: el plato volvió limpio.',
    locStart: '¿Dónde cocinas?',
    storeModelled: 'precios típicos de este tipo de tienda aquí',
    pantryLineSample: '{n} cosas que suele haber en una cocina',
    pantrySubSample: 'Una suposición inicial, no un escaneo de tus estantes',
    morning: 'Buenos días',
    afternoon: 'Buenas tardes',
    planSaveFailed: 'No se pudo guardar el plan. Comprueba tu conexión e inténtalo de nuevo.',
    savedAssumes: 'Eso supone unas nueve compras al mes.',
    streakGoOn: 'Cocina también mañana y la llama sigue contando.',

    /* ── Atribución ── */
    creditsLabel: 'Atribución',
    creditShort: 'Tiendas y precios: © OpenStreetMap contributors · Open Food Facts — ODbL',
    creditOsm:
      'Los nombres de lugares, las tiendas y los horarios vienen de OpenStreetMap. © OpenStreetMap contributors, bajo la Open Database Licence (ODbL).',
    creditOpenFood:
      'Los precios reales y los pesos de los envases vienen de Open Prices y Open Food Facts, bajo la Open Database Licence (ODbL).',
    creditOther:
      'La base medida es el monitor de precios de alimentos del PMA, vía HDX (CC BY). Los tipos de cambio son las tasas de referencia diarias del Banco Central Europeo.',

    /* ── Cuando un precio no entra ── */
    priceOutOfRange:
      'Eso no parece un precio de estante. Dime lo que costó un envase y su tamaño en gramos.',
    priceAlready: 'Ya registraste este hoy. El precio de mañana es el útil.',
    priceTooMany: 'Son muchos precios de golpe. Vuelve en una hora y pasarán los demás.',
    priceFailed: 'Ese precio no se guardó. Suele ser falta de señal — inténtalo en un momento.',

    /* ── When something breaks, and your data ── */
    crashTitle: "Algo aquí dentro se ha roto",
    crashBody: "Culpa mía, no tuya. Nada de lo que me has contado se ha tocado: sigue todo en este dispositivo. Recargar suele devolverte donde estabas.",
    crashWhat: "Qué ha fallado",
    crashReload: "Recargar Pantry",
    crashSave: "Guardar antes una copia de mis datos",
    dataTitle: "Tus datos",
    dataExport: "Guardar una copia",
    dataExportSub: "Un archivo con cuánto has cocinado, tus dietas, tu presupuesto, tu despensa y cada comida que has registrado. Va a tu dispositivo y a ningún otro sitio.",
    dataImport: "Volver a cargar una copia",
    dataImportSub: "Elige un archivo que hayas guardado aquí. Sustituye lo que hay en este dispositivo y Pantry se reinicia.",
    dataImportCloud: "Has iniciado sesión: tu registro de comidas se fusionará, pero los ajustes de tu cuenta ganan en la siguiente sincronización. Cierra sesión antes si este archivo debe sustituirlos.",
    dataImported: "Cargado. Han vuelto {n} comidas con él.",
    dataBadFile: "Eso no es un archivo de Pantry. No ha cambiado nada.",
    dataFutureFile: "Ese archivo viene de una versión de Pantry más nueva que esta. No voy a abrir la mitad y descartar el resto en silencio, así que no ha cambiado nada.",
    budgetRange: "Dame una cifra entre {a} y {b}.",
    pricesChecking: "comprobando precios reales…",
    priceSending: "Añadiendo…",
    planSaving: "Guardando…",
    sendingLink: "Enviando…",

    /* ── The small print ── */
    legalKicker: "La letra pequeña",
    privacyRow: "Privacidad",
    privacyRowSub: "Qué se guarda, dónde, y qué sale de este dispositivo",
    termsRow: "Condiciones",
    termsRowSub: "Lo que esta app promete, y lo que no",
    legalUpdated: "Última actualización: 3 de agosto de 2026",
    privTitle: "Privacidad",
    privIntro: "Pantry funciona en tu teléfono. Casi todo lo que haces aquí nunca sale de él. Esta página dice exactamente qué sí sale, cuándo, y quién lo ve — ni más, ni menos.",
    privLocalH: "Sin sesión iniciada, nada sale de este dispositivo",
    privLocalB: "Todo lo que le dices a Pantry se escribe en el almacenamiento local de tu navegador bajo una sola clave: pantry.v1. Contiene si has pasado por la configuración, cuánto has cocinado, tus dietas, tu país, tu presupuesto, tu límite de tiempo, tu idioma, el interruptor del aviso de sobras, tu registro de comidas, las respuestas que diste a las preguntas de Estadísticas, tu semana guardada, y lo que has marcado como ya presente en tu despensa.\nHay otra clave, pantry.fx.v1, con el tipo de cambio del día. Eso es un dato sobre el dinero, no sobre ti.\nNada de esto se envía a ningún sitio. No hay cuenta, ni servidor, ni petición. Borra los datos de este sitio en tu navegador y desaparece, y con ello todo lo que la app sabía.",
    privAccountH: "Con sesión iniciada, y solo entonces",
    privAccountB: "Iniciar sesión es opcional y la app funciona igual sin ello. Escribes un correo y recibes un enlace. No hay contraseña, así que no hay ninguna que guardar.\nTu correo y tu sesión los guarda Supabase, la base de datos y el servicio de acceso que usa esta app.\nA partir de ahí: profiles guarda los ajustes de arriba, para que la misma cuenta funcione en tu portátil. cook_log guarda lo que cocinaste — el plato, la fecha, lo que costó, raciones, calorías, proteína, carbohidratos, dificultad y cuánto acabó en la basura. saved_plans y plan_meals guardan una semana, si guardas alguna. price_reports guarda un precio, si informas de alguno. push_subscriptions y reminders guardan el aviso, si lo activas.\nNo se escribe nada en ninguna de ellas hasta que haces lo que la escribe. Las ocho semanas de ejemplo de Estadísticas nunca se suben — son un decorado, no tu historial. Lo que marcas como ya presente en tu despensa se queda en este dispositivo; no se sincroniza.",
    privDietH: "Las dietas, y lo que conviene saber sobre ellas",
    privDietB: "Tus dietas son un ajuste como cualquier otro y, con sesión iniciada, van en tu fila de perfil junto a lo demás.\nAlgunas — halal, kosher — dicen algo de ti que no va realmente sobre la cena. Prefiero decírtelo claramente antes que hacerme el listo. Si inicias sesión, esa lista está en una base de datos. Si prefieres que se quede en tu teléfono, usa Pantry sin iniciar sesión. Todo funciona.",
    privWhereH: "Dónde estás",
    privWhereB: "La ubicación está desactivada hasta que pulsas el botón que la pide, y tu navegador vuelve a preguntarte antes de que ocurra nada.\nSi lo permites, tus coordenadas van a dos sitios: Nominatim, de la OpenStreetMap Foundation, para convertirlas en un nombre de lugar, y Overpass, también de OpenStreetMap, para encontrar supermercados cerca de ti. Ambos son servicios públicos, sin clave ni cuenta detrás.\nPantry nunca guarda tus coordenadas. Lo que guarda es el nombre de la ciudad y el país, en este dispositivo — y el país va a tu fila de perfil si has iniciado sesión. Un país no es una ubicación.",
    privPhotoH: "La foto de tu plato",
    privPhotoB: "Nunca sale del dispositivo. La pantalla de Después lee el archivo en una object URL — un puntero que tu navegador guarda en memoria — y lo descarta al salir de la pantalla.\nNo se sube, no se guarda y no está en tu registro de comidas. Nada aquí podría volver a mostrarte esa foto, porque nada aquí la tuvo nunca.",
    privPushH: "La única notificación",
    privPushB: "Si activas los avisos, tu navegador crea una suscripción push y Pantry guarda tres cosas: el endpoint que te da tu navegador, dos claves que permiten cifrar un mensaje para ti, y una copia acortada de la cadena user-agent de tu navegador, para distinguir una suscripción muerta de una viva.\nExisten para enviar un solo tipo de mensaje: el día después de cocinar algo que aguanta, un recordatorio de que sigue bueno. Nunca se les envía nada más, por nadie. Desactiva las notificaciones en tu navegador y el endpoint deja de funcionar.",
    privPriceH: "Los precios que informas",
    privPriceB: "Cuando le dices a Pantry lo que algo costó de verdad, guarda el ingrediente, el precio, la moneda, el tamaño del paquete, el nombre de la tienda si lo diste, el país y tu cuenta.\nTu cuenta está ahí para poder quitarlo. Un precio que informaste es un precio que puedes hacer borrar.\nNadie más puede leer tu informe. La lectura de precios pasa por una función que devuelve solo agregados: el precio mediano por kilo, cuántos informes hubo y qué tan reciente es el más nuevo. Nunca quién lo informó, nunca dónde compra.",
    privOthersH: "Con quién más habla tu dispositivo",
    privOthersB: "api.frankfurter.app, para el tipo de cambio diario del Banco Central Europeo entre libras y tu moneda.\nnominatim.openstreetmap.org y overpass-api.de, solo cuando has permitido la ubicación, como arriba.\nprices.openfoodfacts.org — Open Prices, parte de Open Food Facts — para precios que la gente ha fotografiado en un estante de tu país. Se le pide una categoría de ingrediente y un código de país, y nada sobre ti.\nTu proyecto de Supabase, solo mientras inicias sesión o la tienes iniciada.\nEl sitio lo sirve Netlify que, como cualquier alojamiento web, ve la petición de la página en sus registros de servidor normales. Nada dentro de la app le informa.\nLa lista de fuentes en Ajustes enlaza a OpenStreetMap, Open Food Facts y el BCE. Abrir una de ellas es visitar su sitio, y te ven como cualquier sitio ve a un visitante.",
    privNeverH: "Lo que Pantry no hace",
    privNeverB: "Sin publicidad. Aquí no se vende, alquila ni entrega nada a nadie por dinero.\nSin analítica de terceros. En este sitio no hay ningún script de seguimiento — ni uno. Las dos tipografías se sirven desde este dominio y no desde una CDN de fuentes, así que leer una receta no envía tu dirección a Google.\nSin perfilado más allá de lo que ves en pantalla. Las preguntas de Estadísticas son todo lo que hay, las respondiste tú, y cada una tiene un botón Olvidar al lado.",
    privRightsH: "Lo que puedes pedir",
    privRightsB: "Verlo. Sin sesión, todo es el único valor bajo pantry.v1 en el almacenamiento de tu navegador, y las herramientas del propio navegador te lo muestran. Con sesión, pídelo y te enviaré lo que las tablas guardan sobre ti.\nLlevártelo. Todavía no hay botón de exportar. Eso es una carencia, no una política, y habría que construirlo.\nBorrarlo. Ajustes → Empezar de nuevo borra pantry.v1 de este dispositivo al instante; deja el tipo de cambio, porque nunca fue tuyo. Borrar la cuenta tampoco tiene botón aún — escribe a la dirección de abajo y la cuenta desaparece, y con ella el perfil, el registro de comidas, las semanas guardadas, los recordatorios y las suscripciones push. Dilo y los precios que informaste se van también.\nSi estás en el Reino Unido o la UE, estos son tus derechos bajo el RGPD del Reino Unido y el RGPD, y puedes reclamar ante tu autoridad de protección de datos — en el Reino Unido, la ICO.",
    privContactH: "Preguntar",
    privContactB: "Una sola dirección, abajo, para cualquier cosa de esta página: una duda, una corrección, un borrado — o una frase de aquí que no coincida con lo que la app hace de verdad. Esa última es la que más quiero escuchar.",
    termTitle: "Condiciones",
    termIntro: "Cortas, porque deben serlo. Pantry es una app de cocina gratuita. Usarla significa que aceptas lo que hay en esta página.",
    termWhatH: "Qué es Pantry",
    termWhatB: "Un recetario que se pone precio allí donde estás y trata de ajustarse a lo que sabes cocinar, a lo que tienes y al tiempo del que dispones.\nEs una herramienta para decidir qué hay de cena. No es consejo nutricional, ni médico, ni financiero, y no es una tienda — aquí nada te vende nada.",
    termPriceH: "Los precios son estimaciones",
    termPriceB: "Casi todos los números de Pantry están modelados: un precio típico para ese ingrediente, en ese tipo de tienda, en ese país, convertido a un tipo de cambio de banco central. La pantalla de Compra indica qué precios están medidos y cuáles modelados, porque la diferencia importa.\nIncluso un precio medido es lo que alguien pagó en algún sitio en los últimos seis meses. Tu ticket será distinto. Nada aquí es una oferta, un presupuesto ni una garantía de lo que cuesta algo.",
    termAllergenH: "No es una garantía sobre alérgenos",
    termAllergenB: "Sin frutos secos, sin cerdo y sin alcohol se deducen leyendo los ingredientes de cada receta. La app no puede ver qué metió una fábrica en un bote, ni qué compartió línea de producción. Mira la etiqueta si te importa.\nSi una alergia es grave, no dejes que sea esta app quien decida. Está filtrando una lista de palabras. No está leyendo tu paquete.",
    termCookH: "La cocina es tuya",
    termCookB: "Los tiempos y las temperaturas son una guía. Los hornos varían, las sartenes varían, y solo tú puedes ver si el pollo está hecho. Cocina a temperaturas seguras, enfría bien las sobras y usa tu criterio sobre cuánto aguanta algo — el aviso de sobras es un recordatorio para comprobar, no un veredicto de que sea seguro.\nPantry se ofrece tal cual, sin garantía de ningún tipo. A veces se equivocará, y no se hace responsable de lo que pase en tu cocina.",
    termAccountH: "Tu cuenta",
    termAccountB: "Inicia sesión con un correo que controles. Una persona, una cuenta.\nInforma precios con honestidad. Un informe de precio existe para ayudar a la siguiente persona que esté en ese pasillo, y los informes inventados pueden borrarse, junto con la cuenta que los hizo.\nPuedes irte cuando quieras. Privacidad explica cómo.",
    termLicenceH: "De quién es cada cosa",
    termLicenceB: "Las recetas, los textos, las ilustraciones y el código de Pantry son de Pantry. Cocina con ellas, imprímelas, da de comer a la gente. No republiques la colección como si fuera tuya.\nLos datos de mapas, tiendas y precios vienen de OpenStreetMap y Open Food Facts bajo la Open Database Licence, y los tipos de cambio del Banco Central Europeo. Ajustes nombra cada fuente y su licencia.\nUn precio que informas sigue siendo tuyo para borrarlo, y permites a Pantry publicarlo como parte de un agregado — una mediana sin nombre, que es la única forma en que alguien más lo ve.",
    termChangeH: "Si esto cambia",
    termChangeB: "Estas condiciones y la política de privacidad llevan una fecha arriba. Si alguna cambia de forma relevante, la fecha cambia con ella y la app lo dice.\nSeguir usando Pantry después de eso es aceptar la nueva versión. Las dudas van a la dirección de abajo.",
  },

  fr: {
    account: 'Compte',
    accountTitle: 'Gardez tout ça sur tous vos appareils',
    accountBody:
      'Facultatif. Votre objectif, ce que vous savez déjà cuisiner, vos régimes, votre journal de cuisine et vos placards vous suivent sur un autre téléphone ou un ordinateur. Tout fonctionne pareil sans compte : ceci décide seulement où c’est gardé.',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'vous@exemple.com',
    sendLink: 'Envoyez-moi un lien',
    linkSent: 'Regardez vos e-mails. Le lien vous connecte, sans mot de passe à retenir.',
    signedInAs: 'Connecté en tant que',
    signOut: 'Se déconnecter',
    syncing: 'Synchronisation…',
    cloudOff:
      'La synchronisation n’est pas configurée dans cette version : tout reste sur cet appareil.',
    localOnly: 'Sur cet appareil uniquement',
    cloudUnreachable:
      'Impossible de joindre le service de connexion — le plus souvent, c’est le réseau. Tout le reste continue de fonctionner sur cet appareil.',

    /* ── The one question ── */
    /* Lifted from each language's own tierSkillSub with the sentence about
       dragging cut off the front, so these are real translations rather
       than six new ones. */
    levelSub: 'Il n’y a pas de mauvaise réponse. Cela m’évite simplement de vous proposer des choses qui vous agaceront.',
    stepOf: 'Étape {n} sur {of}',
    resLevel: 'pour votre niveau',

    /* ── Mascot ── */
    mascotN: 'Pantry, dans le coin',
    mascotS: 'La petite cocotte à la cuillère. Désactivez-la si elle vous distrait.',

    priceAsk: 'Vu un autre prix ?',
    priceAskBody:
      'Dites-moi ce que ça a vraiment coûté et tous ceux qui font leurs courses ici auront un vrai chiffre au lieu de mon estimation.',
    priceWhat: 'Combien ça a coûté ?',
    pricePack: 'Taille du paquet',
    priceSend: 'Ajouter ce prix',
    priceThanks: 'Enregistré. Un vrai prix de plus dans le panier.',
    priceNeedsAccount:
      'Connectez-vous d’abord : les prix sont rattachés à un compte pour pouvoir être retirés.',
    priceCommunity: 'personnes qui font leurs courses ici',
    priceReported: 'signalé',
    legCommunity: 'Signalé par des gens qui font leurs courses ici',
    legOpenPrices: 'Open Prices, relevés par des acheteurs dans ce pays',
    priceOpen: 'relevés sur Open Prices',

    haveIt: 'dans votre cuisine',
    tapToToggle: 'Touchez ce que vous avez déjà : ça sort du total et ça y reste.',
    tapPrice: 'Touchez un prix pour le corriger.',
    totalMeans: 'Ce que coûte la part de chaque ingrédient utilisée par ce plat',
    totalMeansBody:
      'Ce n’est pas votre ticket de caisse. Vous achetez des paquets entiers, pas la quantité exacte qu’il faut au plat : les premières courses coûtent donc plus cher et le reste sert au repas suivant.',
    extraAdd: 'facultatif — touchez pour l’ajouter',
    copycatKeep:
      '{who} facture {a} la portion. La vôtre revient à {b} — vous gardez {c} à chaque fois que vous la cuisinez au lieu de la commander.',

    /* ── The time budget ── */
    timeOver: 'au-dessus de vos {m}',
    timeOverWhy:
      'Plus long que les {m} minutes que vous avez demandées. Je vous le montre plutôt que de faire croire que c’est plus rapide : {t} minutes, c’est le vrai chiffre.',

    /* ── The cupboard, honestly ── */
    sampleKitchen:
      'Ce placard est constitué de données d’exemple, pour que l’écran ait quelque chose à montrer avant que vous ayez ajouté quoi que ce soit. Les quantités, les jours et la valeur ne mesurent pas votre cuisine — votre liste de courses ne retire que ce que chaque recette suppose et ce que vous cochez vous-même.',
    assumedHave:
      'Les lignes déjà barrées sont ce que cette recette suppose présent dans la plupart des cuisines, pas ce que vous m’avez dit — touchez-en une pour la remettre sur la liste.',
    dietDerived:
      'Sans fruits à coque, sans porc et sans alcool sont déduits des ingrédients de chaque recette — je ne vois pas ce qu\'une usine a mis dans un bocal, ni ce qui a partagé une ligne de production. Vérifiez l\'étiquette si cela compte.',

    sampleStats:
      'Ces huit semaines sont des données d’exemple, pour que cet écran ait quelque chose à montrer avant que vous ayez cuisiné. Elles ne sont pas les vôtres, elles ne quittent jamais cet appareil, et votre premier vrai plat les remplace.',
    samplePassport: 'Les drapeaux et les plats ci-dessous sont des données d’exemple : votre premier vrai plat les remplace. L’argent gardé hors des plats à emporter est réel, et vient de votre propre journal.',

    planTitle: 'La semaine',
    planSub:
      'Plusieurs jours de dîners d’un coup, et une seule liste de courses pour le tout. Ce que vous avez déjà en est déduit.',
    planDays: 'Combien de jours',
    planMeals: 'Repas par jour',
    planServings: 'Pour combien',
    planBuild: 'Composez-moi une semaine',
    planRebuild: 'Remélanger',
    planSave: 'Enregistrer cette semaine',
    planSaved: 'Enregistré dans votre compte.',
    planEmpty: 'Rien de prévu. Choisissez vos jours et je les remplis.',
    planSwap: 'Changer',
    planList: 'Tout ce qu’il vous faut',
    planTotal: 'La semaine entière',
    planPerDay: 'par jour',
    planCook: 'Le cuisiner',
    planDay: 'Jour',
    planNeedsAccount:
      'Connectez-vous pour garder une semaine d’un appareil à l’autre. Ça marche ici de toute façon.',

    installTitle: 'Mettez-la sur votre écran d’accueil',
    installBody:
      'Elle s’ouvre comme une application et les recettes, les étapes et les minuteurs marchent sans réseau — ce qu’une cuisine a généralement.',
    install: 'Installer',
    installed: 'Installée. Cherchez-la sur votre écran d’accueil.',
    installIos: 'Sur iPhone : touchez Partager, puis Sur l’écran d’accueil.',
    notifyTitle: 'Laissez-moi vous rappeler',
    notifyBody:
      'Une notification le lendemain d’un plat qui se garde, et rien d’autre. Pas de publicité, pas de harcèlement sur les séries.',
    notifyOn: 'Activer les rappels',
    notifyGranted: 'C’est fait. Je ne m’en servirai que pour le rappel des restes.',
    notifyDenied: 'Les notifications sont bloquées pour ce site dans votre navigateur.',
    notifyNeedsAccount:
      'Connectez-vous d’abord : un rappel doit être rattaché à un compte pour être envoyé.',
    offlineReady: 'Prête à servir hors ligne',
    sourceIdle: 'pas encore connecté',
    sourceFx: 'le taux du jour entre la livre et votre monnaie',
    sourceFxBundled: 'aucun taux publié',
    liveLook: 'Touchez pour chercher des magasins près de vous',

    /* ── Getting around without a mouse ── */
    stepBack: 'Étape précédente',
    passportNudgeReal:
      '{n} pays d’ici dont vous n’avez jamais rien cuisiné. Le moins cher qui vous manque est {c} : {d} revient à {a} la portion.',
    streakCleanReal: 'Rien à la poubelle ce soir — l\'assiette est revenue vide.',
    locStart: 'Où cuisinez-vous ?',
    storeModelled: 'prix typiques de ce type de magasin ici',
    pantryLineSample: '{n} choses qu\'une cuisine a d\'habitude',
    pantrySubSample: 'Une hypothèse de départ, pas un scan de vos étagères',
    morning: 'Bonjour',
    afternoon: 'Bon après-midi',
    planSaveFailed: 'Impossible d\'enregistrer le plan — vérifiez votre connexion et réessayez.',
    savedAssumes: 'Cela suppose environ neuf courses par mois.',
    streakGoOn: 'Cuisinez encore demain et la flamme continue de compter.',

    /* ── Attribution ── */
    creditsLabel: 'Attribution',
    creditShort: 'Magasins et prix : © OpenStreetMap contributors · Open Food Facts — ODbL',
    creditOsm:
      'Les noms de lieux, les magasins et les horaires viennent d’OpenStreetMap. © OpenStreetMap contributors, sous licence Open Database (ODbL).',
    creditOpenFood:
      'Les prix réels et les poids des emballages viennent d’Open Prices et d’Open Food Facts, sous licence Open Database (ODbL).',
    creditOther:
      'La base mesurée est le suivi des prix alimentaires du PAM, via HDX (CC BY). Les taux de change sont les taux de référence quotidiens de la Banque centrale européenne.',

    /* ── Quand un prix ne passe pas ── */
    priceOutOfRange:
      'Cela ne ressemble pas à un prix en rayon. Donnez-moi ce qu’a coûté un paquet, et sa taille en grammes.',
    priceAlready: 'Vous avez déjà noté celui-ci aujourd’hui. C’est le prix de demain qui sera utile.',
    priceTooMany: 'Cela fait beaucoup de prix d’un coup. Revenez dans une heure et le reste passera.',
    priceFailed:
      'Ce prix n’a pas été enregistré. En général c’est le réseau — réessayez dans un instant.',

    /* ── When something breaks, and your data ── */
    crashTitle: "Quelque chose ici a cassé",
    crashBody: "C’est ma faute, pas la vôtre. Rien de ce que vous m’avez dit n’a été touché — tout est encore sur cet appareil. Recharger vous ramène en général là où vous étiez.",
    crashWhat: "Ce qui a échoué",
    crashReload: "Recharger Pantry",
    crashSave: "Sauvegarder d’abord une copie de mes données",
    dataTitle: "Vos données",
    dataExport: "Sauvegarder une copie",
    dataExportSub: "Un fichier avec ce que vous savez déjà cuisiner, vos régimes, votre budget, vos placards et chaque plat que vous avez enregistré. Il va sur votre appareil et nulle part ailleurs.",
    dataImport: "Recharger une copie",
    dataImportSub: "Choisissez un fichier sauvegardé ici. Il remplace ce qui est sur cet appareil, et Pantry redémarre.",
    dataImportCloud: "Vous êtes connecté : votre journal de cuisine fusionnera, mais les réglages de votre compte l’emportent à la prochaine synchronisation. Déconnectez-vous d’abord si ce fichier doit les remplacer.",
    dataImported: "Chargé. {n} plats sont revenus avec.",
    dataBadFile: "Ce n’est pas un fichier Pantry. Rien n’a changé.",
    dataFutureFile: "Ce fichier vient d’une version de Pantry plus récente que celle-ci. Je ne vais pas en ouvrir la moitié et jeter le reste en silence, donc rien n’a changé.",
    budgetRange: "Donnez-moi un montant entre {a} et {b}.",
    pricesChecking: "vérification des prix réels…",
    priceSending: "Ajout…",
    planSaving: "Enregistrement…",
    sendingLink: "Envoi…",

    /* ── The small print ── */
    legalKicker: "Les petits caractères",
    privacyRow: "Confidentialité",
    privacyRowSub: "Ce qui est gardé, où, et ce qui quitte cet appareil",
    termsRow: "Conditions",
    termsRowSub: "Ce que cette app promet, et ce qu’elle ne promet pas",
    legalUpdated: "Dernière mise à jour : 3 août 2026",
    privTitle: "Confidentialité",
    privIntro: "Pantry tourne sur votre téléphone. Presque tout ce que vous y faites n’en sort jamais. Cette page dit exactement ce qui en sort, quand, et qui le voit — ni plus, ni moins.",
    privLocalH: "Déconnecté, rien ne quitte cet appareil",
    privLocalB: "Tout ce que vous dites à Pantry est écrit dans le stockage local de votre navigateur sous une seule clé : pantry.v1. Elle contient si vous avez fait la configuration, ce que vous savez déjà cuisiner, vos régimes, votre pays, votre budget, votre limite de temps, votre langue, l’interrupteur du rappel de restes, votre journal de cuisine, les réponses données aux questions de l’écran Chiffres, votre semaine enregistrée, et ce que vous avez coché comme déjà présent dans votre placard.\nIl y a une autre clé, pantry.fx.v1, qui garde le taux de change du jour. C’est un fait sur l’argent, pas sur vous.\nRien de tout cela n’est envoyé nulle part. Pas de compte, pas de serveur, pas de requête. Effacez les données de ce site dans votre navigateur et tout disparaît, y compris tout ce que l’app savait.",
    privAccountH: "Connecté, et seulement alors",
    privAccountB: "Se connecter est facultatif et l’app fonctionne pareil sans. Vous tapez une adresse e-mail et recevez un lien. Pas de mot de passe, donc aucun à stocker.\nVotre adresse e-mail et votre session sont gardées par Supabase, la base de données et le service de connexion utilisés par cette app.\nEnsuite : profiles garde les réglages ci-dessus, pour que le même compte marche sur votre portable. cook_log garde ce que vous avez cuisiné — le plat, la date, le coût, les portions, calories, protéines, glucides, difficulté, et ce qui est parti à la poubelle. saved_plans et plan_meals gardent une semaine, si vous en enregistrez une. price_reports garde un prix, si vous en signalez un. push_subscriptions et reminders gardent la notification, si vous l’activez.\nRien n’y est écrit tant que vous n’avez pas fait la chose qui l’écrit. Les huit semaines d’exemple de l’écran Chiffres ne sont jamais envoyées — c’est un décor, pas votre historique. Ce que vous cochez comme déjà présent dans votre placard reste sur cet appareil ; ce n’est pas synchronisé.",
    privDietH: "Les régimes, et ce qu’il faut savoir",
    privDietB: "Vos régimes sont un réglage comme un autre et, connecté, ils vont dans votre ligne de profil avec le reste.\nCertains — halal, casher — disent quelque chose de vous qui ne parle pas vraiment du dîner. Je préfère vous le dire simplement plutôt que de ruser. Si vous vous connectez, cette liste est dans une base de données. Si vous préférez qu’elle reste sur votre téléphone, utilisez Pantry déconnecté. Tout fonctionne.",
    privWhereH: "Où vous êtes",
    privWhereB: "La localisation est désactivée tant que vous n’appuyez pas sur le bouton qui la demande, et votre navigateur vous redemande avant que quoi que ce soit ne se passe.\nSi vous l’autorisez, vos coordonnées partent à deux endroits : Nominatim, géré par la OpenStreetMap Foundation, pour en tirer un nom de lieu, et Overpass, également OpenStreetMap, pour trouver les supermarchés autour de vous. Deux services publics, sans clé ni compte.\nPantry ne stocke jamais vos coordonnées. Ce qu’il garde, c’est le nom de la ville et le pays, sur cet appareil — et le pays part dans votre ligne de profil si vous êtes connecté. Un pays n’est pas une position.",
    privPhotoH: "La photo de votre assiette",
    privPhotoB: "Elle ne quitte jamais l’appareil. L’écran Après lit le fichier dans une object URL — un pointeur que votre navigateur garde en mémoire — et la jette quand vous quittez l’écran.\nElle n’est ni envoyée, ni stockée, ni dans votre journal de cuisine. Rien ici ne pourrait vous la remontrer, parce que rien ici ne l’a jamais eue.",
    privPushH: "La seule notification",
    privPushB: "Si vous activez les rappels, votre navigateur crée un abonnement push et Pantry garde trois choses : l’endpoint que votre navigateur lui donne, deux clés qui permettent de chiffrer un message pour vous, et une version raccourcie de la chaîne user-agent de votre navigateur, pour distinguer un abonnement mort d’un vivant.\nIls existent pour envoyer un seul type de message : le lendemain d’un plat qui se garde, un rappel qu’il est encore bon. Rien d’autre ne leur est jamais envoyé, par personne. Coupez les notifications dans votre navigateur et l’endpoint cesse de fonctionner.",
    privPriceH: "Les prix que vous signalez",
    privPriceB: "Quand vous dites à Pantry ce qu’une chose a réellement coûté, il enregistre l’ingrédient, le prix, la devise, la taille du paquet, le nom du magasin si vous l’avez donné, le pays, et votre compte.\nVotre compte y figure pour qu’on puisse le retirer. Un prix que vous avez signalé est un prix que vous pouvez faire supprimer.\nPersonne d’autre ne peut lire votre signalement. La lecture des prix passe par une fonction qui ne renvoie que des agrégats : le prix médian au kilo, le nombre de signalements, et la fraîcheur du plus récent. Jamais qui l’a signalé, jamais où il fait ses courses.",
    privOthersH: "À qui d’autre votre appareil parle",
    privOthersB: "api.frankfurter.app, pour le taux quotidien de la Banque centrale européenne entre la livre et votre devise.\nnominatim.openstreetmap.org et overpass-api.de, uniquement une fois la localisation autorisée, comme ci-dessus.\nprices.openfoodfacts.org — Open Prices, qui fait partie d’Open Food Facts — pour des prix photographiés en rayon dans votre pays. On lui demande une catégorie d’ingrédient et un code pays, et rien sur vous.\nVotre projet Supabase, uniquement pendant que vous vous connectez ou êtes connecté.\nLe site lui-même est servi par Netlify qui, comme tout hébergeur, voit la requête de la page dans ses journaux serveur ordinaires. Rien dans l’app ne lui rapporte quoi que ce soit.\nLa liste des sources dans Réglages renvoie vers OpenStreetMap, Open Food Facts et la BCE. En ouvrir une, c’est visiter leur site, et ils vous voient comme n’importe quel site voit un visiteur.",
    privNeverH: "Ce que Pantry ne fait pas",
    privNeverB: "Pas de publicité. Rien ici n’est vendu, loué ni remis à qui que ce soit contre de l’argent.\nPas d’analytique tierce. Il n’y a aucun script de suivi sur ce site — aucun. Les deux polices sont servies depuis ce domaine et non depuis un CDN, donc lire une recette n’envoie pas votre adresse à Google.\nPas de profilage au-delà de ce qui est à l’écran. Les questions de l’écran Chiffres, c’est tout, vous y avez répondu vous-même, et chacune a un bouton Oublier à côté.",
    privRightsH: "Ce que vous pouvez demander",
    privRightsB: "Le voir. Déconnecté, tout tient dans la seule valeur sous pantry.v1 dans le stockage de votre navigateur, et les outils du navigateur vous la montrent. Connecté, demandez et je vous enverrai ce que les tables gardent sur vous.\nL’emporter. Il n’y a pas encore de bouton d’export. C’est un manque, pas une politique, et il faudrait le construire.\nLe supprimer. Réglages → Tout recommencer efface pantry.v1 de cet appareil immédiatement ; le taux de change reste, parce qu’il n’a jamais été à vous. Supprimer le compte n’a pas encore de bouton non plus — écrivez à l’adresse ci-dessous et le compte disparaît, avec le profil, le journal de cuisine, les semaines enregistrées, les rappels et les abonnements push. Dites-le et les prix que vous avez signalés partent aussi.\nSi vous êtes au Royaume-Uni ou dans l’UE, ce sont vos droits au titre du RGPD britannique et du RGPD, et vous pouvez saisir votre autorité de protection des données — au Royaume-Uni, l’ICO.",
    privContactH: "Demander",
    privContactB: "Une seule adresse, ci-dessous, pour tout ce qui figure sur cette page : une question, une correction, une suppression — ou une phrase d’ici qui ne correspond pas à ce que l’app fait vraiment. C’est cette dernière que je veux entendre en premier.",
    termTitle: "Conditions",
    termIntro: "Courtes, parce qu’elles doivent l’être. Pantry est une app de cuisine gratuite. L’utiliser vaut acceptation de ce qui est écrit ici.",
    termWhatH: "Ce qu’est Pantry",
    termWhatB: "Un livre de recettes qui se chiffre là où vous vous trouvez et essaie de coller à ce que vous savez cuisiner, à ce que vous avez et au temps dont vous disposez.\nC’est un outil pour décider du dîner. Ce n’est pas un conseil nutritionnel, médical ou financier, et ce n’est pas une boutique — rien ici ne vous vend quoi que ce soit.",
    termPriceH: "Les prix sont des estimations",
    termPriceB: "Presque tous les chiffres de Pantry sont modélisés : un prix typique pour cet ingrédient, dans ce type de magasin, dans ce pays, converti à un taux de banque centrale. L’écran Courses indique quels prix sont mesurés et lesquels sont modélisés, parce que la différence compte.\nMême un prix mesuré, c’est ce que quelqu’un a payé quelque part dans les six derniers mois. Votre ticket de caisse sera différent. Rien ici n’est une offre, un devis, ni une garantie de prix.",
    termAllergenH: "Pas une garantie sur les allergènes",
    termAllergenB: "Sans fruits à coque, sans porc et sans alcool sont déduits en lisant les ingrédients de chaque recette. L’app ne peut pas voir ce qu’une usine a mis dans un bocal, ni ce qui a partagé une ligne de production. Vérifiez l’étiquette si c’est important.\nSi une allergie est sérieuse, ne laissez pas cette app trancher. Elle filtre une liste de mots. Elle ne lit pas votre paquet.",
    termCookH: "La cuisine, c’est vous",
    termCookB: "Les temps et les températures sont indicatifs. Les fours diffèrent, les poêles diffèrent, et vous seul voyez si le poulet est cuit. Cuisez à des températures sûres, refroidissez correctement les restes, et jugez vous-même de leur durée — le rappel de restes invite à vérifier, il ne déclare pas que c’est sans risque.\nPantry est fourni tel quel, sans garantie d’aucune sorte. Il se trompera parfois, et il n’est pas responsable de ce qui se passe dans votre cuisine.",
    termAccountH: "Votre compte",
    termAccountB: "Connectez-vous avec une adresse e-mail qui vous appartient. Une personne, un compte.\nSignalez les prix honnêtement. Un signalement sert à aider la prochaine personne dans ce rayon, et les signalements inventés peuvent être supprimés, avec le compte qui les a faits.\nVous pouvez partir quand vous voulez. La page Confidentialité dit comment.",
    termLicenceH: "À qui appartient quoi",
    termLicenceB: "Les recettes, les textes, les illustrations et le code de Pantry appartiennent à Pantry. Cuisinez-les, imprimez-les, nourrissez des gens. Ne republiez pas la collection comme si elle était la vôtre.\nLes données de cartes, de magasins et de prix viennent d’OpenStreetMap et d’Open Food Facts sous l’Open Database Licence, et les taux de change de la Banque centrale européenne. Réglages nomme chaque source et sa licence.\nUn prix que vous signalez reste le vôtre à supprimer, et vous autorisez Pantry à le publier au sein d’un agrégat — une médiane sans nom, la seule forme que voient les autres.",
    termChangeH: "Si cela change",
    termChangeB: "Ces conditions et la politique de confidentialité portent une date en haut. Si l’une change de façon significative, la date change avec elle et l’app le signale.\nContinuer à utiliser Pantry après cela vaut acceptation de la nouvelle version. Les questions vont à l’adresse ci-dessous.",
  },

  pl: {
    account: 'Konto',
    accountTitle: 'Zachowaj to na wszystkich urządzeniach',
    accountBody:
      'Opcjonalnie. Twój cel, ile już gotowałeś, diety, dziennik gotowania i szafka przeniosą się na inny telefon albo laptop. Bez logowania działa tak samo — to decyduje tylko o tym, gdzie się to trzyma.',
    emailLabel: 'Adres e-mail',
    emailPlaceholder: 'ty@przyklad.pl',
    sendLink: 'Wyślij mi link',
    linkSent: 'Sprawdź pocztę. Link cię zaloguje, bez hasła do zapamiętania.',
    signedInAs: 'Zalogowano jako',
    signOut: 'Wyloguj się',
    syncing: 'Synchronizacja…',
    cloudOff:
      'Synchronizacja nie jest skonfigurowana w tej wersji, więc wszystko zostaje na tym urządzeniu.',
    localOnly: 'Tylko na tym urządzeniu',
    cloudUnreachable:
      'Nie udało się połączyć z usługą logowania — zwykle to brak zasięgu. Cała reszta działa dalej na tym urządzeniu.',

    /* ── The one question ── */
    /* Lifted from each language's own tierSkillSub with the sentence about
       dragging cut off the front, so these are real translations rather
       than six new ones. */
    levelSub: 'Nie ma złej odpowiedzi. To tylko po to, żebym nie proponował ci rzeczy, które cię zirytują.',
    stepOf: 'Krok {n} z {of}',
    resLevel: 'dla twojego poziomu',

    /* ── Mascot ── */
    mascotN: 'Pantry, w rogu',
    mascotS: 'Garnuszek z łyżką. Wyłącz go, jeśli rozprasza.',

    priceAsk: 'Widziałeś inną cenę?',
    priceAskBody:
      'Powiedz, ile naprawdę kosztowało, a każdy, kto kupuje tutaj, zobaczy prawdziwą liczbę zamiast mojego szacunku.',
    priceWhat: 'Ile kosztowało?',
    pricePack: 'Wielkość opakowania',
    priceSend: 'Dodaj tę cenę',
    priceThanks: 'Zapisane. O jedną prawdziwą cenę w koszyku więcej.',
    priceNeedsAccount:
      'Najpierw się zaloguj — ceny są przypisane do konta, żeby dało się je wycofać.',
    priceCommunity: 'osób kupujących tutaj',
    priceReported: 'zgłoszono',
    legCommunity: 'Zgłoszone przez ludzi kupujących tutaj',
    legOpenPrices: 'Open Prices, zapisane przez kupujących w tym kraju',
    priceOpen: 'zapisanych w Open Prices',

    haveIt: 'w twojej kuchni',
    tapToToggle: 'Dotknij tego, co już masz — zniknie z sumy i tak zostanie.',
    tapPrice: 'Dotknij ceny, żeby ją poprawić.',
    totalMeans: 'Ile kosztuje ta część każdego składnika, którą zjada ten posiłek',
    totalMeansBody:
      'To nie paragon. Kupujesz całe opakowania, a nie dokładnie tyle, ile potrzeba do dania — więc pierwsze zakupy są droższe, a reszta przechodzi na następny posiłek.',
    extraAdd: 'opcjonalne — dotknij, żeby dodać',
    copycatKeep:
      '{who} liczy sobie {a} za porcję. Twoja wychodzi {b} — zostaje ci {c} za każdym razem, gdy gotujesz to zamiast zamawiać.',

    /* ── The time budget ── */
    timeOver: 'ponad twoje {m}',
    timeOverWhy:
      'Dłużej niż {m} minut, o które prosiłeś. Pokazuję to, zamiast udawać, że jest szybsze: {t} minut to prawdziwa liczba.',

    /* ── The cupboard, honestly ── */
    sampleKitchen:
      'Ta szafka to dane przykładowe, żeby ekran miał co pokazać, zanim cokolwiek dodasz. Liczby, dni i wartość nie są pomiarem twojej kuchni — z listy zakupów schodzi tylko to, co zakłada sam przepis, i to, co odhaczysz sam.',
    assumedHave:
      'Przekreślone pozycje to nie twoja informacja, tylko założenie przepisu, że są w większości kuchni — dotknij którejś, żeby wróciła na listę.',
    dietDerived:
      'Bez orzechów, bez wieprzowiny i bez alkoholu wyliczam z listy składników każdego przepisu — nie widzę, co fabryka włożyła do słoika ani co dzieliło linię produkcyjną. Sprawdź etykietę, jeśli to ważne.',

    sampleStats:
      'Te osiem tygodni to dane przykładowe, żeby ten ekran miał co pokazać, zanim cokolwiek ugotujesz. Nie są twoje, nigdy nie opuszczają tego urządzenia, a pierwsze prawdziwe gotowanie je zastąpi.',
    samplePassport: 'Flagi i dania poniżej to dane przykładowe — pierwsze prawdziwe gotowanie je zastąpi. Pieniądze niewydane na jedzenie na wynos są prawdziwe i pochodzą z twojego własnego dziennika.',

    planTitle: 'Tydzień',
    planSub:
      'Kilka dni kolacji za jednym razem i jedna lista zakupów na wszystko. To, co masz w szafce, jest odliczone.',
    planDays: 'Ile dni',
    planMeals: 'Posiłków dziennie',
    planServings: 'Dla ilu osób',
    planBuild: 'Ułóż mi tydzień',
    planRebuild: 'Przetasuj',
    planSave: 'Zapisz ten tydzień',
    planSaved: 'Zapisano na twoim koncie.',
    planEmpty: 'Nic jeszcze nie zaplanowane. Wybierz dni, a ja je wypełnię.',
    planSwap: 'Zamień',
    planList: 'Wszystko, czego potrzebujesz',
    planTotal: 'Cały tydzień',
    planPerDay: 'dziennie',
    planCook: 'Ugotuj to',
    planDay: 'Dzień',
    planNeedsAccount:
      'Zaloguj się, żeby zachować tydzień między urządzeniami. Tutaj i tak działa.',

    installTitle: 'Dodaj to na ekran główny',
    installBody:
      'Otwiera się jak aplikacja, a przepisy, kroki i minutniki działają bez zasięgu — czyli tak, jak zwykle bywa w kuchni.',
    install: 'Zainstaluj',
    installed: 'Zainstalowane. Poszukaj na ekranie głównym.',
    installIos: 'Na iPhonie: dotknij Udostępnij, potem Dodaj do ekranu początkowego.',
    notifyTitle: 'Pozwól mi przypomnieć',
    notifyBody:
      'Jedno powiadomienie dzień po ugotowaniu czegoś, co się przechowa, i nic więcej. Bez reklam i bez męczenia o serie.',
    notifyOn: 'Włącz przypomnienia',
    notifyGranted: 'Gotowe. Użyję tego tylko do przypomnienia o resztkach.',
    notifyDenied: 'Powiadomienia dla tej strony są zablokowane w ustawieniach przeglądarki.',
    notifyNeedsAccount:
      'Najpierw się zaloguj — przypomnienie musi być przypisane do konta, żeby dało się je wysłać.',
    offlineReady: 'Gotowe do użycia offline',
    sourceIdle: 'jeszcze niepodłączone',
    sourceFx: 'dzisiejszy kurs funta do twojej waluty',
    sourceFxBundled: 'kurs niepublikowany',
    liveLook: 'Dotknij, aby poszukać sklepów w pobliżu',

    /* ── Getting around without a mouse ── */
    stepBack: 'Poprzedni krok',
    passportNudgeReal:
      '{n} krajów z tej książki, z których nigdy nie gotowałeś. Najtańszy, którego ci brakuje, to {c} — {d} wychodzi {a} za porcję.',
    streakCleanReal: 'Nic nie wylądowało dziś w koszu — talerz wrócił czysty.',
    locStart: 'Gdzie gotujesz?',
    storeModelled: 'typowe ceny dla tego rodzaju sklepu tutaj',
    pantryLineSample: '{n} rzeczy, które zwykle są w kuchni',
    pantrySubSample: 'Założenie na start, nie skan twoich półek',
    morning: 'Dzień dobry',
    afternoon: 'Dzień dobry',
    planSaveFailed: 'Nie udało się zapisać planu — sprawdź połączenie i spróbuj ponownie.',
    savedAssumes: 'To przy założeniu około dziewięciu zakupów miesięcznie.',
    streakGoOn: 'Ugotuj coś jutro, a płomień liczy dalej.',

    /* ── Źródła i licencje ── */
    creditsLabel: 'Źródła i licencje',
    creditShort: 'Sklepy i ceny: © OpenStreetMap contributors · Open Food Facts — ODbL',
    creditOsm:
      'Nazwy miejsc, sklepy i godziny otwarcia pochodzą z OpenStreetMap. © OpenStreetMap contributors, na licencji Open Database (ODbL).',
    creditOpenFood:
      'Prawdziwe ceny i gramatury opakowań pochodzą z Open Prices i Open Food Facts, na licencji Open Database (ODbL).',
    creditOther:
      'Zmierzona podstawa to monitor cen żywności WFP, poprzez HDX (CC BY). Kursy walut to dzienne kursy referencyjne Europejskiego Banku Centralnego.',

    /* ── Kiedy cena nie przechodzi ── */
    priceOutOfRange:
      'To nie wygląda na cenę z półki. Podaj, ile kosztowało jedno opakowanie, i jego wagę w gramach.',
    priceAlready: 'To już dziś zapisałeś. Przydatna będzie jutrzejsza cena.',
    priceTooMany: 'To dużo cen naraz. Wróć za godzinę, a reszta przejdzie.',
    priceFailed: 'Ta cena się nie zapisała. Zwykle to brak zasięgu — spróbuj za chwilę.',

    /* ── When something breaks, and your data ── */
    crashTitle: "Coś tu się zepsuło",
    crashBody: "To moja wina, nie Twoja. Nic z tego, co mi powiedziałeś, nie zostało ruszone — wszystko nadal jest na tym urządzeniu. Przeładowanie zwykle wraca tam, gdzie byłeś.",
    crashWhat: "Co poszło nie tak",
    crashReload: "Przeładuj Pantry",
    crashSave: "Najpierw zapisz kopię moich danych",
    dataTitle: "Twoje dane",
    dataExport: "Zapisz kopię",
    dataExportSub: "Jeden plik z tym, ile już gotowałeś, dietami, budżetem, szafką i każdym zapisanym gotowaniem. Trafia na Twoje urządzenie i nigdzie indziej.",
    dataImport: "Wczytaj kopię z powrotem",
    dataImportSub: "Wybierz plik zapisany tutaj. Zastąpi to, co jest na tym urządzeniu, i Pantry uruchomi się ponownie.",
    dataImportCloud: "Jesteś zalogowany: dziennik gotowania się połączy, ale ustawienia z Twojego konta wygrają przy następnej synchronizacji. Wyloguj się najpierw, jeśli ten plik ma je zastąpić.",
    dataImported: "Wczytane. Wróciło z tym {n} gotowań.",
    dataBadFile: "To nie jest plik Pantry. Nic się nie zmieniło.",
    dataFutureFile: "Ten plik pochodzi z nowszej wersji Pantry niż ta. Nie otworzę połowy i po cichu nie wyrzucę reszty, więc nic się nie zmieniło.",
    budgetRange: "Podaj kwotę między {a} a {b}.",
    pricesChecking: "sprawdzam prawdziwe ceny…",
    priceSending: "Dodaję…",
    planSaving: "Zapisuję…",
    sendingLink: "Wysyłam…",

    /* ── The small print ── */
    legalKicker: "Drobny druk",
    privacyRow: "Prywatność",
    privacyRowSub: "Co jest przechowywane, gdzie i co opuszcza to urządzenie",
    termsRow: "Warunki",
    termsRowSub: "Co ta aplikacja obiecuje, a czego nie",
    legalUpdated: "Ostatnia aktualizacja: 3 sierpnia 2026",
    privTitle: "Prywatność",
    privIntro: "Pantry działa na twoim telefonie. Prawie nic z tego, co tu robisz, nigdy go nie opuszcza. Ta strona mówi dokładnie, co go opuszcza, kiedy i kto to widzi — nic więcej i nic mniej.",
    privLocalH: "Bez logowania nic nie opuszcza tego urządzenia",
    privLocalB: "Wszystko, co mówisz Pantry, jest zapisywane w pamięci lokalnej przeglądarki pod jednym kluczem: pantry.v1. Zawiera on to, czy przeszedłeś konfigurację, ile już gotowałeś, diety, kraj, budżet, limit czasu, język, przełącznik przypomnienia o resztkach, dziennik gotowania, odpowiedzi na pytania z ekranu Liczby, zapisany tydzień oraz to, co zaznaczyłeś jako już obecne w szafce.\nJest jeszcze jeden klucz, pantry.fx.v1, z dzisiejszym kursem walut. To fakt o pieniądzach, nie o tobie.\nNic z tego nigdzie nie jest wysyłane. Nie ma konta, serwera ani żadnego zapytania. Wyczyść dane tej strony w przeglądarce, a wszystko zniknie — razem ze wszystkim, co aplikacja wiedziała.",
    privAccountH: "Po zalogowaniu — i dopiero wtedy",
    privAccountB: "Logowanie jest opcjonalne, a aplikacja działa tak samo bez niego. Wpisujesz adres e-mail i dostajesz link. Nie ma hasła, więc nie ma czego przechowywać.\nTwój adres e-mail i sesję logowania przechowuje Supabase — baza danych i usługa logowania, z których korzysta ta aplikacja.\nDalej: profiles przechowuje ustawienia wymienione wyżej, żeby to samo konto działało na laptopie. cook_log przechowuje to, co ugotowałeś — danie, datę, koszt, porcje, kalorie, białko, węglowodany, trudność i ile trafiło do kosza. saved_plans i plan_meals przechowują tydzień, jeśli go zapiszesz. price_reports przechowuje cenę, jeśli ją zgłosisz. push_subscriptions i reminders przechowują powiadomienie, jeśli je włączysz.\nDo żadnej z nich nic nie trafia, dopóki nie zrobisz rzeczy, która to zapisuje. Osiem przykładowych tygodni na ekranie Liczby nigdy nie jest wysyłanych — to dekoracja, nie twoja historia. To, co zaznaczyłeś jako obecne w szafce, zostaje na tym urządzeniu; nie jest synchronizowane.",
    privDietH: "Diety i to, co warto o nich wiedzieć",
    privDietB: "Twoje diety to ustawienie jak każde inne, a po zalogowaniu trafiają do twojego wiersza profilu razem z resztą.\nNiektóre — halal, koszerne — mówią o tobie coś, co nie dotyczy tak naprawdę kolacji. Wolę powiedzieć to wprost, niż kombinować. Jeśli się zalogujesz, ta lista jest w bazie danych. Jeśli wolisz, żeby została na telefonie, używaj Pantry bez logowania. Wszystko działa.",
    privWhereH: "Gdzie jesteś",
    privWhereB: "Lokalizacja jest wyłączona, dopóki nie naciśniesz przycisku, który o nią prosi, a przeglądarka pyta cię jeszcze raz, zanim cokolwiek się wydarzy.\nJeśli się zgodzisz, twoje współrzędne trafiają w dwa miejsca: do Nominatim, prowadzonego przez OpenStreetMap Foundation, żeby zamienić je na nazwę miejsca, i do Overpass, też OpenStreetMap, żeby znaleźć sklepy w pobliżu. Oba to usługi publiczne, bez klucza i bez konta.\nPantry nigdy nie zapisuje twoich współrzędnych. Zachowuje nazwę miasta i kraj, na tym urządzeniu — a kraj trafia do wiersza profilu, jeśli jesteś zalogowany. Kraj to nie położenie.",
    privPhotoH: "Zdjęcie twojego talerza",
    privPhotoB: "Nigdy nie opuszcza urządzenia. Ekran Po odczytuje plik do object URL — wskaźnika, który przeglądarka trzyma w pamięci — i wyrzuca go, gdy opuszczasz ekran.\nNie jest wysyłane, nie jest zapisywane i nie ma go w dzienniku gotowania. Nic tutaj nie mogłoby ci go pokazać ponownie, bo nic tutaj nigdy go nie miało.",
    privPushH: "Jedno jedyne powiadomienie",
    privPushB: "Jeśli włączysz przypomnienia, przeglądarka tworzy subskrypcję push, a Pantry przechowuje trzy rzeczy: endpoint, który przeglądarka mu podaje, dwa klucze pozwalające zaszyfrować wiadomość dla ciebie, oraz skróconą kopię łańcucha user-agent twojej przeglądarki, żeby odróżnić martwą subskrypcję od żywej.\nIstnieją po to, by wysłać jeden rodzaj wiadomości: dzień po ugotowaniu czegoś, co się przechowa, jedno przypomnienie, że nadal jest dobre. Nic innego nigdy tam nie trafia, od nikogo. Wyłącz powiadomienia w przeglądarce, a endpoint przestanie działać.",
    privPriceH: "Ceny, które zgłaszasz",
    privPriceB: "Kiedy mówisz Pantry, ile coś naprawdę kosztowało, zapisuje składnik, cenę, walutę, wielkość opakowania, nazwę sklepu, jeśli ją podałeś, kraj i twoje konto.\nTwoje konto jest tam po to, żeby dało się to usunąć. Cenę, którą zgłosiłeś, możesz kazać skasować.\nNikt inny nie może przeczytać twojego zgłoszenia. Odczyt cen idzie przez funkcję zwracającą wyłącznie agregaty: medianę ceny za kilogram, liczbę zgłoszeń i to, jak świeże jest najnowsze. Nigdy kto zgłosił, nigdy gdzie robi zakupy.",
    privOthersH: "Z kim jeszcze rozmawia twoje urządzenie",
    privOthersB: "api.frankfurter.app — po dzienny kurs Europejskiego Banku Centralnego między funtem a twoją walutą.\nnominatim.openstreetmap.org i overpass-api.de — dopiero gdy zezwolisz na lokalizację, jak wyżej.\nprices.openfoodfacts.org — Open Prices, część Open Food Facts — po ceny, które ludzie sfotografowali na półce w twoim kraju. Pyta się go o kategorię składnika i kod kraju, i o nic na twój temat.\nTwój projekt Supabase — tylko gdy się logujesz albo jesteś zalogowany.\nSamą stronę serwuje Netlify, który — jak każdy hosting — widzi żądanie strony w zwykłych logach serwera. Nic w aplikacji mu nic nie raportuje.\nLista źródeł w Ustawieniach linkuje do OpenStreetMap, Open Food Facts i EBC. Otwarcie któregoś to twoja wizyta na ich stronie, a oni widzą cię tak, jak każda strona widzi odwiedzającego.",
    privNeverH: "Czego Pantry nie robi",
    privNeverB: "Żadnych reklam. Nic tutaj nie jest sprzedawane, wynajmowane ani przekazywane komukolwiek za pieniądze.\nŻadnej analityki zewnętrznej. Na tej stronie nie ma ani jednego skryptu śledzącego. Oba kroje pisma serwowane są z tej domeny, a nie z CDN-u czcionek, więc czytanie przepisu nie wysyła twojego adresu do Google.\nŻadnego profilowania poza tym, co widać na ekranie. Pytania na ekranie Liczby to całość, odpowiedziałeś na nie sam, a przy każdym jest przycisk Zapomnij.",
    privRightsH: "O co możesz poprosić",
    privRightsB: "Zobaczyć. Bez logowania wszystko jest jedną wartością pod pantry.v1 w pamięci przeglądarki, a narzędzia samej przeglądarki ci ją pokażą. Po zalogowaniu — poproś, a wyślę ci to, co tabele o tobie przechowują.\nZabrać ze sobą. Nie ma jeszcze przycisku eksportu. To luka, nie polityka, i powinna zostać uzupełniona.\nUsunąć. Ustawienia → Zacznij od nowa natychmiast czyści pantry.v1 z tego urządzenia; zostawia kurs walut, bo ten nigdy nie był twój. Usunięcie konta też nie ma jeszcze przycisku — napisz na adres poniżej, a konto znika, a wraz z nim profil, dziennik gotowania, zapisane tygodnie, przypomnienia i subskrypcje push. Powiedz słowo, a zgłoszone przez ciebie ceny też.\nJeśli jesteś w Wielkiej Brytanii lub UE, to twoje prawa na mocy brytyjskiego RODO i RODO, i możesz złożyć skargę do organu ochrony danych — w Wielkiej Brytanii do ICO.",
    privContactH: "Pytanie",
    privContactB: "Jeden adres, poniżej, do wszystkiego z tej strony: pytanie, poprawka, usunięcie — albo zdanie stąd, które nie zgadza się z tym, co aplikacja naprawdę robi. O tym ostatnim chcę usłyszeć najbardziej.",
    termTitle: "Warunki",
    termIntro: "Krótko, bo tak powinno być. Pantry to darmowa aplikacja kucharska. Korzystanie z niej oznacza akceptację tego, co jest na tej stronie.",
    termWhatH: "Czym jest Pantry",
    termWhatB: "Książka kucharska, która wycenia się tam, gdzie stoisz, i próbuje dopasować się do tego, co umiesz ugotować, co masz i ile masz czasu.\nTo narzędzie do decydowania, co na kolację. To nie porada żywieniowa, medyczna ani finansowa, i to nie sklep — nic tu ci niczego nie sprzedaje.",
    termPriceH: "Ceny są szacunkami",
    termPriceB: "Prawie każda liczba w Pantry jest modelowana: typowa cena tego składnika, w tego rodzaju sklepie, w tym kraju, przeliczona po kursie banku centralnego. Ekran Zakupy oznacza, które ceny są zmierzone, a które modelowane, bo ta różnica ma znaczenie.\nNawet zmierzona cena to tyle, ile ktoś gdzieś zapłacił w ciągu ostatnich sześciu miesięcy. Twój paragon będzie inny. Nic tutaj nie jest ofertą, wyceną ani gwarancją ceny.",
    termAllergenH: "To nie gwarancja alergenowa",
    termAllergenB: "Bez orzechów, bez wieprzowiny i bez alkoholu są wyliczane z odczytu składników każdego przepisu. Aplikacja nie widzi, co fabryka włożyła do słoika ani co dzieliło linię produkcyjną. Sprawdź etykietę, jeśli to ważne.\nJeśli alergia jest poważna, nie pozwól tej aplikacji decydować. Ona filtruje listę słów. Nie czyta twojego opakowania.",
    termCookH: "Gotowanie należy do ciebie",
    termCookB: "Czasy i temperatury to wskazówka. Piekarniki się różnią, patelnie się różnią, i tylko ty widzisz, czy kurczak jest gotowy. Gotuj do bezpiecznych temperatur, porządnie schładzaj resztki i sam oceniaj, jak długo coś się trzyma — przypomnienie o resztkach to zachęta, żeby sprawdzić, a nie orzeczenie, że jest bezpiecznie.\nPantry jest udostępniane takie, jakie jest, bez żadnej gwarancji. Czasem się pomyli i nie odpowiada za to, co dzieje się w twojej kuchni.",
    termAccountH: "Twoje konto",
    termAccountB: "Zaloguj się adresem e-mail, który kontrolujesz. Jedna osoba, jedno konto.\nZgłaszaj ceny uczciwie. Zgłoszenie ceny ma pomóc następnej osobie stojącej w tej alejce, a zmyślone zgłoszenia mogą zostać usunięte — razem z kontem, które je złożyło.\nMożesz odejść, kiedy chcesz. Prywatność mówi jak.",
    termLicenceH: "Co do kogo należy",
    termLicenceB: "Przepisy, teksty, ilustracje i kod Pantry należą do Pantry. Gotuj z nich, drukuj je, karm ludzi. Nie publikuj zbioru ponownie jako własnego.\nDane map, sklepów i cen pochodzą z OpenStreetMap i Open Food Facts na licencji Open Database Licence, a kursy walut z Europejskiego Banku Centralnego. Ustawienia wymieniają każde źródło i jego licencję.\nCena, którą zgłaszasz, pozostaje twoja i możesz ją usunąć, a Pantry może ją opublikować jako część agregatu — mediany bez nazwiska, i tylko w tej formie widzi ją ktokolwiek inny.",
    termChangeH: "Jeśli to się zmieni",
    termChangeB: "Te warunki i polityka prywatności mają u góry datę. Jeśli któreś zmienią się w istotny sposób, data zmieni się razem z nimi, a aplikacja to powie.\nDalsze korzystanie z Pantry po tym oznacza akceptację nowej wersji. Pytania na adres poniżej.",
  },

  ur: {
    account: 'اکاؤنٹ',
    accountTitle: 'اسے اپنے تمام آلات پر محفوظ رکھیں',
    accountBody:
      'اختیاری۔ آپ کا ہدف، آپ نے کتنا کھانا پکایا ہے، غذائی ترجیحات، کھانا پکانے کا ریکارڈ اور آپ کی الماری کسی دوسرے فون یا لیپ ٹاپ پر آپ کے ساتھ چلے جائیں گے۔ بغیر لاگ اِن کے بھی سب کچھ ویسے ہی کام کرتا ہے — یہ صرف یہ طے کرتا ہے کہ سب کچھ کہاں رکھا جائے۔',
    emailLabel: 'ای میل ایڈریس',
    emailPlaceholder: 'you@example.com',
    sendLink: 'مجھے لنک بھیجیں',
    linkSent: 'اپنی ای میل دیکھیں۔ لنک آپ کو لاگ اِن کر دے گا — کوئی پاس ورڈ یاد رکھنے کی ضرورت نہیں۔',
    signedInAs: 'لاگ اِن بطور',
    signOut: 'لاگ آؤٹ',
    syncing: 'ہم آہنگ کیا جا رہا ہے…',
    cloudOff: 'اس نسخے میں کلاؤڈ سنک ترتیب نہیں دی گئی، اس لیے سب کچھ اسی آلے پر رہتا ہے۔',
    localOnly: 'صرف اسی آلے پر',
    cloudUnreachable:
      'سائن اِن سروس تک رسائی نہیں ہو سکی — عام طور پر سگنل نہ ہونے کی وجہ سے۔ باقی سب کچھ اسی آلے پر چلتا رہے گا۔',

    /* ── The one question ── */
    /* Lifted from each language's own tierSkillSub with the sentence about
       dragging cut off the front, so these are real translations rather
       than six new ones. */
    levelSub: 'کوئی جواب غلط نہیں۔ یہ صرف اس لیے ہے کہ میں آپ کو ایسی چیزیں تجویز نہ کروں جو آپ کو بری لگیں۔',
    stepOf: 'مرحلہ {n} از {of}',
    resLevel: 'آپ کے درجے کے لیے',

    /* ── Mascot ── */
    mascotN: 'پینٹری، کونے میں',
    mascotS: 'چمچے والی چھوٹی ہانڈی۔ اگر دھیان بٹے تو بند کر دیں۔',

    priceAsk: 'کوئی اور قیمت دیکھی؟',
    priceAskBody:
      'مجھے بتائیں کہ اصل میں کتنے کی تھی، تو یہاں خریداری کرنے والے ہر شخص کو میرے اندازے کے بجائے اصل عدد ملے گا۔',
    priceWhat: 'کتنے کی تھی؟',
    pricePack: 'پیکٹ کا حجم',
    priceSend: 'یہ قیمت شامل کریں',
    priceThanks: 'درج ہو گئی۔ ٹوکری میں ایک اور اصل قیمت۔',
    priceNeedsAccount: 'پہلے لاگ اِن کریں — قیمتیں اکاؤنٹ سے منسوب ہوتی ہیں تاکہ ہٹائی جا سکیں۔',
    priceCommunity: 'لوگ یہاں خریداری کرتے ہیں',
    priceReported: 'اطلاع دی گئی',
    legCommunity: 'یہاں خریداری کرنے والوں کی بتائی ہوئی',
    legOpenPrices: 'اوپن پرائسز، اسی ملک کے خریداروں کے درج کردہ',
    priceOpen: 'اوپن پرائسز پر درج',

    haveIt: 'آپ کی باورچی خانے میں',
    tapToToggle: 'جو کچھ آپ کے پاس پہلے سے ہے اسے چھوئیں — وہ کل رقم سے نکل جائے گا اور نکلا رہے گا۔',
    tapPrice: 'قیمت درست کرنے کے لیے اسے چھوئیں۔',
    totalMeans: 'اس کھانے میں استعمال ہونے والے ہر جزو کے حصے کی قیمت',
    totalMeansBody:
      'یہ آپ کی رسید نہیں۔ آپ پورے پیکٹ خریدتے ہیں، اتنا نہیں جتنا اس کھانے کو درکار ہے — اس لیے پہلی خریداری مہنگی رہتی ہے اور باقی اگلے کھانے کے کام آتا ہے۔',
    extraAdd: 'اختیاری — شامل کرنے کے لیے چھوئیں',
    copycatKeep:
      '{who} ایک حصے کے {a} لیتے ہیں۔ آپ کا اپنا حصہ {b} میں پڑتا ہے — یعنی ہر بار جب آپ اسے منگوانے کے بجائے خود بناتے ہیں، {c} بچ جاتے ہیں۔',

    /* ── The time budget ── */
    timeOver: 'آپ کے {m} سے زیادہ',
    timeOverWhy:
      'یہ آپ کے مانگے ہوئے {m} منٹ سے زیادہ لیتا ہے۔ میں اسے تیز تر ظاہر کرنے کے بجائے دکھا رہا ہوں: اصل وقت {t} منٹ ہے۔',

    /* ── The cupboard, honestly ── */
    sampleKitchen:
      'یہ الماری نمونے کا ڈیٹا ہے، تاکہ آپ کے کچھ شامل کرنے سے پہلے اس اسکرین پر دکھانے کو کچھ ہو۔ تعداد، دن اور قیمت آپ کے باورچی خانے کی پیمائش نہیں — خریداری کی فہرست سے صرف وہی نکلتا ہے جو ہر ترکیب فرض کرتی ہے اور جس پر آپ خود نشان لگاتے ہیں۔',
    assumedHave:
      'جن سطروں پر پہلے سے لکیر کھنچی ہے وہ آپ کی بتائی ہوئی نہیں — یہ ترکیب فرض کرتی ہے کہ زیادہ تر باورچی خانوں میں یہ چیزیں ہوتی ہیں۔ کسی کو چھوئیں تو وہ دوبارہ فہرست میں آ جائے گی۔',
    dietDerived:
      'بغیر گری دار میوہ، بغیر سؤر اور بغیر الکحل کا فیصلہ ہر ترکیب کے اجزاء پڑھ کر ہوتا ہے — مجھے یہ نظر نہیں آتا کہ کارخانے نے ڈبے میں کیا ڈالا یا کون سی چیزیں ایک ہی لائن پر بنیں۔ اگر معاملہ اہم ہے تو لیبل ضرور دیکھیں۔',

    sampleStats:
      'یہ آٹھ ہفتے نمونے کا ڈیٹا ہیں، تاکہ آپ کے کچھ پکانے سے پہلے اس اسکرین پر دکھانے کو کچھ ہو۔ یہ آپ کے نہیں، یہ کبھی اس آلے سے باہر نہیں جاتے، اور آپ کا پہلا اصل کھانا انہیں بدل دے گا۔',
    samplePassport: 'نیچے کے جھنڈے اور کھانے نمونے کا ڈیٹا ہیں — آپ کا پہلا اصل کھانا انہیں بدل دے گا۔ باہر سے کھانا منگوانے پر جو پیسہ بچا وہ اصلی ہے اور آپ کے اپنے ریکارڈ سے آتا ہے۔',

    planTitle: 'ہفتہ',
    planSub:
      'کئی دنوں کے کھانے ایک ساتھ، اور سب کے لیے ایک ہی خریداری کی فہرست۔ جو آپ کی الماری میں پہلے سے ہے وہ اس میں سے نکل جاتا ہے۔',
    planDays: 'کتنے دن',
    planMeals: 'روزانہ کھانے',
    planServings: 'کتنے افراد',
    planBuild: 'میرے لیے ایک ہفتہ ترتیب دیں',
    planRebuild: 'دوبارہ ملائیں',
    planSave: 'یہ ہفتہ محفوظ کریں',
    planSaved: 'آپ کے اکاؤنٹ میں محفوظ ہو گیا۔',
    planEmpty: 'ابھی کچھ طے نہیں۔ اپنے دن چنیں، میں انہیں بھر دوں گا۔',
    planSwap: 'بدلیں',
    planList: 'جو کچھ آپ کو چاہیے',
    planTotal: 'پورا ہفتہ',
    planPerDay: 'روزانہ',
    planCook: 'اسے پکائیں',
    planDay: 'دن',
    planNeedsAccount: 'ہفتہ آلات کے درمیان محفوظ رکھنے کے لیے لاگ اِن کریں۔ یہاں یہ ویسے بھی چلتا ہے۔',

    installTitle: 'اسے اپنی ہوم اسکرین پر رکھیں',
    installBody:
      'یہ ایک ایپ کی طرح کھلتا ہے اور ترکیبیں، مراحل اور ٹائمر سگنل کے بغیر بھی چلتے ہیں — اور باورچی خانے میں عموماً یہی صورتحال ہوتی ہے۔',
    install: 'انسٹال کریں',
    installed: 'انسٹال ہو گیا۔ اپنی ہوم اسکرین پر دیکھیں۔',
    installIos: 'آئی فون پر: شیئر دبائیں، پھر ہوم اسکرین میں شامل کریں۔',
    notifyTitle: 'مجھے یاد دلانے دیں',
    notifyBody:
      'جو چیز رکھی جا سکتی ہے اسے پکانے کے اگلے دن ایک اطلاع، اور بس۔ نہ اشتہار، نہ سلسلے کی تنگ کرنے والی یاد دہانی۔',
    notifyOn: 'یاد دہانیاں آن کریں',
    notifyGranted: 'ہو گیا۔ میں اسے صرف بچے ہوئے کھانے کی یاد دہانی کے لیے استعمال کروں گا۔',
    notifyDenied: 'آپ کے براؤزر کی ترتیبات میں اس سائٹ کے لیے اطلاعات بند ہیں۔',
    notifyNeedsAccount: 'پہلے لاگ اِن کریں — یاد دہانی بھیجنے کے لیے اکاؤنٹ سے منسلک ہونا ضروری ہے۔',
    offlineReady: 'آف لائن استعمال کے لیے تیار',
    sourceIdle: 'ابھی منسلک نہیں',
    sourceFx: 'پاؤنڈ اور آپ کی کرنسی کے درمیان آج کی شرح',
    sourceFxBundled: 'شرح شائع نہیں',
    liveLook: 'اپنے قریب دکانیں تلاش کرنے کے لیے چھوئیں',

    /* ── Getting around without a mouse ── */
    stepBack: 'پچھلا مرحلہ',
    passportNudgeReal:
      'اس کتاب میں {n} ممالک ایسے ہیں جن کا کھانا آپ نے کبھی نہیں پکایا۔ ان میں سب سے سستا {c} ہے — {d} فی حصہ {a} پڑتا ہے۔',
    streakCleanReal: 'آج رات کچھ ضائع نہیں ہوا — پلیٹ صاف واپس آئی۔',
    locStart: 'آپ کہاں کھانا پکا رہے ہیں؟',
    storeModelled: 'یہاں اس قسم کی دکان کی عام قیمتیں',
    pantryLineSample: '{n} چیزیں جو عموماً باورچی خانے میں ہوتی ہیں',
    pantrySubSample: 'ایک ابتدائی مفروضہ، آپ کی الماریوں کا جائزہ نہیں',
    morning: 'صبح بخیر',
    afternoon: 'دوپہر بخیر',
    planSaveFailed: 'منصوبہ محفوظ نہیں ہو سکا — اپنا کنکشن دیکھیں اور دوبارہ کوشش کریں۔',
    savedAssumes: 'یہ مہینے میں تقریباً نو بار خریداری کے مفروضے پر ہے۔',
    streakGoOn: 'کل پھر پکائیں تو شعلہ گنتا رہے گا۔',

    /* ── اعتراف اور لائسنس ── */
    creditsLabel: 'اعتراف اور لائسنس',
    creditShort: 'دکانیں اور قیمتیں: © OpenStreetMap contributors · Open Food Facts — ODbL',
    creditOsm:
      'جگہوں کے نام، دکانیں اور اوقاتِ کار OpenStreetMap سے آتے ہیں۔ © OpenStreetMap contributors، Open Database Licence (ODbL) کے تحت۔',
    creditOpenFood:
      'اصل قیمتیں اور پیکٹ کے وزن Open Prices اور Open Food Facts سے آتے ہیں، Open Database Licence (ODbL) کے تحت۔',
    creditOther:
      'ماپی گئی بنیاد WFP کا خوراکی قیمت مانیٹر ہے، HDX کے ذریعے (CC BY)۔ شرحِ تبادلہ یورپی مرکزی بینک کی روزانہ حوالہ شرحیں ہیں۔',

    /* ── جب قیمت درج نہ ہو ── */
    priceOutOfRange:
      'یہ شیلف کی قیمت نہیں لگتی۔ بتائیں ایک پیکٹ کتنے کا تھا، اور اس کا وزن گرام میں۔',
    priceAlready: 'یہ آج آپ پہلے ہی درج کر چکے ہیں۔ کل کی قیمت زیادہ کام کی ہوگی۔',
    priceTooMany: 'ایک ساتھ بہت سی قیمتیں ہو گئیں۔ ایک گھنٹے بعد آئیں، باقی درج ہو جائیں گی۔',
    priceFailed: 'یہ قیمت محفوظ نہیں ہوئی۔ عموماً سگنل نہ ہونے کی وجہ سے — تھوڑی دیر بعد دوبارہ کوشش کریں۔',

    /* ── When something breaks, and your data ── */
    crashTitle: "یہاں کچھ ٹوٹ گیا ہے",
    crashBody: "یہ میری غلطی ہے، آپ کی نہیں۔ آپ نے مجھے جو کچھ بتایا، اُسے ہاتھ نہیں لگا — سب کچھ اِسی آلے پر موجود ہے۔ دوبارہ لوڈ کرنے سے عموماً آپ وہیں پہنچ جاتے ہیں جہاں تھے۔",
    crashWhat: "خرابی کیا ہوئی",
    crashReload: "Pantry دوبارہ لوڈ کریں",
    crashSave: "پہلے میرے ڈیٹا کی نقل محفوظ کریں",
    dataTitle: "آپ کا ڈیٹا",
    dataExport: "ایک نقل محفوظ کریں",
    dataExportSub: "ایک فائل جس میں آپ نے کتنا کھانا پکایا ہے، غذائیں، بجٹ، الماری اور ہر درج شدہ پکوان شامل ہے۔ یہ آپ کے آلے پر جاتی ہے، کہیں اور نہیں۔",
    dataImport: "نقل واپس لوڈ کریں",
    dataImportSub: "یہاں محفوظ کی گئی کوئی فائل چنیں۔ یہ اِس آلے کے مواد کی جگہ لے لے گی اور Pantry دوبارہ شروع ہوگا۔",
    dataImportCloud: "آپ سائن اِن ہیں: آپ کا پکوان ریکارڈ مل جائے گا، مگر اگلی مطابقت پذیری پر آپ کے اکاؤنٹ کی ترتیبات غالب رہیں گی۔ اگر یہ فائل اُنہیں بدلنی ہے تو پہلے سائن آؤٹ کریں۔",
    dataImported: "لوڈ ہو گیا۔ اِس کے ساتھ {n} پکوان واپس آئے۔",
    dataBadFile: "یہ Pantry کی فائل نہیں ہے۔ کچھ نہیں بدلا۔",
    dataFutureFile: "یہ فائل اِس سے نئے Pantry کی ہے۔ میں آدھی کھول کر باقی خاموشی سے پھینکوں گا نہیں، سو کچھ نہیں بدلا۔",
    budgetRange: "{a} اور {b} کے درمیان کوئی رقم دیں۔",
    pricesChecking: "اصل قیمتیں دیکھ رہا ہوں…",
    priceSending: "شامل کر رہا ہوں…",
    planSaving: "محفوظ کر رہا ہوں…",
    sendingLink: "بھیج رہا ہوں…",

    /* ── The small print ── */
    legalKicker: "باریک تحریر",
    privacyRow: "پرائیویسی",
    privacyRowSub: "کیا محفوظ ہوتا ہے، کہاں، اور کیا اس ڈیوائس سے باہر جاتا ہے",
    termsRow: "شرائط",
    termsRowSub: "یہ ایپ کیا وعدہ کرتی ہے، اور کیا نہیں",
    legalUpdated: "آخری تازہ کاری: 3 اگست 2026",
    privTitle: "پرائیویسی",
    privIntro: "Pantry آپ کے فون پر چلتی ہے۔ یہاں آپ جو کچھ کرتے ہیں، اُس کا بیشتر حصہ کبھی فون سے باہر نہیں جاتا۔ یہ صفحہ ٹھیک ٹھیک بتاتا ہے کہ کیا باہر جاتا ہے، کب جاتا ہے، اور کون دیکھتا ہے — نہ اس سے زیادہ، نہ کم۔",
    privLocalH: "سائن آؤٹ کی حالت میں کچھ بھی اس ڈیوائس سے باہر نہیں جاتا",
    privLocalB: "آپ Pantry کو جو کچھ بتاتے ہیں وہ آپ کے براؤزر کے لوکل اسٹوریج میں ایک ہی کلید کے تحت لکھا جاتا ہے: pantry.v1۔ اس میں یہ ہوتا ہے کہ آپ نے سیٹ اپ مکمل کیا یا نہیں، آپ نے کتنا کھانا پکایا ہے، آپ کی غذائی ترجیحات، ملک، بجٹ، وقت کی حد، زبان، بچے ہوئے کھانے کی یاد دہانی کا بٹن، آپ کا کُکنگ لاگ، اعداد و شمار والی اسکرین کے سوالوں کے جواب، آپ کا محفوظ کیا ہوا ہفتہ، اور وہ چیزیں جو آپ نے پہلے سے الماری میں موجود کے طور پر نشان زد کیں۔\nایک اور کلید ہے، pantry.fx.v1، جس میں دن کی زرِ مبادلہ کی شرح ہوتی ہے۔ یہ پیسے کے بارے میں حقیقت ہے، آپ کے بارے میں نہیں۔\nاِن میں سے کچھ بھی کہیں نہیں بھیجا جاتا۔ نہ کوئی اکاؤنٹ، نہ سرور، نہ کوئی درخواست۔ براؤزر میں اس سائٹ کا ڈیٹا صاف کریں اور سب ختم — اور اُس کے ساتھ وہ سب بھی جو ایپ جانتی تھی۔",
    privAccountH: "سائن اِن ہونے پر، اور صرف تب",
    privAccountB: "سائن اِن کرنا اختیاری ہے اور ایپ اس کے بغیر بھی ویسے ہی کام کرتی ہے۔ آپ ای میل لکھتے ہیں اور جواب میں ایک لنک آتا ہے۔ کوئی پاس ورڈ نہیں، سو محفوظ کرنے کو کچھ نہیں۔\nآپ کا ای میل پتہ اور سائن اِن سیشن Supabase کے پاس رہتے ہیں — یہی ڈیٹابیس اور سائن اِن سروس یہ ایپ استعمال کرتی ہے۔\nاُس کے بعد: profiles اوپر بیان کردہ ترتیبات رکھتا ہے، تاکہ وہی اکاؤنٹ آپ کے لیپ ٹاپ پر بھی چلے۔ cook_log وہ رکھتا ہے جو آپ نے پکایا — ڈش، تاریخ، لاگت، حصے، کیلوریز، پروٹین، کاربوہائیڈریٹ، دشواری، اور کتنا کوڑے میں گیا۔ saved_plans اور plan_meals ایک ہفتہ رکھتے ہیں، اگر آپ محفوظ کریں۔ price_reports ایک قیمت رکھتا ہے، اگر آپ اطلاع دیں۔ push_subscriptions اور reminders اطلاع رکھتے ہیں، اگر آپ اسے آن کریں۔\nاِن میں سے کسی میں کچھ بھی نہیں لکھا جاتا جب تک آپ وہ کام نہ کریں جو اسے لکھتا ہے۔ اعداد و شمار والی اسکرین کے نمونے کے آٹھ ہفتے کبھی اپ لوڈ نہیں ہوتے — وہ ایک سجاوٹ ہیں، آپ کی تاریخ نہیں۔ آپ نے الماری میں موجود کے طور پر جو نشان زد کیا وہ اسی ڈیوائس پر رہتا ہے؛ وہ سنک نہیں ہوتا۔",
    privDietH: "غذائی ترجیحات، اور اُن کے بارے میں جاننے کی بات",
    privDietB: "آپ کی غذائی ترجیحات باقی ترتیبات جیسی ہی ایک ترتیب ہیں، اور سائن اِن ہونے پر وہ باقی سب کے ساتھ آپ کی پروفائل قطار میں چلی جاتی ہیں۔\nاِن میں سے کچھ — حلال، کوشر — آپ کے بارے میں ایسی بات کہتی ہیں جو دراصل رات کے کھانے کے بارے میں نہیں۔ میں چالاکی کے بجائے صاف بات کہنا بہتر سمجھتا ہوں۔ اگر آپ سائن اِن کرتے ہیں تو یہ فہرست ایک ڈیٹابیس میں ہوگی۔ اگر آپ چاہتے ہیں کہ یہ آپ کے فون پر ہی رہے تو Pantry کو سائن اِن کیے بغیر استعمال کریں۔ سب کچھ چلتا ہے۔",
    privWhereH: "آپ کہاں ہیں",
    privWhereB: "مقام اُس وقت تک بند رہتا ہے جب تک آپ وہ بٹن نہ دبائیں جو اسے مانگتا ہے، اور کچھ ہونے سے پہلے آپ کا براؤزر بھی دوبارہ پوچھتا ہے۔\nاگر آپ اجازت دیں تو آپ کے کوآرڈینیٹس دو جگہ جاتے ہیں: Nominatim، جو OpenStreetMap Foundation چلاتی ہے، تاکہ اُنہیں جگہ کے نام میں بدلا جا سکے، اور Overpass، جو بھی OpenStreetMap کا ہے، تاکہ آپ کے قریب سپر مارکیٹیں تلاش ہوں۔ دونوں عوامی خدمات ہیں، نہ کوئی کلید نہ اکاؤنٹ۔\nPantry آپ کے کوآرڈینیٹس کبھی محفوظ نہیں کرتی۔ وہ شہر کا نام اور ملک رکھتی ہے، اسی ڈیوائس پر — اور اگر آپ سائن اِن ہیں تو ملک آپ کی پروفائل قطار میں جاتا ہے۔ ملک کوئی مقام نہیں ہوتا۔",
    privPhotoH: "آپ کی پلیٹ کی تصویر",
    privPhotoB: "یہ کبھی ڈیوائس سے باہر نہیں جاتی۔ ’بعد‘ والی اسکرین فائل کو ایک object URL میں پڑھتی ہے — ایک اشارہ جو آپ کا براؤزر میموری میں رکھتا ہے — اور اسکرین چھوڑتے ہی اُسے پھینک دیتی ہے۔\nنہ یہ اپ لوڈ ہوتی ہے، نہ محفوظ، اور نہ آپ کے کُکنگ لاگ میں ہوتی ہے۔ یہاں کی کوئی چیز آپ کو وہ تصویر دوبارہ نہیں دکھا سکتی، کیونکہ یہاں کی کسی چیز کے پاس وہ کبھی تھی ہی نہیں۔",
    privPushH: "وہ ایک اطلاع",
    privPushB: "اگر آپ یاد دہانیاں آن کریں تو آپ کا براؤزر ایک پُش سبسکرپشن بناتا ہے اور Pantry تین چیزیں رکھتی ہے: وہ اینڈ پوائنٹ جو آپ کا براؤزر دیتا ہے، دو کلیدیں جن سے پیغام آپ کے لیے خفیہ کیا جا سکے، اور آپ کے براؤزر کی user-agent سطر کی ایک مختصر نقل تاکہ مردہ اور زندہ سبسکرپشن میں فرق کیا جا سکے۔\nیہ صرف ایک قسم کا پیغام بھیجنے کے لیے ہیں: ایسی چیز پکانے کے اگلے دن جو رکھی جا سکتی ہو، ایک یاد دہانی کہ وہ ابھی بھی ٹھیک ہے۔ اِن پر کبھی کچھ اور نہیں بھیجا جاتا، کسی کی طرف سے بھی۔ براؤزر میں اطلاعات بند کر دیں تو اینڈ پوائنٹ کام کرنا چھوڑ دیتا ہے۔",
    privPriceH: "وہ قیمتیں جو آپ بتاتے ہیں",
    privPriceB: "جب آپ Pantry کو بتاتے ہیں کہ کسی چیز کی اصل قیمت کیا تھی، تو وہ جزو، قیمت، کرنسی، پیک کا حجم، دکان کا نام اگر آپ نے دیا ہو، ملک، اور آپ کا اکاؤنٹ محفوظ کرتی ہے۔\nآپ کا اکاؤنٹ اس لیے ساتھ ہے کہ اسے واپس ہٹایا جا سکے۔ جو قیمت آپ نے بتائی، وہ آپ ہٹوا بھی سکتے ہیں۔\nآپ کی اطلاع کوئی اور نہیں پڑھ سکتا۔ قیمتیں پڑھنے کا کام ایک ایسے فنکشن سے ہوتا ہے جو صرف مجموعی اعداد لوٹاتا ہے: فی کلو درمیانی قیمت، کتنی اطلاعات تھیں، اور سب سے نئی کتنی حالیہ ہے۔ کبھی یہ نہیں کہ کس نے بتائی، اور کبھی یہ نہیں کہ وہ کہاں خریداری کرتا ہے۔",
    privOthersH: "آپ کی ڈیوائس اور کس سے بات کرتی ہے",
    privOthersB: "api.frankfurter.app — یورپی مرکزی بینک کی پاؤنڈ اور آپ کی کرنسی کے درمیان روزانہ کی شرح کے لیے۔\nnominatim.openstreetmap.org اور overpass-api.de — صرف اُس وقت جب آپ مقام کی اجازت دے چکے ہوں، جیسا اوپر بیان ہوا۔\nprices.openfoodfacts.org — Open Prices، جو Open Food Facts کا حصہ ہے — اُن قیمتوں کے لیے جو لوگوں نے آپ کے ملک میں شیلف پر تصویر کھینچ کر درج کیں۔ اِس سے صرف ایک جزو کی قسم اور ملک کا کوڈ پوچھا جاتا ہے، آپ کے بارے میں کچھ نہیں۔\nآپ کا Supabase پروجیکٹ — صرف اُس وقت جب آپ سائن اِن کر رہے ہوں یا سائن اِن ہوں۔\nسائٹ خود Netlify پیش کرتی ہے، جو ہر ویب ہوسٹ کی طرح صفحے کی درخواست اپنے عام سرور لاگز میں دیکھتی ہے۔ ایپ کے اندر سے اُسے کچھ نہیں بھیجا جاتا۔\nترتیبات میں ذرائع کی فہرست OpenStreetMap، Open Food Facts اور ECB کی طرف لے جاتی ہے۔ اُن میں سے کوئی کھولنا آپ کا اُن کی سائٹ پر جانا ہے، اور وہ آپ کو ویسے ہی دیکھتے ہیں جیسے کوئی بھی سائٹ کسی آنے والے کو دیکھتی ہے۔",
    privNeverH: "Pantry کیا نہیں کرتی",
    privNeverB: "کوئی اشتہار نہیں۔ یہاں کچھ بھی پیسوں کے عوض بیچا، کرائے پر دیا یا کسی کے حوالے نہیں کیا جاتا۔\nکوئی تیسرے فریق کا اینالیٹکس نہیں۔ اس سائٹ پر کوئی ٹریکنگ اسکرپٹ نہیں — ایک بھی نہیں۔ دونوں فونٹ اسی ڈومین سے دیے جاتے ہیں، کسی فونٹ CDN سے نہیں، سو کوئی ترکیب پڑھنے سے آپ کا پتہ Google کو نہیں جاتا۔\nاسکرین پر جو ہے اُس سے آگے کوئی پروفائلنگ نہیں۔ اعداد و شمار والی اسکرین کے سوال ہی سب کچھ ہیں، جواب آپ نے خود دیے، اور ہر ایک کے ساتھ ’بھول جاؤ‘ کا بٹن موجود ہے۔",
    privRightsH: "آپ کیا مانگ سکتے ہیں",
    privRightsB: "دیکھنا۔ سائن آؤٹ کی حالت میں سب کچھ آپ کے براؤزر کے اسٹوریج میں pantry.v1 کے تحت ایک ہی قدر ہے، اور خود براؤزر کے اوزار آپ کو وہ دکھا دیں گے۔ سائن اِن ہوں تو کہیے، اور میں آپ کو بھیج دوں گا کہ ٹیبلز آپ کے بارے میں کیا رکھتے ہیں۔\nساتھ لے جانا۔ ابھی ایکسپورٹ کا بٹن نہیں ہے۔ یہ ایک کمی ہے، کوئی پالیسی نہیں، اور اسے بنایا جانا چاہیے۔\nمٹانا۔ ترتیبات ← ’نئے سرے سے شروع کریں‘ اِس ڈیوائس سے pantry.v1 فوراً صاف کر دیتا ہے؛ زرِ مبادلہ کی شرح رہ جاتی ہے، کیونکہ وہ کبھی آپ کی تھی ہی نہیں۔ اکاؤنٹ مٹانے کا بھی ابھی کوئی بٹن نہیں — نیچے دیے پتے پر ای میل کریں اور اکاؤنٹ ختم، اور اُس کے ساتھ پروفائل، کُکنگ لاگ، محفوظ ہفتے، یاد دہانیاں اور پُش سبسکرپشنز بھی۔ کہہ دیجیے تو آپ کی بتائی ہوئی قیمتیں بھی چلی جائیں گی۔\nاگر آپ برطانیہ یا یورپی یونین میں ہیں تو یہ UK GDPR اور GDPR کے تحت آپ کے حقوق ہیں، اور آپ اپنے ڈیٹا تحفظ کے ادارے سے شکایت کر سکتے ہیں — برطانیہ میں ICO۔",
    privContactH: "پوچھنا",
    privContactB: "اِس صفحے سے متعلق ہر بات کے لیے ایک ہی پتہ، نیچے: کوئی سوال، کوئی درستی، کوئی حذف — یا یہاں لکھی کوئی ایسی سطر جو ایپ کے اصل کام سے میل نہ کھاتی ہو۔ آخری بات وہ ہے جو میں سب سے زیادہ سننا چاہتا ہوں۔",
    termTitle: "شرائط",
    termIntro: "مختصر، کیونکہ ایسا ہی ہونا چاہیے۔ Pantry ایک مفت کھانا پکانے کی ایپ ہے۔ اسے استعمال کرنے کا مطلب ہے کہ آپ اس صفحے پر لکھی باتیں قبول کرتے ہیں۔",
    termWhatH: "Pantry کیا ہے",
    termWhatB: "ایک ترکیبوں کی کتاب جو وہیں قیمت لگاتی ہے جہاں آپ کھڑے ہیں، اور یہ دیکھنے کی کوشش کرتی ہے کہ آپ کیا پکا سکتے ہیں، آپ کے پاس کیا ہے، اور کتنا وقت ہے۔\nیہ فیصلہ کرنے کا ایک اوزار ہے کہ رات کے کھانے میں کیا ہو۔ یہ غذائی، طبی یا مالی مشورہ نہیں، اور یہ دکان بھی نہیں — یہاں کوئی چیز آپ کو کچھ نہیں بیچتی۔",
    termPriceH: "قیمتیں تخمینے ہیں",
    termPriceB: "Pantry میں تقریباً ہر عدد ماڈل کیا ہوا ہے: اُس جزو کی اُس قسم کی دکان میں، اُس ملک میں، ایک عام قیمت، جو مرکزی بینک کی شرح پر تبدیل کی گئی ہو۔ خریداری والی اسکرین بتاتی ہے کہ کون سی قیمتیں ناپی گئی ہیں اور کون سی ماڈل کی گئی، کیونکہ یہ فرق اہم ہے۔\nناپی ہوئی قیمت بھی وہی ہے جو کسی نے پچھلے چھ ماہ میں کہیں ادا کی۔ آپ کی رسید مختلف ہوگی۔ یہاں کچھ بھی کوئی پیشکش، تخمینہ نامہ یا قیمت کی ضمانت نہیں۔",
    termAllergenH: "یہ الرجی کی ضمانت نہیں",
    termAllergenB: "’نٹ فری‘، ’بغیر سؤر‘ اور ’بغیر الکحل‘ ہر ترکیب کے اجزا پڑھ کر نکالے جاتے ہیں۔ ایپ یہ نہیں دیکھ سکتی کہ کارخانے نے مرتبان میں کیا ڈالا، یا کیا چیز پروڈکشن لائن میں شریک رہی۔ اگر اہم ہو تو لیبل ضرور دیکھیں۔\nاگر الرجی سنجیدہ ہے تو فیصلہ اس ایپ پر نہ چھوڑیں۔ یہ صرف الفاظ کی فہرست چھان رہی ہے۔ یہ آپ کا پیکٹ نہیں پڑھ رہی۔",
    termCookH: "پکانا آپ کا کام ہے",
    termCookB: "وقت اور درجۂ حرارت صرف رہنمائی ہیں۔ اوون مختلف ہوتے ہیں، برتن مختلف ہوتے ہیں، اور صرف آپ ہی دیکھ سکتے ہیں کہ مرغی پک گئی یا نہیں۔ محفوظ درجۂ حرارت پر پکائیں، بچا ہوا کھانا ٹھیک سے ٹھنڈا کریں، اور یہ اپنی سمجھ سے طے کریں کہ کوئی چیز کتنی دیر ٹھیک رہے گی — بچے کھانے کی یاد دہانی جانچنے کی دعوت ہے، یہ فیصلہ نہیں کہ وہ محفوظ ہے۔\nPantry جیسی ہے ویسی ہی فراہم کی جاتی ہے، کسی بھی قسم کی ضمانت کے بغیر۔ یہ کبھی کبھی غلط ہوگی، اور آپ کے باورچی خانے میں جو ہو اُس کی ذمہ دار نہیں۔",
    termAccountH: "آپ کا اکاؤنٹ",
    termAccountB: "ایسے ای میل پتے سے سائن اِن کریں جو آپ کا اپنا ہو۔ ایک شخص، ایک اکاؤنٹ۔\nقیمتیں دیانت داری سے بتائیں۔ قیمت کی اطلاع اُس اگلے شخص کی مدد کے لیے ہے جو اُسی قطار میں کھڑا ہوگا، اور من گھڑت اطلاعات ہٹائی جا سکتی ہیں — اُس اکاؤنٹ سمیت جس نے وہ دیں۔\nآپ جب چاہیں چھوڑ سکتے ہیں۔ پرائیویسی والا صفحہ بتاتا ہے کیسے۔",
    termLicenceH: "کس چیز کا مالک کون",
    termLicenceB: "Pantry کی ترکیبیں، تحریر، فن پارے اور کوڈ Pantry کے ہیں۔ اِن سے پکائیے، چھاپیے، لوگوں کو کھلائیے۔ اِس مجموعے کو اپنا کہہ کر دوبارہ شائع نہ کیجیے۔\nنقشے، دکانوں اور قیمتوں کا ڈیٹا OpenStreetMap اور Open Food Facts سے Open Database Licence کے تحت آتا ہے، اور زرِ مبادلہ کی شرحیں یورپی مرکزی بینک سے۔ ترتیبات میں ہر ذریعہ اور اُس کا لائسنس درج ہے۔\nآپ کی بتائی ہوئی قیمت آپ ہی کی رہتی ہے اور آپ اسے ہٹا سکتے ہیں، اور آپ Pantry کو اجازت دیتے ہیں کہ وہ اسے مجموعی شکل میں شائع کرے — ایک بے نام درمیانی قدر، اور کوئی دوسرا اسے اسی شکل میں دیکھتا ہے۔",
    termChangeH: "اگر یہ بدلے",
    termChangeB: "اِن شرائط اور پرائیویسی پالیسی کے اوپر ایک تاریخ درج ہے۔ اگر اِن میں سے کوئی اہم طور پر بدلے تو تاریخ بھی بدلے گی اور ایپ بتا دے گی۔\nاُس کے بعد Pantry استعمال کرتے رہنا نئی شکل کو قبول کرنا ہے۔ سوالات نیچے دیے پتے پر بھیجیں۔",
  },

  ar: {
    account: 'الحساب',
    accountTitle: 'احتفظ بهذا على كل أجهزتك',
    accountBody:
      'اختياري. هدفك وكم طبخت من قبل وتفضيلاتك الغذائية وسجل طبخك وخزانتك تنتقل معك إلى هاتف آخر أو حاسوب. كل شيء يعمل كما هو من دون تسجيل الدخول — هذا يحدّد فقط أين يُحفظ.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    sendLink: 'أرسل لي رابطاً',
    linkSent: 'تفقّد بريدك. الرابط يسجّل دخولك، بلا كلمة مرور تحفظها.',
    signedInAs: 'مسجّل الدخول باسم',
    signOut: 'تسجيل الخروج',
    syncing: 'جارٍ المزامنة…',
    cloudOff: 'المزامنة السحابية غير مُهيّأة في هذه النسخة، لذا يبقى كل شيء على هذا الجهاز.',
    localOnly: 'على هذا الجهاز فقط',
    cloudUnreachable:
      'تعذّر الوصول إلى خدمة تسجيل الدخول — غالباً بسبب انقطاع الشبكة. كل شيء آخر يواصل العمل على هذا الجهاز.',

    /* ── The one question ── */
    /* Lifted from each language's own tierSkillSub with the sentence about
       dragging cut off the front, so these are real translations rather
       than six new ones. */
    levelSub: 'لا توجد إجابة خاطئة. هذا فقط يمنعني من اقتراح أشياء ستزعجك.',
    stepOf: 'الخطوة {n} من {of}',
    resLevel: 'حسب مستواك',

    /* ── Mascot ── */
    mascotN: 'بانتري، في الزاوية',
    mascotS: 'القِدر الصغير بالملعقة. أطفئه إن كان يشتّت انتباهك.',

    priceAsk: 'رأيت سعراً مختلفاً؟',
    priceAskBody:
      'أخبرني بما كلّف فعلاً، فيحصل كل من يتسوّق هنا على رقم حقيقي بدل تقديري.',
    priceWhat: 'كم كلّف؟',
    pricePack: 'حجم العبوة',
    priceSend: 'أضِف هذا السعر',
    priceThanks: 'سُجِّل. سعر حقيقي آخر في السلة.',
    priceNeedsAccount: 'سجّل الدخول أولاً — الأسعار مرتبطة بحساب حتى يمكن سحبها.',
    priceCommunity: 'أشخاص يتسوّقون هنا',
    priceReported: 'مُبلَّغ عنه',
    legCommunity: 'أبلغ عنه من يتسوّقون هنا',
    legOpenPrices: 'Open Prices، سجّلها متسوّقون في هذا البلد',
    priceOpen: 'مسجّلة في Open Prices',

    haveIt: 'في مطبخك',
    tapToToggle: 'المس أي شيء تملكه أصلاً — يخرج من المجموع ويبقى خارجه.',
    tapPrice: 'المس السعر لتصحيحه.',
    totalMeans: 'تكلفة حصّة هذه الوجبة من كل مكوّن',
    totalMeansBody:
      'ليست فاتورتك. أنت تشتري عبوات كاملة، لا المقدار الذي تحتاجه الوجبة بالضبط — لذا تكون التسوّقة الأولى أغلى، والباقي ينتقل إلى الوجبة التالية.',
    extraAdd: 'اختياري — المس لإضافته',
    copycatKeep:
      'يطلب {who} {a} للحصة الواحدة. حصّتك تكلّف {b} — أي يبقى معك {c} في كل مرة تطبخه بدل أن تطلبه.',

    /* ── The time budget ── */
    timeOver: 'أكثر من {m} التي حدّدتها',
    timeOverWhy:
      'أطول من {m} دقيقة طلبتها. أعرضه بدل التظاهر بأنه أسرع: {t} دقيقة هو الرقم الحقيقي.',

    /* ── The cupboard, honestly ── */
    sampleKitchen:
      'هذه الخزانة بيانات نموذجية، حتى يكون لدى الشاشة ما تعرضه قبل أن تضيف شيئاً. الأعداد والأيام والقيمة ليست قياساً لمطبخك — قائمة تسوّقك لا تُسقط إلا ما تفترضه كل وصفة وما تؤشّر عليه بنفسك.',
    assumedHave:
      'الأسطر المشطوبة أصلاً هي ما تفترض هذه الوصفة وجوده في معظم المطابخ، لا ما أخبرتني به — المس أحدها ليعود إلى القائمة.',
    dietDerived:
      'خالٍ من المكسّرات، بلا لحم خنزير وبلا كحول تُستنتج من قراءة مكوّنات كل وصفة — لا أرى ما وضعه مصنع في عبوة، ولا ما تشارك خط إنتاج. راجع الملصق إن كان الأمر مهماً.',

    sampleStats:
      'هذه الأسابيع الثمانية بيانات نموذجية، حتى يكون لدى هذه الشاشة ما تعرضه قبل أن تطبخ شيئاً. ليست بياناتك، ولا تغادر هذا الجهاز أبداً، وأول طبخة حقيقية تحلّ محلّها.',
    samplePassport: 'الأعلام والأطباق أدناه بيانات نموذجية — أول طبخة حقيقية تحلّ محلّها. أما المال الذي وفّرته على الطلبات الخارجية فحقيقي، ومصدره سجلّك أنت.',

    planTitle: 'الأسبوع',
    planSub:
      'عشاء بضعة أيام دفعة واحدة، وقائمة تسوّق واحدة للجميع. ما تملكه في خزانتك يُخصم منها.',
    planDays: 'كم يوماً',
    planMeals: 'وجبات في اليوم',
    planServings: 'لكم شخص',
    planBuild: 'رتّب لي أسبوعاً',
    planRebuild: 'أعِد الخلط',
    planSave: 'احفظ هذا الأسبوع',
    planSaved: 'حُفظ في حسابك.',
    planEmpty: 'لا شيء مخطط بعد. اختر أيامك وسأملؤها.',
    planSwap: 'بدّل',
    planList: 'كل ما تحتاجه',
    planTotal: 'الأسبوع كامل',
    planPerDay: 'في اليوم',
    planCook: 'اطبخه',
    planDay: 'اليوم',
    planNeedsAccount: 'سجّل الدخول للاحتفاظ بأسبوع بين الأجهزة. يعمل هنا على أي حال.',

    installTitle: 'ضعه على شاشتك الرئيسية',
    installBody:
      'يفتح كتطبيق، والوصفات والخطوات والمؤقتات تعمل بلا إشارة — وهو ما يتوفّر عادة في المطبخ.',
    install: 'تثبيت',
    installed: 'تم التثبيت. ابحث عنه على شاشتك الرئيسية.',
    installIos: 'على الآيفون: المس مشاركة، ثم إضافة إلى الشاشة الرئيسية.',
    notifyTitle: 'دعني أذكّرك',
    notifyBody:
      'إشعار واحد في اليوم التالي لطبخ شيء يمكن حفظه، ولا شيء غير ذلك. لا إعلانات ولا إلحاح على السلسلة.',
    notifyOn: 'فعّل التذكيرات',
    notifyGranted: 'تم. لن أستخدمه إلا لتذكير بقايا الطعام.',
    notifyDenied: 'الإشعارات محظورة لهذا الموقع في إعدادات متصفحك.',
    notifyNeedsAccount: 'سجّل الدخول أولاً — التذكير يجب أن يرتبط بحساب حتى يُرسَل.',
    offlineReady: 'جاهز للاستخدام دون اتصال',
    sourceIdle: 'غير موصول بعد',
    sourceFx: 'سعر صرف اليوم بين الجنيه الإسترليني وعملتك',
    sourceFxBundled: 'لا سعر منشور',
    liveLook: 'المس للبحث عن متاجر قريبة منك',

    /* ── Getting around without a mouse ── */
    stepBack: 'الخطوة السابقة',
    passportNudgeReal:
      '{n} بلداً في هذا الكتاب لم تطبخ من مطبخها قط. أرخص ما يفوتك {c} — {d} يكلّف {a} للحصة.',
    streakCleanReal: 'لا شيء في القمامة الليلة — عاد الطبق نظيفاً.',
    locStart: 'أين تطبخ؟',
    storeModelled: 'أسعار معتادة لهذا النوع من المتاجر هنا',
    pantryLineSample: '{n} أشياء يضمّها مطبخ عادةً',
    pantrySubSample: 'افتراض للبداية، لا مسح لرفوفك',
    morning: 'صباح الخير',
    afternoon: 'مساء الخير',
    planSaveFailed: 'تعذّر حفظ الخطة — تحقّق من اتصالك وحاول مجدداً.',
    savedAssumes: 'هذا بافتراض نحو تسع تسوّقات في الشهر.',
    streakGoOn: 'اطبخ غداً أيضاً وتواصل الشعلة العدّ.',

    /* ── الإسناد والتراخيص ── */
    creditsLabel: 'الإسناد والتراخيص',
    creditShort: 'المتاجر والأسعار: © OpenStreetMap contributors · Open Food Facts — ODbL',
    creditOsm:
      'أسماء الأماكن والمتاجر وأوقات العمل تأتي من OpenStreetMap. © OpenStreetMap contributors، بموجب رخصة Open Database (ODbL).',
    creditOpenFood:
      'الأسعار الحقيقية وأوزان العبوات تأتي من Open Prices وOpen Food Facts، بموجب رخصة Open Database (ODbL).',
    creditOther:
      'الأساس المقيس هو مرصد أسعار الغذاء لبرنامج الأغذية العالمي، عبر HDX (CC BY). وأسعار الصرف هي أسعار المرجع اليومية للبنك المركزي الأوروبي.',

    /* ── حين لا يُقبل السعر ── */
    priceOutOfRange:
      'هذا لا يبدو سعر رفّ. أخبرني كم كلّفت عبوة واحدة، وحجمها بالغرامات.',
    priceAlready: 'سجّلت هذا اليوم بالفعل. سعر الغد هو المفيد.',
    priceTooMany: 'هذه أسعار كثيرة دفعة واحدة. عد بعد ساعة وسيمرّ الباقي.',
    priceFailed: 'لم يُحفظ هذا السعر. غالباً بسبب انقطاع الشبكة — حاول بعد لحظات.',

    /* ── When something breaks, and your data ── */
    crashTitle: "شيء ما هنا تعطّل",
    crashBody: "الخطأ خطئي لا خطؤك. لم يُمسّ شيء ممّا أخبرتني به — كلّه ما زال على هذا الجهاز. إعادة التحميل تعيدك عادةً إلى حيث كنت.",
    crashWhat: "ما الذي فشل",
    crashReload: "أعِد تحميل Pantry",
    crashSave: "احفظ نسخة من بياناتي أولاً",
    dataTitle: "بياناتك",
    dataExport: "احفظ نسخة",
    dataExportSub: "ملف واحد يضمّ كم طبخت من قبل وحمياتك وميزانيتك وخزانتك وكلّ طبخة سجّلتها. يذهب إلى جهازك ولا مكان آخر.",
    dataImport: "أعِد تحميل نسخة",
    dataImportSub: "اختر ملفاً حفظته من هنا. سيحلّ محلّ ما على هذا الجهاز، ويعيد Pantry التشغيل.",
    dataImportCloud: "أنت مسجّل الدخول: سجلّ طبخك سيُدمج، لكن إعدادات حسابك تغلب في المزامنة التالية. سجّل الخروج أولاً إن كان هذا الملف يجب أن يحلّ محلّها.",
    dataImported: "تمّ التحميل. عادت معه {n} طبخة.",
    dataBadFile: "هذا ليس ملف Pantry. لم يتغيّر شيء.",
    dataFutureFile: "هذا الملف من نسخة Pantry أحدث من هذه. لن أفتح نصفه وأُسقط الباقي بصمت، لذا لم يتغيّر شيء.",
    budgetRange: "أعطني مبلغاً بين {a} و{b}.",
    pricesChecking: "أتحقّق من الأسعار الحقيقية…",
    priceSending: "أضيف…",
    planSaving: "أحفظ…",
    sendingLink: "أرسل…",

    /* ── The small print ── */
    legalKicker: "التفاصيل الصغيرة",
    privacyRow: "الخصوصية",
    privacyRowSub: "ما الذي يُحفظ، وأين، وما الذي يغادر هذا الجهاز",
    termsRow: "الشروط",
    termsRowSub: "ما يَعِد به هذا التطبيق، وما لا يَعِد به",
    legalUpdated: "آخر تحديث: 3 أغسطس 2026",
    privTitle: "الخصوصية",
    privIntro: "يعمل Pantry على هاتفك. ومعظم ما تفعله هنا لا يغادره أبداً. هذه الصفحة تقول بالضبط ما الذي يغادر، ومتى، ومن يراه — لا أكثر ولا أقل.",
    privLocalH: "دون تسجيل الدخول، لا شيء يغادر هذا الجهاز",
    privLocalB: "كل ما تخبر به Pantry يُكتب في التخزين المحلي لمتصفّحك تحت مفتاح واحد: pantry.v1. يحتوي على ما إذا كنت أنهيت الإعداد، وكم طبخت من قبل، وأنظمتك الغذائية، وبلدك، وميزانيتك، وحدّك الزمني، ولغتك، ومفتاح تذكير البقايا، وسجلّ طبخك، وإجاباتك على أسئلة شاشة الأرقام، والأسبوع الذي حفظته، وما أشّرت عليه كموجود في خزانتك.\nوهناك مفتاح آخر، pantry.fx.v1، يحمل سعر صرف اليوم. وهذه حقيقة عن المال، لا عنك.\nلا شيء من ذلك يُرسل إلى أي مكان. لا حساب، ولا خادم، ولا طلب. امسح بيانات هذا الموقع من متصفّحك ويختفي كل شيء — ومعه كل ما كان التطبيق يعرفه.",
    privAccountH: "عند تسجيل الدخول، وعندها فقط",
    privAccountB: "تسجيل الدخول اختياري، والتطبيق يعمل كما هو بدونه. تكتب بريداً إلكترونياً فيصلك رابط. لا كلمة مرور، فلا شيء لتخزينه.\nبريدك الإلكتروني وجلسة دخولك يحتفظ بهما Supabase، وهو قاعدة البيانات وخدمة الدخول التي يستخدمها هذا التطبيق.\nومن هناك: profiles يحمل الإعدادات المذكورة أعلاه، ليعمل الحساب نفسه على حاسوبك. cook_log يحمل ما طبخته — الطبق، والتاريخ، والتكلفة، والحصص، والسعرات، والبروتين، والكربوهيدرات، والصعوبة، وكم ذهب إلى القمامة. saved_plans وplan_meals يحملان أسبوعاً إن حفظته. price_reports يحمل سعراً إن أبلغت عنه. push_subscriptions وreminders يحملان الإشعار إن فعّلته.\nلا يُكتب شيء في أيٍّ منها حتى تفعل ما يكتب فيه. أسابيع العيّنة الثمانية في شاشة الأرقام لا تُرفع أبداً — فهي ديكور لا سِجلّك. وما أشّرت عليه كموجود في خزانتك يبقى على هذا الجهاز؛ ولا يُزامَن.",
    privDietH: "الأنظمة الغذائية، وما يستحق أن تعرفه عنها",
    privDietB: "أنظمتك الغذائية إعداد كأي إعداد آخر، وعند تسجيل الدخول تذهب إلى صفّ ملفك مع كل شيء آخر.\nبعضها — حلال، كوشير — يقول عنك شيئاً لا يخصّ العشاء حقاً. وأفضّل أن أقولها لك بوضوح على أن أتحايل. إن سجّلت الدخول فهذه القائمة في قاعدة بيانات. وإن كنت تفضّل بقاءها على هاتفك فاستخدم Pantry دون تسجيل دخول. كل شيء يعمل.",
    privWhereH: "أين أنت",
    privWhereB: "الموقع مُعطَّل حتى تضغط الزر الذي يطلبه، ومتصفّحك يسألك مرة أخرى قبل أن يحدث أي شيء.\nإن سمحت، تذهب إحداثياتك إلى موضعين: Nominatim، الذي تديره مؤسسة OpenStreetMap، لتحويلها إلى اسم مكان، وOverpass، وهو أيضاً من OpenStreetMap، لإيجاد المتاجر القريبة منك. كلاهما خدمة عامة بلا مفتاح وبلا حساب.\nلا يخزّن Pantry إحداثياتك أبداً. ما يحتفظ به هو اسم المدينة والبلد، على هذا الجهاز — والبلد يذهب إلى صفّ ملفك إن كنت مسجّل الدخول. والبلد ليس موقعاً.",
    privPhotoH: "صورة طبقك",
    privPhotoB: "لا تغادر الجهاز أبداً. شاشة «بعد» تقرأ الملف في object URL — مؤشّر يحتفظ به متصفّحك في الذاكرة — وتتخلّص منه حين تغادر الشاشة.\nلا تُرفع، ولا تُخزَّن، وليست في سجلّ طبخك. لا شيء هنا يمكنه أن يُريك تلك الصورة مرة أخرى، لأن لا شيء هنا امتلكها أصلاً.",
    privPushH: "الإشعار الوحيد",
    privPushB: "إن فعّلت التذكيرات، ينشئ متصفّحك اشتراك دفع ويحتفظ Pantry بثلاثة أشياء: نقطة النهاية التي يمنحها متصفّحك، ومفتاحين يتيحان تشفير رسالة موجَّهة إليك، ونسخة مختصرة من سطر user-agent لمتصفّحك ليمكن تمييز اشتراك ميّت من اشتراك حيّ.\nوهي موجودة لإرسال نوع واحد من الرسائل: في اليوم التالي لطبخ شيء يمكن حفظه، تذكير واحد بأنه ما زال صالحاً. ولا يُرسَل إليها شيء آخر أبداً، من أحد. أوقف الإشعارات في متصفّحك وتتوقّف نقطة النهاية عن العمل.",
    privPriceH: "الأسعار التي تُبلّغ عنها",
    privPriceB: "حين تخبر Pantry بما كلّفه شيء فعلاً، يحفظ المكوّن والسعر والعملة وحجم العبوة واسم المتجر إن ذكرته والبلد وحسابك.\nحسابك مرفق كي يمكن سحب البلاغ لاحقاً. فالسعر الذي أبلغت عنه سعر يمكنك حذفه.\nلا أحد غيرك يستطيع قراءة بلاغك. قراءة الأسعار تمرّ عبر دالة لا تُرجع إلا تجميعات: السعر الوسيط للكيلو، وعدد البلاغات، ومدى حداثة أحدثها. لا مَن أبلغ أبداً، ولا أين يتسوّق.",
    privOthersH: "بمن يتّصل جهازك أيضاً",
    privOthersB: "api.frankfurter.app، لسعر البنك المركزي الأوروبي اليومي بين الجنيه الإسترليني وعملتك.\nnominatim.openstreetmap.org وoverpass-api.de، فقط بعد أن تسمح بالموقع، كما ورد أعلاه.\nprices.openfoodfacts.org — أي Open Prices، وهو جزء من Open Food Facts — لأسعار صوّرها الناس على الرفّ في بلدك. يُسأل عن فئة مكوّن ورمز بلد، ولا شيء عنك.\nمشروع Supabase الخاص بك، فقط أثناء تسجيل دخولك أو بعده.\nالموقع نفسه تقدّمه Netlify، التي — كأي مستضيف — ترى طلب الصفحة في سجلّات خادمها المعتادة. ولا شيء في التطبيق يبلّغها بشيء.\nقائمة المصادر في الإعدادات تحيل إلى OpenStreetMap وOpen Food Facts والبنك المركزي الأوروبي. وفتح أحدها هو زيارتك لموقعهم، ويرونك كما يرى أي موقع زائراً.",
    privNeverH: "ما لا يفعله Pantry",
    privNeverB: "لا إعلانات. لا شيء هنا يُباع أو يُؤجَّر أو يُسلَّم لأحد مقابل مال.\nلا تحليلات طرف ثالث. لا يوجد أي سكربت تتبّع على هذا الموقع — ولا واحد. والخطّان يُقدَّمان من هذا النطاق لا من شبكة خطوط، فقراءة وصفة لا ترسل عنوانك إلى Google.\nلا تصنيف لك خارج ما تراه على الشاشة. أسئلة شاشة الأرقام هي كل ما في الأمر، وأنت من أجاب عنها، ولكل واحد منها زرّ «انسَ» بجانبه.",
    privRightsH: "ما يمكنك طلبه",
    privRightsB: "أن تراه. دون تسجيل دخول، كل شيء هو القيمة الواحدة تحت pantry.v1 في تخزين متصفّحك، وأدوات المتصفّح نفسها ستُريك إياها. وبتسجيل الدخول، اطلب وسأرسل لك ما تحمله الجداول عنك.\nأن تأخذه معك. لا يوجد زرّ تصدير بعد. هذه ثغرة لا سياسة، ويجب بناؤها.\nأن تحذفه. الإعدادات ← «ابدأ من جديد» يمسح pantry.v1 من هذا الجهاز فوراً؛ ويترك سعر الصرف، لأنه لم يكن لك أصلاً. وحذف الحساب نفسه لا زرّ له بعد — راسل العنوان أدناه ويذهب الحساب، ومعه الملف وسجلّ الطبخ والأسابيع المحفوظة والتذكيرات واشتراكات الدفع. وقل كلمة فتذهب معها أي أسعار أبلغت عنها.\nإن كنت في المملكة المتحدة أو الاتحاد الأوروبي فهذه حقوقك بموجب UK GDPR وGDPR، ويمكنك التقدّم بشكوى إلى هيئة حماية البيانات لديك — وفي المملكة المتحدة هي ICO.",
    privContactH: "أن تسأل",
    privContactB: "عنوان واحد، أدناه، لأي شيء في هذه الصفحة: سؤال، أو تصحيح، أو حذف — أو سطر هنا لا يطابق ما يفعله التطبيق فعلاً. وهذا الأخير هو ما أودّ سماعه أكثر من غيره.",
    termTitle: "الشروط",
    termIntro: "قصيرة، كما ينبغي أن تكون. Pantry تطبيق طبخ مجاني. واستخدامه يعني قبولك بما في هذه الصفحة.",
    termWhatH: "ما هو Pantry",
    termWhatB: "كتاب وصفات يُسعّر نفسه حيث تقف، ويحاول أن يناسب ما تجيد طبخه، وما لديك، وكم من الوقت تملك.\nهو أداة لتقرّر ما العشاء. وليس نصيحة غذائية ولا طبية ولا مالية، وليس متجراً — لا شيء هنا يبيعك شيئاً.",
    termPriceH: "الأسعار تقديرات",
    termPriceB: "معظم الأرقام في Pantry مُنمذَجة: سعر معتاد لذلك المكوّن، في ذلك النوع من المتاجر، في ذلك البلد، محوَّلاً بسعر بنك مركزي. وشاشة التسوّق تُبيّن أي الأسعار مقيسة وأيها منمذَجة، لأن الفرق مهم.\nوحتى السعر المقيس هو ما دفعه أحدهم في مكان ما خلال الأشهر الستة الماضية. فاتورتك ستختلف. لا شيء هنا عرض ولا تسعيرة ولا ضمان لتكلفة أي شيء.",
    termAllergenH: "ليس ضماناً بشأن المُحسِّسات",
    termAllergenB: "«خالٍ من المكسّرات» و«بلا لحم خنزير» و«بلا كحول» تُستنتج من قراءة مكوّنات كل وصفة. لا يرى التطبيق ما وضعه مصنع في عبوة، ولا ما تشارك خط إنتاج. راجع الملصق إن كان الأمر مهماً.\nوإن كانت الحساسية خطيرة فلا تدع هذا التطبيق يقرّر. إنه يُرشِّح قائمة كلمات. وهو لا يقرأ عبوتك.",
    termCookH: "الطبخ مسؤوليتك",
    termCookB: "الأوقات ودرجات الحرارة دليل لا أكثر. الأفران تختلف، والمقالي تختلف، وأنت وحدك ترى إن نضج الدجاج. اطبخ إلى درجات حرارة آمنة، وبرِّد البقايا كما ينبغي، واحكم بنفسك كم تبقى صالحة — تذكير البقايا دعوة لتتحقّق، لا حكم بأنها آمنة.\nيُقدَّم Pantry كما هو، دون أي ضمان من أي نوع. سيخطئ أحياناً، وهو غير مسؤول عمّا يحدث في مطبخك.",
    termAccountH: "حسابك",
    termAccountB: "سجّل الدخول ببريد إلكتروني تملكه. شخص واحد، حساب واحد.\nأبلغ عن الأسعار بصدق. بلاغ السعر موجود ليساعد الشخص التالي الواقف في ذلك الممرّ، والبلاغات المُختلَقة يمكن حذفها، ومعها الحساب الذي قدّمها.\nويمكنك المغادرة متى شئت. صفحة الخصوصية تقول كيف.",
    termLicenceH: "لِمَن يعود كل شيء",
    termLicenceB: "الوصفات والنصوص والرسوم وشيفرة Pantry ملكٌ لـ Pantry. اطبخ منها، واطبعها، وأطعم الناس. لكن لا تُعِد نشر المجموعة على أنها لك.\nبيانات الخرائط والمتاجر والأسعار من OpenStreetMap وOpen Food Facts بموجب Open Database Licence، وأسعار الصرف من البنك المركزي الأوروبي. والإعدادات تذكر كل مصدر ورخصته.\nالسعر الذي تُبلّغ عنه يبقى لك ولك حذفه، وتسمح لـ Pantry بنشره ضمن تجميعة — وسيط بلا اسم، وهي الصورة الوحيدة التي يراها بها أي شخص آخر.",
    termChangeH: "إن تغيّر هذا",
    termChangeB: "هذه الشروط وسياسة الخصوصية تحمل تاريخاً في أعلاها. وإن تغيّر أيّهما بشكل يهمّ، تغيّر التاريخ معه وقال التطبيق ذلك.\nومواصلة استخدام Pantry بعد ذلك قبولٌ بالنسخة الجديدة. والأسئلة تذهب إلى العنوان أدناه.",
  },
};

export const xt = (lang: string, key: string): string =>
  EXTRA[lang]?.[key] ?? EXTRA.en[key] ?? key;

/** Every key that has no translation in `lang` yet. Should be empty for all six. */
export const untranslated = (lang: string): string[] =>
  lang === 'en' ? [] : Object.keys(EXTRA.en).filter((k) => !EXTRA[lang]?.[k]);

/** Keys a translation has that English does not — these would never render. */
export const orphaned = (lang: string): string[] =>
  Object.keys(EXTRA[lang] ?? {}).filter((k) => !(k in EXTRA.en));
