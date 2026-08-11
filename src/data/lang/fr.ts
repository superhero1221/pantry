/**
 * French. Nothing imports this eagerly — data/lang-pack.ts fetches it once, on
 * the boot of somebody reading French. Everything in it is English-backed by
 * the accessors in pantry-i18n.js and extra-copy.ts, so until it lands (and if
 * it never does, because the signal died) the interface reads in English
 * rather than in nothing.
 *
 * A handful of keys arrive here already stated twice — the source carries
 * several languages' worth of `anHour` stacked in every pack, with the last
 * one winning under plain JS semantics. Only the last is kept, which is
 * exactly what the engine was already handing back; data/equiv.test.ts holds
 * the whole of this file to that.
 *
 * The five crash* keys in `extra` are also in data/crash-copy.ts, which is
 * eager, because a net that needs the module graph it exists to survive is not
 * a net. The duplication is deliberate and data.test.ts asserts the two agree.
 */
export const strings: Record<string, string> = {
  navTonight: 'Ce soir', navKitchen: 'Cuisine', navStats: 'Chiffres', navPassport: 'Passeport', navYou: 'Vous',
  welcomeTag: "Dites-moi ce qui vous tente et ce qu'il reste dans votre poche. Je décide pour vous.",
  welcome1: 'Une décision à la fois',
  welcome2: 'Aux prix de là où vous êtes vraiment',
  welcome3: 'Se souvient de ce que vous avez déjà',
  welcomeGo: 'Commencer', welcomeSkip: 'Passer tout ça',
  tierSkill: 'Que savez-vous déjà faire ?',
  tierSkillSub: "Glissez chaque carte dans une rangée, ou touchez-la puis touchez la rangée. Il n'y a pas de mauvaise réponse. Ça m'évite juste de vous proposer des choses agaçantes.",
  tierTime: 'Combien de temps avez-vous vraiment ?',
  tierTimeSub: 'Pareil. Soyez honnête plutôt qu’optimiste.',
  tierNext: 'Suivant', tierSkip: 'Passer', tierLeft: 'à placer', tierAllPlaced: 'Tout est placé',
  dietTitle: "Y a-t-il des choses que vous ne mangez pas ?",
  dietSub: 'Touchez tout ce qui s’applique. Modifiable plus tard.',
  dietNone: 'Aucune restriction',
  locFinding: 'Je vous localise…', locFound: 'Trouvé',
  locThatsMe: "C'est moi", locNotMe: 'Ailleurs',
  locUse: 'Utiliser ma position', locManual: 'Choisir un pays',
  locWhy: 'Les prix et les magasins changent de rue en rue. Rien ne quitte cet appareil.',
  locDenied: 'Pas grave : choisissez un lieu et je pars de là.',
  homeWhat: 'Vous avez envie de quoi ?',
  homePlaceholder: 'pad thaï, quelque chose de chaud, des ailes…',
  homeMoney: 'Budget', homeTime: 'Temps', homeFor: 'Pour',
  homeGo: 'Montrez-moi le dîner', homeAny: 'Peu importe, choisissez',
  homeBrowse: 'Tout parcourir', homeOther: 'Autre',
  homeServes1: 'moi seul', homeServes2: 'deux', homeServes4: 'quatre',
  resServing: 'la portion', resToBuy: 'à acheter, pour',
  resInstead: "Au lieu de l'acheter tout fait", resKeep: 'Vous gardez',
  resCook: 'Cuisiner ça', resOthers: 'Deux autres', resMicro: "Le reste de l'étiquette",
  resHide: 'Masquer', resUnder: 'sous le budget', resOver: 'au-dessus',
  resHard: 'Difficulté', resMins: 'min',
  shopTitle: 'Où l’acheter', shopList: 'Votre liste',
  shopTotal: 'Total à acheter', shopGo: 'Commencer à cuisiner',
  shopHave: 'déjà chez vous', shopBuy: 'à acheter',
  shopCheapest: 'le moins cher', shopLive: 'en direct', shopModelled: 'estimé',
  shopWhere: "D'où viennent ces chiffres",
  cookOf: 'sur', cookDone: 'Terminé', cookNext: 'Étape suivante',
  cookLost: 'J’ai perdu le fil', cookGot: 'Compris',
  cookWhere: 'Où vous en êtes', cookHob: 'Ce qui est sur le feu',
  cookTimer: 'Lancer le minuteur', cookStop: 'Arrêter',
  afterTitle: 'Vous l’avez fait.',
  afterSub: 'Une dernière chose et je vous laisse tranquille.',
  afterPhoto: 'Déposez une photo de l’assiette finie',
  afterOptional: 'Facultatif. Ça ne sert qu’à apprendre vos portions.',
  afterSkip: 'Passer la photo',
  afterTell: 'Ou dites-le-moi', afterNothing: 'Ne pas enregistrer',
  afterCleared: 'Tout mangé', afterBit: 'Un peu resté', afterLoads: 'Beaucoup resté',
  afterNotRight: 'pas ça', afterDays: 'jours d’affilée',
  kitchenTitle: 'Votre cuisine', kitchenFirst: 'À finir en premier',
  kitchenStock: 'Placard', kitchenDays: 'jours',
  statsTitle: 'Ce que je sais', statsSpend: 'Ce que vous dépensez',
  statsCooked: 'Ce que vous cuisinez', statsHard: 'À quel point vous poussez',
  statsLearned: 'Ce que j’ai déduit de vous',
  statsForget: 'Oublier ça', statsWeek: 'par semaine', statsAvg: 'moyenne',
  passTitle: 'Passeport', passServing: 'la portion', passCooked: 'cuisiné',
  setTitle: 'Vous', setDiet: 'Ce que vous ne mangez pas', setTier: 'Vos listes',
  setRedo: 'Refaire', setWhere: 'Où vous êtes', setLang: 'Langue',
  setSources: 'D’où viennent les données', setReset: 'Tout recommencer',
  setKey: 'Clé de prix', setKeyHint: 'Facultatif. Débloque les prix d’enseignes nommées.',
  yes: 'Oui', no: 'Non', notNow: 'Pas maintenant', neverAsk: 'Ne plus demander',
  back: 'Retour', close: 'Fermer', save: 'Enregistrer'
};

