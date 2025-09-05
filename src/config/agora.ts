export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

// If you have enabled the Primary Certificate in Agora Console, you must provide tokens.
// For development only, you can supply a temporary token via env. In production, generate on server.
export const AGORA_TEMP_TOKEN: string | null = process.env.EXPO_PUBLIC_AGORA_TEMP_TOKEN || null;

// Optional: prefix for channels to avoid collisions
export const AGORA_CHANNEL_PREFIX = process.env.EXPO_PUBLIC_AGORA_CHANNEL_PREFIX || 'zawajplus-';


