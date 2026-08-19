import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

const STATUS_LABELS = {
  pending: 'Inasubiri',
  accepted: 'Imekubaliwa',
  rejected: 'Imekataliwa',
  in_progress: 'Inaendelea',
  completed: 'Imekamilika',
  cancelled: 'Imeghairiwa',
};

const STATUS_COLORS = {
  pending: '#FBBF24',
  accepted: '#34D399',
  rejected: '#F87171',
  in_progress: '#60A5FA',
  completed: '#8B5CF6',
  cancelled: '#6B7280',
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const res = await client.get('/bookings/mine');
      setBookings(res.data);
    } catch (e) {
      console.log('Load bookings error', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  function onRefresh() {
    setRefreshing(true);
    loadBookings();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookings Zangu</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.providerName}>{item.provider_name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[item.status_code] + '22' },
                ]}
              >
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status_code] }]}>
                  {STATUS_LABELS[item.status_code]}
                </Text>
              </View>
            </View>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            {item.scheduled_at && (
              <Text style={styles.detailText}>
                🕐 {new Date(item.scheduled_at).toLocaleString('sw-TZ')}
              </Text>
            )}
            {item.notes && <Text style={styles.detailText}>📝 {item.notes}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Bado huna bookings zozote.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F14', padding: 20, paddingTop: 50 },
  center: { flex: 1, backgroundColor: '#0F0F14', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  card: { backgroundColor: '#1A1A24', borderRadius: 14, padding: 16, marginBottom: 14 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  providerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  serviceName: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  detailText: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
