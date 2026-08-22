import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import client from '../api/client';
import { getCurrentLocation } from '../utils/location';

export default function ProvidersListScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params || {};
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const loadProviders = useCallback(async () => {
    try {
      const loc = await getCurrentLocation();
      const params = {};
      if (categoryId) params.category_id = categoryId;

      if (loc.error) {
        setLocationDenied(true);
      } else {
        setLocationDenied(false);
        params.lat = loc.latitude;
        params.lng = loc.longitude;
        params.radius = 30;
      }

      const res = await client.get('/providers', { params });
      setProviders(res.data);
    } catch (e) {
      console.log('Load providers error', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  function onRefresh() {
    setRefreshing(true);
    loadProviders();
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
      <Text style={styles.title}>{categoryName || 'Mafundi Walio Karibu'}</Text>
      {locationDenied && (
        <Text style={styles.locationWarning}>
          📍 Washa GPS ili kuona mafundi walio karibu zaidi nawe.
        </Text>
      )}
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProviderDetail', { providerId: item.id })}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.rating}>
                  ⭐ {item.avg_rating ? Number(item.avg_rating).toFixed(1) : 'Mpya'}
                </Text>
                {item.distance_km != null && (
                  <Text style={styles.distance}>
                    {' '}
                    · {Number(item.distance_km).toFixed(1)} km
                  </Text>
                )}
              </View>
              {item.ward && <Text style={styles.ward}>{item.ward}</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Hakuna mafundi waliopatikana kwa huduma hii.</Text>
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
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  locationWarning: {
    color: '#FBBF24',
    fontSize: 12,
    marginBottom: 14,
    backgroundColor: '#2A230F',
    padding: 10,
    borderRadius: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  metaRow: { flexDirection: 'row', marginTop: 4 },
  rating: { color: '#FBBF24', fontSize: 13 },
  distance: { color: '#9CA3AF', fontSize: 13 },
  ward: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
