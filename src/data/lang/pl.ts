/**
 * Polish. Nothing imports this eagerly — data/lang-pack.ts fetches it once, on
 * the boot of somebody reading Polish. Everything in it is English-backed by
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
  navTonight: 'Dziś', navKitchen: 'Kuchnia', navStats: 'Dane', navPassport: 'Paszport', navYou: 'Ty',
  welcomeTag: 'Powiedz, na co masz ochotę i ile masz w kieszeni. Ja zdecyduję.',
  welcome1: 'Jedna decyzja na ekranie naraz',
  welcome2: 'Ceny z miejsca, w którym naprawdę jesteś',
  welcome3: 'Pamięta, co już masz w domu',
  welcomeGo: 'Zaczynamy', welcomeSkip: 'Pomiń to wszystko',
  tierSkill: 'Co już potrafisz?',
  tierSkillSub: 'Przeciągnij kartę do wiersza albo dotknij karty, a potem wiersza. Nie ma złych odpowiedzi. Chodzi tylko o to, żebym nie proponował rzeczy, które cię zirytują.',
  tierTime: 'Ile masz naprawdę czasu?',
  tierTimeSub: 'To samo. Szczerze, nie ambitnie.',
  tierNext: 'Dalej', tierSkip: 'Pomiń', tierLeft: 'do rozłożenia', tierAllPlaced: 'Wszystko rozłożone',
  dietTitle: 'Czegoś nie jesz?',
  dietSub: 'Zaznacz wszystko, co pasuje. Możesz to zmienić później.',
  dietNone: 'Brak ograniczeń',
  locFinding: 'Szukam cię…', locFound: 'Znalazłem',
  locThatsMe: 'To ja', locNotMe: 'Jestem gdzie indziej',
  locUse: 'Użyj mojej lokalizacji', locManual: 'Wybierz kraj',
  locWhy: 'Ceny i sklepy zmieniają się z ulicy na ulicę. Nic nie opuszcza tego urządzenia.',
  locDenied: 'Nic nie szkodzi — wybierz miejsce, a policzę od tego.',
  homeWhat: 'Na co masz ochotę?',
  homePlaceholder: 'pad thai, coś ciepłego, skrzydełka…',
  homeMoney: 'Budżet', homeTime: 'Czas', homeFor: 'Dla',
  homeGo: 'Pokaż kolację', homeAny: 'Wszystko jedno — wybierz',
  homeBrowse: 'Przejrzyj wszystko', homeOther: 'Inne',
  homeServes1: 'tylko ja', homeServes2: 'dwie osoby', homeServes4: 'cztery',
  resServing: 'porcja', resToBuy: 'do kupienia, na',
  resInstead: 'Zamiast kupować gotowe', resKeep: 'Zostaje ci',
  resCook: 'Gotuję to', resOthers: 'Dwie inne', resMicro: 'Reszta etykiety',
  resHide: 'Ukryj', resUnder: 'poniżej budżetu', resOver: 'powyżej',
  resHard: 'Trudność', resMins: 'min',
  shopTitle: 'Gdzie to kupić', shopList: 'Twoja lista',
  shopTotal: 'Razem do kupienia', shopGo: 'Zaczynam gotować',
  shopHave: 'już masz', shopBuy: 'do kupienia',
  shopCheapest: 'najtaniej', shopLive: 'na żywo', shopModelled: 'szacunek',
  shopWhere: 'Skąd te liczby',
  cookOf: 'z', cookDone: 'Gotowe', cookNext: 'Następny krok',
  cookLost: 'Zgubiłem się', cookGot: 'Jasne',
  cookWhere: 'Gdzie jesteś', cookHob: 'Co jest na palniku',
  cookTimer: 'Włącz minutnik', cookStop: 'Stop',
  afterTitle: 'Ugotowałeś to.',
  afterSub: 'Jeszcze jedno i zostawiam cię w spokoju.',
  afterPhoto: 'Wrzuć zdjęcie gotowego talerza',
  afterOptional: 'Opcjonalnie. Służy tylko do nauki twoich porcji.',
  afterSkip: 'Pomiń zdjęcie',
  afterTell: 'Albo po prostu powiedz', afterNothing: 'Nie zapisuj tego',
  afterCleared: 'Zjadłem wszystko', afterBit: 'Trochę zostało', afterLoads: 'Dużo zostało',
  afterNotRight: 'nie tak', afterDays: 'dni z rzędu',
  kitchenTitle: 'Twoja kuchnia', kitchenFirst: 'Zużyj to najpierw',
  kitchenStock: 'Szafka', kitchenDays: 'dni',
  statsTitle: 'Co o tobie wiem', statsSpend: 'Ile wydajesz',
  statsCooked: 'Co gotujesz', statsHard: 'Jak wysoko mierzysz',
  statsLearned: 'Co z ciebie wywnioskowałem',
  statsForget: 'Zapomnij to', statsWeek: 'tygodniowo', statsAvg: 'średnio',
  passTitle: 'Paszport', passServing: 'porcja', passCooked: 'ugotowane',
  setTitle: 'Ty', setDiet: 'Czego nie jesz', setTier: 'Twoje listy',
  setRedo: 'Od nowa', setWhere: 'Gdzie jesteś', setLang: 'Język',
  setSources: 'Skąd pochodzą dane', setReset: 'Zacznij od zera',
  setKey: 'Klucz do cen', setKeyHint: 'Opcjonalnie. Odblokowuje ceny konkretnych sieci.',
  yes: 'Tak', no: 'Nie', notNow: 'Nie teraz', neverAsk: 'Nie pytaj więcej',
  back: 'Wstecz', close: 'Zamknij', save: 'Zapisz'
};

export const pack: Record<string, unknown> = {
  "lo": {"mango_wings":"pieczone, nie smażone","stir_fry":"z ryżem","omelette":"na grzance","veg_curry":"z mlekiem kokosowym","tuna_bake":"cztery puszki i torebka"},
  "us": ["zamienia twoje współrzędne w nazwę miejsca","prawdziwe sklepy wokół ciebie, z godzinami otwarcia","prawdziwe ceny sfotografowane na półce","wagi produktów i wartości odżywcze","zmierzony punkt odniesienia w 62 krajach"],
  "plans": ["Ograniczę się do pięciu składników i żadnej roboty nożem, której już nie robiłeś.","Trochę cię pociągnę, nigdy więcej niż jedna nowość na posiłek.","Nic cię tu nie znudzi i nic cię nie zaskoczy.","Nic nie jest wykluczone."],
  "pc": {"IN":"Indie","GB":"Wielka Brytania","IT":"Włochy","FR":"Francja","CN":"Chiny","NG":"Nigeria","TH":"Tajlandia"},
  "am": {"a1":"180 g z torebki 300 g","a2":"prawie całe opakowanie 30 g","a3":"4 z 8","a4":"180 g, otwarte","a5":"kostka 270 g","cooked":"gotowane","time":"raz","times":"razy"},
  "h": {"daysWord":"dni","forServings":"na {n} porcje","otherChip":"Inna","findMe":"Znajdź mi {q}","inKitchen":"{n} rzeczy już masz w kuchni","passportNudge":"84 kraje, z których nigdy nie gotowałeś. Najtańszy, którego ci brakuje, to Etiopia — misir wot wychodzi {a} za porcję.","liveShops":"{n} sklepów w zasięgu spaceru, prosto z OpenStreetMap","week":["P","W","Ś","C","P","S","N"]},
  "v": {
   "recapDone": "Masz za sobą {a} z {b} kroków. Ostatnia rzecz: {t}.","plan1":"Trzymam się pięciu składników i żadnej roboty nożem, której jeszcze nie robiłeś.","plan2":"Trochę cię rozciągnę, nigdy więcej niż jedna nowość na posiłek.","plan3":"Nic tutaj cię nie znudzi i nic cię nie zaskoczy.","plan4":"Nic nie jest wykluczone.","tierSkillSub":"Przeciągnij każdą kartę do wiersza — albo dotknij karty, potem wiersza. Nie ma złej odpowiedzi. To tylko po to, żebym nie proponował ci rzeczy, które cię zirytują.","tierTimeSub":"To samo jeszcze raz. Bądź szczery, nie ambitny — wolę ugotować ci coś w dwadzieścia minut niż patrzeć, jak nie gotujesz nic przez pięćdziesiąt.","readsLike":"Czyta się to jak: {w}. {p}","placeFew":"Ułóż kilka, a powiem ci, co o tym myślę.","timeRead":"Dobrze — w zwykły dzień trzymam wszystko poniżej {m} minut, a długie proponuję tylko w weekend.","dietSome":"Zapisane. Nic, co łamie którykolwiek z tych punktów, nie zostanie ci zaproponowane. Takie dania spadają na koniec listy, zamiast znikać, więc wciąż widzisz, co odrzucasz.","dietNone":"Nic nie zaznaczono, więc nic nie jest filtrowane. Możesz tu wrócić, gdy pierwszy raz zaproponuję coś, czego nigdy byś nie zjadł.","wasteNone":"Czysty talerz, nic do kosza. Ta porcja jest w sam raz — zostawiam ją dokładnie tak.","wasteSome":"Zdjęcie pokazuje jakieś 20% wciąż na talerzu. Nie tragedia, ale to pieniądze ugotowane i niezjedzone.","wasteLots":"Wygląda, że została połowa. Albo porcja jest za duża, albo danie nie było tym, czego chciałeś — obie rzeczy warto wiedzieć.","hob0":"Dopiero zacząłeś. Nic jeszcze nie stoi na ogniu — nie mogłeś tego zepsuć.","hobNone":"Nic na kuchence.","hobPrep":"Jeszcze nic na kuchence — to wszystko przygotowanie.","hobHot":"Na kuchence teraz: patelnia, gorąca. Nie odchodź od niej.","nudge":"Kiełki i kolendra do zużycia w ciągu 3 dni","remind":"Przypomnij mi jutro o 12:30","remindPing":"Jutro 12:30 — {d} nadal jest dobre. Odgrzej je zamiast kupować lunch.","shrinkBig":"Ugotować następnym razem o jedną trzecią mniej?","shrinkSmall":"Ugotować następnym razem o 15% mniej?","shrinkBody":"To samo danie, mniejsza patelnia. Oszczędza około {a} na raz i nie pozwala kawałkowi, którego nigdy nie jesz, trafić do kosza. Możesz to cofnąć w każdej chwili.","shrinkPing":"Porcja zmniejszona. Następne {d} jest wymierzone na to, co naprawdę zjadasz.","shrinkYesText":"Gotowe. Następnym razem porcja pasuje do tego, co naprawdę zjadasz, a lista zakupów kurczy się razem z nią.","shrinkNoText":"W porządku — celowe resztki to nie marnowanie. Zostawiam porcję i przestaję pytać.","streakClean":"Nic do kosza przez cały tydzień. To około {a} oszczędności.","streakKeep":"Czysty talerz jutro i będzie tydzień.","receiptPing":"Skanowanie paragonów to na razie szkic — prawdziwy jest silnik cen.","keyOn":"Klucz zapisany. Ceny konkretnych sieci włączone.","keyOff":"Klucz usunięty.","looking":"Szukam sklepów w pobliżu…"},
  "u": {"setMe":"Ustaw mnie — 4 szybkie ekrany","thatsLot":"To wszystko.","dietSub":"Zaznacz, co pasuje, albo nic. To filtr, nie ocena — możesz to zmienić w każdej chwili w Ustawieniach.","lookTitle":"Albo pozwól mi naprawdę spojrzeć.","noBother":"Nie ma sprawy — wybierz miasto poniżej, a wszystko przeliczy się na nowo.","coverage":"8 krajów ma własny wskaźnik kosztów. Każda cena zaczyna jako modelowana i jest skalowana do miejsca, w którym jesteś — łącznie z Wielką Brytanią. Prawdziwe ceny wchodzą pojedynczo, gdy ktoś je zgłosi albo ma je Open Prices, a kropka obok każdej ceny mówi, na którą patrzysz.","thatsMe":"To ja — jemy","setBtn":"Ustaw","barsNote":"Słupki to udział w dziennym referencyjnym spożyciu dorosłego, na porcję.","legMeasured":"Zmierzone na targach w tym kraju","legEurope":"Zmierzone w Europie, przeliczone tutaj","legModelled":"Modelowane z ceny opakowania, urealnione inflacją","timerLabel":"Minutnik","stopBtn":"Stop","whereYouAre":"Gdzie jesteś","noPhoto":"Bez zdjęcia. Zupełnie w porządku — dotknij, jeśli zmienisz zdanie.","notRight":"nie tak","shrinkYes":"Tak, zmniejsz","shrinkNo":"Nie, lubię resztki","doneThanks":"Gotowe — dzięki","redoTier":"Zrób listę od nowa","changeBtn":"Zmień","resTier":"do twojej listy","gotIt":"Jasne, zamknij","timerStart":"Włącz {m} minut","langNote":"Interfejs przełącza się natychmiast, łącznie z pisaniem od prawej. Metody przepisów zostają na razie po angielsku — wolę zostawić je nieprzetłumaczone, niż maszynowo przetłumaczyć krok mówiący, kiedy zdjąć krewetki z ognia.","apiNote":"Żaden supermarket w Wielkiej Brytanii, USA ani UE nie publikuje publicznego API cen — ani Tesco, ani Sainsbury’s, ani Kroger. Bez klucza używam Open Prices: prawdziwego, ale społecznościowego i dziurawego. Z kluczem ceny półkowe konkretnych sieci zastępują szacunek, a każda linia mówi, co jest czym.","picNote":"Zdjęcia dań to główne ilustracje z artykułów Wikipedii o tych daniach, prawie wszystkie na CC BY-SA.","nowTag":"teraz"},
  "cn": {"GB":"Wielka Brytania","US":"Stany Zjednoczone","IN":"Indie","NG":"Nigeria","PK":"Pakistan","DE":"Niemcy","AE":"ZEA","TR":"Turcja"},
  "sl": {"saved":"Pamiętanie o twojej szafce zdjęło {a} z tych zakupów. Przez miesiąc gotowania to około {b}, których nie wydałeś drugi raz.","measured":"Większość tego koszyka jest zmierzona — ankieterzy odwiedzają targi w kraju {c} co miesiąc. To wyjątkowo dobre pokrycie.","modelled":"Mówię wprost: w kraju {c} większość tego koszyka jest modelowana, nie zmierzona. Żadna sieć nie publikuje cen w tej skali. Traktuj to jako dobre oszacowanie, nie paragon.","listEnglish":"Nazwy jak na opakowaniu","listWhy":"Półki są opisane w lokalnym języku. Pokazuję nazwę, którą naprawdę przeczytasz na opakowaniu."},
  "q": {"training":{"q":"Wybrałeś wysokobiałkowe {k} razy na {n}.","why":"Jeśli jest ku temu powód, mogę celować świadomie zamiast zgadywać. Trenujesz?","o":["Podnoszę ciężary","Biegam albo jeżdżę","Nie, po prostu to lubię"]},"calorieGoal":{"q":"{k} z twoich ostatnich {n} dań miało poniżej 500 kalorii.","why":"To wzorzec, nie przypadek. W jakim celu?","o":["Chudnę","Rekompozycja","Tak po prostu wyszło"]},"cuisine":{"q":"{k} z twoich ostatnich {n} gotowań to kuchnia {c}.","why":"Mam się w tę stronę skłaniać, gdy nie mam nic lepszego, czy dalej mieszać?","o":["Skłaniaj się ku {c}","Mieszaj dalej"]},"push":{"q":"Nic, co ugotowałeś przez miesiąc, nie było trudniejsze niż dwójka.","why":"Mogę zostawić łatwo albo podrzucać jedno trudniejsze danie tygodniowo.","o":["Popchnij mnie trochę","Zostaw łatwo"]},"budget":{"q":"Średnio wychodzi {a} za porcję przy koszyku {b}.","why":"To ciaśniej, niż wygląda. Podnieść domyślny budżet, żebym przestał chować przed tobą dania?","o":["Podnieś","Zostaw"]},"empty":"Jeszcze nic. Zapisuję coś tylko wtedy, gdy odpowiedziałeś na pytanie na głos — nie wnioskuję celu z twojego gotowania i nie działam po cichu.","forget":"Zapomnij to","noted":"Zapisane"},
  "L": {"training:strength":["Podnosisz ciężary","Dania są sortowane najpierw po białku, a w dzień treningowy nie zaproponuję nic poniżej 30 g na porcję."],"training:endurance":["Biegasz albo jeździsz","Trzymam węglowodany wysoko zamiast je ciąć i przestałem chować przed tobą kaloryczniejsze dania."],"calorieGoal:cut":["Jesteś na redukcji","Kalorie są na przodzie każdej karty, a wszystko powyżej 600 na porcję dostaje flagę, a nie ukrycie."],"calorieGoal:recomp":["Robisz rekompozycję","Sortuję po białku na kalorię, a nie po samych kaloriach, co sporo zmienia w kolejności."],"push:yes":["Chcesz być popychany","Jedno danie w tygodniu stoi teraz oczko wyżej niż twoja lista, i mówię ci które."],"budget:up":["Budżet podniesiony","Konsekwentnie wydawałeś powyżej ustawionej kwoty, więc przestałem filtrować po starej."],"goal":["Twój cel: {v}","Powiedziałeś mi to na wejściu. To zmienia tylko kolejność — wszystko nadal tam jest, a tę linijkę możesz skasować."],"cuisine":["Skłonność ku {v}","Gdy nie mam nic lepszego, podnoszę dania {v} wyżej. Nic nie ukrywa i znika, gdy tylko to skasujesz."]},
  "x": {
   "plate": "Wrzuć zdjęcie gotowego talerza",
   "onLast": "w porównaniu z zeszłym tygodniem",
   "nowW": "teraz","insteadOf":"Zamiast kupować gotowe","youKeep":"Zostaje ci","everyTime":"za każdym razem, gdy gotujesz to zamiast zamawiać.","fourTimes":"Cztery razy w miesiącu to","anOrderOf":"porcja na wynos kosztuje","forEight":"za osiem. Tutaj masz dwanaście za","andYouKeep":"i zostaje ci","aPortion":"na porcję.","microShow":"Żelazo, B12, błonnik, sól …","microHide":"Ukryj szczegóły","twoOthers":"Dwie inne, które pasują","browseSub":"Każde danie wycenione dla miasta {city}, za porcję, od najtańszego sklepu w pobliżu do najdroższego. Nic nie jest tu filtrowane budżetem — to wszystko.","statsSub":"Zapisanych gotowań: {n}. Wszystko liczone na tym telefonie — nic nigdzie nie poszło i możesz to skasować.","kitchenSub":"Wszystko to schodzi automatycznie z następnej listy zakupów. Nie poproszę cię drugi raz o kmin.","passportSub":"Każdy kraj, z którego gotowałeś, od najtańszego za porcję.","nudges":"Przypomnienia","leftoverN":"Przypomnienia o resztkach","leftoverS":"Przypomnienie następnego dnia, tylko gdy się nadaje","shrinkN":"Nauka porcji","shrinkS":"Pytaj, zanim zmniejszę przepis, który marnujesz","shopN":"Alerty o zamknięciu","shopS":"Powiedz mi, gdy najtańszy sklep zaraz się zamknie","carbs":"węglowodany","fat":"tłuszcz"},
  "s": {"shopSub":"sklepy w zasięgu spaceru od","sameBasket":"Ten sam koszyk, ceny: {n}.","openTill":"otwarte do","hoursUnknown":"godziny nieznane"},
  "levels": ["","zupełnie początkujący, i to jest w porządku","poradzisz sobie sam","pewny siebie domowy kucharz","dokładnie wiesz, co robisz"],
  "r": {"reads":"Wygląda to na","placeFew":"Rozłóż kilka, a powiem ci, co z tego wynika.","keepUnder":"Dobrze — będę trzymał wszystko poniżej","minsNormal":"minut w zwykły dzień, a te dłuższe zaproponuję tylko w weekend.","underYour":"poniżej twoich","overYour":"powyżej twoich","andIncludes":"— i to nie licząc tego, co już masz","switchCheapest":"Przełącz na najtańszy sklep poniżej i się zmieści.","noRush":"Bez pośpiechu","underMins":"poniżej"},
  "dishes": {
   "pad_thai": "Pad thai",
   "mango_wings": "Skrzydełka mango-habanero",
   "stir_fry": "Kurczak stir-fry",
   "veg_curry": "Curry z batata i ciecierzycy",
   "omelette": "Omlet z serem i ziołami",
   "tuna_bake": "Zapiekanka z tuńczykiem",
   "shakshuka": "Szakszuka",
   "chicken_tacos": "Tacos z kurczakiem",
   "beef_pho": "Pho wołowe",
   "jollof_rice": "Ryż jollof",
   "lentil_bolognese": "Bolognese z soczewicy",
   "butter_chicken": "Butter chicken",
   "dal_tadka": "Dal tadka",
   "carbonara": "Spaghetti carbonara"
  },
  "cuisines": {
   "Thai": "Tajska",
   "American": "Amerykańska",
   "Chinese": "Chińska",
   "Indian": "Indyjska",
   "French": "Francuska",
   "British": "Brytyjska",
   "North African": "Północnoafrykańska",
   "Mexican": "Meksykańska",
   "Vietnamese": "Wietnamska",
   "West African": "Zachodnioafrykańska",
   "Italian": "Włoska"
  },
  "diff": {
   "1": "Bardzo łatwe",
   "2": "Do zrobienia",
   "3": "Trochę wyzwania",
   "4": "Poważny projekt"
  },
  "skill": {
   "onion": "Pokroić cebulę",
   "rice": "Ugotować ryż jak trzeba",
   "sear": "Mocno obsmażyć mięso",
   "sauce": "Zrobić sos na patelni",
   "temp": "Użyć termometru",
   "fry": "Smażyć w głębokim tłuszczu",
   "dough": "Wyrobić ciasto",
   "fish": "Wyfiletować rybę"
  },
  "times": {
   "t10": "10 minut",
   "t20": "20 minut",
   "t30": "30 minut",
   "t45": "45 minut",
   "t60": "Godzina albo więcej"
  },
  "sTiers": {
   "S": "Robię to stale",
   "A": "Raz czy dwa",
   "B": "Trochę się boję",
   "C": "Nigdy i nie dzisiaj"
  },
  "tTiers": {
   "S": "Każdego dnia",
   "A": "Prawie codziennie",
   "B": "Tylko w weekend",
   "C": "Nie ma mowy"
  },
  "cravings": [
   "Pad thai",
   "Skrzydełka mango-habanero",
   "Coś z jajkiem",
   "Curry",
   "Makaron",
   "Stir-fry"
  ],
  "shops": {
   "discount": "dyskont",
   "standard": "zwykły",
   "convenience": "osiedlowy",
   "premium": "delikatesy",
   "wholesale": "hurt"
  },
  "goals": {
   "lose": "Schudnąć",
   "gain": "Przytyć",
   "muscle": "Zbudować mięśnie",
   "recomp": "Rekompozycja",
   "cheap": "Wydawać mniej",
   "energy": "Więcej energii",
   "none": "Bez celu, po prostu nakarm mnie"
  },
  "w": {
   "goalTitle": "O co ci chodzi?",
   "goalSub": "Opcjonalne, można zmienić albo usunąć później. Zmienia to, co ci proponuję, a nie to, co wolno ci ugotować.",
   "goalSkip": "Na razie bez celu",
   "goalNote": "Cokolwiek wybierzesz, nic nie znika. Zmieniam kolejność listy i mówię dlaczego.",
   "evening": "Dobry wieczór",
   "browseAll": "Przejrzyj wszystko",
   "minutes": "min",
   "anHour": "An hour",
   "noRush": "No rush",
   "activeMins": "to twoja robota",
   "ofThem": "z",
   "toBuyFor": "do kupienia, na",
   "servings": "porcje",
   "underBudget": "poniżej budżetu",
   "overBudget": "powyżej budżetu",
   "cheaperThan": "taniej niż na wynos",
   "youHave": "już masz",
   "toBuy": "do kupienia",
   "already": "już w twojej kuchni",
   "optional": "opcjonalne",
   "stepOf": "z",
   "doneNext": "Gotowe, dalej",
   "thatsIt": "I to tyle — koniec",
   "nothingHob": "Nic na palniku.",
   "prepOnly": "Nic jeszcze na palniku — to same przygotowania.",
   "panHot": "Na palniku: patelnia, gorąca. Nie odchodź.",
   "justStarted": "Dopiero zacząłeś. Nic nie stoi na ogniu, nie dało się nic zepsuć.",
   "youHaveDone": "Zrobiłeś",
   "ofSteps": "kroków. Ostatnia rzecz:",
   "clearedIt": "Nic nie zostało. Dokładnie tak.",
   "someLeft": "Została mniej więcej piąta część.",
   "lotsLeft": "Została prawie połowa.",
   "daysRunning": "dni z rzędu",
   "keepClean": "Czysty talerz jutro i masz tydzień.",
   "nothingBinned": "Nic nie poszło do kosza przez cały tydzień.",
   "goingOff": "zaraz się zepsują",
   "cupboard": "wartość szafki",
   "keepsMonths": "Wytrzyma miesiące",
   "useIt": "Zużyj",
   "days": "DNI",
   "scanReceipt": "Zeskanuj paragon, żeby dodać więcej",
   "ofCountries": "z 37 krajów",
   "keptOut": "nie wydane na jedzenie na wynos",
   "cookedTimes": "ugotowane",
   "time": "raz",
   "timesWord": "razy",
   "skillIs": "Poziom",
   "timeIs": "Czas",
   "upTo": "do",
   "minutesNormal": "minut w zwykły dzień",
   "cardsPlaced": "kart techniki rozłożonych",
   "redoTier": "Ułóż listy od nowa",
   "leftToPlace": "do rozłożenia",
   "allPlaced": "Wszystko rozłożone",
   "thatsTheLot": "To wszystko.",
   "theCards": "Karty",
   "aWeek": "tygodniowo",
   "average": "średnio",
   "aServingAvg": "za porcję, średnio",
   "notSpent": "nie wydane na wynos",
   "leftOnPlate": "zostawione na talerzu",
   "eightWeeks": "Osiem tygodni, najstarszy po lewej",
   "aCook": "za raz",
   "wholeMenu": "Całe menu",
   "dishesWord": "dań",
   "everything": "Wszystko",
   "under30": "Poniżej 30 min",
   "cheapest": "Najtaniej",
   "highProtein": "Dużo białka",
   "vegetarianCat": "Wegetariańskie",
   "easiest": "Najłatwiejsze",
   "kcal": "kcal",
   "protein": "białko",
   "carbs": "węglowodany",
   "fat": "tłuszcz",
   "patternMaybe": "Może to wzorzec",
   "forgetAll": "Zapomnij wszystko i zadaj pytania od nowa",
   "stepsEnglish": "Kroki są po angielsku",
   "stepsWhy": "Nie tłumaczyłem metody. Źle przetłumaczona instrukcja o tym, kiedy zdjąć krewetki z ognia, jest gorsza niż angielska."
  }
 };

export const extra: Record<string, string> = {
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

    /* ── You ── */
    statsRowSub: 'Wzorce, które zauważyłem, i przełącznik, żeby je zapomnieć',
    langOffline: 'Ten język wymaga pobrania, a sygnału nie ma. Nadal w {n}.',

    /* ── Tonight, answered ── */
    /* The home screen opens on a dish rather than on a form. These are
       the words around it: what it is offering, how to take it, how to
       decline it, and how to say all that to a screen reader when the
       name changes in place. */
    tonightId: 'Dziś ugotowałbym',
    cookThis: 'Ugotuj to',
    another: 'Pokaż inne',
    refine: 'Masz coś innego na myśli?',
    nowShowing: 'Teraz pokazuję: {d}',

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
    someMeasured: "{n} z {of} pozycji tutaj to prawdziwe ceny, które ktoś zapłacił i zgłosił — kropki obok pokazują które. Reszta jest modelowana: dobry szacunek, nie paragon.",
    noneOfThat: "Nie mam {q} w książce — jeszcze nie. Najbliżej jest {d}.",
    lastOfThat: "To ostatnie, co mam z {q}. Jest ich {n} i widziałeś już wszystkie.",
    goWider: "Pokaż mi cokolwiek",
    whyTitle: "Dlaczego to",
    whyBudget: "Mieści się w {b}, które ustawiłeś",
    whyTime: "{t} minut, poniżej {m}, o które prosiłeś",
    whyDiet: "{d} — sprawdzone składnik po składniku",
    whyOwned: "{n} już masz w domu",
    whyLevel: "{l} — mniej więcej twój poziom",
    pctDearer: "{n}% drożej",
    priceRange: "{a} – {b}",
    rangeShops: "od {a} do {b}",
    storeKinds: "rodzaje sklepów, jakie znajdziesz w",
    storeEstimate: "Szacunki, a nie własne ceny Aldi czy Tesco — żaden supermarket ich nie publikuje. Każda kwota to tyle, ile zwykle kosztuje w takim sklepie w twojej okolicy.",
    legalKicker: "Drobny druk",
    privacyRow: "Prywatność",
    privacyRowSub: "Co jest przechowywane, gdzie i co opuszcza to urządzenie",
    termsRow: "Warunki",
    termsRowSub: "Co ta aplikacja obiecuje, a czego nie",
    legalUpdated: "Ostatnia aktualizacja: 5 sierpnia 2026",
    ownCopy: "© 2026 Pantry. Wszelkie prawa zastrzeżone.",

    slideH1: "Kolacja postanowiona",
    slideS1: "Powiedz, na co masz ochotę i ile masz w kieszeni. Ja zdecyduję.",
    slideH2: "Po kolei, jedno na raz",
    slideS2: "Żadnej ściany wyborów. Jedna potrawa, jeden powód, dla którego tu jest, i sposób, by zmienić zdanie.",
    slideH3: "Ceny stamtąd, gdzie jesteś",
    slideS3: "Każda potrawa ma przedział cen ze sklepów w pobliżu, w Twojej walucie — nie londyńską kwotę z podmienionym symbolem.",
    slideH4: "Za darmo. Wszystko",
    slideS4: "Każdy przepis, każda cena, sześć języków. Bez konta, bez karty, nic nie zostaje na później.",
    slideH5: "Zaczynajmy",
    slideS5: "Cztery szybkie pytania, żebym wiedział, co Ci podać. Pomiń dowolne — i tak będę działać.",
    slideGo: "Ruszamy",
    priceHome: "Od tej chwili każda cena jest w {cur}, w sklepach, które naprawdę są w pobliżu. Coś się nie zgadza?",
    ownMark: "Pantry™ i postać są znakami towarowymi. Przepisy, teksty, ilustracje i kod należą do autorów Pantry. Dane, fotografie i kroje pisma należą do źródeł wymienionych powyżej i zachowują własne licencje.",
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
    termLicenceB: "Przepisy, teksty, ilustracje i kod Pantry należą do autorów Pantry. Gotuj z nich, wydrukuj jeden na ścianę w kuchni, karm ludzi — także tych, którzy płacą ci za obiad.\nNie publikuj zbioru ponownie jako własnego i nie hostuj kopii. Pantry nie jest oprogramowaniem otwartym. Twoja przeglądarka dostaje całą aplikację, bo tak działa sieć, a to, że możesz ją przeczytać, nie jest zgodą na jej zabranie. Jeśli chcesz zrobić to, czego zabrania ten akapit, zapytaj; adres jest poniżej.\n„Pantry” i postać — kremowy pojemnik z drewnianą łyżką — są znakami towarowymi. Korzystanie z aplikacji nie daje prawa do używania żadnego z nich.\nDane map, sklepów i cen pochodzą z OpenStreetMap i Open Food Facts na licencji Open Database Licence, a kursy walut z Europejskiego Banku Centralnego. Ustawienia wymieniają każde źródło i jego licencję.\nCena, którą zgłaszasz, pozostaje twoja i możesz ją usunąć, a Pantry może ją opublikować jako część agregatu — mediany bez nazwiska, i tylko w tej formie widzi ją ktokolwiek inny.",
    termChangeH: "Jeśli to się zmieni",
    termChangeB: "Te warunki i polityka prywatności mają u góry datę. Jeśli któreś zmienią się w istotny sposób, data zmieni się razem z nimi, a aplikacja to powie.\nDalsze korzystanie z Pantry po tym oznacza akceptację nowej wersji. Pytania na adres poniżej.",
};
