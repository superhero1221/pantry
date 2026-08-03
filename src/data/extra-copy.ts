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
    cloudUnreachable:
      'Could not reach the sign-in service — usually that is no signal. Everything else carries on working on this device.',

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
    samplePassport: 'The flags and dishes below are sample data — this screen does not yet track where you have really cooked from. The money kept out of takeaways is real, and comes from your own log.',

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
    tierPlaceIn: 'Put the selected card in this row: {t}',
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
  },

  es: {
    account: 'Cuenta',
    accountTitle: 'Consérvalo en todos tus dispositivos',
    accountBody:
      'Opcional. Tu objetivo, tus listas por niveles, tus dietas, tu registro de cocina y tu despensa te siguen a otro móvil o a un portátil. Todo funciona igual sin sesión: esto solo decide dónde se guarda.',
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
    samplePassport: 'Las banderas y los platos de abajo son datos de ejemplo: esta pantalla aún no refleja de dónde has cocinado de verdad. El dinero que no fue a comida a domicilio sí es real, y sale de tu propio registro.',

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
    tierPlaceIn: 'Pon la tarjeta seleccionada en esta fila: {t}',
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
  },

  fr: {
    account: 'Compte',
    accountTitle: 'Gardez tout ça sur tous vos appareils',
    accountBody:
      'Facultatif. Votre objectif, vos classements, vos régimes, votre journal de cuisine et vos placards vous suivent sur un autre téléphone ou un ordinateur. Tout fonctionne pareil sans compte : ceci décide seulement où c’est gardé.',
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
    samplePassport: 'Les drapeaux et les plats ci-dessous sont des données d’exemple : cet écran ne suit pas encore d’où vous avez vraiment cuisiné. L’argent gardé hors des plats à emporter est réel, et vient de votre propre journal.',

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
    tierPlaceIn: 'Mettre la carte sélectionnée dans cette rangée : {t}',
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
  },

  pl: {
    account: 'Konto',
    accountTitle: 'Zachowaj to na wszystkich urządzeniach',
    accountBody:
      'Opcjonalnie. Twój cel, listy poziomów, diety, dziennik gotowania i szafka przeniosą się na inny telefon albo laptop. Bez logowania działa tak samo — to decyduje tylko o tym, gdzie się to trzyma.',
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
    samplePassport: 'Flagi i dania poniżej to dane przykładowe — ten ekran jeszcze nie śledzi, skąd naprawdę gotowałeś. Pieniądze niewydane na jedzenie na wynos są prawdziwe i pochodzą z twojego własnego dziennika.',

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
    tierPlaceIn: 'Umieść wybraną kartę w tym rzędzie: {t}',
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
  },

  ur: {
    account: 'اکاؤنٹ',
    accountTitle: 'اسے اپنے تمام آلات پر محفوظ رکھیں',
    accountBody:
      'اختیاری۔ آپ کا ہدف، درجہ بندی کی فہرستیں، غذائی ترجیحات، کھانا پکانے کا ریکارڈ اور آپ کی الماری کسی دوسرے فون یا لیپ ٹاپ پر آپ کے ساتھ چلے جائیں گے۔ بغیر لاگ اِن کے بھی سب کچھ ویسے ہی کام کرتا ہے — یہ صرف یہ طے کرتا ہے کہ سب کچھ کہاں رکھا جائے۔',
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
    samplePassport: 'نیچے کے جھنڈے اور کھانے نمونے کا ڈیٹا ہیں — یہ اسکرین ابھی یہ نہیں جانتی کہ آپ نے واقعی کہاں کا کھانا پکایا۔ باہر سے کھانا منگوانے پر جو پیسہ بچا وہ اصلی ہے اور آپ کے اپنے ریکارڈ سے آتا ہے۔',

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
    tierPlaceIn: 'منتخب کارڈ اس قطار میں رکھیں: {t}',
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
  },

  ar: {
    account: 'الحساب',
    accountTitle: 'احتفظ بهذا على كل أجهزتك',
    accountBody:
      'اختياري. هدفك وقوائم مستوياتك وتفضيلاتك الغذائية وسجل طبخك وخزانتك تنتقل معك إلى هاتف آخر أو حاسوب. كل شيء يعمل كما هو من دون تسجيل الدخول — هذا يحدّد فقط أين يُحفظ.',
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
    samplePassport: 'الأعلام والأطباق أدناه بيانات نموذجية — هذه الشاشة لا تتابع بعد من أين طبخت فعلاً. أما المال الذي وفّرته على الطلبات الخارجية فحقيقي، ومصدره سجلّك أنت.',

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
    tierPlaceIn: 'ضع البطاقة المختارة في هذا الصف: {t}',
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
