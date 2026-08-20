import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import client from '../api/client';
import { connectSocket, getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen({ route }) {
  const { bookingId, otherPersonName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let socketInstance;

    async function setup() {
      // Pakia historia ya ujumbe
      try {
        const res = await client.get(`/messages/${bookingId}`);
        setMessages(res.data);
      } catch (e) {
        console.log('Load messages error', e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }

      // Unganisha socket
      socketInstance = await connectSocket();
      if (!socketInstance) return;

      socketInstance.emit('join_booking', bookingId);

      socketInstance.on('new_message', (msg) => {
        if (msg.booking_id === bookingId) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      socketInstance.on('user_typing', ({ is_typing }) => {
        setOtherTyping(is_typing);
      });
    }

    setup();

    return () => {
      const s = getSocket();
      if (s) {
        s.emit('leave_booking', bookingId);
        s.off('new_message');
        s.off('user_typing');
      }
    };
  }, [bookingId]);

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;

    const s = getSocket();
    if (s) {
      s.emit('send_message', { booking_id: bookingId, message: text });
      s.emit('typing', { booking_id: bookingId, is_typing: false });
    }
    setInputText('');
  }

  function handleTyping(text) {
    setInputText(text);
    const s = getSocket();
    if (!s) return;

    s.emit('typing', { booking_id: bookingId, is_typing: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      s.emit('typing', { booking_id: bookingId, is_typing: false });
    }, 1500);
  }

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{otherPersonName || 'Mazungumzo'}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        renderItem={({ item }) => {
          const isMine = item.sender_id === user?.id;
          return (
            <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={styles.bubbleText}>{item.message}</Text>
                <Text style={styles.bubbleTime}>
                  {new Date(item.created_at).toLocaleTimeString('sw-TZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Bado hakuna ujumbe. Anza mazungumzo!</Text>
        }
      />

      {otherTyping && <Text style={styles.typingText}>Anaandika...</Text>}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Andika ujumbe..."
          placeholderTextColor="#6B7280"
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F14' },
  center: { flex: 1, backgroundColor: '#0F0F14', justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: { backgroundColor: '#8B5CF6', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#1A1A24', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 14 },
  bubbleTime: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 60 },
  typingText: { color: '#9CA3AF', fontSize: 12, paddingHorizontal: 20, paddingBottom: 4, fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A24',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  sendBtn: {
    backgroundColor: '#8B5CF6',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
