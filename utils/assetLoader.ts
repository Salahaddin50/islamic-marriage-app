// Dynamic asset loader that bypasses Metro's static analysis issues
export const getAssetUri = (assetPath: string): string => {
  // For web builds, return the asset path directly
  if (typeof window !== 'undefined') {
    return assetPath;
  }
  
  // For native builds, use require dynamically
  try {
    return require(`../${assetPath}`);
  } catch (error) {
    console.warn(`Failed to load asset: ${assetPath}`, error);
    // Return a transparent 1x1 pixel as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }
};
