// Default thumbnail for videos when no thumbnail is available
export const DEFAULT_VIDEO_THUMBNAIL = `data:image/svg+xml;base64,${Buffer.from(`
<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3498db;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2c3e50;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)"/>
  <circle cx="200" cy="150" r="60" fill="white" fill-opacity="0.3"/>
  <polygon points="180,120 180,180 230,150" fill="white"/>
  <rect x="100" y="80" width="200" height="140" rx="15" stroke="white" stroke-width="6" fill="none"/>
</svg>
`).toString('base64')}`;
