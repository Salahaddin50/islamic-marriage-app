import React, { useEffect } from 'react';
import { Platform } from 'react-native';

// Simple redirect component for all admin pages
const AdminRedirect: React.FC = () => {
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Redirect to the HTML admin panel
      window.location.href = '/admin.html';
    }
  }, []);

  return null;
};

export default AdminRedirect;