export const pack: Record<string, unknown> = {
  "lo": {"mango_wings":"au four, pas frit","stir_fry":"avec du riz","omelette":"sur pain grillé","veg_curry":"au lait de coco","tuna_bake":"quatre boîtes et un paquet"},
  "us": ["transforme vos coordonnées en nom de lieu","les magasins réels autour de vous, avec leurs horaires","de vrais prix photographiés en rayon","poids des produits et nutrition","la référence mesurée dans 62 pays"],
  "plans": ["Je m’en tiendrai à cinq ingrédients et à aucun geste de couteau que vous n’ayez déjà fait.","Je vous pousserai un peu, jamais plus d’une nouveauté par repas.","Rien ici ne vous ennuiera et rien ne vous prendra au dépourvu.","Rien n’est exclu."],
  "pc": {"IN":"Inde","GB":"Royaume-Uni","IT":"Italie","FR":"France","CN":"Chine","NG":"Nigeria","TH":"Thaïlande"},
  "am": {"a1":"180 g restants sur un sachet de 300 g","a2":"presque tout un paquet de 30 g","a3":"4 sur 8","a4":"180 g, entamé","a5":"bloc de 270 g","cooked":"cuisiné","time":"fois","times":"fois"},
  "h": {"daysWord":"jours","forServings":"pour {n} portions","otherChip":"Autre","findMe":"Trouvez-moi {q}","inKitchen":"{n} choses déjà dans votre cuisine","passportNudge":"84 pays dont vous n’avez jamais rien cuisiné. Le moins cher qui vous manque est l’Éthiopie : le misir wot revient à {a} la portion.","liveShops":"{n} magasins à pied, directement d’OpenStreetMap","week":["L","M","M","J","V","S","D"]},
  "v": {
   "recapDone": "Vous avez fait {a} étapes sur {b}. La dernière chose faite : {t}.","plan1":"Je m’en tiens à cinq ingrédients et à aucun geste au couteau que vous n’ayez déjà fait.","plan2":"Je vous pousse un peu, jamais plus d’une nouveauté par repas.","plan3":"Rien ici ne vous ennuiera et rien ne vous prendra au dépourvu.","plan4":"Rien n’est exclu.","tierSkillSub":"Glissez chaque carte dans une rangée — ou touchez-en une, puis une rangée. Il n’y a pas de mauvaise réponse. Cela m’évite simplement de vous proposer des choses qui vous agaceront.","tierTimeSub":"Pareil. Soyez honnête plutôt qu’ambitieux : je préfère vous faire cuisiner en vingt minutes que vous regarder ne rien cuisiner en cinquante.","readsLike":"Cela se lit comme : {w}. {p}","placeFew":"Placez-en quelques-unes et je vous dirai ce que j’en pense.","timeRead":"Bien — je garde tout sous {m} minutes en semaine, et je ne propose les longues que le week-end.","dietSome":"Noté. Rien de ce qui enfreint l’un de ces points ne vous est proposé. Ces plats passent en bas de liste plutôt que de disparaître, pour que vous voyiez ce que vous écartez.","dietNone":"Rien de sélectionné, donc rien n’est filtré. Vous pourrez y revenir la première fois que je vous propose quelque chose que vous ne mangeriez jamais.","wasteNone":"Assiette vide, rien à la poubelle. Cette portion est la bonne — je la laisse exactement telle quelle.","wasteSome":"La photo indique environ 20% encore dans l’assiette. Pas un drame, mais c’est de l’argent cuisiné et pas mangé.","wasteLots":"On dirait qu’il en reste la moitié. Soit la portion est trop grande, soit le plat n’était pas ce que vous vouliez — les deux méritent d’être sus.","hob0":"Vous venez de commencer. Rien n’est encore sur le feu — vous ne pouvez pas vous être trompé.","hobNone":"Rien sur le feu.","hobPrep":"Rien sur le feu pour l’instant — tout ceci est de la préparation.","hobHot":"Sur le feu maintenant : la poêle, chaude. Ne vous éloignez pas.","nudge":"Les germes et la coriandre sont à utiliser sous 3 jours","remind":"Rappelle-moi demain à 12h30","remindPing":"Demain 12h30 — {d} est encore bon. Réchauffez-le plutôt que d’acheter à déjeuner.","shrinkBig":"Je cuisine un tiers de moins la prochaine fois ?","shrinkSmall":"Je cuisine 15% de moins la prochaine fois ?","shrinkBody":"Même plat, poêle plus petite. Environ {a} économisés par fois, et le morceau que vous ne mangez jamais ne part plus à la poubelle. Vous pouvez annuler à tout moment.","shrinkPing":"Portion réduite. Le prochain {d} est dimensionné pour ce que vous mangez vraiment.","shrinkYesText":"C’est fait. La prochaine fois, c’est dimensionné pour ce que vous mangez vraiment, et la liste de courses rétrécit avec.","shrinkNoText":"Très bien — des restes volontaires ne sont pas du gaspillage. Je laisse la portion telle quelle et j’arrête de demander.","streakClean":"Rien à la poubelle de la semaine. Cela fait environ {a} économisés.","streakKeep":"Une assiette propre demain et cela fera une semaine.","receiptPing":"Le scan de tickets n’est qu’une esquisse pour l’instant — c’est le moteur de prix qui est réel.","keyOn":"Clé enregistrée. Prix des enseignes activés.","keyOff":"Clé effacée.","looking":"Recherche de magasins près de vous…"},
  "u": {"setMe":"Configurez-moi — 4 écrans rapides","thatsLot":"C’est tout.","dietSub":"Cochez ce qui s’applique, ou rien. C’est un filtre, pas un jugement, et vous pouvez le changer à tout moment dans les réglages.","lookTitle":"Ou laissez-moi vraiment regarder.","noBother":"Pas de souci — choisissez une ville ci-dessous et tout est recalculé.","coverage":"8 pays ont leur propre indice de coût. Chaque prix commence modélisé puis est ajusté à là où vous êtes — Royaume-Uni compris. Les vrais prix n’arrivent qu’une ligne à la fois, quand quelqu’un en signale un ou qu’Open Prices en a un, et le point à côté de chaque prix dit lequel vous regardez.","thatsMe":"C’est moi — à table","setBtn":"Valider","barsNote":"Les barres représentent la part d’un apport journalier de référence adulte, par portion.","legMeasured":"Mesuré sur les marchés de ce pays","legEurope":"Mesuré en Europe, transposé ici","legModelled":"Modélisé depuis un prix d’emballage, actualisé avec l’inflation","timerLabel":"Minuteur","stopBtn":"Arrêter","whereYouAre":"Où vous en êtes","noPhoto":"Pas de photo. C’est parfaitement bien — touchez si vous changez d’avis.","notRight":"pas exact","shrinkYes":"Oui, réduisez","shrinkNo":"Non, j’aime les restes","doneThanks":"Terminé — merci","redoTier":"Refaire le classement","changeBtn":"Changer","resTier":"pour votre classement","gotIt":"Compris, fermer","timerStart":"Lancer {m} minutes","langNote":"L’interface bascule immédiatement, droite-à-gauche comprise. Les méthodes de recette restent en anglais pour l’instant : je préfère les laisser non traduites plutôt que de faire traduire par machine une étape qui vous dit quand retirer les crevettes du feu.","apiNote":"Aucun supermarché britannique, américain ou européen ne publie d’API de prix — ni Tesco, ni Sainsbury’s, ni Kroger. Sans clé j’utilise Open Prices, réel mais collaboratif et lacunaire. Avec une clé, les prix en rayon d’enseignes nommées remplacent l’estimation et chaque ligne indique laquelle.","picNote":"Les photos des plats sont l’image principale de l’article Wikipédia de chaque plat, presque toutes en CC BY-SA.","nowTag":"maintenant"},
  "cn": {"GB":"le Royaume-Uni","US":"les États-Unis","IN":"l’Inde","NG":"le Nigeria","PK":"le Pakistan","DE":"l’Allemagne","AE":"les Émirats","TR":"la Turquie"},
  "sl": {"saved":"Se souvenir de vos placards a retiré {a} à ces courses. Sur un mois de cuisine, cela fait environ {b} que vous n’avez pas dépensés deux fois.","measured":"L’essentiel de ce panier est mesuré — des enquêteurs visitent les marchés {c} chaque mois. C’est une couverture inhabituellement bonne.","modelled":"Soyons clairs : {c}, l’essentiel de ce panier est modélisé, pas mesuré. Aucune chaîne ne publie ses prix à cette échelle. Prenez-le comme une bonne estimation, pas comme un ticket.","listEnglish":"Les noms suivent l’emballage","listWhy":"Les rayons sont étiquetés dans la langue locale. Je vous montre le nom que vous lirez vraiment sur le paquet."},
  "q": {"training":{"q":"Vous avez visé les protéines {k} fois sur {n}.","why":"S’il y a une raison, je peux viser juste au lieu de deviner. Vous vous entraînez ?","o":["Je fais de la muscu","Je cours ou je pédale","Non, j’aime ça, c’est tout"]},"calorieGoal":{"q":"{k} de vos {n} derniers plats faisaient moins de 500 calories.","why":"C’est une habitude, pas un hasard. Dans quel but ?","o":["Perdre du poids","Recomposition","C’est tombé comme ça"]},"cuisine":{"q":"{k} de vos {n} derniers plats étaient {c}.","why":"Dois-je pencher de ce côté quand je n’ai rien de mieux, ou continuer à varier ?","o":["Penchez {c}","Continuez à varier"]},"push":{"q":"Rien de ce que vous avez cuisiné en un mois ne dépassait la difficulté deux.","why":"Je peux rester sur du facile, ou glisser un plat plus exigeant par semaine.","o":["Poussez-moi un peu","Restez sur du facile"]},"budget":{"q":"Vous êtes à {a} la portion en moyenne, pour un panier de {b}.","why":"C’est plus serré qu’il n’y paraît. Je monte le budget par défaut pour arrêter de vous cacher des choses ?","o":["Montez-le","Laissez comme ça"]},"empty":"Rien pour l’instant. Je ne retiens quelque chose que si vous avez répondu à une question à voix haute — je ne déduis pas un objectif de votre cuisine pour agir en douce.","forget":"Oublier ceci","noted":"Noté"},
  "L": {"training:strength":["Vous faites de la muscu","Les plats sont classés par protéines d’abord, et je ne propose rien sous 30 g par portion un jour d’entraînement."],"training:endurance":["Vous courez ou pédalez","Je garde les glucides hauts au lieu de les couper, et j’ai arrêté de vous cacher les plats plus caloriques."],"calorieGoal:cut":["Vous êtes en déficit","Les calories passent en tête de chaque fiche et tout ce qui dépasse 600 par portion est signalé, pas masqué."],"calorieGoal:recomp":["Vous êtes en recomposition","Je classe par protéines par calorie plutôt que par calories seules, ce qui change beaucoup l’ordre."],"push:yes":["Vous voulez être poussé","Un plat par semaine se situe désormais un cran au-dessus de votre liste, et je vous dis lequel."],"budget:up":["Budget relevé","Vous dépassiez régulièrement le chiffre que vous aviez fixé, alors j’ai arrêté de filtrer à l’ancien."],"goal":["Votre objectif : {v}","Vous me l’avez dit en arrivant. Cela ne change que l’ordre d’affichage — tout est encore là, et vous pouvez supprimer cette ligne."],"cuisine":["Penchant {v}","Quand je n’ai rien de mieux, je remonte les plats {v}. Cela ne masque rien et s’arrête dès que vous l’oubliez."]},
  "x": {
   "plate": "Déposez une photo de l’assiette finie",
   "onLast": "par rapport à la semaine dernière",
   "nowW": "maintenant","insteadOf":"Au lieu de l’acheter tout fait","youKeep":"Vous gardez","everyTime":"à chaque fois que vous le cuisinez au lieu de le commander.","fourTimes":"Quatre fois par mois, cela fait","anOrderOf":"commande de ces ailes coûte","forEight":"pour huit. Ici vous en avez douze pour","andYouKeep":"et vous gardez","aPortion":"par portion.","microShow":"Fer, B12, fibres, sel …","microHide":"Masquer les détails","twoOthers":"Deux autres qui conviennent","browseSub":"Chaque plat chiffré pour {city}, à la portion, du magasin le moins cher près de chez vous au plus cher. Rien n’est filtré par votre budget : tout est là.","statsSub":"{n} plats enregistrés. Tout est calculé sur ce téléphone — rien n’a été envoyé nulle part, et vous pouvez tout supprimer.","kitchenSub":"Tout ceci est retiré automatiquement de votre prochaine liste de courses. On ne vous redemandera pas d’acheter du cumin.","passportSub":"Chaque pays que vous avez cuisiné, du moins cher à la portion au plus cher.","nudges":"Rappels","leftoverN":"Rappels de restes","leftoverS":"Un rappel le lendemain, seulement si ça se garde","shrinkN":"Apprentissage des portions","shrinkS":"Demander avant de réduire une recette souvent gaspillée","shopN":"Alertes de fermeture","shopS":"Me prévenir quand le magasin le moins cher va fermer","carbs":"glucides","fat":"lipides"},
  "s": {"shopSub":"magasins à pied de","sameBasket":"Le même panier, {n} prix.","openTill":"ouvert jusqu’à","hoursUnknown":"horaires inconnus"},
  "levels": ["","débutant, et c’est très bien","vous savez vous nourrir","un cuisinier sûr de lui","vous savez exactement ce que vous faites"],
  "r": {"reads":"Ça ressemble à","placeFew":"Placez-en quelques-unes et je vous dirai ce que j’en pense.","keepUnder":"Entendu — je garderai tout sous","minsNormal":"minutes un jour normal, et je ne proposerai les longues que le week-end.","underYour":"sous vos","overYour":"au-dessus de vos","andIncludes":"— et cela sans compter ce que vous avez déjà","switchCheapest":"Passez au magasin le moins cher ci-dessous et ça rentre.","noRush":"Pas pressé","underMins":"moins de"},
  "dishes": {
   "pad_thai": "Pad thaï",
   "mango_wings": "Ailes mangue-habanero",
   "stir_fry": "Poulet sauté",
   "veg_curry": "Curry de patate douce et pois chiches",
   "omelette": "Omelette fromage et herbes",
   "tuna_bake": "Gratin de pâtes au thon",
   "shakshuka": "Chakchouka",
   "chicken_tacos": "Tacos au poulet",
   "beef_pho": "Phở au bœuf",
   "jollof_rice": "Riz jollof",
   "lentil_bolognese": "Bolognaise de lentilles",
   "butter_chicken": "Poulet au beurre",
   "dal_tadka": "Dal tadka",
   "carbonara": "Spaghetti carbonara"
  },
  "cuisines": {
   "Thai": "Thaïlandaise",
   "American": "Américaine",
   "Chinese": "Chinoise",
   "Indian": "Indienne",
   "French": "Française",
   "British": "Britannique",
   "North African": "Nord-africaine",
   "Mexican": "Mexicaine",
   "Vietnamese": "Vietnamienne",
   "West African": "Ouest-africaine",
   "Italian": "Italienne"
  },
  "diff": {
   "1": "Très facile",
   "2": "Abordable",
   "3": "Un peu exigeant",
   "4": "Un vrai projet"
  },
  "skill": {
   "onion": "Émincer un oignon",
   "rice": "Réussir le riz",
   "sear": "Saisir la viande",
   "sauce": "Faire une sauce",
   "temp": "Utiliser un thermomètre",
   "fry": "Frire",
   "dough": "Pétrir une pâte",
   "fish": "Lever un filet de poisson"
  },
  "times": {
   "t10": "10 minutes",
   "t20": "20 minutes",
   "t30": "30 minutes",
   "t45": "45 minutes",
   "t60": "Une heure ou plus"
  },
  "sTiers": {
   "S": "Je le fais souvent",
   "A": "Une ou deux fois",
   "B": "Ça m’intimide",
   "C": "Jamais, et pas aujourd’hui"
  },
  "tTiers": {
   "S": "N’importe quel jour",
   "A": "La plupart des jours",
   "B": "Le week-end seulement",
   "C": "Hors de question"
  },
  "cravings": [
   "Pad thaï",
   "Ailes mangue-habanero",
   "Quelque chose aux œufs",
   "Curry",
   "Pâtes",
   "Wok"
  ],
  "shops": {
   "discount": "discount",
   "standard": "classique",
   "convenience": "de proximité",
   "premium": "haut de gamme",
   "wholesale": "gros"
  },
  "goals": {
   "lose": "Perdre du poids",
   "gain": "Prendre du poids",
   "muscle": "Prendre du muscle",
   "recomp": "Recomposition",
   "cheap": "Dépenser moins",
   "energy": "Plus d'énergie",
   "none": "Pas d’objectif, nourrissez-moi"
  },
  "w": {
   "goalTitle": "Vous cherchez quoi ?",
   "goalSub": "Facultatif, modifiable ou supprimable ensuite. Ça change ce que je vous propose, pas ce que vous avez le droit de cuisiner.",
   "goalSkip": "Pas d’objectif pour l’instant",
   "goalNote": "Quoi que vous choisissiez, rien n’est masqué. Je réordonne la liste et je vous dis pourquoi.",
   "evening": "Bonsoir",
   "browseAll": "Tout parcourir",
   "minutes": "min",
   "anHour": "An hour",
   "noRush": "No rush",
   "activeMins": "de vous",
   "ofThem": "sur",
   "toBuyFor": "à acheter, pour",
   "servings": "portions",
   "underBudget": "sous le budget",
   "overBudget": "au-dessus",
   "cheaperThan": "moins cher qu’à emporter",
   "youHave": "déjà chez vous",
   "toBuy": "à acheter",
   "already": "déjà dans vos placards",
   "optional": "facultatif",
   "stepOf": "sur",
   "doneNext": "Fait, suivant",
   "thatsIt": "Voilà — terminé",
   "nothingHob": "Rien sur le feu.",
   "prepOnly": "Rien sur le feu : c’est de la préparation.",
   "panHot": "Sur le feu : la poêle, chaude. Ne vous éloignez pas.",
   "justStarted": "Vous venez de commencer. Rien n’est sur le feu, impossible de s’être trompé.",
   "youHaveDone": "Vous avez fait",
   "ofSteps": "étapes. La dernière :",
   "clearedIt": "Rien resté. C’est exactement ça.",
   "someLeft": "Un cinquième resté.",
   "lotsLeft": "Environ la moitié restée.",
   "daysRunning": "jours d’affilée",
   "keepClean": "Assiette vide demain et ça fait une semaine.",
   "nothingBinned": "Rien jeté de la semaine.",
   "goingOff": "bientôt périmés",
   "cupboard": "valeur du placard",
   "keepsMonths": "Se garde des mois",
   "useIt": "Utiliser",
   "days": "JOURS",
   "scanReceipt": "Scanner un ticket pour en ajouter",
   "ofCountries": "sur 37 pays",
   "keptOut": "non dépensés en livraison",
   "cookedTimes": "cuisiné",
   "time": "fois",
   "timesWord": "fois",
   "skillIs": "Niveau",
   "timeIs": "Temps",
   "upTo": "jusqu’à",
   "minutesNormal": "minutes un jour normal",
   "cardsPlaced": "cartes de technique placées",
   "redoTier": "Refaire les listes",
   "leftToPlace": "à placer",
   "allPlaced": "Tout est placé",
   "thatsTheLot": "C’est tout.",
   "theCards": "Les cartes",
   "aWeek": "par semaine",
   "average": "moyenne",
   "aServingAvg": "la portion, en moyenne",
   "notSpent": "non dépensés en livraison",
   "leftOnPlate": "laissé dans l’assiette",
   "eightWeeks": "Huit semaines, la plus ancienne à gauche",
   "aCook": "par fois",
   "wholeMenu": "La carte entière",
   "dishesWord": "plats",
   "everything": "Tout",
   "under30": "Moins de 30 min",
   "cheapest": "Le moins cher",
   "highProtein": "Riche en protéines",
   "vegetarianCat": "Végétarien",
   "easiest": "Le plus facile",
   "kcal": "kcal",
   "protein": "protéines",
   "carbs": "glucides",
   "fat": "lipides",
   "patternMaybe": "Une habitude, peut-être",
   "forgetAll": "Tout oublier et reposer les questions",
   "stepsEnglish": "Les étapes sont en anglais",
   "stepsWhy": "Je n’ai pas traduit la méthode. Une consigne mal traduite sur le moment où retirer les crevettes du feu est pire qu’une consigne en anglais."
  }
 };

