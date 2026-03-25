import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { AuthScreen } from '../screens/AuthScreen';
import { FloorPlanScreen } from '../screens/FloorPlanScreen';
import { TaskListScreen } from '../screens/TaskListScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useRealtime } from '../hooks/useRealtime';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Plan: '🏠', Tâches: '📋', Historique: '🕐',
    Agenda: '📅', Stats: '📊', Admin: '⚙️',
  };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
        {icons[label] ?? '•'}
      </Text>
    </View>
  );
}

function MainTabs() {
  useRealtime();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const label =
            route.name === 'FloorPlan' ? 'Plan' :
            route.name === 'TaskList' ? 'Tâches' :
            route.name === 'History' ? 'Historique' :
            route.name === 'Agenda' ? 'Agenda' :
            route.name === 'Stats' ? 'Stats' : 'Admin';
          return <TabIcon label={label} focused={focused} />;
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
      })}
    >
      <Tab.Screen name="FloorPlan" component={FloorPlanScreen} options={{ tabBarLabel: 'Plan' }} />
      <Tab.Screen name="TaskList" component={TaskListScreen} options={{ tabBarLabel: 'Tâches' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Historique' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ tabBarLabel: 'Agenda' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: 'Stats' }} />
      <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarLabel: 'Admin' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const session = useAuthStore((s: any) => s.session);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
