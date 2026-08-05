/**
 * The five things the crash net says, in the five languages that do not ship
 * in the main chunk.
 *
 * lib/crash.ts lives by a rule it states in its own header: a net that needs
 * the module graph it exists to survive is not a net. Once the translations
 * sit behind a dynamic import, that import failing is one of the commonest
 * things the net is there to catch — so the apology for it cannot be inside
 * it.
 *
 * Five keys across five languages, about a kilobyte and a half, eager for
 * ever. The same strings also live with the rest of their language, and
 * data.test.ts asserts the two copies agree so they cannot drift apart.
 */
export const CRASH: Record<string, Record<string, string>> = {
  es: {
    crashTitle: 'Algo aquí dentro se ha roto',
    crashBody: 'Culpa mía, no tuya. Nada de lo que me has contado se ha tocado: sigue todo en este dispositivo. Recargar suele devolverte donde estabas.',
    crashWhat: 'Qué ha fallado',
    crashReload: 'Recargar Pantry',
    crashSave: 'Guardar antes una copia de mis datos',
  },
  fr: {
    crashTitle: 'Quelque chose ici a cassé',
    crashBody: 'C’est ma faute, pas la vôtre. Rien de ce que vous m’avez dit n’a été touché — tout est encore sur cet appareil. Recharger vous ramène en général là où vous étiez.',
    crashWhat: 'Ce qui a échoué',
    crashReload: 'Recharger Pantry',
    crashSave: 'Sauvegarder d’abord une copie de mes données',
  },
  pl: {
    crashTitle: 'Coś tu się zepsuło',
    crashBody: 'To moja wina, nie Twoja. Nic z tego, co mi powiedziałeś, nie zostało ruszone — wszystko nadal jest na tym urządzeniu. Przeładowanie zwykle wraca tam, gdzie byłeś.',
    crashWhat: 'Co poszło nie tak',
    crashReload: 'Przeładuj Pantry',
    crashSave: 'Najpierw zapisz kopię moich danych',
  },
  ur: {
    crashTitle: 'یہاں کچھ ٹوٹ گیا ہے',
    crashBody: 'یہ میری غلطی ہے، آپ کی نہیں۔ آپ نے مجھے جو کچھ بتایا، اُسے ہاتھ نہیں لگا — سب کچھ اِسی آلے پر موجود ہے۔ دوبارہ لوڈ کرنے سے عموماً آپ وہیں پہنچ جاتے ہیں جہاں تھے۔',
    crashWhat: 'خرابی کیا ہوئی',
    crashReload: 'Pantry دوبارہ لوڈ کریں',
    crashSave: 'پہلے میرے ڈیٹا کی نقل محفوظ کریں',
  },
  ar: {
    crashTitle: 'شيء ما هنا تعطّل',
    crashBody: 'الخطأ خطئي لا خطؤك. لم يُمسّ شيء ممّا أخبرتني به — كلّه ما زال على هذا الجهاز. إعادة التحميل تعيدك عادةً إلى حيث كنت.',
    crashWhat: 'ما الذي فشل',
    crashReload: 'أعِد تحميل Pantry',
    crashSave: 'احفظ نسخة من بياناتي أولاً',
  },
};
