import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProviderProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const res = await client.get('/providers/me');
      setProfile(res.data);
    } catch (e) {
      console.log('Profile fetch error', e?.response?.data || e.message);
      setError('Imeshindwa kupata taarifa za profile. Jaribu tena.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function onRefresh() {
    setRefreshing(true);
    fetchProfile();
  }

  function handleLogout() {
    Alert.alert('Toka', 'Una uhakika unataka kutoka?', [
      { text: 'Ghairi', style: 'cancel' },
      { text: 'Toka', style: 'destructive', onPress: logout },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryBtnText}>Jaribu Tena</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Fundi'}</Text>
        <Text style={styles.phone}>{profile?.phone}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {profile?.rating ? Number(profile.rating).toFixed(1) : '—'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.experience_years ?? '—'}</Text>
          <Text style={styles.statLabel}>Miaka ya Uzoefu</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.services?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Huduma</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kuhusu</Text>
        <Text style={styles.bioText}>
          {profile?.bio || 'Bado hujaongeza maelezo yako. Bonyeza "Hariri Profile" kuongeza.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Huduma Ninazotoa</Text>
        {profile?.services?.length ? (
          profile.services.map((s) => (
            <View key={s.id} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.servicePrice}>
                {s.price_min && s.price_max
                  ? `TSh ${s.price_min} - ${s.price_max}`
                  : 'Bei haijawekwa'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.bioText}>Bado hujaongeza huduma zozote.</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editBtnText}>Hariri Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Toka</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: '#0F0F14',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  phone: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A24',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#1A1A24',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#A78BFA',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  bioText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
  },
  serviceName: {
    color: '#fff',
    fontSize: 14,
  },
  servicePrice: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  editBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  logoutBtnText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 15,
  },
});
