import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '6px',
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
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFC857" />
                <stop offset="100%" stopColor="#D4920B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="6" fill="#1A1A2E" />
            <path
              d="M16 6C10.5 6 6 10 6 15C6 18.1 7.8 20.8 10.5 22.3V24.5C10.5 25.3 11.2 26 12 26H20C20.8 26 21.5 25.3 21.5 24.5V22.3C24.2 20.8 26 18.1 26 15C26 10 21.5 6 16 6Z"
              fill="url(#bg)"
            />
            <rect x="12" y="27" width="8" height="1" rx="0.5" fill="#D4920B" opacity="0.8" />
            <ellipse cx="13.5" cy="13" rx="2.5" ry="3" fill="rgba(255,255,255,0.25)" />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
