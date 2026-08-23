import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import client from '../api/client';
import { Linking } from 'react-native';

function isOpenNow(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const now = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

function openWhatsApp(number) {
  if (!number) return;
  let digits = number.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '255' + digits.slice(1);
  Linking.openURL(`https://wa.me/${digits}`);
}

export default function ProviderDetailScreen({ route, navigation }) {
  const { providerId } = route.params;
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProvider();
  }, []);

  async function loadProvider() {
    try {
      const res = await client.get(`/providers/${providerId}`);
      setProvider(res.data);
    } catch (e) {
      console.log('Load provider error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', 'Imeshindwa kupata taarifa za fundi.');
    } finally {
      setLoading(false);
    }
  }

  function openBookingModal(service) {
    setSelectedService(service);
    setNotes('');
    setScheduledAt('');
    setModalVisible(true);
  }

  async function submitBooking() {
    setSubmitting(true);
    try {
      await client.post('/bookings', {
        provider_id: providerId,
        service_id: selectedService.id,
        scheduled_at: scheduledAt || null,
        notes: notes.trim() || null,
      });
      setModalVisible(false);
      Alert.alert('Booking Imetumwa', 'Ombi lako limetumwa kwa fundi. Subiri akubali.', [
        { text: 'Sawa', onPress: () => navigation.navigate('MyBookings') },
      ]);
    } catch (e) {
      console.log('Create booking error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', 'Imeshindwa kutuma booking. Jaribu tena.');
    } finally {
      setSubmitting(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {provider?.full_name ? provider.full_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{provider?.full_name}</Text>
          {provider?.verification_status === 'verified' && (
            <Text style={styles.verifiedBadge}>✓</Text>
          )}
        </View>
        <Text style={styles.rating}>
          ⭐ {provider?.avg_rating ? Number(provider.avg_rating).toFixed(1) : 'Mpya'} ·{' '}
          {provider?.total_reviews || 0} reviews
        </Text>
        {provider?.working_hours_start && provider?.working_hours_end && (
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOpenNow(provider.working_hours_start, provider.working_hours_end) ? '#34D399' : '#F87171' },
              ]}
            />
            <Text style={styles.statusText}>
              {isOpenNow(provider.working_hours_start, provider.working_hours_end) ? 'Ameonline sasa' : 'Hayupo sasa'}
              {' · '}{provider.working_hours_start.slice(0,5)} - {provider.working_hours_end.slice(0,5)}
            </Text>
          </View>
        )}
        {provider?.whatsapp_number && (
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => openWhatsApp(provider.whatsapp_number)}
          >
            <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kuhusu</Text>
        <Text style={styles.bioText}>{provider?.bio || 'Hakuna maelezo bado.'}</Text>
        {provider?.experience_years != null && (
          <Text style={styles.detailText}>Uzoefu: {provider.experience_years} miaka</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Huduma</Text>
        {provider?.services?.length ? (
          provider.services.map((s) => (
            <View key={s.id} style={styles.serviceRow}>
              <View>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.servicePrice}>
                  {s.price_min && s.price_max
                    ? `TSh ${s.price_min} - ${s.price_max}`
                    : 'Bei haijawekwa'}
                </Text>
              </View>
              <TouchableOpacity style={styles.bookBtn} onPress={() => openBookingModal(s)}>
                <Text style={styles.bookBtnText}>Book</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.bioText}>Hakuna huduma zilizowekwa.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maoni ({provider?.reviews?.length || 0})</Text>
        {provider?.reviews?.length ? (
          provider.reviews.map((r, idx) => (
            <View key={idx} style={styles.reviewRow}>
              <Text style={styles.reviewName}>
                {r.full_name} · ⭐ {r.rating}
              </Text>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.bioText}>Bado hakuna maoni.</Text>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book: {selectedService?.name}</Text>

            <Text style={styles.label}>Tarehe na Saa (hiari)</Text>
            <TextInput
              style={styles.input}
              value={scheduledAt}
              onChangeText={setScheduledAt}
              placeholder="mfano: 2026-08-25 14:00"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.label}>Maelezo (hiari)</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Eleza kazi unayohitaji..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Ghairi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={submitBooking}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Tuma Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F14' },
  content: { padding: 20, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: '#0F0F14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedBadge: {
    color: '#fff',
    backgroundColor: '#34D399',
    fontSize: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
    fontWeight: '900',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#9CA3AF', fontSize: 12 },
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  whatsappBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  rating: { color: '#FBBF24', fontSize: 14, marginTop: 4 },
  section: {
    backgroundColor: '#1A1A24',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { color: '#A78BFA', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  bioText: { color: '#D1D5DB', fontSize: 14, lineHeight: 20 },
  detailText: { color: '#9CA3AF', fontSize: 13, marginTop: 6 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
  },
  serviceName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  servicePrice: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  bookBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reviewRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
  },
  reviewName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  reviewComment: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#17171D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
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
    minHeight: 80,
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
