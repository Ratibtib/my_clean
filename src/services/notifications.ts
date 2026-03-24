// ============================================================
// CHORIFY — Notifications Push (Expo)
// ============================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

let handlerConfigured = false;

function ensureHandler() {
  if (handlerConfigured) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    handlerConfigured = true;
  } catch (e) {
    console.warn('Notification handler setup failed:', e);
  }
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  ensureHandler();

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chores', {
        name: 'Tâches ménagères',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  } catch (e) {
    console.warn('Push registration error:', e);
    return null;
  }
}

export async function scheduleTaskReminder(
  taskName: string,
  targetName: string,
  triggerDate: Date,
  priority: 'orange' | 'red'
): Promise<string | null> {
  ensureHandler();

  try {
    const isUrgent = priority === 'red';
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: isUrgent ? `⚠️ ${taskName} en retard !` : `🔔 ${taskName} bientôt`,
        body: isUrgent
          ? `${targetName} — cette tâche a dépassé son délai.`
          : `${targetName} — pensez-y dans les prochains jours.`,
      },
      trigger: {
        date: triggerDate,
      } as any,
    });
    return id;
  } catch (e) {
    console.warn('Schedule notification error:', e);
    return null;
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Cancel notifications error:', e);
  }
}
