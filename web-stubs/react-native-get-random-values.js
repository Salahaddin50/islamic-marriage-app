// Web polyfill for react-native-get-random-values
// This provides a compatible implementation for web environments

// Ensure crypto.getRandomValues is available
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    window.crypto = {};
  }
  
  if (!window.crypto.getRandomValues) {
    // Fallback implementation using Math.random
    window.crypto.getRandomValues = function(array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }
}

// For Node.js environments (like metro bundler)
if (typeof global !== 'undefined' && typeof window === 'undefined') {
  const crypto = require('crypto');
  global.crypto = global.crypto || {};
  global.crypto.getRandomValues = global.crypto.getRandomValues || function(array) {
    const bytes = crypto.randomBytes(array.length);
    for (let i = 0; i < array.length; i++) {
      array[i] = bytes[i];
    }
    return array;
  };
}

// Export empty object to satisfy import requirements
module.exports = {};
if (typeof exports !== 'undefined') {
  exports.default = {};
}
