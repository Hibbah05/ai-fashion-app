import { API_URL } from '../config';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, Platform,
  Image, Animated, useColorScheme, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// ─── API URL ──────────────────────────────────────────────────────────────
 // <-- update this if your PC's IP changes

// ─── Design Tokens ────────────────────────────────────────────────────────────
const lightTheme = {
  baseBg:    '#D9CFCB',
  cardBg:    '#F4EFEB',
  primary:   '#D67C8E',
  onPrimary: '#F4EFEB',
  textMain:  '#1A1516',
  textMuted: '#706265',
  inputBg:   '#E8DFDB',
  border:    '#1A1516',
  sageBg:    '#E3EAE0',
  sage:      '#6A7A62',
  skeleton:  '#E0D8D5',
};

const darkTheme = {
  baseBg:    '#171214',
  cardBg:    '#1F181B',
  primary:   '#D67C8E',
  onPrimary: '#171214',
  textMain:  '#F4EAEB',
  textMuted: '#A88C92',
  inputBg:   '#110C0E',
  border:    '#D67C8E',
  sageBg:    '#1F261C',
  sage:      '#8FA88A',
  skeleton:  '#2A1F24',
};

const IS_WEB = Platform.OS === 'web';

console.log('[App] API URL:', API_URL);

// ─── Helper: safely parse a fetch Response as JSON ────────────────────────────
// If the server (or a dead tunnel, proxy, etc.) returns HTML instead of JSON,
// this throws a CLEAR error instead of the cryptic "Unexpected character: <".
async function parseJsonSafely(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('[parseJsonSafely] Non-JSON response:', raw.slice(0, 200));
    throw new Error(
      `Server did not return JSON (status ${response.status}). ` +
      `First 80 chars: ${raw.slice(0, 80)}`
    );
  }
}

// ─── Animated bubble wrapper ──────────────────────────────────────────────────
const AnimatedBubble = ({ children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%' }}>
      {children}
    </Animated.View>
  );
};

// ─── Skeleton shimmer ──────────────────────────────────────────────────────
const SkeletonCard = ({ T, styles }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View style={[styles.productCard, { opacity }]}>
      <View style={[styles.productImage, { backgroundColor: T.skeleton }]} />
      <View style={styles.productActionBtn}>
        <View style={{ width: 70, height: 8, backgroundColor: T.skeleton, borderRadius: 4 }} />
      </View>
    </Animated.View>
  );
};

// ─── Product Card ────────────────────────────────────────────────────────────
const MAX_RETRIES = 2;

