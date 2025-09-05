
import React from 'react';

export const PhoneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

export const HangUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 9c-1.6 0-3.15.25-4.62.72v3.1c0 .34-.23.64-.56.7-.98.17-1.92.44-2.79.79-.18.07-.36.1-.53.1-.29 0-.57-.13-.76-.35L1.22 12.1c-.24-.28-.34-.67-.27-1.05.1-.52.29-1.02.53-1.5.4-1.22 1.04-2.37 1.87-3.44C5.6 3.14 8.61 2 12 2s6.4 1.14 8.65 4.11c.83 1.07 1.47 2.22 1.87 3.44.24.48.43.98.53 1.5.07.38-.03.77-.27 1.05l-1.52 1.76c-.19.22-.47.35-.76.35-.17 0-.34-.03-.53-.1-.87-.35-1.81-.62-2.79-.79-.33-.06-.56-.36-.56-.7v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

export const VideoOnIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);

export const VideoOffIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z" />
  </svg>
);

export const MicOnIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
  </svg>
);

export const MicOffIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 11h-1.7c0 .58-.1 1.13-.27 1.64l1.27 1.27c.44-.88.7-1.87.7-2.91zM4.41 4.81L3 6.22l4.72 4.72V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9L19.78 21l1.41-1.41L4.41 4.81zM15 5c0 .18-.01.35-.03.52l-2.98 2.98L12 5c-1.66 0-3 1.34-3 3v.18l-2-2V5c0-1.66 1.34-3 3-3s3 1.34 3 3z"/>
  </svg>
);

export const SendIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

export const ScreenShareIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
  </svg>
);

export const ScreenShareOffIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.41 1.68L0 3.09l1.45 1.45C1.17 4.9 1 5.43 1 6v10c0 1.1.9 2 2 2h3v2h12v-2h1.55l2.36 2.36 1.41-1.41L1.41 1.68zM3 16V6.27L14.73 18H3zm18 0V6H8.82l12 12H21z" />
  </svg>
);

export const CameraFlipIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5H5l2.5-2.5L10 13H8c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4c-.58 0-1.14.13-1.64.36L9.5 8.5C10.27 8.19 11.11 8 12 8c2.76 0 5 2.24 5 5s-2.24 5-5 5z" />
  </svg>
);
