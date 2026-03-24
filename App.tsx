// ============================================================
// CHORIFY — Point d'entrée
// ============================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/useAuthStore';
import { useRealtime } from './src/hooks/useRealtime';
import { COLORS } from './src/utils/colors';

export default function App() {
  const { loading, initialize } = useAuthStore();

  // Sync temps réel multi-utilisateurs
  useRealtime();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