export const extra: Record<string, string> = {
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

    /* ── You ── */
    statsRowSub: 'Ce que j’ai remarqué, et le bouton pour l’oublier',
    langOffline: 'Cette langue demande un téléchargement et le réseau n’est pas là. Toujours en {n}.',

    /* ── Tonight, answered ── */
    /* The home screen opens on a dish rather than on a form. These are
       the words around it: what it is offering, how to take it, how to
       decline it, and how to say all that to a screen reader when the
       name changes in place. */
    tonightId: 'Ce soir, je cuisinerais',
    cookThis: 'Cuisiner ça',
    another: 'Montrez-m’en un autre',
    refine: 'Une autre idée en tête ?',
    nowShowing: 'À l’écran maintenant : {d}',

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
    someMeasured: "{n} des {of} lignes ici sont de vrais prix payés et signalés par quelqu’un — les points à côté disent lesquels. Le reste est modélisé : une bonne estimation, pas un ticket de caisse.",
    noneOfThat: "Pas de {q} dans le livre — pas encore. Le plus proche que j’aie est {d}.",
    lastOfThat: "C’est le dernier {q} que j’ai. Il y en a {n}, et vous les avez tous vus.",
    goWider: "Montrez-moi n’importe quoi",
    whyTitle: "Pourquoi celui-ci",
    whyBudget: "Dans les {b} que vous avez fixés",
    whyTime: "{t} minutes, sous les {m} demandées",
    whyDiet: "{d} — vérifié ingrédient par ingrédient",
    whyOwned: "{n} que vous avez déjà",
    whyLevel: "{l} — à peu près votre niveau",
    pctDearer: "{n}% plus cher",
    priceRange: "{a} – {b}",
    rangeShops: "de {a} à {b}",
    storeKinds: "types de magasin que vous trouverez à",
    storeEstimate: "Des estimations, pas les prix d’Aldi ou de Tesco — aucun supermarché ne les publie. Chaque chiffre est ce que ce type de magasin facture habituellement près de chez vous.",
    legalKicker: "Les petits caractères",
    privacyRow: "Confidentialité",
    privacyRowSub: "Ce qui est gardé, où, et ce qui quitte cet appareil",
    termsRow: "Conditions",
    termsRowSub: "Ce que cette app promet, et ce qu’elle ne promet pas",
    legalUpdated: "Dernière mise à jour : 5 août 2026",
    ownCopy: "© 2026 Pantry. Tous droits réservés.",

    slideH1: "Le dîner, décidé",
    slideS1: "Dites-moi ce qui vous tente et ce que vous avez en poche. Je décide pour vous.",
    slideH2: "Une chose à la fois",
    slideS2: "Pas de mur de choix. Un plat, une raison d'être là, et de quoi changer d'avis.",
    slideH3: "Au prix de chez vous",
    slideS3: "Chaque plat porte une fourchette de prix des magasins près de chez vous, dans votre monnaie — pas un chiffre londonien au symbole changé.",
    slideH4: "Gratuit. Tout",
    slideS4: "Toutes les recettes, tous les prix, six langues. Sans compte, sans carte, rien gardé pour plus tard.",
    slideH5: "C'est parti",
    slideS5: "Quatre questions rapides pour savoir quoi vous proposer. Passez-en autant que vous voulez, je fonctionnerai quand même.",
    slideGo: "Allons-y",
    priceHome: "À partir d'ici, chaque prix est en {cur}, dans des magasins qui existent vraiment près de chez vous. Pas le bon endroit ?",
    ownMark: "Pantry™ et le personnage sont des marques déposées. Les recettes, les textes, les illustrations et le code appartiennent aux auteurs de Pantry. Les données, les photographies et les polices appartiennent aux sources citées ci-dessus et conservent leurs propres licences.",
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
    termLicenceB: "Les recettes, les textes, les illustrations et le code de Pantry appartiennent aux auteurs de Pantry. Cuisinez-les, imprimez-en une pour le mur de la cuisine, nourrissez des gens — y compris des gens qui vous paient pour le dîner.\nNe republiez pas la collection comme si elle était la vôtre, et n’en hébergez pas de copie. Pantry n’est pas un logiciel libre. Votre navigateur reçoit l’application entière parce que c’est ainsi que fonctionne le web, et pouvoir la lire n’est pas la permission de la prendre. Si vous voulez faire ce que ce paragraphe interdit, demandez ; l’adresse est en bas.\n« Pantry » et le personnage — le bocal crème à la cuillère en bois — sont des marques déposées. Utiliser l’application ne donne le droit d’utiliser ni l’un ni l’autre.\nLes données de cartes, de magasins et de prix viennent d’OpenStreetMap et d’Open Food Facts sous l’Open Database Licence, et les taux de change de la Banque centrale européenne. Réglages nomme chaque source et sa licence.\nUn prix que vous signalez reste le vôtre à supprimer, et vous autorisez Pantry à le publier au sein d’un agrégat — une médiane sans nom, la seule forme que voient les autres.",
    termChangeH: "Si cela change",
    termChangeB: "Ces conditions et la politique de confidentialité portent une date en haut. Si l’une change de façon significative, la date change avec elle et l’app le signale.\nContinuer à utiliser Pantry après cela vaut acceptation de la nouvelle version. Les questions vont à l’adresse ci-dessous.",
};
