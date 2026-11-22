import type { ReactNode } from 'react';
import type { GenreId } from '@/lib/music/genres';

/*
 * Original artwork, one sleeve per genre, drawn in code.
 * No album covers are used, so there is nothing to license and nothing to download.
 * Every drawing lives on a 100 x 100 grid.
 */
const K = '#000000'; // night
const W = '#fff2ee'; // chalk
const G = '#ffd23f'; // lamp
const S = '#ff8fb8'; // blush
const P = '#ff2a1f'; // flame

const range = (length: number) => Array.from({ length }, (_, index) => index);

const ART: Record<GenreId, { background: string; art: ReactNode }> = {
  mongolianPop: {
    background: S,
    art: (
      <g>
        <circle cx="50" cy="32" r="22" fill={K} />
        <path d="M31 32h38M36 21h28M36 43h28" stroke={P} strokeWidth="3" />
        <path d="M39 55h22l-6 45H45Z" fill={P} />
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
