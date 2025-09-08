import React, { useEffect } from 'react';
import { Platform } from 'react-native';

const AdminDashboard: React.FC = () => {

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Redirect to the HTML admin panel
      window.location.href = '/admin.html';
    }
  }, []);

  // This component will redirect, so no need for UI
  return null;
};

export default AdminDashboard;
