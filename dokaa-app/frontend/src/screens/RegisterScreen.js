import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthInput from '../components/PasswordStrengthInput';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // 'customer' | 'provider'
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !phone || !password) {
      Alert.alert('Kosa', 'Jaza taarifa zote zinazohitajika.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Kosa', 'Password iwe angalau herufi 6.');
      return;
    }
    setLoading(true);
    try {
      await register({ full_name: fullName, phone, password, role });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Imeshindikana kusajili. Jaribu tena.';
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Jisajili</Text>
        <Text style={styles.subtitle}>Tengeneza akaunti mpya</Text>

        <View style={styles.roleSwitch}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
              Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'provider' && styles.roleButtonActive]}
            onPress={() => setRole('provider')}
          >
            <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>
              Fundi / Provider
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Jina kamili"
            placeholderTextColor="#8B8B94"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

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

        <PasswordStrengthInput
          value={password}
          onChangeText={setPassword}
          placeholder="Weka password"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Inasajili...' : 'Jisajili'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Una akaunti tayari? Ingia</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 24,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#17171D',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  roleText: {
    color: '#8B8B94',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#FFFFFF',
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
    marginTop: 20,
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
