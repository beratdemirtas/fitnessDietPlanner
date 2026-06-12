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
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const GEMINI_API_KEY = 'AQ.Ab8RN6KgnavHmmW6X--Gl2P0gGO7B_mmpWZjZy6P6VdJ6uKQzg';
const GEMINI_MODEL = 'gemini-2.5-flash';
const VIGO_ICON = require('../../assets/images/vigo/icon.jpeg');

const SYSTEM_PROMPTS = {
  en: `You are Vigo, an AI fitness and diet planning assistant. Here's your introduction: "Hello! I'm Vigo, your AI fitness and diet planning assistant. I'm here to help you achieve your healthy lifestyle goals. You can ask me about weight loss, weight gain, exercise, nutrition, and much more."

Developer Information: I was developed by Hüseyin and Berat. If someone asks "who created you" or "who made you", share this information.

Rules:
- Always respond in the language the user is using
- Be an expert in fitness, nutrition, diet, and sports
- Prioritize user health and safety
- Keep answers short and clear
- Give advice, not medical diagnoses
- Be friendly and encouraging`,

  tr: `Sen Vigo adında bir yapay zeka asistanısın. Seni tanıtan genel tanıtım şu şekildedir: "Merhaba! Ben Vigo, fitness ve diyet planlama konusunda uzmanlaşmış yapay zeka asistanınız. Sağlıklı yaşam hedeflerinize ulaşmanızda size yardımcı olmak için buradayım. Kilo verme, kilo alma, egzersiz, beslenme ve daha pek çok konuda bana sorabilirsiniz."

Geliştirici Bilgisi: Beni Hüseyin ve Berat geliştirdi. Eğer "kim geliştirdi" veya "seni kim yaptı" gibi sorular sorulursa bu bilgiyi ver.

Kurallar:
- Her zaman kullanıcının dilinde cevap ver
- Fitness, beslenme, diyet ve spor konularında uzman ol
- Kullanıcının sağlığı ve güvenliği en önemli önceliklerin
- Cevaplarını kısa ve anlaşılır tutma
- Tavsiyeler ver, tıbbi tanı verme
- Dostça ve teşvik edici ol`,
};

export default function TalkToVigo() {
  const navigation = useNavigation();
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: language === 'en' 
        ? "Hello! I'm Vigo, your AI fitness and diet planning assistant. I'm here to help you achieve your healthy lifestyle goals. You can ask me about weight loss, weight gain, exercise, nutrition, and much more."
        : 'Merhaba! Ben Vigo, fitness ve diyet planlama konusunda uzmanlaşmış yapay zeka asistanınız. Sağlıklı yaşam hedeflerinize ulaşmanızda size yardımcı olmak için buradayım. Kilo verme, kilo alma, egzersiz, beslenme ve daha pek çok konuda bana sorabilirsiniz.',
      character: 'Vigo',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Reset chat when language changes
  useEffect(() => {
    setMessages([
      {
        type: 'bot',
        text: language === 'en' 
          ? "Hello! I'm Vigo, your AI fitness and diet planning assistant. I'm here to help you achieve your healthy lifestyle goals. You can ask me about weight loss, weight gain, exercise, nutrition, and much more."
          : 'Merhaba! Ben Vigo, fitness ve diyet planlama konusunda uzmanlaşmış yapay zeka asistanınız. Sağlıklı yaşam hedeflerinize ulaşmanızda size yardımcı olmak için buradayım. Kilo verme, kilo alma, egzersiz, beslenme ve daha pek çok konuda bana sorabilirsiniz.',
        character: 'Vigo',
      },
    ]);
  }, [language]);

  // Auto-scroll to end when messages update
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  const sendMessage = async () => {
    const userMessage = userInput.trim();
    if (!userMessage) return;

    // Add user message
    setMessages((prev) => [...prev, { type: 'user', text: userMessage }]);
    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: {
                text: SYSTEM_PROMPTS[language],
              },
            },
            contents: [
              {
                parts: messages
                  .filter((m) => m.type === 'bot' || m.type === 'user')
                  .map((m) => ({
                    text:
                      m.type === 'bot'
                        ? `Vigo: ${m.text}`
                        : `User: ${m.text}`,
                  }))
                  .concat([{ text: `User: ${userMessage}` }]),
              },
            ],
            generation_config: {
              temperature: 0.7,
              top_p: 0.9,
              top_k: 40,
              max_output_tokens: 1024,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || 'API hatası oluştu';
        throw new Error(errorMsg);
      }

      const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!botResponse) {
        throw new Error('Model yanıtı alınamadı. Lütfen tekrar deneyin.');
      }

      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: botResponse,
          character: 'Vigo',
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: `Hata: ${error.message}`,
          character: '⚠️',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#D2691E" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Vigo</Text>
          <Image source={VIGO_ICON} style={styles.headerIcon} />
        </View>
        <View style={styles.languageSelector}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'tr' && styles.langBtnActive]}
            onPress={() => setLanguage('tr')}
          >
            <Text style={[styles.langText, language === 'tr' && styles.langTextActive]}>TR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Container */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, idx) => (
          <View key={idx} style={msg.type === 'bot' ? styles.botMessageWrap : styles.userMessageWrap}>
            {msg.type === 'bot' && (
              <View style={styles.characterBubble}>
                <Image source={VIGO_ICON} style={styles.characterImage} />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                msg.type === 'bot' ? styles.botBubble : styles.userBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.type === 'bot' ? styles.botText : styles.userText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.botMessageWrap}>
            <View style={styles.characterBubble}>
              <Image source={VIGO_ICON} style={styles.characterImage} />
            </View>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Sorunuzu yazın..."
            placeholderTextColor="#999"
            value={userInput}
            onChangeText={setUserInput}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={loading}
          >
            <MaterialIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFD6A5',
    borderBottomWidth: 0,
    borderRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBtn: { padding: 8 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  headerIcon: { width: 36, height: 36, borderRadius: 18 },
  languageSelector: { flexDirection: 'row', gap: 4 },
  langBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.3)' },
  langBtnActive: { backgroundColor: '#fff' },
  langText: { fontSize: 12, fontWeight: '600', color: '#D2691E' },
  langTextActive: { color: '#FF8C00' },

  messagesContainer: { flex: 1, paddingHorizontal: 12 },
  messagesContent: { paddingVertical: 12 },

  botMessageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  userMessageWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  characterBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  characterImage: { width: 36, height: 36, borderRadius: 18 },
  character: { fontSize: 20 },

  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#e8f0ff',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },

  messageText: { fontSize: 14, lineHeight: 18 },
  botText: { color: '#222' },
  userText: { color: '#fff' },

  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
});
