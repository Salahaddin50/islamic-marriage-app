import { supabase } from '../config/supabase';

export interface UserAnalytics {
  date: string;
  new_males_daily: number;
  new_females_daily: number;
  new_males_weekly: number;
  new_females_weekly: number;
  total_males: number;
  total_females: number;
}

export interface SubscriptionAnalytics {
  date: string;
  new_subscriptions_daily: number;
  new_subscriptions_weekly: number;
  total_active_subscriptions: number;
  total_revenue: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalMales: number;
  totalFemales: number;
  pendingApprovals: number;
  approvedUsers: number;
  rejectedUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newSubscriptionsToday: number;
  newSubscriptionsThisWeek: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }[];
}

class AdminAnalyticsService {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get user statistics
      const { data: userStats, error: userError } = await supabase
        .from('user_profiles')
        .select('gender, admin_approved, created_at');

      if (userError) {
        return { success: false, error: userError.message };
      }

      // Get subscription statistics
      const { data: subscriptionStats, error: subError } = await supabase
        .from('subscriptions')
        .select('status, amount, created_at');

      if (subError) {
        console.warn('Subscription stats error (table might not exist):', subError.message);
      }

      // Calculate user stats
      const totalUsers = userStats?.length || 0;
      const totalMales = userStats?.filter(u => u.gender === 'male').length || 0;
      const totalFemales = userStats?.filter(u => u.gender === 'female').length || 0;
      const pendingApprovals = userStats?.filter(u => u.admin_approved === null).length || 0;
      const approvedUsers = userStats?.filter(u => u.admin_approved === true).length || 0;
      const rejectedUsers = userStats?.filter(u => u.admin_approved === false).length || 0;

      const newUsersToday = userStats?.filter(u => 
        u.created_at && u.created_at.startsWith(today)
      ).length || 0;

      const newUsersThisWeek = userStats?.filter(u => 
        u.created_at && u.created_at >= weekAgo
      ).length || 0;

      // Calculate subscription stats
      const totalSubscriptions = subscriptionStats?.length || 0;
      const activeSubscriptions = subscriptionStats?.filter(s => s.status === 'active').length || 0;
      const totalRevenue = subscriptionStats?.reduce((sum, s) => 
        s.status === 'active' ? sum + (s.amount || 0) : sum, 0
      ) || 0;

      const newSubscriptionsToday = subscriptionStats?.filter(s => 
        s.created_at && s.created_at.startsWith(today)
      ).length || 0;

      const newSubscriptionsThisWeek = subscriptionStats?.filter(s => 
        s.created_at && s.created_at >= weekAgo
      ).length || 0;

      const stats: DashboardStats = {
        totalUsers,
        totalMales,
        totalFemales,
        pendingApprovals,
        approvedUsers,
        rejectedUsers,
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue,
        newUsersToday,
        newUsersThisWeek,
        newSubscriptionsToday,
        newSubscriptionsThisWeek
      };

