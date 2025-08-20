import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { COLORS, illustrations } from '../constants';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

export default function NotFoundScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.area}>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <View style={styles.container}>
        <Image
          source={illustrations.error}
          style={styles.illustration}
          resizeMode="contain"
        />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button
          title="Go to Home"
          filled
          onPress={() => router.replace('/')}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: getResponsiveSpacing(24),
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: getResponsiveSpacing(24),
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(12),
  },
  description: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(32),
    maxWidth: 300,
  },
  button: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderRadius: 30,
  },
});
