
// Dynamically determine the WebSocket URL based on the browser's location
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_URL = `${protocol}//${window.location.host}`;

console.log(`[CONFIG] Using WebSocket URL: ${WS_URL}`);

export const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
