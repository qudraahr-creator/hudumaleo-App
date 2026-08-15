# Dokaa Frontend (React Native + Expo)

## Kuendesha kwenye Termux

### 1. Sakinisha Node.js (kama hujafanya kwa backend)
```bash
pkg install nodejs git
```

### 2. Sakinisha dependencies
```bash
cd frontend
npm install
```

### 3. Badilisha BASE_URL
Fungua `src/api/client.js` na hakikisha `BASE_URL` inaelekeza sehemu sahihi backend yako inapoendesha:
- Kama backend na simu ni kifaa kimoja: `http://localhost:5000/api`
- Kama unatumia Expo Go kwenye simu tofauti na backend (WiFi moja): tumia IP ya kompyuta/simu yenye backend, mfano `http://192.168.1.5:5000/api`

Pata IP yako kwa: `ifconfig` au `ip addr` kwenye Termux.

### 4. Anzisha Expo
```bash
npx expo start
```

Itaonyesha QR code — fungua **Expo Go** app kwenye simu yako (pakua kutoka Play Store) na scan QR hiyo.

> **Kumbuka**: Termux haiwezi kuendesha Android emulator, kwa hiyo njia rahisi zaidi ni kutumia **Expo Go** app kwenye simu halisi kuunganisha na dev server.

## Muundo wa Folder
```
frontend/
  App.js                          -> Entry point
  src/
    api/client.js                 -> Axios + JWT interceptor
    context/AuthContext.js        -> Login/Register/Logout state
    navigation/AppNavigator.js    -> Auth stack vs App stack
    screens/
      LoginScreen.js
      RegisterScreen.js           -> Ina PasswordStrengthInput
      HomeScreen.js
    components/
      PasswordStrengthInput.js    -> "Bank vault" style password strength UI
```

## Kuhusu PasswordStrengthInput
Component hii inakokotoa **entropy bits** kutoka kwenye password (based on character variety + length) na kuonyesha:
- Progress bar inayobadilika rangi (nyekundu → njano → kijani)
- "Tier" card yenye jina la kuchekesha (paperclip → bike lock → safe → bank vault) na muda inavyoweza "kuvunjwa"

Tumika kwenye `RegisterScreen.js`. Unaweza kuongeza kwenye Login pia ukitaka, ila kwa kawaida haihitajiki huko kwani user tayari ana password.

## Hatua Zinazofuata
- Ongeza screen za: Provider list, Provider profile, Booking flow, Chat, Reviews
- Ongeza Google Maps / react-native-maps kwa location picking
- Ongeza Firebase Cloud Messaging kwa push notifications
- Ongeza image upload (Cloudinary) kwa verification documents na profile photos