      return { success: true, data: stats };

    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user analytics for charts (daily data for last 30 days)
   */
  async getUserAnalytics(): Promise<{ success: boolean; data?: ChartData; error?: string }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data: userData, error } = await supabase
        .from('user_profiles')
        .select('gender, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Group by date and gender
      const dateGroups: { [date: string]: { males: number; females: number } } = {};
      
      // Initialize all dates in the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dateGroups[dateStr] = { males: 0, females: 0 };
      }

      // Count users by date and gender
      userData?.forEach(user => {
        const date = user.created_at.split('T')[0];
        if (dateGroups[date]) {
          if (user.gender === 'male') {
            dateGroups[date].males++;
          } else if (user.gender === 'female') {
            dateGroups[date].females++;
          }
        }
      });

      const labels = Object.keys(dateGroups).sort();
      const maleData = labels.map(date => dateGroups[date].males);
      const femaleData = labels.map(date => dateGroups[date].females);

      const chartData: ChartData = {
        labels: labels.map(date => {
          const d = new Date(date);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        datasets: [
          {
            label: 'New Males',
            data: maleData,
            borderColor: '#3B82F6',
            backgroundColor: '#3B82F6',
          },
          {
            label: 'New Females',
            data: femaleData,
            borderColor: '#EC4899',
            backgroundColor: '#EC4899',
          }
        ]
      };

      return { success: true, data: chartData };

    } catch (error: any) {
      console.error('User analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get subscription analytics for charts
   */
  async getSubscriptionAnalytics(): Promise<{ success: boolean; data?: ChartData; error?: string }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('amount, created_at, status')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Subscription analytics error (table might not exist):', error.message);
        // Return empty chart data if subscriptions table doesn't exist
        return {
          success: true,
          data: {
            labels: [],
            datasets: [{
              label: 'New Subscriptions',
              data: [],
              borderColor: '#10B981',
              backgroundColor: '#10B981',
            }]
          }
        };
      }

      // Group by date
      const dateGroups: { [date: string]: { count: number; revenue: number } } = {};
      
      // Initialize all dates in the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dateGroups[dateStr] = { count: 0, revenue: 0 };
      }

      // Count subscriptions by date
      subscriptionData?.forEach(sub => {
        const date = sub.created_at.split('T')[0];
        if (dateGroups[date]) {
          dateGroups[date].count++;
          dateGroups[date].revenue += sub.amount || 0;
        }
      });

      const labels = Object.keys(dateGroups).sort();
      const subscriptionData2 = labels.map(date => dateGroups[date].count);
      const revenueData = labels.map(date => dateGroups[date].revenue);

      const chartData: ChartData = {
        labels: labels.map(date => {
          const d = new Date(date);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        datasets: [
          {
            label: 'New Subscriptions',
            data: subscriptionData2,
            borderColor: '#10B981',
            backgroundColor: '#10B981',
          },
          {
            label: 'Revenue ($)',
            data: revenueData,
            borderColor: '#F59E0B',
            backgroundColor: '#F59E0B',
          }
        ]
      };

      return { success: true, data: chartData };

    } catch (error: any) {
      console.error('Subscription analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total users chart (monthly/yearly)
   */
  async getTotalUsersChart(period: 'monthly' | 'yearly'): Promise<{ success: boolean; data?: ChartData; error?: string }> {
    try {
      const now = new Date();
      let startDate: Date;
      let dateFormat: string;

      if (period === 'monthly') {
        // Last 12 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        dateFormat = 'YYYY-MM';
      } else {
        // Last 5 years
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        dateFormat = 'YYYY';
      }

      const { data: userData, error } = await supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Group by period
      const periodGroups: { [period: string]: number } = {};
      
      // Initialize periods
      if (period === 'monthly') {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const periodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          periodGroups[periodStr] = 0;
        }
      } else {
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          periodGroups[year.toString()] = 0;
        }
      }

      // Count users by period (cumulative)
      let cumulativeCount = 0;
      const sortedData = userData?.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || [];

      const labels = Object.keys(periodGroups).sort();
      const cumulativeData: number[] = [];

      labels.forEach(label => {
        // Count users up to this period
        if (period === 'monthly') {
          const [year, month] = label.split('-');
          const endOfPeriod = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
          cumulativeCount = sortedData.filter(user => 
            new Date(user.created_at) <= endOfPeriod
          ).length;
        } else {
          const endOfYear = new Date(parseInt(label), 11, 31, 23, 59, 59);
          cumulativeCount = sortedData.filter(user => 
            new Date(user.created_at) <= endOfYear
          ).length;
        }
        cumulativeData.push(cumulativeCount);
      });

      const chartData: ChartData = {
        labels: labels.map(label => {
          if (period === 'monthly') {
            const [year, month] = label.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          } else {
            return label;
          }
        }),
        datasets: [
          {
            label: 'Total Users',
            data: cumulativeData,
            borderColor: '#8B5CF6',
            backgroundColor: '#8B5CF6',
            fill: false
          }
        ]
      };

      return { success: true, data: chartData };

    } catch (error: any) {
      console.error('Total users chart error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AdminAnalyticsService();
