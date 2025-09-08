import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { AdminAuthProvider } from '../../src/contexts/AdminAuthContext';

export default function AdminLayout() {
  
  // Load Font Awesome and setup bulletproof icons for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Load Font Awesome CDN - bulletproof icon solution
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      fontAwesomeLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontAwesomeLink);

      // Add viewport meta tag
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewportMeta);

      // Simple, clean CSS
      const adminStyle = document.createElement('style');
      adminStyle.innerHTML = `
        /* Clean system fonts */
        html, body, #root {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-weight: 400;
          line-height: 1.5;
          background-color: #f8fafc;
        }
        
        /* Headings */
        h1, h2, h3, h4, h5, h6 {
          font-weight: 600;
          color: #1f2937;
        }
        
        /* Font Awesome icons - guaranteed to work */
        .fa, .fas, .far, .fab, .fal, .fad {
          font-family: "Font Awesome 6 Free", "Font Awesome 6 Pro", "Font Awesome 6 Brands" !important;
        }
        
        /* Custom icon styles for admin */
        .admin-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          font-size: 16px;
        }
        
        .admin-icon-large {
          width: 32px;
          height: 32px;
          font-size: 20px;
        }
        
        /* Ensure icons don't break */
        .icon-fallback {
          display: inline-block;
          width: 20px;
          height: 20px;
          background-color: #6b7280;
          border-radius: 2px;
          position: relative;
        }
        
        .icon-fallback::after {
          content: "•";
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
        }
      `;
      document.head.appendChild(adminStyle);

      // Set body styles directly
      document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    }
  }, []);

  return (
    <AdminAuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="female-profiles" />
        <Stack.Screen name="male-profiles" />
        <Stack.Screen name="interests" />
        <Stack.Screen name="meet-requests" />
        <Stack.Screen name="admin-management" />
      </Stack>
    </AdminAuthProvider>
  );
}