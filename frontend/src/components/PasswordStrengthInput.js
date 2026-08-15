import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';

// Tiers zinazofanana na screenshot: paperclip -> bike lock -> safe -> bank vault
const TIERS = [
  { max: 28, label: 'A paperclip', color: '#EF4444', crack: 'Sekunde chache' },
  { max: 45, label: 'A bike lock', color: '#F59E0B', crack: 'Masaa machache' },
  { max: 60, label: 'A safe', color: '#EAB308', crack: 'Miaka michache' },
  { max: 80, label: 'A bank vault', color: '#22C55E', crack: 'Maelfu ya miaka' },
  { max: Infinity, label: 'Fort Knox', color: '#06B6D4', crack: 'Mamilioni ya miaka' },
];

function calculateEntropy(password) {
  if (!password) return 0;

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) return 0;

  // entropy bits = length * log2(poolSize)
  const entropy = password.length * Math.log2(poolSize);
  return Math.round(entropy);
}

function getTier(entropyBits) {
  return TIERS.find((t) => entropyBits <= t.max) || TIERS[TIERS.length - 1];
}

export default function PasswordStrengthInput({ value, onChangeText, placeholder = 'Password' }) {
  const entropy = useMemo(() => calculateEntropy(value), [value]);
  const tier = useMemo(() => getTier(entropy), [entropy]);
  const progressPercent = Math.min(100, (entropy / 80) * 100);

  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animatedColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progressPercent,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const barWidth = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, value ? { borderColor: tier.color } : null]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8B8B94"
          secureTextEntry={false}
          autoCapitalize="none"
        />
      </View>

      {value.length > 0 && (
        <>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: barWidth, backgroundColor: tier.color },
              ]}
            />
          </View>

          <View style={[styles.card, { borderColor: `${tier.color}55` }]}>
            <View>
              <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
              <Text style={styles.crackTime}>Cracked in {tier.crack}</Text>
              <Text style={styles.entropyText}>{entropy} bits of entropy</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#2A2A33',
    borderRadius: 12,
    backgroundColor: '#17171D',
    paddingHorizontal: 14,
  },
  input: {
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#2A2A33',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  card: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#141419',
    padding: 14,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  crackTime: {
    color: '#B4B4BD',
    fontSize: 13,
    marginBottom: 2,
  },
  entropyText: {
    color: '#7A7A85',
    fontSize: 12,
  },
});
