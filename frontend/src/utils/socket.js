import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../api/client';

// Ondoa "/api" mwishoni mwa BASE_URL kwa sababu socket.io haitumii /api prefix
const SOCKET_URL = BASE_URL.replace(/\/api$/, '');

let socket = null;

export async function connectSocket() {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => console.log('🟢 Socket imeunganishwa'));
  socket.on('connect_error', (err) => console.log('Socket connect error:', err.message));
  socket.on('disconnect', () => console.log('🔴 Socket imekatika'));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
