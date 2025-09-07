import { supabase } from '../config';

export interface SupportTeamMember {
  id: string;
  name: string;
  role: 'Project Manager' | 'Customer support' | 'Payment support' | 'Profile support (f)' | 'Profile support (m)';
  whatsapp_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupportTeamService {
  /**
   * Get all active support team members
   */
  static async getAllSupportMembers(): Promise<SupportTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('support_team')
        .select('*')
        .eq('is_active', true)
        .order('role');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching support team members:', error);
      return [];
    }
  }

  /**
   * Get support member by role
   */
  static async getSupportMemberByRole(role: SupportTeamMember['role']): Promise<SupportTeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('support_team')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching support member for role ${role}:`, error);
      return null;
    }
  }

  /**
   * Get Customer Support WhatsApp number
   */
  static async getCustomerSupportWhatsApp(): Promise<string | null> {
    const member = await this.getSupportMemberByRole('Customer support');
    return member?.whatsapp_number || null;
  }

  /**
   * Get Profile Support (Male) WhatsApp number
   */
  static async getProfileSupportMaleWhatsApp(): Promise<string | null> {
    const member = await this.getSupportMemberByRole('Profile support (m)');
    return member?.whatsapp_number || null;
  }

  /**
   * Get Profile Support (Female) WhatsApp number
   */
  static async getProfileSupportFemaleWhatsApp(): Promise<string | null> {
    const member = await this.getSupportMemberByRole('Profile support (f)');
    return member?.whatsapp_number || null;
  }

  /**
   * Get Payment Support WhatsApp number
   */
  static async getPaymentSupportWhatsApp(): Promise<string | null> {
    const member = await this.getSupportMemberByRole('Payment support');
    return member?.whatsapp_number || null;
  }

  /**
   * Get Project Manager WhatsApp number
   */
  static async getProjectManagerWhatsApp(): Promise<string | null> {
    const member = await this.getSupportMemberByRole('Project Manager');
    return member?.whatsapp_number || null;
  }
}
