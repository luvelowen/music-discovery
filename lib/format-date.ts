// Fixed to Ulaanbaatar time, so the server and the browser always write the same text.
const format = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ulaanbaatar',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

export const formatDateTime = (time: number) => format.format(time);
