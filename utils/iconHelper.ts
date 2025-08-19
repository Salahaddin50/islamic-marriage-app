export const safeRequire = (path: string) => {
  try {
    return require(path);
  } catch (error) {
    console.warn(`Failed to load icon: ${path}`);
    // Return a transparent 1x1 pixel PNG as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
};
