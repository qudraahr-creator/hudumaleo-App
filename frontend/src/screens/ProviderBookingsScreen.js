import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
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

export default function ProviderBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

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

  async function updateStatus(bookingId, statusCode) {
    setUpdatingId(bookingId);
    try {
      await client.patch(`/bookings/${bookingId}/status`, { status_code: statusCode });
      loadBookings();
    } catch (e) {
      console.log('Update status error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', 'Imeshindwa kusasisha booking. Jaribu tena.');
    } finally {
      setUpdatingId(null);
    }
  }

  function confirmAction(booking, statusCode, label) {
    Alert.alert(label, `Una uhakika unataka ${label.toLowerCase()} booking hii?`, [
      { text: 'Ghairi', style: 'cancel' },
      { text: 'Ndiyo', onPress: () => updateStatus(booking.id, statusCode) },
    ]);
  }

  function openChat(item) {
    navigation.navigate('Chat', { bookingId: item.id, otherPersonName: item.customer_name });
  }

  function renderActions(item) {
    const isUpdating = updatingId === item.id;
    if (isUpdating) {
      return <ActivityIndicator color="#8B5CF6" style={{ marginTop: 10 }} />;
    }
    switch (item.status_code) {
      case 'pending':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => confirmAction(item, 'accepted', 'Kubali')}
            >
              <Text style={styles.actionBtnText}>Kubali</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => confirmAction(item, 'rejected', 'Kataa')}
            >
              <Text style={styles.actionBtnText}>Kataa</Text>
            </TouchableOpacity>
          </View>
        );
      case 'accepted':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.progressBtn]}
              onPress={() => confirmAction(item, 'in_progress', 'Anza Kazi')}
            >
              <Text style={styles.actionBtnText}>Anza Kazi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => confirmAction(item, 'cancelled', 'Ghairi')}
            >
              <Text style={styles.actionBtnText}>Ghairi</Text>
            </TouchableOpacity>
          </View>
        );
      case 'in_progress':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => confirmAction(item, 'completed', 'Kamilisha')}
            >
              <Text style={styles.actionBtnText}>Kamilisha Kazi</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
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
              <Text style={styles.customerName}>{item.customer_name}</Text>
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
            {item.customer_phone && (
              <Text style={styles.detailText}>📞 {item.customer_phone}</Text>
            )}
            {item.scheduled_at && (
              <Text style={styles.detailText}>
                🕐 {new Date(item.scheduled_at).toLocaleString('sw-TZ')}
              </Text>
            )}
            {item.notes && <Text style={styles.detailText}>📝 {item.notes}</Text>}

            <TouchableOpacity style={styles.chatBtn} onPress={() => openChat(item)}>
              <Text style={styles.chatBtnText}>💬 Chat</Text>
            </TouchableOpacity>

            {renderActions(item)}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Bado huna bookings zozote.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F14', padding: 20, paddingTop: 50 },
  center: {
    flex: 1,
    backgroundColor: '#0F0F14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  card: {
    backgroundColor: '#1A1A24',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  serviceName: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  detailText: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  chatBtn: {
    backgroundColor: '#2A2A38',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  chatBtnText: { color: '#A78BFA', fontWeight: '700', fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtn: { backgroundColor: '#34D399' },
  rejectBtn: { backgroundColor: '#F87171' },
  progressBtn: { backgroundColor: '#60A5FA' },
  completeBtn: { backgroundColor: '#8B5CF6' },
  actionBtnText: { color: '#0F0F14', fontWeight: '700', fontSize: 13 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
