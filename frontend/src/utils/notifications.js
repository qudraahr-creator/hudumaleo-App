import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import client from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }

  if (!Device.isDevice) {
    console.log('Push notifications zinahitaji simu halisi, siyo emulator.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Ruhusa ya notifications haijatolewa.');
    return null;
  }

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenResponse.data;
  } catch (e) {
    console.log('Imeshindwa kupata push token:', e.message);
    return null;
  }

  return token;
}

export async function savePushTokenToServer(token) {
  if (!token) return;
  try {
    await client.put('/auth/push-token', { push_token: token });
    console.log('Push token imehifadhiwa kwenye server.');
  } catch (e) {
    console.log('Imeshindwa kuhifadhi push token:', e?.response?.data || e.message);
  }
}
