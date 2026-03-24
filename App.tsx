// ============================================================
// CHORIFY — Point d'entrée
// ============================================================

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/useAuthStore';

export default function App() {
  const { loading, initialize } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize().catch((e: any) => {
      setError(e?.message || 'Erreur de démarrage');
    });
  }, []);

  if (error) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.title}>Chorify</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>🏠</Text>
        <ActivityIndicator size="large" color="#1C1917" />
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
    backgroundColor: '#FAFAF9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1917',
  },
  error: {
    color: '#78716C',
    textAlign: 'center',
    paddingHorizontal: 32,
    fontSize: 14,
  },
});
