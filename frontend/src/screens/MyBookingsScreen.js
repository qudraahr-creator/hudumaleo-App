import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
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

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payBooking, setPayBooking] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [paying, setPaying] = useState(false);

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

  function openChat(item) {
    navigation.navigate('Chat', { bookingId: item.id, otherPersonName: item.provider_name });
  }

  function openReviewModal(item) {
    setReviewBooking(item);
    setRating(0);
    setComment('');
    setReviewModalVisible(true);
  }

  function openPayModal(item) {
    setPayBooking(item);
    setPayAmount(item.price_agreed ? String(item.price_agreed) : '');
    setPayPhone('');
    setPayModalVisible(true);
  }

  async function submitReview() {
    if (rating < 1) {
      Alert.alert('Chagua Rating', 'Tafadhali chagua nyota angalau moja.');
      return;
    }
    setSubmittingReview(true);
    try {
      await client.post('/reviews', {
        booking_id: reviewBooking.id,
        provider_id: reviewBooking.provider_id,
        rating,
        comment: comment.trim() || null,
      });
      setReviewModalVisible(false);
      Alert.alert('Asante!', 'Review yako imetumwa.');
      loadBookings();
    } catch (e) {
      console.log('Submit review error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', e?.response?.data?.error || 'Imeshindwa kutuma review. Jaribu tena.');
    } finally {
      setSubmittingReview(false);
    }
  }

  async function submitPayment() {
    const amountNum = parseInt(payAmount, 10);
    if (!amountNum || amountNum < 1) {
      Alert.alert('Bei Sahihi', 'Tafadhali weka kiasi sahihi cha malipo.');
      return;
    }
    if (!payPhone.trim() || payPhone.trim().length < 9) {
      Alert.alert('Namba ya Simu', 'Tafadhali weka namba sahihi ya simu (mfano 0712345678).');
      return;
    }
    setPaying(true);
    try {
      await client.post('/payments/initiate', {
        booking_id: payBooking.id,
        phone_number: payPhone.trim(),
        amount: amountNum,
      });
      setPayModalVisible(false);
      Alert.alert(
        'Ombi Limetumwa',
        'Angalia simu yako uweke PIN yako kukamilisha malipo.'
      );
    } catch (e) {
      console.log('Payment error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', e?.response?.data?.error || 'Imeshindwa kuanzisha malipo. Jaribu tena.');
    } finally {
      setPaying(false);
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

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.chatBtn} onPress={() => openChat(item)}>
                <Text style={styles.chatBtnText}>💬 Chat</Text>
              </TouchableOpacity>

              {(item.status_code === 'accepted' ||
                item.status_code === 'in_progress' ||
                item.status_code === 'completed') && (
                <TouchableOpacity style={styles.payBtn} onPress={() => openPayModal(item)}>
                  <Text style={styles.payBtnText}>💳 Lipa</Text>
                </TouchableOpacity>
              )}

              {item.status_code === 'completed' && !item.has_review && (
                <TouchableOpacity style={styles.reviewBtn} onPress={() => openReviewModal(item)}>
                  <Text style={styles.reviewBtnText}>⭐ Toa Review</Text>
                </TouchableOpacity>
              )}
              {item.status_code === 'completed' && item.has_review && (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedBadgeText}>✓ Umeshatoa review</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Bado huna bookings zozote.</Text>}
      />

      <Modal visible={payModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lipa Huduma</Text>
            <Text style={styles.modalSubtitle}>{payBooking?.service_name}</Text>

            <Text style={styles.label}>Kiasi (TSh)</Text>
            <TextInput
              style={styles.input}
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder="mfano: 25000"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Namba ya Simu (M-Pesa/Tigo Pesa/Airtel)</Text>
            <TextInput
              style={styles.input}
              value={payPhone}
              onChangeText={setPayPhone}
              placeholder="mfano: 0712345678"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPayModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Ghairi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={submitPayment}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Lipa Sasa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={reviewModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Toa Review</Text>
            <Text style={styles.modalSubtitle}>{reviewBooking?.provider_name}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Maoni (hiari)</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Eleza kuhusu huduma uliyopata..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Ghairi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Tuma Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  chatBtn: {
    backgroundColor: '#2A2A38',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatBtnText: { color: '#A78BFA', fontWeight: '700', fontSize: 13 },
  payBtn: {
    backgroundColor: '#34D399',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payBtnText: { color: '#0F0F14', fontWeight: '700', fontSize: 13 },
  reviewBtn: {
    backgroundColor: '#FBBF24',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewBtnText: { color: '#0F0F14', fontWeight: '700', fontSize: 13 },
  reviewedBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  reviewedBadgeText: { color: '#34D399', fontSize: 12, fontWeight: '600' },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 60, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#17171D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 4, marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  star: { fontSize: 40, color: '#2A2A38' },
  starActive: { color: '#FBBF24' },
  label: { color: '#9CA3AF', fontSize: 13, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#1A1A24',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  textArea: {
    backgroundColor: '#1A1A24',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A38',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { color: '#9CA3AF', fontWeight: '600' },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
