import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert('Kosa', 'Jaza namba ya simu na password.');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Imeshindikana ku-login. Jaribu tena.';
      Alert.alert('Kosa', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Karibu HudumaLeo 👋</Text>
      <Text style={styles.subtitle}>Ingia kuendelea</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Namba ya simu"
          placeholderTextColor="#8B8B94"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8B8B94"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Inaingia...' : 'Ingia'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Huna akaunti? Jisajili</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: '#8B8B94',
    fontSize: 15,
    marginBottom: 32,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#2A2A33',
    borderRadius: 12,
    backgroundColor: '#17171D',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  input: {
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    color: '#A78BFA',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
