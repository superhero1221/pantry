/**
 * Spanish. Nothing imports this eagerly — data/lang-pack.ts fetches it once, on
 * the boot of somebody reading Spanish. Everything in it is English-backed by
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
  navTonight: 'Esta noche', navKitchen: 'Cocina', navStats: 'Datos', navPassport: 'Pasaporte', navYou: 'Tú',
  welcomeTag: 'Dime qué te apetece y qué llevas en el bolsillo. Yo decido por ti.',
  welcome1: 'Una decisión en pantalla cada vez',
  welcome2: 'Con los precios de donde estás de verdad',
  welcome3: 'Se acuerda de lo que ya tienes',
  welcomeGo: 'Empezar', welcomeSkip: 'Sáltate todo esto',
  tierSkill: '¿Qué sabes hacer ya?',
  tierSkillSub: 'Arrastra cada tarjeta a una fila, o tócala y luego toca la fila. No hay respuesta incorrecta. Solo evita que te proponga cosas que te van a fastidiar.',
  tierTime: '¿Cuánto tiempo tienes de verdad?',
  tierTimeSub: 'Otra vez lo mismo. Sé sincero, no optimista.',
  tierNext: 'Siguiente', tierSkip: 'Saltar', tierLeft: 'por colocar', tierAllPlaced: 'Todo colocado',
  dietTitle: '¿Hay algo que no comas?',
  dietSub: 'Toca todo lo que corresponda. Puedes cambiarlo después.',
  dietNone: 'Sin restricciones',
  locFinding: 'Buscándote…', locFound: 'Te encontré',
  locThatsMe: 'Soy yo', locNotMe: 'Estoy en otro sitio',
  locUse: 'Usar mi ubicación', locManual: 'Elegir un país',
  locWhy: 'Los precios y las tiendas cambian calle por calle. Nada sale de este dispositivo.',
  locDenied: 'No pasa nada: elige un sitio y trabajo con eso.',
  homeWhat: '¿Qué te apetece?',
  homePlaceholder: 'pad thai, algo caliente, alitas…',
  homeMoney: 'Dinero', homeTime: 'Tiempo', homeFor: 'Para',
  homeGo: 'Enséñame la cena', homeAny: 'Me da igual, elige tú',
  homeBrowse: 'Ver todo', homeOther: 'Otro',
  homeServes1: 'solo yo', homeServes2: 'dos', homeServes4: 'cuatro',
  resServing: 'por ración', resToBuy: 'de compra, para',
  resInstead: 'En vez de comprarlo hecho', resKeep: 'Te ahorras',
  resCook: 'Cocinar esto', resOthers: 'Otras dos', resMicro: 'El resto de la etiqueta',
  resHide: 'Ocultar', resUnder: 'por debajo', resOver: 'por encima',
  resHard: 'Dificultad', resMins: 'min',
  shopTitle: 'Dónde comprarlo', shopList: 'Tu lista',
  shopTotal: 'Total a comprar', shopGo: 'Empezar a cocinar',
  shopHave: 'ya tienes', shopBuy: 'a comprar',
  shopCheapest: 'más barato', shopLive: 'en vivo', shopModelled: 'estimado',
  shopWhere: 'De dónde salen estos números',
  cookOf: 'de', cookDone: 'Hecho', cookNext: 'Siguiente paso',
  cookLost: 'Me he perdido', cookGot: 'Vale',
  cookWhere: 'Dónde vas', cookHob: 'Qué hay al fuego',
  cookTimer: 'Empezar temporizador', cookStop: 'Parar',
  afterTitle: 'Lo has cocinado.',
  afterSub: 'Una última cosa y te dejo en paz.',
  afterPhoto: 'Suelta una foto del plato terminado',
  afterOptional: 'Opcional. Solo sirve para aprender tus raciones.',
  afterSkip: 'Saltar la foto',
  afterTell: 'O dímelo sin más', afterNothing: 'No registrar esta',
  afterCleared: 'Me lo comí todo', afterBit: 'Sobró un poco', afterLoads: 'Sobró mucho',
  afterNotRight: 'no es eso', afterDays: 'días seguidos',
  kitchenTitle: 'Tu cocina', kitchenFirst: 'Gasta esto primero',
  kitchenStock: 'Despensa', kitchenDays: 'días',
  statsTitle: 'Lo que sé', statsSpend: 'Lo que gastas',
  statsCooked: 'Lo que cocinas', statsHard: 'Cuánto te complicas',
  statsLearned: 'Lo que he deducido de ti',
  statsForget: 'Olvidar esto', statsWeek: 'por semana', statsAvg: 'media',
  passTitle: 'Pasaporte', passServing: 'por ración', passCooked: 'cocinado',
  setTitle: 'Tú', setDiet: 'Lo que no comes', setTier: 'Tus listas',
  setRedo: 'Rehacer', setWhere: 'Dónde estás', setLang: 'Idioma',
  setSources: 'De dónde vienen los datos', setReset: 'Empezar de cero',
  setKey: 'Clave de precios', setKeyHint: 'Opcional. Desbloquea precios de cadenas concretas.',
  yes: 'Sí', no: 'No', notNow: 'Ahora no', neverAsk: 'No preguntes más',
  back: 'Atrás', close: 'Cerrar', save: 'Guardar'
};

export const pack: Record<string, unknown> = {
  "lo": {"mango_wings":"al horno, no frito","stir_fry":"con arroz","omelette":"sobre tostada","veg_curry":"con coco","tuna_bake":"cuatro latas y una bolsa"},
  "us": ["convierte tus coordenadas en un nombre de lugar","las tiendas reales a tu alrededor, con sus horarios","precios reales que la gente ha fotografiado en el lineal","pesos de producto y nutrición","la referencia medida en 62 países"],
  "plans": ["Lo dejaré en cinco ingredientes y nada de cuchillo que no hayas usado ya.","Te estiraré un poco, nunca más de una cosa nueva por comida.","Aquí nada te aburrirá y nada te pillará por sorpresa.","No hay nada descartado."],
  "pc": {"IN":"India","GB":"Reino Unido","IT":"Italia","FR":"Francia","CN":"China","NG":"Nigeria","TH":"Tailandia"},
  "am": {"a1":"quedan 180 g de una bolsa de 300 g","a2":"casi todo un paquete de 30 g","a3":"4 de 8","a4":"180 g, abierto","a5":"bloque de 270 g","cooked":"cocinado","time":"vez","times":"veces"},
  "h": {"daysWord":"días","forServings":"para {n} raciones","otherChip":"Otro","findMe":"Búscame {q}","inKitchen":"{n} cosas que ya tienes en la cocina","passportNudge":"84 países de los que nunca has cocinado. El más barato que te falta es Etiopía: el misir wot sale a {a} la ración.","liveShops":"{n} tiendas a pie, directas de OpenStreetMap","week":["L","M","X","J","V","S","D"]},
  "v": {
   "recapDone": "Llevas {a} de {b} pasos. Lo último que hiciste: {t}.","plan1":"Lo dejo en cinco ingredientes y nada de cuchillo que no hayas hecho ya.","plan2":"Te estiro un poco, nunca más de una cosa nueva por comida.","plan3":"Aquí nada te va a aburrir ni te va a pillar por sorpresa.","plan4":"No hay nada descartado.","tierSkillSub":"Arrastra cada tarjeta a una fila, o toca una y luego la fila. No hay respuesta incorrecta. Esto solo evita que te sugiera cosas que te van a fastidiar.","tierTimeSub":"Lo mismo otra vez. Sé honesto, no ambicioso: prefiero cocinarte algo en veinte minutos que verte no cocinar nada en cincuenta.","readsLike":"Se lee como: {w}. {p}","placeFew":"Coloca algunas y te digo qué me parece.","timeRead":"Bien: mantendré todo por debajo de {m} minutos entre semana, y solo te ofreceré las largas el fin de semana.","dietSome":"Anotado. Nada que incumpla alguna de estas se te ofrece. Bajan al final de la lista en vez de desaparecer, así que sigues viendo lo que estás descartando.","dietNone":"Nada seleccionado, así que no se filtra nada. Puedes volver aquí la primera vez que te sugiera algo que jamás comerías.","wasteNone":"Plato limpio, nada a la basura. Esa ración está bien: la dejo exactamente donde está.","wasteSome":"La foto marca un 20% aún en el plato. No es un desastre, pero es dinero que cocinaste y no comiste.","wasteLots":"Parece que queda la mitad. O la ración es muy grande o el plato no era lo que querías: las dos cosas conviene saberlas.","hob0":"Acabas de empezar. Todavía no hay nada al fuego, no has podido equivocarte.","hobNone":"Nada al fuego.","hobPrep":"Nada al fuego todavía: esto es todo preparación.","hobHot":"Al fuego ahora mismo: la sartén, caliente. No te alejes.","nudge":"Los brotes y el cilantro hay que gastarlos en 3 días","remind":"Avísame mañana a las 12:30","remindPing":"Mañana 12:30 — {d} sigue bueno. Recaliéntalo en vez de comprar comida.","shrinkBig":"¿Cocino un tercio menos la próxima vez?","shrinkSmall":"¿Cocino un 15% menos la próxima vez?","shrinkBody":"Mismo plato, sartén más pequeña. Ahorra unos {a} por vez y evita que el trozo que nunca comes acabe en la basura. Puedes deshacerlo cuando quieras.","shrinkPing":"Ración ajustada. El próximo {d} está dimensionado para lo que comes de verdad.","shrinkYesText":"Hecho. La próxima vez está dimensionado para lo que comes de verdad, y la lista de la compra encoge con ello.","shrinkNoText":"Me parece bien: las sobras a propósito no son desperdicio. Dejo la ración como está y no vuelvo a preguntar.","streakClean":"Nada a la basura en toda la semana. Son unos {a} ahorrados.","streakKeep":"Mantén el plato limpio mañana y ya es una semana.","receiptPing":"Escanear tickets es solo un boceto por ahora: lo real es el motor de precios.","keyOn":"Clave guardada. Precios de cadenas concretas activados.","keyOff":"Clave borrada.","looking":"Buscando tiendas cerca de ti…"},
  "u": {"setMe":"Prepárame — 4 pantallas rápidas","thatsLot":"Eso es todo.","dietSub":"Marca lo que corresponda, o nada. Es un filtro, no un juicio, y puedes cambiarlo cuando quieras en Ajustes.","lookTitle":"O déjame mirar de verdad.","noBother":"Sin problema: elige una ciudad abajo y todo se recalcula.","coverage":"8 países tienen precios propios. En 4 los números vienen de encuestas reales de mercado; en el resto se modelan a partir de precios de envase y se envejecen con la inflación alimentaria. Siempre te diré cuál estás viendo.","thatsMe":"Ese soy yo — a comer","setBtn":"Fijar","barsNote":"Las barras son el porcentaje de la ingesta diaria de referencia de un adulto, por ración.","legMeasured":"Medido en mercados de este país","legEurope":"Medido en Europa, escalado hasta aquí","legModelled":"Modelado desde un precio de envase, ajustado por inflación","timerLabel":"Temporizador","stopBtn":"Parar","whereYouAre":"Dónde estás","noPhoto":"Sin foto. No pasa nada — toca si cambias de idea.","notRight":"no es así","shrinkYes":"Sí, redúcela","shrinkNo":"No, me gustan las sobras","doneThanks":"Listo — gracias","redoTier":"Rehacer la lista","changeBtn":"Cambiar","resTier":"para tu lista","gotIt":"Entendido, cerrar","timerStart":"Poner {m} minutos","langNote":"La interfaz cambia al instante, también de derecha a izquierda. Los métodos de las recetas siguen en inglés por ahora: prefiero dejarlos sin traducir que traducir a máquina un paso que te dice cuándo sacar las gambas del fuego.","apiNote":"Ningún supermercado del Reino Unido, EE. UU. o la UE publica una API de precios: ni Tesco, ni Sainsbury’s, ni Kroger. Sin clave uso Open Prices, que es real pero colaborativo e irregular. Con clave, los precios de estante de cadenas concretas sustituyen a la estimación y cada línea dice cuál es.","picNote":"Las fotos de los platos son la imagen principal del artículo de Wikipedia de cada plato, casi todas CC BY-SA.","nowTag":"ahora"},
  "cn": {"GB":"el Reino Unido","US":"Estados Unidos","IN":"India","NG":"Nigeria","PK":"Pakistán","DE":"Alemania","AE":"los EAU","TR":"Turquía"},
  "sl": {"saved":"Recordar tu despensa le quitó {a} a esta compra. En un mes de cocinar son unos {b} que no gastaste dos veces.","measured":"La mayor parte de esta cesta está medida: hay encuestadores que visitan mercados en {c} cada mes. Es una cobertura inusualmente buena.","modelled":"Te lo digo claro: en {c} la mayor parte de esta cesta está modelada, no medida. Ninguna cadena publica precios a esta escala. Tómalo como una buena estimación, no como un ticket.","listEnglish":"Los nombres siguen al envase","listWhy":"Los estantes están etiquetados en el idioma local. Te muestro el nombre que vas a leer de verdad en el paquete."},
  "q": {"training":{"q":"Has ido a por proteína {k} de {n} veces.","why":"Si hay un motivo puedo apuntar bien en vez de adivinar. ¿Entrenas?","o":["Levanto pesas","Corro o voy en bici","No, simplemente me gusta"]},"calorieGoal":{"q":"{k} de tus últimas {n} comidas bajaron de 500 calorías.","why":"Eso es un patrón, no una casualidad. ¿A qué responde?","o":["Perder peso","Recomposición","Salió así, sin más"]},"cuisine":{"q":"{k} de tus últimas {n} veces cocinaste {c}.","why":"¿Tiro por ahí cuando no tengo nada mejor, o sigo variando?","o":["Tira por {c}","Mantén la variedad"]},"push":{"q":"Nada de lo que has cocinado en un mes pasó de dificultad dos.","why":"Puedo seguir fácil, o colar un plato más exigente a la semana.","o":["Exígeme un poco","Déjalo fácil"]},"budget":{"q":"Promedias {a} por ración frente a una cesta de {b}.","why":"Va más justo de lo que parece. ¿Subo el presupuesto por defecto para dejar de ocultarte cosas?","o":["Súbelo","Déjalo"]},"empty":"Nada todavía. Solo guardo algo cuando lo has respondido en voz alta: no deduzco un objetivo de lo que cocinas y actúo por mi cuenta.","forget":"Olvida esto","noted":"Anotado"},
  "L": {"training:strength":["Levantas pesas","Las comidas se ordenan por proteína primero, y en día de entreno no te propongo nada por debajo de 30 g por ración."],"training:endurance":["Corres o vas en bici","Mantengo los hidratos arriba en lugar de recortarlos, y dejé de esconderte los platos más calóricos."],"calorieGoal:cut":["Estás en déficit","Las calorías van al frente de cada ficha y todo lo que pase de 600 por ración lleva un aviso, no se oculta."],"calorieGoal:recomp":["Estás recomponiendo","Ordeno por proteína por caloría en vez de por calorías solas, y eso cambia bastante el orden."],"push:yes":["Quieres que te exija","Un plato a la semana está ahora un punto por encima de tu lista, y te digo cuál es."],"budget:up":["Presupuesto subido","Gastabas de forma constante por encima del número que pusiste, así que dejé de filtrar con el antiguo."],"goal":["Tu objetivo: {v}","Me lo dijiste al entrar. Solo cambia el orden de lo que te enseño primero: todo sigue ahí, y puedes borrar esta línea."],"cuisine":["Tirando a {v}","Cuando no tengo nada mejor, subo los platos {v} en la lista. No oculta nada y se apaga en cuanto lo olvides."]},
  "x": {
   "plate": "Suelta una foto del plato terminado",
   "onLast": "frente a la semana pasada",
   "nowW": "ahora","insteadOf":"En vez de comprarlo hecho","youKeep":"Te ahorras","everyTime":"cada vez que lo cocinas en lugar de pedirlo.","fourTimes":"Cuatro veces al mes son","anOrderOf":"pedido de estas cuesta","forEight":"por ocho. Aquí tienes doce por","andYouKeep":"y te ahorras","aPortion":"por ración.","microShow":"Hierro, B12, fibra, sal …","microHide":"Ocultar la letra pequeña","twoOthers":"Otras dos que encajan","browseSub":"Cada plato con el precio de {city}, por ración, de la tienda más barata que tienes cerca a la más cara. Aquí no se filtra nada por presupuesto: está todo.","statsSub":"{n} veces cocinado, registradas. Todo se calcula en este teléfono: nada se ha enviado a ningún sitio y puedes borrar lo que quieras.","kitchenSub":"Todo esto se descuenta solo de tu próxima lista de la compra. No te volveré a pedir que compres comino.","passportSub":"Cada país del que has cocinado, del más barato por ración al más caro.","nudges":"Avisos","leftoverN":"Avisos de sobras","leftoverS":"Un recordatorio al día siguiente, solo si aguanta","shrinkN":"Aprender raciones","shrinkS":"Preguntar antes de reducir una receta que sueles desperdiciar","shopN":"Avisos de cierre","shopS":"Avisarme cuando la tienda más barata esté a punto de cerrar","carbs":"hidratos","fat":"grasa"},
  "s": {"shopSub":"tiendas a pie de","sameBasket":"La misma cesta, tres precios.","openTill":"abierto hasta las","hoursUnknown":"horario desconocido"},
  "levels": ["","empezando, y no pasa nada","te apañas solo","cocinero de casa con soltura","sabes perfectamente lo que haces"],
  "r": {"reads":"Se lee como","placeFew":"Coloca algunas y te digo qué me parece.","keepUnder":"Bien: mantendré todo por debajo de","minsNormal":"minutos en un día normal, y solo te ofreceré las largas el fin de semana.","underYour":"por debajo de tus","overYour":"por encima de tus","andIncludes":"— y eso sin contar lo que ya tienes","switchCheapest":"Cambia a la tienda más barata de abajo y entra.","noRush":"Sin prisa","underMins":"menos de"},
  "dishes": {
   "pad_thai": "Pad Thai",
   "mango_wings": "Alitas de mango y habanero",
   "stir_fry": "Salteado de pollo",
   "veg_curry": "Curry de boniato y garbanzos",
   "omelette": "Tortilla de queso y hierbas",
   "tuna_bake": "Pasta al horno con atún",
   "shakshuka": "Shakshuka",
   "chicken_tacos": "Tacos de pollo",
   "beef_pho": "Pho de ternera",
   "jollof_rice": "Arroz jollof",
   "lentil_bolognese": "Boloñesa de lentejas",
   "butter_chicken": "Pollo a la mantequilla",
   "dal_tadka": "Dal tadka",
   "carbonara": "Espaguetis a la carbonara"
  },
  "cuisines": {
   "Thai": "Tailandesa",
   "American": "Estadounidense",
   "Chinese": "China",
   "Indian": "India",
   "French": "Francesa",
   "British": "Británica",
   "North African": "Norteafricana",
   "Mexican": "Mexicana",
   "Vietnamese": "Vietnamita",
   "West African": "Africana occidental",
   "Italian": "Italiana"
  },
  "diff": {
   "1": "Muy fácil",
   "2": "Asequible",
   "3": "Exige algo",
   "4": "Un proyecto"
  },
  "skill": {
   "onion": "Picar una cebolla",
   "rice": "Cocer arroz bien",
   "sear": "Sellar carne fuerte",
   "sauce": "Hacer una salsa",
   "temp": "Usar termómetro",
   "fry": "Freír en abundante aceite",
   "dough": "Amasar",
   "fish": "Filetear un pescado"
  },
  "times": {
   "t10": "10 minutos",
   "t20": "20 minutos",
   "t30": "30 minutos",
   "t45": "45 minutos",
   "t60": "Una hora o más"
  },
  "sTiers": {
   "S": "Lo hago siempre",
   "A": "Lo he hecho un par de veces",
   "B": "Me da respeto",
   "C": "Nunca, y hoy tampoco"
  },
  "tTiers": {
   "S": "Cualquier día",
   "A": "Casi todos los días",
   "B": "Solo fines de semana",
   "C": "Ni de broma"
  },
  "cravings": [
   "Pad thai",
   "Alitas de mango y habanero",
   "Algo con huevo",
   "Curry",
   "Pasta",
   "Salteado"
  ],
  "shops": {
   "discount": "descuento",
   "standard": "normal",
   "convenience": "de barrio",
   "premium": "gourmet",
   "wholesale": "mayorista"
  },
  "goals": {
   "lose": "Perder peso",
   "gain": "Ganar peso",
   "muscle": "Ganar músculo",
   "recomp": "Recomposición",
   "cheap": "Gastar menos",
   "energy": "Más energía",
   "none": "Sin objetivo, solo dame de comer"
  },
  "w": {
   "goalTitle": "¿Qué buscas?",
   "goalSub": "Opcional, y puedes cambiarlo o borrarlo después. Cambia lo que te propongo, no lo que te dejo cocinar.",
   "goalSkip": "Sin objetivo por ahora",
   "goalNote": "Elijas lo que elijas, no se oculta nada. Reordeno la lista y te digo por qué.",
   "evening": "Buenas noches",
   "browseAll": "Ver todo",
   "minutes": "min",
   "anHour": "An hour",
   "noRush": "No rush",
   "activeMins": "los pones tú",
   "ofThem": "de",
   "toBuyFor": "de compra, para",
   "servings": "raciones",
   "underBudget": "por debajo del presupuesto",
   "overBudget": "por encima",
   "cheaperThan": "más barato que pedirlo",
   "youHave": "ya tienes",
   "toBuy": "a comprar",
   "already": "ya en tu cocina",
   "optional": "opcional",
   "stepOf": "de",
   "doneNext": "Hecho, siguiente",
   "thatsIt": "Ya está — terminado",
   "nothingHob": "Nada al fuego.",
   "prepOnly": "Nada al fuego todavía: esto es preparación.",
   "panHot": "Ahora mismo al fuego: la sartén, caliente. No te alejes.",
   "justStarted": "Acabas de empezar. Nada está al fuego, no has podido equivocarte.",
   "youHaveDone": "Has hecho",
   "ofSteps": "pasos. Lo último que hiciste:",
   "clearedIt": "No sobró nada. Perfecto.",
   "someLeft": "Sobró como un quinto.",
   "lotsLeft": "Sobró casi la mitad.",
   "daysRunning": "días seguidos",
   "keepClean": "Deja el plato limpio mañana y es una semana.",
   "nothingBinned": "Nada a la basura en toda la semana.",
   "goingOff": "se pasan pronto",
   "cupboard": "valor en despensa",
   "keepsMonths": "Aguanta meses",
   "useIt": "Úsalo",
   "days": "DÍAS",
   "scanReceipt": "Escanear un ticket para añadir más",
   "ofCountries": "de 37 países",
   "keptOut": "que no fue a comida a domicilio",
   "cookedTimes": "cocinado",
   "time": "vez",
   "timesWord": "veces",
   "skillIs": "Nivel",
   "timeIs": "Tiempo",
   "upTo": "hasta",
   "minutesNormal": "minutos en un día normal",
   "cardsPlaced": "tarjetas de técnica colocadas",
   "redoTier": "Rehacer las listas",
   "leftToPlace": "por colocar",
   "allPlaced": "Todo colocado",
   "thatsTheLot": "Ya está todo.",
   "theCards": "Las tarjetas",
   "aWeek": "por semana",
   "average": "media",
   "aServingAvg": "por ración, de media",
   "notSpent": "no gastado en comida a domicilio",
   "leftOnPlate": "dejado en el plato",
   "eightWeeks": "Ocho semanas, la más antigua a la izquierda",
   "aCook": "por vez",
   "wholeMenu": "La carta entera",
   "dishesWord": "platos",
   "everything": "Todo",
   "under30": "Menos de 30 min",
   "cheapest": "Más barato",
   "highProtein": "Mucha proteína",
   "vegetarianCat": "Vegetariano",
   "easiest": "Más fácil",
   "kcal": "kcal",
   "protein": "proteína",
   "carbs": "hidratos",
   "fat": "grasa",
   "patternMaybe": "Quizá un patrón",
   "forgetAll": "Olvidarlo todo y volver a empezar",
   "stepsEnglish": "Los pasos están en inglés",
   "stepsWhy": "No he traducido el método. Una instrucción mal traducida sobre cuándo sacar las gambas del fuego es peor que una en inglés."
  }
 };

export const extra: Record<string, string> = {
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

    /* ── You ── */
    statsRowSub: 'Los patrones que he detectado, y el interruptor para olvidar cualquiera',
    langOffline: 'Ese idioma necesita una descarga y no hay señal. Sigues en {n}.',

    /* ── Tonight, answered ── */
    /* The home screen opens on a dish rather than on a form. These are
       the words around it: what it is offering, how to take it, how to
       decline it, and how to say all that to a screen reader when the
       name changes in place. */
    tonightId: 'Esta noche cocinaría',
    cookThis: 'Cocinar esto',
    another: 'Enséñame otra',
    refine: '¿Tienes otra cosa en mente?',
    nowShowing: 'Ahora se muestra: {d}',

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
    whyTitle: "Por qué esta",
    whyBudget: "Dentro de los {b} que fijaste",
    whyTime: "{t} minutos, por debajo de los {m} que pediste",
    whyDiet: "{d} — comprobado ingrediente por ingrediente",
    whyOwned: "{n} ya lo tienes en casa",
    whyLevel: "{l} — más o menos donde estás",
    pctDearer: "{n}% más caro",
    priceRange: "{a} – {b}",
    rangeShops: "de {a} a {b}",
    storeKinds: "tipos de tienda que encontrarás en",
    storeEstimate: "Estimaciones, no los precios propios de Aldi o Tesco — ningún supermercado los publica. Cada cifra es lo que suele cobrar ese tipo de tienda cerca de ti.",
    legalKicker: "La letra pequeña",
    privacyRow: "Privacidad",
    privacyRowSub: "Qué se guarda, dónde, y qué sale de este dispositivo",
    termsRow: "Condiciones",
    termsRowSub: "Lo que esta app promete, y lo que no",
    legalUpdated: "Última actualización: 5 de agosto de 2026",
    ownCopy: "© 2026 Pantry. Todos los derechos reservados.",
    ownMark: "Pantry™ y el personaje son marcas registradas. Las recetas, los textos, las ilustraciones y el código pertenecen a los autores de Pantry. Los datos, las fotografías y las tipografías pertenecen a las fuentes citadas arriba y conservan sus propias licencias.",
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
    termLicenceB: "Las recetas, los textos, las ilustraciones y el código de Pantry pertenecen a los autores de Pantry. Cocina con ellas, imprime una para la pared de la cocina, da de comer a la gente — incluida la gente que te paga por la cena.\nNo republiques la colección como si fuera tuya, y no alojes una copia. Pantry no es software libre. Tu navegador recibe la aplicación entera porque así funciona la web, y poder leerla no es permiso para llevártela. Si quieres hacer algo que este párrafo prohíbe, pregunta; la dirección está abajo.\n«Pantry» y el personaje — el bote color crema con la cuchara de madera — son marcas registradas. Usar la aplicación no da derecho a usar ninguno de los dos.\nLos datos de mapas, tiendas y precios vienen de OpenStreetMap y Open Food Facts bajo la Open Database Licence, y los tipos de cambio del Banco Central Europeo. Ajustes nombra cada fuente y su licencia.\nUn precio que informas sigue siendo tuyo para borrarlo, y permites a Pantry publicarlo como parte de un agregado — una mediana sin nombre, que es la única forma en que alguien más lo ve.",
    termChangeH: "Si esto cambia",
    termChangeB: "Estas condiciones y la política de privacidad llevan una fecha arriba. Si alguna cambia de forma relevante, la fecha cambia con ella y la app lo dice.\nSeguir usando Pantry después de eso es aceptar la nueva versión. Las dudas van a la dirección de abajo.",
};
