import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1A1A2E',
          borderRadius: '36px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bulbGrad" x1="70" y1="10" x2="70" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFC857" />
                <stop offset="100%" stopColor="#D4920B" />
              </linearGradient>
            </defs>

            <line x1="70" y1="8" x2="70" y2="24" stroke="#FFC857" stroke-width="4" stroke-linecap="round" />
            <line x1="36" y1="20" x2="46" y2="34" stroke="#FFC857" stroke-width="4" stroke-linecap="round" />
            <line x1="104" y1="20" x2="94" y2="34" stroke="#FFC857" stroke-width="4" stroke-linecap="round" />
            <line x1="22" y1="54" x2="38" y2="56" stroke="#FFC857" stroke-width="4" stroke-linecap="round" />
            <line x1="118" y1="54" x2="102" y2="56" stroke="#FFC857" stroke-width="4" stroke-linecap="round" />

            <path
              d="M70 30C50 30 34 44 34 60C34 70 40 78 50 83V96C50 99 53 102 56 102H84C87 102 90 99 90 96V83C100 78 106 70 106 60C106 44 90 30 70 30Z"
              fill="url(#bulbGrad)"
            />

            <ellipse cx="58" cy="54" rx="10" ry="14" fill="rgba(255,255,255,0.2)" />

            <rect x="54" y="106" width="32" height="4" rx="2" fill="#D4920B" opacity="0.8" />
            <rect x="58" y="113" width="24" height="4" rx="2" fill="#D4920B" opacity="0.7" />
            <path d="M62 121 Q70 128 78 121" stroke="#D4920B" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.6" />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
