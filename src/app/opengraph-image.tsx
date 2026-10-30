import { ImageResponse } from 'next/og';
import { getProfile } from '@/lib/queries';

export const alt = 'Portfolio de Siriki YEO';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Couleurs de la charte (voir src/app/globals.css) : blanc cassé, encre, bleu d'accent.
const PAPER = '#fbfaf7';
const INK = '#161c2c';
const INK_SOFT = '#3d4558';
const ACCENT = '#1f3a70';

// Image de partage (Open Graph), générée à partir du profil.
export default async function OpenGraphImage() {
  const profile = await getProfile();
  const [firstLine, ...rest] = profile.shortName.toUpperCase().split(' ');

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: PAPER,
        color: INK,
        borderBottom: `18px solid ${ACCENT}`,
      }}
    >
      <div style={{ display: 'flex', fontSize: 30, color: INK_SOFT }}>{profile.fullName}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 150, fontWeight: 900, lineHeight: 0.92, letterSpacing: -4 }}>
          {firstLine}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 150,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: -4,
            color: ACCENT,
          }}
        >
          {rest.join(' ')}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 34, color: INK_SOFT }}>{profile.headline}</div>
    </div>,
    size,
  );
}
