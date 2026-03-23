// ============================================================
// CHORIFY — Navigation
// ============================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import { COLORS } from '../utils/colors';
import { RootStackParamList, RootTabParamList } from '../types';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { FloorPlanScreen } from '../screens/FloorPlanScreen';
import { TaskListScreen } from '../screens/TaskListScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { AdminScreen } from '../screens/AdminScreen';

// Stores
import { useAuthStore } from '../store/useAuthStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

// Icônes tab (texte simple — remplacer par Lucide ou SF Symbols en prod)
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Plan: '🏠',
    Tâches: '📋',
    Historique: '🕐',
    Agenda: '📅',
    Stats: '📊',
  };
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
        {icons[label] ?? '•'}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name === 'FloorPlan' ? 'Plan' :
            route.name === 'TaskList' ? 'Tâches' :
            route.name === 'History' ? 'Historique' :
            route.name === 'Agenda' ? 'Agenda' : 'Stats'
          } focused={focused} />
        ),
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="FloorPlan"
        component={FloorPlanScreen}
        options={{ tabBarLabel: 'Plan' }}
      />
      <Tab.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{ tabBarLabel: 'Tâches' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Historique' }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{ tabBarLabel: 'Agenda' }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: 'Stats' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const session = useAuthStore((s) => s.session);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{
                headerShown: true,
                headerTitle: 'Administration',
                headerBackTitle: 'Retour',
                headerTintColor: COLORS.text,
                headerStyle: { backgroundColor: COLORS.bg },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
