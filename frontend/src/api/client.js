# Change: const BASE_URL = 'https://hudumaleo-app.onrender.com/api';

# Admin
nano admin/script.js
# Change: const API_BASE = 'https://hudumaleo-app.onrender.com/api';

# Push to GitHub
git add .
git commit -m "Update production API URL"
git pushimport axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BADILISHA hii kwa IP ya kompyuta/simu inayoendesha backend
// Kama unatumia Termux kwenye simu moja kwa emulator/simu hiyohiyo: http://localhost:5000/api
// Kama backend iko kwenye kompyuta na simu tofauti kwenye WiFi moja: http://<IP_YA_BACKEND>:5000/api
const BASE_URL = 'https://hudumaleo-app.onrender.com/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
export { BASE_URL };
