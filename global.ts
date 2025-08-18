// Global polyfills for DigitalOcean and AWS SDK
import { Buffer } from 'buffer';

// Make Buffer available globally for AWS SDK
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}

// Also add to window for web environments
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
}

export {};
