// Mobile stub for braintree - prevents TurboModule errors
// Braintree requires native modules not available in Expo Go

// Dummy Braintree gateway
class BraintreeGateway {
  constructor(config) {
    this.config = config;
  }
  
  clientToken = {
    generate: () => Promise.reject(new Error('Braintree not supported on mobile without custom development build'))
  };
  
  transaction = {
    sale: () => Promise.reject(new Error('Braintree not supported on mobile without custom development build'))
  };
}

// Default export  
export default BraintreeGateway;

