// ============================================================
// CHORIFY — Notifications Push (Expo)
// ============================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configuration du handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Demander la permission et enregistrer le token push.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Sauvegarder le token dans le profil
  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);

  // Android : canal de notification
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chores', {
      name: 'Tâches ménagères',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}

/**
 * Planifier une notification locale pour une tâche.
 */
export async function scheduleTaskReminder(
  taskName: string,
  targetName: string,
  triggerDate: Date,
  priority: 'orange' | 'red'
): Promise<string> {
  const isUrgent = priority === 'red';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: isUrgent ? `⚠️ ${taskName} en retard !` : `🔔 ${taskName} bientôt`,
      body: isUrgent
        ? `${targetName} — cette tâche a dépassé son délai.`
        : `${targetName} — pensez-y dans les prochains jours.`,
      priority: isUrgent
        ? Notifications.AndroidNotificationPriority.HIGH
        : Notifications.AndroidNotificationPriority.DEFAULT,
      },
    trigger: {
      channelId: 'chores',
      date: triggerDate,
    },
  });

  return id;
}

/**
 * Annuler toutes les notifications planifiées.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
