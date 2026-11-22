import type { peopleEn } from './people.en.ts';

export const peopleMn: typeof peopleEn = {
  loading: 'Ачаалж байна',
  errors: {
    unavailable: 'Энэ хүнтэй холбогдох боломжгүй.',
    notAccepting: 'Шинэ хүсэлт авахгүй байгаа.',
    needsSharedGenre: 'Ижил төрөлд дуртай хүнээс хүсэлт авдаг.',
    dailyLimit: 'Өнөөдөр илгээх 10 хүсэлтийн хязгаарт хүрлээ.',
    reportLimit: 'Өнөөдөр илгээх 10 мэдээллийн хязгаарт хүрлээ.',
    notReady: 'Эхлээд профайлаа бөглөж, имэйлээ баталгаажуул.',
    invalid: 'Болсонгүй. Дахин оролдоорой.',
    offline: 'Апптай холбогдож чадсангүй. Дахин оролдоорой.',
    signedOut: 'Бүртгэлээсээ гарсан байна. Дахин нэвтэрнэ үү.',
  },
};
