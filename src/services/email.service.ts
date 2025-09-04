// ============================================================================
// EMAIL SERVICE - HUME ISLAMIC DATING APP
// ============================================================================
// Centralized email service for authentication and notifications
// ============================================================================

import { supabase } from '../config/supabase';

// Email configuration constants
const EMAIL_CONFIG = {
  APP_NAME: 'Zawajplus Islamic Marriage',
  SUPPORT_EMAIL: 'support@zawajplus.com',
  NOREPLY_EMAIL: 'noreply@zawajplus.com',
  GREETING: 'Assalamu Alaikum',
  SIGNATURE: 'Barakallahu feeki,\nThe Zawajplus Islamic Marriage Team',
  WEBSITE_URL: typeof window !== 'undefined' ? window.location.origin : 'https://zawajplus.com'
};

export class EmailService {
  /**
   * Send password reset email with custom branding
   */
  static async sendPasswordReset(email: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${EMAIL_CONFIG.WEBSITE_URL}/createnewpassword`,
        data: {
          app_name: EMAIL_CONFIG.APP_NAME,
          website_url: EMAIL_CONFIG.WEBSITE_URL,
          support_email: EMAIL_CONFIG.SUPPORT_EMAIL,
          greeting: EMAIL_CONFIG.GREETING,
          signature: EMAIL_CONFIG.SIGNATURE,
          // Additional Islamic context
          community_message: 'Join our Islamic community for halal relationships',
          privacy_message: 'Your privacy and Islamic values are our priority'
        }
      });
      
      return { error };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { error };
    }
  }

  /**
   * Send email confirmation with custom branding
   */
  static async sendEmailConfirmation(email: string, password: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            app_name: EMAIL_CONFIG.APP_NAME,
            website_url: EMAIL_CONFIG.WEBSITE_URL,
            support_email: EMAIL_CONFIG.SUPPORT_EMAIL,
            greeting: EMAIL_CONFIG.GREETING,
            signature: EMAIL_CONFIG.SIGNATURE,
            welcome_message: 'Welcome to the Islamic marriage community',
            next_steps: 'Complete your profile to start connecting with other Muslims'
          }
        }
      });
      
      return { data, error };
    } catch (error) {
      console.error('Email confirmation error:', error);
      return { data: null, error };
    }
  }

  /**
   * Resend email confirmation
   */
  static async resendConfirmation(email: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          data: {
            app_name: EMAIL_CONFIG.APP_NAME,
            website_url: EMAIL_CONFIG.WEBSITE_URL,
            support_email: EMAIL_CONFIG.SUPPORT_EMAIL,
            greeting: EMAIL_CONFIG.GREETING,
            signature: EMAIL_CONFIG.SIGNATURE
          }
        }
      });
      
      return { error };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return { error };
    }
  }

  /**
   * Send magic link for passwordless login
   */
  static async sendMagicLink(email: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            app_name: EMAIL_CONFIG.APP_NAME,
            website_url: EMAIL_CONFIG.WEBSITE_URL,
            support_email: EMAIL_CONFIG.SUPPORT_EMAIL,
            greeting: EMAIL_CONFIG.GREETING,
            signature: EMAIL_CONFIG.SIGNATURE,
            login_message: 'Click the link below to sign in to your account'
          }
        }
      });
      
      return { error };
    } catch (error) {
      console.error('Magic link error:', error);
      return { error };
    }
  }

  /**
   * Get email configuration for use in templates
   */
  static getEmailConfig() {
    return EMAIL_CONFIG;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate email preview URL for testing
   */
  static generatePreviewUrl(type: 'reset' | 'confirmation' | 'magic-link'): string {
    const baseUrl = EMAIL_CONFIG.WEBSITE_URL;
    switch (type) {
      case 'reset':
        return `${baseUrl}/createnewpassword`;
      case 'confirmation':
        return `${baseUrl}/login`;
      case 'magic-link':
        return `${baseUrl}/(tabs)/home`;
      default:
        return baseUrl;
    }
  }
}

// Export email configuration for use in other services
export { EMAIL_CONFIG };

// Export types for TypeScript support
export interface EmailData {
  app_name: string;
  website_url: string;
  support_email: string;
  greeting: string;
  signature: string;
  [key: string]: any;
}

export interface EmailResponse {
  data?: any;
  error?: any;
}
