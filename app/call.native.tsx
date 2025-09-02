import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Temporary native fallback until react-native-agora is installed and linked.
// To enable native calling: install the SDK and revert to the Agora implementation.
export default function CallScreen() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.txt}>Native calling is not yet installed. Please install react-native-agora and rebuild.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex:1, alignItems:'center', justifyContent:'center', padding: 16 },
  txt: { textAlign:'center' }
});


