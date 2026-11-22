import type { Dictionary } from './en.ts';
import { accountMn } from './account.mn.ts';
import { chatMn } from './chat.mn.ts';
import { communityMn } from './community.mn.ts';
import { legalMn } from './legal.mn.ts';
import { peopleMn } from './people.mn.ts';
import { profileMn } from './profile.mn.ts';

/*
 * Written as Mongolian, not translated word for word. The voice is informal "чи",
 * the way friends talk to each other. TypeScript reports any key that is missing here.
 */
export const mn: Dictionary = {
  appName: 'Дуу, болзоо, найз',
  languageLabel: 'Хэл',
  skip: 'Үндсэн хэсэг рүү очих',

  welcome: {
    title: 'Чихэвчнийхээ нэгийг өгөх хүнээ ол.',
    body: 'Улаанбаатарт дуртай хөгжмөөрөө дамжуулан болзох хүн, найзаа олоорой. Зөвхөн 18+.',
    photo: 'Шөнийн Улаанбаатар',
    credit: 'Улаанбаатар. Зураг: @naranbayar_1, Unsplash',
  },

  steps: { genres: 'Төрөл', artists: 'Уран бүтээлч', tracks: 'Дуу', links: 'Холбоос', about: 'Чиний тухай' },

  setup: {
    progress: (current, total) => `Алхам ${current}/${total}`,
    back: 'Буцах',
    next: 'Үргэлжлүүлэх',
    skipStep: 'Алгасах',
    finish: 'Профайлаа харах',
    save: 'Хадгалах',
    remove: (name) => `${name}: хасах`,
    add: 'Нэмэх',
    count: (count, max) => `Нэмсэн: ${count}/${max}`,
  },

  seeking: { friends: 'Найз', dating: 'Болзоо' },

  genresStep: {
    title: 'Ямар хөгжим сонсдог вэ?',
    body: 'Тав хүртэлх төрөл сонгоорой.',
    selected: (count, max) => `Сонгосон: ${count}/${max}`,
    limit: 'Тавыг сонгочихлоо. Солих бол сонгосон нэгээ дарж болиулаарай.',
    required: 'Үргэлжлүүлэхийн тулд дор хаяж нэг төрөл сонгоорой.',
  },

  artistsStep: {
    title: 'Хэнийг байнга сонсдог вэ?',
    body: 'Арав хүртэл уран бүтээлч нэмээрэй. Манайх ч бай, гадаадынх ч бай, алдартай эсэх нь хамаагүй.',
    label: 'Дуучин эсвэл хамтлаг',
    placeholder: 'Жишээ нь, Magnolian',
    suggestions: 'Санал болгох уран бүтээлчид',
    noMatch: 'Жагсаалтад алга уу? «Нэмэх» дарвал бичсэн нэр чинь орно.',
  },

  tracksStep: {
    title: 'Ямар дуу чамайг илэрхийлдэг вэ?',
    body: 'Тав хүртэл дуу нэмээрэй. Хөгжмийн тухай яриа эхлүүлэхэд амар болно.',
    trackTitle: 'Дууны нэр',
    trackArtist: 'Дуучин, хамтлаг',
    add: 'Дуу нэмэх',
  },

  linksStep: {
    title: 'Холбоосоо нэмээрэй',
    body: 'Заавал биш. Зөвхөн танилцсан хүмүүст харагдана.',
    instagram: { button: 'Instagram нэмэх', label: 'Instagram нэр эсвэл холбоос', placeholder: '@username', help: 'Зөвхөн нэрийг нь үлдээж, хянах кодыг авч хаяна.' },
    spotify: { button: 'Spotify нэмэх', label: 'Spotify профайл эсвэл плейлистийн холбоос', placeholder: 'https://open.spotify.com/…', help: 'Spotify дээр Share, дараа нь Copy link дарна. Холбоосын төгсгөлийн хянах кодыг бид авч хаяна.' },
    privacy: 'Эхлээд хаягаа шалгаарай: Instagram, Spotify дээр жинхэнэ нэр, царай, пост чинь харагдаж магадгүй.',
    profile: 'Spotify профайл',
    playlist: 'Spotify плейлист',
  },

  aboutStep: {
    title: 'Өөрийгөө товч танилцуулаарай',
    body: 'Хоч нэр хэрэглээрэй. Жинхэнэ нэр, ажлын газар, холбоо барих мэдээллээ бичих хэрэггүй.',
    username: 'Хэрэглэгчийн нэр',
    usernameHelp: 'Бүгдэд харагдана. 3–24 тэмдэгт: үсэг, тоо, цэг, доогуур зураас.',
    seeking: 'Юу хайж байна вэ?',
    seekingHelp: 'Нэгийг эсвэл хоёуланг нь сонго. «Болзоо» зөвхөн бас сонгосон хүмүүст харагдана.',
    bio: 'Товч танилцуулга (заавал биш)',
    bioHelp: 'Зөвхөн танилуудад чинь харагдана.',
    bioPlaceholder: 'Басс гитар сурч байгаа. Шинэ инди хамтлаг хайх дуртай.',
    photo: 'Профайл зураг (заавал биш)',
    photoHelp: 'Зөвхөн танилуудад чинь харагдана. Бусдад нэрийн чинь эхний үсэг харагдана.',
    choosePhoto: 'Зураг сонгох',
    changePhoto: 'Зураг солих',
    removePhoto: 'Зургийг хасах',
  },

  errors: {
    usernameTaken: 'Ийм эсвэл ижил харагдах нэртэй хүн байна. Өөр нэр сонгоорой.',
    usernameLength: '3–24 тэмдэгт ашиглаарай.',
    usernameCharacters: 'Зөвхөн үсэг, тоо, цэг, доогуур зураас ашиглана. Зай авахгүй.',
    contactInfo: 'Аюулгүй байдлынхаа үүднээс утас, имэйл, сошиал хаяг, холбоос бүү бичээрэй.',
    duplicate: 'Үүнийг аль хэдийн нэмсэн байна.',
    full: 'Жагсаалт дүүрсэн. Шинээр нэмэх бол нэгийг нь хасаарай.',
    empty: 'Эхлээд нэрийг нь бичээрэй.',
    trackIncomplete: 'Дууны нэр, дуучныг хоёуланг нь бичээрэй.',
    invalid: 'Энэ нь Spotify профайл эсвэл плейлистийн холбоос биш байна. open.spotify.com гэж эхэлсэн байх ёстой.',
    shortLink: 'Богино холбоосыг шалгах боломжгүй. Нээгээд open.spotify.com гэсэн бүтэн хаягийг хуулаарай.',
    wrongKind: 'Энэ бол дуу, цомог, дуучин эсвэл подкастын холбоос. Профайл эсвэл плейлистийн холбоос оруулаарай.',
    instagram: 'Instagram нэрээ @name хэлбэрээр эсвэл профайлын холбоосоор оруулаарай.',
    oneProfile: 'Нэг профайл нэмж болно. Солих бол одоогийнхыг нь хасаарай.',
    photoType: 'Файлыг нээж чадсангүй. JPG, PNG эсвэл WebP зураг сонгоорой.',
    photoSize: '10 MB-аас бага хэмжээтэй зураг сонгоорой.',
  },

  profile: {
    viewAs: 'Хэний нүдээр харах',
    stranger: 'Танихгүй хүн',
    connection: 'Танил',
    strangerNote: 'Танилцаагүй хүмүүст зураг, танилцуулга, холбоос чинь харагдахгүй.',
    connectionNote: 'Харилцан зөвшөөрч танилцсан хүмүүст профайл чинь бүтнээрээ харагдана.',
    seeking: 'Хайж буй',
    datingNote: '«Болзоо» сонгосон чинь зөвхөн бас сонгосон хүмүүст харагдана.',
    genres: 'Дуртай төрөл',
    artists: 'Байнга сонсдог',
    tracks: 'Дуртай дуунууд',
    links: 'Холбоос',
    newTab: '(шинэ цонхонд нээгдэнэ)',
    incompleteTitle: 'Профайл чинь бэлэн болоогүй байна',
    incompleteBody: 'Харахын тулд дор хаяж нэг төрөл, хэрэглэгчийн нэр сонгоорой.',
    incompleteAction: 'Профайлаа дуусгах',
  },

  account: accountMn,
  chat: chatMn,
  community: communityMn,
  legal: legalMn,
  people: peopleMn,
  me: profileMn,

  failed: { title: 'Алдаа гарлаа', body: 'Хадгалсан өөрчлөлт чинь хэвээрээ. Дахин оролдоорой.', action: 'Дахин оролдох' },
  notFound: { title: 'Ийм хуудас алга', action: 'Эхлэл рүү буцах' },

  genres: {
    pop: 'Поп', hipHop: 'Хип-хоп', rnb: 'R&B', rock: 'Рок', latin: 'Латин', electronic: 'Данс/Электрон',
    kPop: 'К-поп', indie: 'Инди', country: 'Кантри', metal: 'Метал', jazz: 'Жазз', classical: 'Сонгодог',
    folk: 'Фолк ба акустик', soul: 'Соул', punk: 'Панк', ambient: 'Эмбиент', blues: 'Блюз', jPop: 'J-поп',
    alternative: 'Альтернатив', caribbean: 'Кариб',
    mongolianPop: 'Монгол поп', lofi: 'Ло-фай',
  },
};
