/**
 * Draws a card as a 1080×1920 picture for Instagram or Facebook stories.
 * It's made on the phone itself: the picture never goes to any server.
 */

const W = 1080;
const H = 1920;
const COLORS = { night: '#000000', chalk: '#ffffff', accent: '#cbb8ff', deep: '#7c3aed', muted: '#a9a9a9', line: '#262626', surface: '#171717' };

/** Splits text into lines that fit `width`, breaking long words if needed. */
function lines(ctx, text, width, max) {
  const out = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width) {
      line = next;
      continue;
    }
    if (line) out.push(line);
    line = word;
    while (ctx.measureText(line).width > width) {
      let cut = line.length - 1;
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > width) cut -= 1;
      out.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) out.push(line);
  if (out.length > max) {
    out.length = max;
    out[max - 1] = `${out[max - 1].replace(/.$/, '')}…`;
  }
  return out;
}

function mark(ctx, x, y, size) {
  const r = size * 0.25;
  ctx.fillStyle = COLORS.deep;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, r);
  ctx.fill();
  ctx.strokeStyle = COLORS.chalk;
  ctx.lineWidth = size * 0.094;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.297, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.094, 0, Math.PI * 2);
  ctx.fill();
}

/** Returns a PNG file of the card. `words` holds the labels in the current language. */
export async function storyImage(card, words) {
  await Promise.all([document.fonts.load('700 120px Montserrat', card.name), document.fonts.load('600 40px Manrope', card.name)]);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const left = 96;
  const width = W - left * 2;

  ctx.fillStyle = COLORS.night;
  ctx.fillRect(0, 0, W, H);

  // Header: the ring mark and the app's name.
  mark(ctx, left, 120, 88);
  ctx.fillStyle = COLORS.chalk;
  ctx.font = '700 40px Manrope, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(words.appName, left + 116, 164);

  let y = 400;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.muted;
  ctx.font = '600 40px Manrope, sans-serif';
  ctx.fillText(words.storyTitle, left, y);

  y += 40;
  ctx.fillStyle = COLORS.chalk;
  ctx.font = '700 132px Montserrat, sans-serif';
  for (const line of lines(ctx, card.name, width, 2)) {
    y += 140;
    ctx.fillText(line, left, y);
  }

  const anthem = card.tracks[card.anthem];
  if (anthem) {
    y += 90;
    ctx.fillStyle = COLORS.accent;
    ctx.font = '700 46px Manrope, sans-serif';
    for (const line of lines(ctx, `${words.anthem}: ${anthem.title}${anthem.artist ? ` · ${anthem.artist}` : ''}`, width, 2)) {
      ctx.fillText(line, left, y);
      y += 60;
    }
  }

  if (card.genres.length) {
    y += 50;
    ctx.fillStyle = COLORS.chalk;
    ctx.font = '600 42px Manrope, sans-serif';
    for (const line of lines(ctx, card.genres.map(words.genre).join(' · '), width, 2)) {
      ctx.fillText(line, left, y);
      y += 58;
    }
  }

  if (card.artists.length) {
    y += 60;
    ctx.fillStyle = COLORS.muted;
    ctx.font = '700 38px Manrope, sans-serif';
    ctx.fillText(words.artists, left, y);
    y += 30;
    card.artists.slice(0, 5).forEach((artist, index) => {
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(W - left, y);
      ctx.stroke();
      y += 76;
      ctx.fillStyle = COLORS.muted;
      ctx.font = '600 44px Manrope, sans-serif';
      ctx.fillText(String(index + 1), left, y);
      ctx.fillStyle = COLORS.chalk;
      ctx.font = '700 50px Manrope, sans-serif';
      ctx.fillText(lines(ctx, words.artist(artist), width - 80, 1)[0] ?? '', left + 80, y);
      y += 34;
    });
  }

  // Footer: where to make one, in a violet pill.
  ctx.fillStyle = COLORS.muted;
  ctx.font = '600 38px Manrope, sans-serif';
  ctx.fillText(words.storyCta, left, H - 250);
  ctx.font = '700 44px Manrope, sans-serif';
  const address = lines(ctx, words.address, width - 80, 1)[0] ?? '';
  const pill = Math.min(width, ctx.measureText(address).width + 80);
  ctx.fillStyle = COLORS.deep;
  ctx.beginPath();
  ctx.roundRect(left, H - 210, pill, 100, 50);
  ctx.fill();
  ctx.fillStyle = COLORS.chalk;
  ctx.textBaseline = 'middle';
  ctx.fillText(address, left + 40, H - 160);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('no image');
  return new File([blob], 'music-card.png', { type: 'image/png' });
}
