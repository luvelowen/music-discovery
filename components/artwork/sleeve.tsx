import type { ReactNode } from 'react';
import type { GenreId } from '@/lib/music/genres';

/*
 * Original artwork, one sleeve per genre, drawn in code.
 * No album covers are used, so there is nothing to license and nothing to download.
 * Every drawing lives on a 100 x 100 grid.
 */
const K = '#000000'; // black
const W = '#ffffff'; // white
const G = '#d8dad5'; // stone
const S = '#afbdaa'; // sage
const P = '#3d5847'; // pine

const range = (length: number) => Array.from({ length }, (_, index) => index);

const ART: Record<GenreId, { background: string; art: ReactNode }> = {
  // The toono, the crown of a ger.
  mongolianPop: {
    background: S,
    art: (
      <g fill="none" stroke={K} strokeWidth="3">
        <circle cx="50" cy="50" r="36" strokeWidth="6" />
        <circle cx="50" cy="50" r="14" fill={W} />
        {range(8).map((i) => <path key={i} d="M50 14V36" transform={`rotate(${i * 45} 50 50)`} />)}
      </g>
    ),
  },
  hipHop: {
    background: K,
    art: (
      <g>
        {[38, 62, 46, 80, 28].map((height, i) => (
          <rect key={i} x={i * 20} y={100 - height} width="20" height={height} fill={[G, S, W, P, S][i]} />
        ))}
      </g>
    ),
  },
  kPop: {
    background: W,
    art: (
      <g>
        {range(5).map((i) => (
          <circle key={i} cx="50" cy="29" r="19" fill={i % 2 ? S : P} transform={`rotate(${i * 72} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="12" fill={K} />
      </g>
    ),
  },
  pop: {
    background: P,
    art: (
      <g>
        <path d="M0 100a50 50 0 0 1 100 0Z" fill={S} />
        <circle cx="50" cy="28" r="16" fill={W} />
      </g>
    ),
  },
  indie: {
    background: G,
    art: (
      <g>
        <path d="M18 100V46a26 26 0 0 1 52 0v54Z" fill={P} />
        <path d="M44 100V60a22 22 0 0 1 44 0v40Z" fill={K} />
        <circle cx="66" cy="60" r="7" fill={W} />
      </g>
    ),
  },
  rock: {
    background: K,
    art: (
      <g>
        <path d="M66 0 22 58h24L32 100l48-60H54L86 0Z" fill={W} />
        <path d="M0 100V72l22 28Z" fill={S} />
      </g>
    ),
  },
  // Long notes that keep travelling, like a voice over open steppe.
  longSong: {
    background: P,
    art: (
      <g fill="none" stroke={S} strokeWidth="3">
        {range(7).map((i) => (
          <path key={i} stroke={i === 3 ? W : S} d={`M-5 ${20 + i * 11}C22 ${-6 + i * 11} 38 ${46 + i * 11} 62 ${20 + i * 11}S92 ${10 + i * 11} 108 ${16 + i * 11}`} />
        ))}
      </g>
    ),
  },
  // One low drone, with overtones rising out of it.
  throatSinging: {
    background: K,
    art: (
      <g fill="none" stroke={S} strokeWidth="2.5">
        {range(7).map((i) => <ellipse key={i} cx="50" cy={90 - i * 7} rx={10 + i * 7} ry={6 + i * 6} />)}
        <circle cx="50" cy="90" r="6" fill={W} stroke="none" />
      </g>
    ),
  },
  morinKhuur: {
    background: G,
    art: (
      <g>
        <path d="M36 50h28l8 43H28Z" fill={P} />
        <path d="M45 50V18q0-11 12-10l5 8-8 1v33Z" fill={K} />
        <path d="M47 22V86M52 22V86" stroke={W} strokeWidth="1.2" />
        <path d="M14 76 88 58" stroke={K} strokeWidth="3" />
      </g>
    ),
  },
  ethnoFusion: {
    background: W,
    art: (
      <g>
        <circle cx="72" cy="26" r="13" fill={S} />
        {[S, P, K].map((fill, i) => (
          <path key={i} fill={fill} d={`M0 ${68 + i * 14}L25 ${42 + i * 14}L50 ${66 + i * 14}L75 ${46 + i * 14}L100 ${68 + i * 14}V100H0Z`} />
        ))}
      </g>
    ),
  },
  composedSongs: {
    background: S,
    art: (
      <g>
        {range(5).map((i) => <path key={i} d={`M0 ${28 + i * 11}H100`} stroke={P} strokeWidth="1.5" />)}
        {[[22, 61], [44, 50], [64, 39], [82, 55]].map(([x, y]) => (
          <g key={x} fill={K}>
            <ellipse cx={x} cy={y} rx="7" ry="5.5" />
            <path d={`M${x! + 4.5} ${y}v-25h2.5v25Z`} />
          </g>
        ))}
      </g>
    ),
  },
  rnb: {
    background: K,
    art: (
      <g>
        <circle cx="36" cy="50" r="27" fill={P} />
        <circle cx="64" cy="50" r="27" fill={S} />
        <path d="M50 26.9a27 27 0 0 1 0 46.2 27 27 0 0 1 0-46.2Z" fill={W} />
      </g>
    ),
  },
  electronic: {
    background: W,
    art: (
      <g fill={K}>
        {range(36).map((i) => (
          <circle key={i} cx={12.5 + (i % 6) * 15} cy={12.5 + Math.floor(i / 6) * 15} r={1.2 + ((i % 6) + Math.floor(i / 6)) * 0.62} />
        ))}
      </g>
    ),
  },
  lofi: {
    background: S,
    art: (
      <g>
        <rect x="14" y="26" width="72" height="48" rx="4" fill={K} />
        <rect x="24" y="36" width="52" height="22" rx="11" fill={G} />
        <circle cx="36" cy="47" r="6" fill={P} />
        <circle cx="64" cy="47" r="6" fill={P} />
        <path d="m32 74 4-9h28l4 9Z" fill={P} />
      </g>
    ),
  },
  jazz: {
    background: P,
    art: (
      <g>
        {[70, 44, 84, 56, 34, 76].map((height, i) => (
          <rect key={i} x={5 + i * 16} width="10" height={height} fill={i === 2 ? K : i % 2 ? S : W} />
        ))}
      </g>
    ),
  },
  classical: {
    background: G,
    art: (
      <g fill="none">
        {range(5).map((i) => (
          <path key={i} d={`M${8 + i * 8.5} 100V56a${42 - i * 8.5} ${42 - i * 8.5} 0 0 1 ${84 - i * 17} 0V100`} stroke={i % 2 ? P : K} strokeWidth="4" />
        ))}
      </g>
    ),
  },
  metal: {
    background: K,
    art: (
      <g>
        {range(12).map((i) => (
          <path key={i} d="m45 50 5-45 5 45Z" fill={i % 2 ? P : G} transform={`rotate(${i * 30} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="10" fill={K} />
      </g>
    ),
  },
  jPop: {
    background: W,
    art: (
      <g>
        <circle cx="60" cy="42" r="28" fill={P} />
        {range(5).map((i) => (
          <path key={i} d={`M-4 ${70 + i * 9}L${44 + i * 14} ${44 + i * 9}`} stroke={i % 2 ? S : K} strokeWidth="3" />
        ))}
      </g>
    ),
  },
};

export function Sleeve({ genre, className }: { genre: GenreId; className?: string }) {
  const { background, art } = ART[genre];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={className} style={{ background }} aria-hidden>
      {art}
    </svg>
  );
}