const ProductCard = ({ item, T, styles, delay = 0 }) => {
  const [imgStatus, setImgStatus] = useState(delay > 0 ? 'pending' : 'loading');
  const [retryCount, setRetryCount] = useState(0);
  const [cacheBust, setCacheBust] = useState(0);
  const shimmer = useRef(new Animated.Value(0)).current;

  const displayLabel = item?.label || 'ITEM';
  const baseImageUrl = item?.imageUrl || 'https://via.placeholder.com/500x500/D67C8E/FFFFFF?text=Loading';
  // Append a cache-busting param on retries so we don't just re-request
  // the exact same (possibly failed) render from pollinations.ai
  const imageUrl = cacheBust === 0 ? baseImageUrl : `${baseImageUrl}&retry=${cacheBust}`;

  // Stagger: don't start loading until `delay` ms have passed, so 3 cards
  // requested at once don't all hit the image API in the same instant.
  useEffect(() => {
    if (delay <= 0) return;
    const t = setTimeout(() => setImgStatus('loading'), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (imgStatus !== 'loading' && imgStatus !== 'pending') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [imgStatus]);

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      // Wait a beat, then retry with a cache-busting param and a fresh attempt
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCacheBust(prev => prev + 1);
        setImgStatus('loading');
      }, 600 * (retryCount + 1));
    } else {
      setImgStatus('error');
    }
  };

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <View style={styles.productCard}>
      {(imgStatus === 'loading' || imgStatus === 'pending') && (
        <Animated.View
          style={[
            styles.productImage,
            {
              backgroundColor: T.skeleton,
              opacity: shimmerOpacity,
              position: 'absolute',
              top: 0, left: 0, right: 0,
              zIndex: 1,
            }
          ]}
        />
      )}

      {imgStatus !== 'pending' && (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.productImage,
            { opacity: imgStatus === 'loaded' ? 1 : 0, zIndex: 2 }
          ]}
          resizeMode="contain"
          onLoad={() => setImgStatus('loaded')}
          onError={handleError}
        />
      )}

      {imgStatus === 'error' && (
        <View style={[styles.productImageError, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }]}>
          <Text style={[styles.productErrorIcon, { color: T.textMuted }]}>✦</Text>
          <Text style={[styles.productErrorLabel, { color: T.textMain }]} numberOfLines={2}>
            {displayLabel.toUpperCase()}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.productActionBtn}>
        <Text style={styles.productActionText} numberOfLines={1}>
          {displayLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Carousel ─────────────────────────────────────────────────────────────────
const RecommendationCarousel = ({ recommendations, T, styles }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const TARGET = 3;
  const slots = [...recommendations];
  while (slots.length < TARGET) {
    slots.push({ __skeleton: true, id: `skel_${slots.length}` });
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.recommendationScrollContent}
    >
      {slots.map((item, idx) => (
        item.__skeleton
          ? <SkeletonCard key={item.id} T={T} styles={styles} />
          : <ProductCard key={item.id} item={item} T={T} styles={styles} delay={idx * 500} />
      ))}
    </ScrollView>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ChatScreen({ navigation }) {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';
  const T = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => getStyles(T), [T]);

  const [messages, setMessages] = useState([{
    id: 1, sender: 'ai',
    text: "Hello Hibbah. I am monitoring your local weather profile and wardrobe logs. What context are we curating for today?",
  }]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  // ─── Test connection on mount ─────────────────────────────────────────────
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('[Test] Testing connection to:', `${API_URL}/`);
      const response = await fetch(`${API_URL}/`);
      const data = await parseJsonSafely(response);
      console.log('[Test] ✅ Connection successful:', data);
    } catch (error) {
      console.error('[Test] ❌ Connection failed:', error);
      Alert.alert(
        '⚠️ Connection Error',
        `Cannot reach:\n${API_URL}\n\n` +
        `1. Is "python app.py" running in the backend terminal?\n` +
        `2. Is your phone on the SAME WiFi as your computer?\n` +
        `3. Does the IP in config.js match "ipconfig" on your PC right now?\n\n` +
        `Error: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const currentText = inputText;
    const currentImage = selectedImage;

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: currentText || "Sent an item from wardrobe.",
      imageUri: currentImage?.uri || null,
    }]);
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const url = `${API_URL}/chat`;
      console.log('[Send] 📤 Sending to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: currentText,
          image: currentImage?.base64 || '',
          user: 'Hibbah',
          city: 'Karachi',
        }),
      });

      console.log('[Send] Response status:', response.status);

      const data = await parseJsonSafely(response);
      console.log('[Send] 📦 Data received:', data);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.reply || "Style engine online.",
        recommendations: data.recommendations?.length > 0 ? data.recommendations : null,
      }]);

    } catch (error) {
      console.error('[Send] ❌ Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `❌ Error: ${error.message}\n\nCheck that config.js has the right IP and the backend is running.`,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.responsiveFrame}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← ARCHIVE</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MAISON</Text>
          <TouchableOpacity onPress={testConnection}>
            <Text style={{ fontSize: 10, color: T.textMuted }}>🔗</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <AnimatedBubble key={msg.id}>
              <View style={[styles.rowContainer, msg.sender === 'user' ? styles.rowUser : styles.rowAi]}>
                <View style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.bubbleLabel, msg.sender === 'user' ? styles.userLabel : styles.aiLabel]}>
                    {msg.sender === 'user' ? 'USER / HIBBAH' : 'AI / ENGINE'}
                  </Text>
                  {msg.imageUri && (
                    <Image source={{ uri: msg.imageUri }} style={styles.embeddedMessageImage} />
                  )}
                  {msg.text && (
                    <Text style={[styles.messageText, msg.sender === 'user' ? styles.textLight : styles.textDark]}>
                      {msg.text}
                    </Text>
                  )}
                </View>
              </View>

              {msg.recommendations && msg.recommendations.length > 0 && (
                <RecommendationCarousel
                  recommendations={msg.recommendations}
                  T={T}
                  styles={styles}
                />
              )}
            </AnimatedBubble>
          ))}

          {isTyping && (
            <AnimatedBubble key="typing-loader">
              <View style={[styles.rowContainer, styles.rowAi]}>
                <View style={[styles.bubble, styles.aiBubble, { paddingVertical: 12, minWidth: 80, alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={T.sage} />
                </View>
              </View>
            </AnimatedBubble>
          )}
        </ScrollView>

        {/* Image preview */}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.thumbnailPreview} />
            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBadge}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input tray */}
        <View style={styles.inputTray}>
          <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={isTyping}>
            <Text style={styles.mediaIconText}>＋</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Specify aesthetic parameters..."
            placeholderTextColor={T.textMuted}
            value={inputText}
            onChangeText={setInputText}
            editable={!isTyping}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isTyping}>
            <Text style={styles.sendText}>SEND</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (T) => StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: T.baseBg, alignItems: 'center', justifyContent: 'center' },
  responsiveFrame: { flex: 1, width: '100%', maxWidth: IS_WEB ? 540 : '100%', backgroundColor: T.baseBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1.5, borderColor: T.border, alignItems: 'center' },
  backButton: { fontFamily: 'SpaceMono-Bold', fontSize: 11, color: T.textMain },
  headerTitle: { fontFamily: 'Playfair-Bold', fontSize: 18, color: T.textMain },
  placeholder: { width: 60 },
  feed: { flex: 1, backgroundColor: T.baseBg },
  feedContent: { padding: 20, paddingBottom: 40 },
  rowContainer: { width: '100%', marginVertical: 6, flexDirection: 'row' },
  rowAi: { justifyContent: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },
  bubble: { padding: 16, borderRadius: 14, borderWidth: 1.5, maxWidth: '85%' },
  aiBubble: { backgroundColor: T.sageBg, borderColor: T.sage },
  userBubble: { backgroundColor: T.primary, borderColor: T.border },
  bubbleLabel: { fontFamily: 'SpaceMono-Bold', fontSize: 8, marginBottom: 6, letterSpacing: 1 },
  aiLabel: { color: T.sage },
  userLabel: { color: T.onPrimary },
  embeddedMessageImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 8, borderWidth: 1.5, borderColor: T.border },
  messageText: { fontFamily: 'SpaceMono-Bold', fontSize: 13, lineHeight: 20 },
  textDark: { color: T.textMain },
  textLight: { color: T.onPrimary },
  recommendationScrollContent: { paddingVertical: 12, paddingLeft: 4, paddingRight: 20 },
  productCard: {
    backgroundColor: T.cardBg,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 8,
    width: 150,
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: 160, backgroundColor: T.skeleton },
  productImageError: { width: '100%', height: 160, backgroundColor: T.skeleton, alignItems: 'center', justifyContent: 'center' },
  productErrorIcon: { fontSize: 20, marginBottom: 4 },
  productErrorLabel: { fontFamily: 'SpaceMono-Bold', fontSize: 10, textAlign: 'center', paddingHorizontal: 8 },
  productActionBtn: { borderTopWidth: 1.5, borderColor: T.border, paddingVertical: 10, alignItems: 'center', backgroundColor: T.cardBg, minHeight: 40, justifyContent: 'center' },
  productActionText: { fontFamily: 'SpaceMono-Bold', fontSize: 9, color: T.textMain, textAlign: 'center' },
  previewContainer: { padding: 12, backgroundColor: T.cardBg, flexDirection: 'row', borderTopWidth: 1.5, borderColor: T.border, alignItems: 'center' },
  thumbnailPreview: { width: 50, height: 50, borderRadius: 8, borderWidth: 1.5, borderColor: T.border },
  removeImageBadge: { marginLeft: 12, backgroundColor: T.textMain, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: T.baseBg, fontSize: 10, fontFamily: 'SpaceMono-Bold' },
  inputTray: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: T.baseBg, borderTopWidth: 1.5, borderColor: T.border, alignItems: 'center' },
  mediaButton: { width: 50, height: 50, backgroundColor: T.cardBg, borderWidth: 1.5, borderColor: T.border, justifyContent: 'center', alignItems: 'center' },
  mediaIconText: { fontSize: 18, color: T.textMain, fontWeight: 'bold' },
  input: { flex: 1, backgroundColor: T.inputBg, borderWidth: 1.5, borderColor: T.border, paddingHorizontal: 16, height: 50, color: T.textMain, fontFamily: 'SpaceMono-Bold', fontSize: 11 },
  sendButton: { backgroundColor: T.textMain, paddingHorizontal: 20, height: 50, justifyContent: 'center', alignItems: 'center' },
  sendText: { fontFamily: 'SpaceMono-Bold', color: T.baseBg, fontSize: 11, letterSpacing: 1.5 },
});