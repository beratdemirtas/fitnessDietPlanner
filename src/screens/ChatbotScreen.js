import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([]); // { type: 'bot'|'user', text: string }
  const [text, setText] = useState('');
  const [welcomeShown, setWelcomeShown] = useState(false);
  const scrollRef = useRef(null);

  const apiUrl = 'https://localhost:7112/AI/ai';

  useEffect(() => {
    if (visible && !welcomeShown) {
      setMessages((m) => [...m, { type: 'bot', text: 'Hoş geldiniz. Ben Yarım Akıllı Asistan. Nasıl yardımcı olabilirim!' }]);
      setWelcomeShown(true);
    }
  }, [visible, welcomeShown]);

  useEffect(() => {
    // scroll to end when messages change
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  const togglePanel = () => {
    setVisible((v) => !v);
  };

  const sendMessage = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText('');
    setMessages((m) => [...m, { type: 'user', text: msg }]);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: '*/*' },
        body: JSON.stringify({ message: msg }),
      });

      let data;
      const contentType = response.headers.get ? response.headers.get('content-type') : '';
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        data = json.reply || JSON.stringify(json);
      } else {
        data = await response.text();
      }

      setMessages((m) => [...m, { type: 'bot', text: String(data) }]);
    } catch (err) {
      setMessages((m) => [...m, { type: 'bot', text: 'ERROR: ' + err.message }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header / Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chatbot</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.infoText}>TeknoAI Asistan ile konuşun. Sağ alt kökteki balona dokunarak sohbet penceresini açın.</Text>
      </View>

      {/* Floating bubble */}
      <TouchableOpacity style={styles.bubble} onPress={togglePanel} activeOpacity={0.9}>
        <Text style={styles.bubbleText}>TeknoAI</Text>
      </TouchableOpacity>

      {/* Chat panel */}
      {visible && (
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.panelWrap}>
          <View style={styles.panel}>
            <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ paddingVertical: 10 }}>
              {messages.map((m, i) => (
                <View key={i} style={m.type === 'bot' ? styles.botMsgWrap : styles.userMsgWrap}>
                  <Text style={m.type === 'bot' ? styles.botMsg : styles.userMsg}>{m.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Mesajınızı yazın..."
                style={styles.input}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendBtnText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBtn: { padding: 8 },
  headerBtnText: { color: '#0063f7', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: { flex: 1, padding: 18 },
  infoText: { color: '#333', fontSize: 14 },

  bubble: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    minWidth: 70,
    height: 60,
    paddingHorizontal: 12,
    backgroundColor: 'linear-gradient(135deg, #0063f7, #00c6ff)' /* RN doesn't support CSS gradients here; keep fallback below */,
    backgroundColor: '#0063f7',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 9999,
  },
  bubbleText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  panelWrap: {
    position: 'absolute',
    right: 25,
    bottom: 95,
    width: 380,
    maxHeight: 400,
    zIndex: 9999,
  },
  panel: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  messages: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    paddingHorizontal: 12,
  },
  botMsgWrap: { alignItems: 'flex-start', marginBottom: 8 },
  userMsgWrap: { alignItems: 'flex-end', marginBottom: 8 },
  botMsg: {
    backgroundColor: '#e1f5fe',
    color: '#0b3954',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '80%',
    fontSize: 14,
    lineHeight: 18,
  },
  userMsg: {
    backgroundColor: '#0063f7',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '80%',
    fontSize: 14,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#0063f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '700' },
});
