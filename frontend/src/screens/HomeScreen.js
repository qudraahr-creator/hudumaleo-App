import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const res = await client.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.log('Failed to load categories', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Habari, {user?.full_name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>{user?.role === 'provider' ? 'Fundi/Provider' : 'Customer'}</Text>
        </View>
        <View style={styles.headerActions}>
          {user?.role === 'provider' && (
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
              <Text style={styles.profileBtnText}>Profile</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Toka</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Huduma Zinazopatikana</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCategories} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryCard}>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>Hakuna categories bado.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  role: {
    color: '#8B8B94',
    fontSize: 13,
    marginTop: 2,
  },
  logout: {
    color: '#EF4444',
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  categoryCard: {
    backgroundColor: '#17171D',
    borderWidth: 1,
    borderColor: '#2A2A33',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#8B8B94',
    textAlign: 'center',
    marginTop: 40,
  },
});
