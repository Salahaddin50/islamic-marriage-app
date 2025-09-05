// Replace with your production Agora App ID from console.agora.io
export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '027ee1488c5a4188bdc04fe44853cda8';

// For development only. In production, generate a token on your server.
export const AGORA_TEMP_TOKEN: string | null = null;

// Optional: prefix for channels to avoid collisions
export const AGORA_CHANNEL_PREFIX = 'hume-';

// Your App Certificate (keep this secret, only use on server-side)
// export const AGORA_APP_CERTIFICATE = 'your_app_certificate_here'; // Only for server-side token generation


