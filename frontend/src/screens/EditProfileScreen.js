import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import client from '../api/client';
import { getCurrentLocation } from '../utils/location';

export default function EditProfileScreen({ navigation }) {
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allServices, setAllServices] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [addingService, setAddingService] = useState(false);

  const [locationStatus, setLocationStatus] = useState(null); // null | 'loading' | 'saved' | 'error'
  const [currentWard, setCurrentWard] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, servicesRes] = await Promise.all([
        client.get('/providers/me'),
        client.get('/services'),
      ]);
      setBio(profileRes.data.bio || '');
      setExperienceYears(
        profileRes.data.experience_years != null ? String(profileRes.data.experience_years) : ''
      );
      setMyServices(profileRes.data.services || []);
      setAllServices(servicesRes.data || []);
    } catch (e) {
      console.log('EditProfile load error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', 'Imeshindwa kupata taarifa. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await client.put('/providers/me/profile', {
        bio: bio.trim(),
        experience_years: experienceYears ? parseInt(experienceYears, 10) : null,
      });
      Alert.alert('Sawa', 'Profile imesasishwa.', [
        { text: 'Sawa', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.log('Save profile error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', 'Imeshindwa kusasisha profile. Jaribu tena.');
    } finally {
      setSaving(false);
    }
  }

  function openServicePicker() {
    setSelectedService(null);
    setPriceMin('');
    setPriceMax('');
    setPickerVisible(true);
  }

  async function handleAddService() {
    if (!selectedService) {
      Alert.alert('Chagua Huduma', 'Tafadhali chagua huduma kwanza.');
      return;
    }
    setAddingService(true);
    try {
      await client.post('/providers/me/services', {
        service_id: selectedService.id,
        price_min: priceMin ? parseInt(priceMin, 10) : null,
        price_max: priceMax ? parseInt(priceMax, 10) : null,
      });
      setPickerVisible(false);
      loadData();
    } catch (e) {
      console.log('Add service error', e?.response?.data || e.message);
      Alert.alert('Hitilafu', 'Imeshindwa kuongeza huduma. Jaribu tena.');
    } finally {
      setAddingService(false);
    }
  }


  async function handleSetLocation() {
    setLocationStatus('loading');
    const loc = await getCurrentLocation();
    if (loc.error) {
      setLocationStatus('error');
      Alert.alert(
        'Ruhusa Imekataliwa',
        'Tafadhali washa GPS/Location kwenye mipangilio ya simu ili wateja waweze kukuona.'
      );
      return;
    }
    try {
      const res = await client.post('/providers/me/location', {
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius_km: 15,
      });
      setCurrentWard(res.data.ward || res.data.city || 'Eneo limehifadhiwa');
      setLocationStatus('saved');
    } catch (e) {
      console.log('Save location error', e?.response?.data || e.message);
      setLocationStatus('error');
      Alert.alert('Hitilafu', 'Imeshindwa kuhifadhi eneo. Jaribu tena.');
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
      <Text style={styles.title}>Hariri Profile</Text>

      <Text style={styles.label}>Kuhusu (Bio)</Text>
      <TextInput
        style={styles.textArea}
        value={bio}
        onChangeText={setBio}
        placeholder="Andika maelezo mafupi kuhusu wewe na ujuzi wako..."
        placeholderTextColor="#6B7280"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Miaka ya Uzoefu</Text>
      <TextInput
        style={styles.input}
        value={experienceYears}
        onChangeText={setExperienceYears}
        placeholder="mfano: 5"
        placeholderTextColor="#6B7280"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Hifadhi Profile</Text>
        )}
      </TouchableOpacity>


      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Eneo la Kazi</Text>
      </View>
      <Text style={styles.locationHint}>
        Weka eneo lako la sasa ili wateja walio karibu wakuone kwa urahisi.
      </Text>
      <TouchableOpacity
        style={styles.locationBtn}
        onPress={handleSetLocation}
        disabled={locationStatus === 'loading'}
      >
        {locationStatus === 'loading' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.locationBtnText}>
            📍 {locationStatus === 'saved' ? 'Sasisha Eneo Langu' : 'Tumia Eneo Langu la Sasa'}
          </Text>
        )}
      </TouchableOpacity>
      {locationStatus === 'saved' && (
        <Text style={styles.locationSaved}>✓ Eneo limehifadhiwa: {currentWard}</Text>
      )}

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Huduma Ninazotoa</Text>
        <TouchableOpacity onPress={openServicePicker}>
          <Text style={styles.addLink}>+ Ongeza</Text>
        </TouchableOpacity>
      </View>

      {myServices.length ? (
        myServices.map((s) => (
          <View key={s.id} style={styles.serviceRow}>
            <Text style={styles.serviceName}>{s.name}</Text>
            <Text style={styles.servicePrice}>
              {s.price_min && s.price_max ? `TSh ${s.price_min} - ${s.price_max}` : 'Bei haijawekwa'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>Bado hujaongeza huduma zozote.</Text>
      )}

      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ongeza Huduma</Text>

            <FlatList
              data={allServices}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.serviceOption,
                    selectedService?.id === item.id && styles.serviceOptionSelected,
                  ]}
                  onPress={() => setSelectedService(item)}
                >
                  <Text style={styles.serviceOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.label}>Bei ya Chini (TSh)</Text>
            <TextInput
              style={styles.input}
              value={priceMin}
              onChangeText={setPriceMin}
              keyboardType="numeric"
              placeholder="mfano: 10000"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.label}>Bei ya Juu (TSh)</Text>
            <TextInput
              style={styles.input}
              value={priceMax}
              onChangeText={setPriceMax}
              keyboardType="numeric"
              placeholder="mfano: 50000"
              placeholderTextColor="#6B7280"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={styles.modalCancelText}>Ghairi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddService}
                disabled={addingService}
              >
                {addingService ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Hifadhi</Text>
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
  content: { padding: 20, paddingBottom: 60 },
  center: {
    flex: 1,
    backgroundColor: '#0F0F14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 24 },
  label: { color: '#9CA3AF', fontSize: 13, marginBottom: 6, marginTop: 14 },
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  locationHint: { color: '#6B7280', fontSize: 12, marginBottom: 12, lineHeight: 18 },
  locationBtn: {
    backgroundColor: '#2A2A38',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  locationBtnText: { color: '#A78BFA', fontWeight: '700', fontSize: 14 },
  locationSaved: { color: '#34D399', fontSize: 12, marginTop: 8, textAlign: 'center' },
  divider: {
    height: 1,
    backgroundColor: '#2A2A38',
    marginVertical: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#A78BFA', fontSize: 16, fontWeight: '700' },
  addLink: { color: '#8B5CF6', fontWeight: '700', fontSize: 14 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A24',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  serviceName: { color: '#fff', fontSize: 14 },
  servicePrice: { color: '#9CA3AF', fontSize: 13 },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#17171D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  serviceOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 6,
  },
  serviceOptionSelected: { backgroundColor: '#2A1F4D' },
  serviceOptionText: { color: '#fff', fontSize: 14 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
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
