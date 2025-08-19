// Dynamic asset loader that bypasses Metro's static analysis issues
export const getAssetUri = (assetPath: string): string => {
  // For web builds and static exports, return the asset path directly
  // This works because web builds don't need Metro's asset bundling
  return assetPath;
};
