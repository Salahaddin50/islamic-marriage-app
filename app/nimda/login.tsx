import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const AdminLogin: React.FC = () => {
  
  const openAdminPanel = () => {
    if (Platform.OS === 'web') {
      // On web, redirect to the HTML admin panel
      window.location.href = '/admin.html';
      } else {
      // On mobile, open in browser
      Linking.openURL('http://localhost:8081/admin.html');
    }
  };

  // Auto-redirect on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      openAdminPanel();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🛡️</Text>
                <Text style={styles.appName}>Hume Admin</Text>
                <Text style={styles.subtitle}>Administrative Dashboard</Text>
              </View>

          <TouchableOpacity style={styles.adminButton} onPress={openAdminPanel}>
            <Text style={styles.adminButtonText}>🚀 Open Admin Panel</Text>
            <Text style={styles.adminButtonSubtext}>Access the full-featured admin dashboard</Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              🌐 The admin panel opens in your web browser for the best experience
            </Text>
            <Text style={styles.infoText}>
              ✅ All icons and features guaranteed to work
            </Text>
            <Text style={styles.infoText}>
              🔒 Secure authentication and full admin controls
                </Text>
              </View>
            </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  adminButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    marginBottom: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  adminButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  adminButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
});

export default AdminLogin;
