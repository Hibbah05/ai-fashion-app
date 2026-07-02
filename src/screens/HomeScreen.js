import { API_URL } from '../config';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, Pressable, Animated,
  ScrollView, Platform, TouchableOpacity, useColorScheme,
  Modal, TextInput, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const lightTheme = {
  baseBg:    '#D9CFCB',
  cardBg:    '#F4EFEB',
  primary:   '#D67C8E',
  onPrimary: '#F4EFEB',
  secondary: '#A69692',
  textMain:  '#1A1516',
  textMuted: '#706265',
  inputBg:   '#E8DFDB',
  border:    '#1A1516',
  divider:   '#C2B4B0',
  trackBg:   '#C2B4B0',
};

const darkTheme = {
  baseBg:    '#171214',
  cardBg:    '#1F181B',
  primary:   '#D67C8E',
  onPrimary: '#171214',
  secondary: '#915C67',
  textMain:  '#F4EAEB',
  textMuted: '#A88C92',
  inputBg:   '#110C0E',
  border:    '#D67C8E',
  divider:   '#3D2A30',
  trackBg:   '#2A1F23',
};

const IS_WEB = Platform.OS === 'web';

function calcThermalIndex(tempStr, summary = '') {
  const temp = parseFloat(tempStr) || 32;
  const humidMatch = summary.match(/(\d+)%/);
  const humidity   = humidMatch ? parseInt(humidMatch[1]) : 75;
  const heatIndex  = temp + (humidity - 40) * 0.1;
  const score      = Math.max(0, Math.min(10, 10 - (heatIndex - 25) * 0.25));
  return parseFloat(score.toFixed(1));
}

function getWearabilityLabel(score) {
  if (score >= 8) return 'OPTIMAL';
  if (score >= 6) return 'MODERATE';
  if (score >= 4) return 'TAXING';
  return 'EXTREME';
}

function getFabricTags(score) {
  const all = ['LINEN', 'OPEN-WEAVE', 'COTTON', 'DENIM', 'SYNTHETIC', 'WOOL'];
  const recommended = score >= 7
    ? ['LINEN', 'OPEN-WEAVE', 'COTTON']
    : score >= 5 ? ['LINEN', 'OPEN-WEAVE'] : ['LINEN'];
  return all.map(f => ({ label: f, active: recommended.includes(f) }));
}

// Safe font family — falls back to system font if custom fonts failed to load
const FONT_MONO   = Platform.select({ web: '"Space Mono", monospace', default: 'SpaceMono-Bold' });
const FONT_SERIF  = Platform.select({ web: '"Playfair Display", serif', default: 'Playfair-Bold' });
const FONT_ITALIC = Platform.select({ web: '"Playfair Display", serif', default: 'Playfair-Italic' });

export default function HomeScreen({ navigation }) {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';
  const T = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => getStyles(T), [T]);

  const headerAnim  = useRef(new Animated.Value(0)).current;
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const weatherAnim = useRef(new Animated.Value(0)).current;
  const thermalAnim = useRef(new Animated.Value(0)).current;
  const heroAnim    = useRef(new Animated.Value(0)).current;
  const btnsAnim    = useRef(new Animated.Value(0)).current;
  const thermalBar  = useRef(new Animated.Value(0)).current;
  const heroScale   = useRef(new Animated.Value(1)).current;
  const scanScale   = useRef(new Animated.Value(1)).current;
  const chatScale   = useRef(new Animated.Value(1)).current;

  const [weatherData, setWeatherData] = useState({
    temp: '32°C', summary: 'Atmosphere contains heavy haze. High humidity profile detected.',
    title: 'Airy Minimalist', top: 'Semi-sheer linen drop-shoulder shirt',
    base: 'Lightweight cotton tailored chinos', acc: 'Woven breathable leather loafers',
  });
  const [thermalScore, setThermalScore] = useState(6.2);
  const [fabrics, setFabrics]           = useState(getFabricTags(6.2));
  const [archived, setArchived]         = useState(false);

  const [scannedImage, setScannedImage]       = useState(null);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [itemName, setItemName]               = useState('');
  const [itemCategory, setItemCategory]       = useState('');
  const [isSaving, setIsSaving]               = useState(false);

  useEffect(() => {
    const makeSpring = (anim, delay) =>
      Animated.spring(anim, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true, delay });
    Animated.parallel([
      makeSpring(headerAnim, 0), makeSpring(titleAnim, 80),
      makeSpring(weatherAnim, 160), makeSpring(thermalAnim, 230),
      makeSpring(heroAnim, 300), makeSpring(btnsAnim, 380),
    ]).start();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`${API_URL}/weather`, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return;
        const json = await res.json();
        const data = {
          temp:    json.temp    || '32°C',
          summary: json.summary || weatherData.summary,
          title:   json.title   || weatherData.title,
          top:     json.top     || weatherData.top,
          base:    json.base    || weatherData.base,
          acc:     json.acc     || weatherData.acc,
        };
        setWeatherData(data);
        const score = calcThermalIndex(data.temp, data.summary);
        setThermalScore(score);
        setFabrics(getFabricTags(score));
      } catch (e) {
        console.log('Weather endpoint unreachable:', e);
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    Animated.timing(thermalBar, {
      toValue: thermalScore / 10, duration: 900, delay: 600, useNativeDriver: false,
    }).start();
  }, [thermalScore]);

  const pressIn  = (s) => Animated.spring(s, { toValue: 0.97, useNativeDriver: true, tension: 150 }).start();
  const pressOut = (s) => Animated.spring(s, { toValue: 1.0,  useNativeDriver: true, tension: 150 }).start();

  const animStyle = (anim, offsetY = 18) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) }],
  });

  const thermalBarWidth = thermalBar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const handleScanWardrobe = () => {
    Alert.alert('Add to Wardrobe', 'How would you like to add this item?', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera Permission Needed', 'Enable camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true });
    handlePickerResult(result);
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, base64: true,
    });
    handlePickerResult(result);
  };

  const handlePickerResult = (result) => {
    if (!result.canceled && result.assets?.[0]) {
      setScannedImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
      setItemName(''); setItemCategory(''); setNameModalVisible(true);
    }
  };

  const cancelNaming = () => { setNameModalVisible(false); setScannedImage(null); };

  const saveWardrobeItem = async () => {
    if (!itemName.trim()) { Alert.alert('Name Required', 'Give this piece a name before saving.'); return; }
    if (!scannedImage?.base64) { Alert.alert('Error', 'No image found — please try again.'); return; }
    setIsSaving(true);
    try {
      // ✅ Fixed: was using undefined `NGROK`, now correctly uses `API_URL` from config
      const response = await fetch(`${API_URL}/wardrobe/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName.trim(),
          category: itemCategory.trim(),
          image: scannedImage.base64,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      setNameModalVisible(false); setScannedImage(null);
      Alert.alert('✦ Saved to Wardrobe', `"${itemName.trim()}" has been added.`, [
        { text: 'Keep Adding', style: 'cancel' },
        { text: 'View Wardrobe', onPress: () => navigation.navigate('Wardrobe') },
      ]);
    } catch (error) {
      Alert.alert('Save Failed', error.message || 'Could not save this item.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={IS_WEB ? { overflowY: 'auto' } : {}}
      >
        <Animated.View style={[styles.topBar, animStyle(headerAnim, -10)]}>
          <Text style={styles.brandLabel}>SG / ARCHIVE</Text>
          <View style={styles.statusPill}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>AI ACTIVE</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.titleBlock, animStyle(titleAnim, -8)]}>
          <Text style={styles.titleSub}>Curation for</Text>
          <Text style={styles.titleMain}>Hib{'\n'}bah</Text>
        </Animated.View>

        <Animated.View style={[styles.weatherStrip, animStyle(weatherAnim)]}>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherChip}>KHI METRIC</Text>
            <View style={styles.sepDot} />
            <Text style={styles.weatherChip}>{weatherData.temp}</Text>
          </View>
          <Text style={styles.weatherIntel}>{weatherData.summary}</Text>
        </Animated.View>

        <Animated.View style={[styles.thermalStrip, animStyle(thermalAnim)]}>
          <View style={styles.thermalHeaderRow}>
            <View>
              <Text style={styles.thermalLabel}>THERMAL COMFORT INDEX</Text>
              <View style={styles.thermalScoreRow}>
                <Text style={styles.thermalScore}>{thermalScore}</Text>
                <Text style={styles.thermalUnit}>/ 10</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.thermalLabel}>WEARABILITY</Text>
              <Text style={styles.thermalWearability}>{getWearabilityLabel(thermalScore)}</Text>
            </View>
          </View>
          <View style={styles.thermalTrack}>
            <Animated.View style={[styles.thermalFill, { width: thermalBarWidth }]} />
          </View>
          <View style={styles.fabricRow}>
            {fabrics.map(f => (
              <View key={f.label} style={[styles.fabricTag, f.active && styles.fabricTagActive]}>
                <Text style={[styles.fabricTagText, f.active && styles.fabricTagTextActive]}>{f.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.heroOuter, animStyle(heroAnim), { transform: [
          { translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[18,0] }) },
          { scale: heroScale },
        ]}]}>
          <Pressable onPressIn={() => pressIn(heroScale)} onPressOut={() => pressOut(heroScale)} style={styles.heroPressable}>
            <View style={styles.heroMetaRow}>
              <Text style={styles.heroTagTxt}>DAILY RECORD</Text>
              <View style={styles.heroEdBadge}><Text style={styles.heroEdText}>ED. 064</Text></View>
            </View>
            <Text style={styles.heroTitle}>{weatherData.title}</Text>
            <View style={styles.manifestoList}>
              {[
                { label: '01 / TOP',  value: weatherData.top  },
                { label: '02 / BASE', value: weatherData.base },
                { label: '03 / ACC',  value: weatherData.acc  },
              ].map((item, i) => (
                <View key={i} style={[styles.manifestoRow, i === 2 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.mLabel}>{item.label}</Text>
                  <Text style={styles.mValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </Pressable>
          <View style={styles.saveRow}>
            <Text style={styles.saveHint}>{archived ? '✦ SAVED TO CODEX' : 'TAP TO ARCHIVE THIS LOOK'}</Text>
            <TouchableOpacity style={[styles.saveBtn, archived && styles.saveBtnDone]} onPress={() => setArchived(true)}>
              <Text style={[styles.saveBtnText, archived && styles.saveBtnTextDone]}>{archived ? 'ARCHIVED' : '+ ARCHIVE'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.btnCluster, animStyle(btnsAnim)]}>
          <Animated.View style={{ transform: [{ scale: scanScale }] }}>
            <Pressable style={styles.btnPrimary} onPressIn={() => pressIn(scanScale)} onPressOut={() => pressOut(scanScale)} onPress={handleScanWardrobe}>
              <Text style={styles.btnPrimaryTxt}>SCAN YOUR WARDROBE</Text>
            </Pressable>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: chatScale }] }}>
            <Pressable style={styles.btnSecondary} onPressIn={() => pressIn(chatScale)} onPressOut={() => pressOut(chatScale)} onPress={() => navigation.navigate('Chat')}>
              <Text style={styles.btnSecondaryTxt}>CONSULT AI STYLIST</Text>
            </Pressable>
          </Animated.View>
          <Animated.View style={{ marginTop: 4 }}>
            <Pressable style={styles.btnGhost} onPress={() => navigation.navigate('Wardrobe')}>
              <Text style={styles.btnGhostTxt}>VIEW MY WARDROBE</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={cancelNaming}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {scannedImage?.uri && (
              <Image source={{ uri: scannedImage.uri }} style={styles.modalImage} resizeMode="cover" />
            )}
            <Text style={styles.modalLabel}>ITEM NAME</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Navy linen blazer" placeholderTextColor={T.textMuted} value={itemName} onChangeText={setItemName} editable={!isSaving} autoFocus />
            <Text style={styles.modalLabel}>CATEGORY (OPTIONAL)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Outerwear, Shoes, Tops" placeholderTextColor={T.textMuted} value={itemCategory} onChangeText={setItemCategory} editable={!isSaving} />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={cancelNaming} disabled={isSaving}>
                <Text style={styles.modalCancelTxt}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, isSaving && { opacity: 0.7 }]} onPress={saveWardrobeItem} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={T.onPrimary} size="small" /> : <Text style={styles.modalSaveTxt}>SAVE ITEM</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (T) => StyleSheet.create({
  root: { flex: 1, backgroundColor: T.baseBg },
  scrollContent: { paddingBottom: 80, maxWidth: IS_WEB ? 540 : undefined, alignSelf: 'center', width: '100%' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
  brandLabel: { fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2, color: T.textMain },
  statusPill: { backgroundColor: T.cardBg, borderWidth: 1.5, borderColor: T.border, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.primary },
  statusText: { fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 1.5, color: T.textMain },
  titleBlock: { paddingHorizontal: 24, paddingTop: 28 },
  titleSub: { fontFamily: FONT_ITALIC, fontSize: 18, color: T.textMuted, marginBottom: 2 },
  titleMain: { fontFamily: FONT_SERIF, fontSize: IS_WEB ? 58 : 50, color: T.textMain, lineHeight: IS_WEB ? 53 : 46, letterSpacing: -2 },
  weatherStrip: { backgroundColor: T.cardBg, borderWidth: 1.5, borderColor: T.border, marginHorizontal: 24, marginTop: 24, padding: 16, shadowColor: T.primary, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  weatherChip: { fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1.5, color: T.textMuted },
  sepDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.textMuted },
  weatherIntel: { fontFamily: FONT_MONO, fontSize: 11, color: T.textMain, lineHeight: 18 },
  thermalStrip: { backgroundColor: T.inputBg, borderWidth: 1.5, borderColor: T.border, marginHorizontal: 24, marginTop: 12, padding: 16 },
  thermalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  thermalLabel: { fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 2, color: T.textMuted, marginBottom: 4 },
  thermalScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  thermalScore: { fontFamily: FONT_SERIF, fontSize: 30, color: T.textMain, lineHeight: 32 },
  thermalUnit: { fontFamily: FONT_MONO, fontSize: 10, color: T.textMuted },
  thermalWearability: { fontFamily: FONT_MONO, fontSize: 11, color: T.primary, letterSpacing: 1 },
  thermalTrack: { height: 3, backgroundColor: T.trackBg, marginBottom: 12 },
  thermalFill: { height: 3, backgroundColor: T.primary },
  fabricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  fabricTag: { borderWidth: 1, borderColor: T.secondary, paddingHorizontal: 8, paddingVertical: 3 },
  fabricTagActive: { borderColor: T.primary },
  fabricTagText: { fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 1, color: T.textMuted },
  fabricTagTextActive: { color: T.primary },
  heroOuter: { backgroundColor: T.cardBg, borderWidth: 1.5, borderColor: T.border, marginHorizontal: 24, marginTop: 20, shadowColor: T.primary, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 },
  heroPressable: { padding: 24 },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroTagTxt: { fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 2, color: T.textMuted },
  heroEdBadge: { backgroundColor: T.primary, paddingHorizontal: 8, paddingVertical: 3 },
  heroEdText: { fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1, color: T.onPrimary },
  heroTitle: { fontFamily: FONT_SERIF, fontSize: IS_WEB ? 44 : 38, color: T.textMain, lineHeight: IS_WEB ? 42 : 36, letterSpacing: -1, marginBottom: 22 },
  manifestoList: { gap: 0 },
  manifestoRow: { borderBottomWidth: 1, borderBottomColor: T.divider, paddingVertical: 10, gap: 3 },
  mLabel: { fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 2, color: T.textMuted },
  mValue: { fontFamily: FONT_MONO, fontSize: 12, color: T.textMain },
  saveRow: { borderTopWidth: 1.5, borderTopColor: T.border, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveHint: { fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 1, color: T.textMuted },
  saveBtn: { borderWidth: 1, borderColor: T.primary, paddingHorizontal: 12, paddingVertical: 5 },
  saveBtnDone: { backgroundColor: T.primary },
  saveBtnText: { fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 1.5, color: T.primary },
  saveBtnTextDone: { color: T.onPrimary },
  btnCluster: { marginHorizontal: 24, marginTop: 20, gap: 12 },
  btnPrimary: { backgroundColor: T.primary, paddingVertical: 17, borderWidth: 1.5, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryTxt: { fontFamily: FONT_MONO, color: T.onPrimary, fontSize: 11, letterSpacing: 2 },
  btnSecondary: { backgroundColor: T.cardBg, paddingVertical: 17, borderWidth: 1.5, borderColor: T.border, alignItems: 'center', justifyContent: 'center', shadowColor: T.primary, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 },
  btnSecondaryTxt: { fontFamily: FONT_MONO, color: T.primary, fontSize: 11, letterSpacing: 2 },
  btnGhost: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnGhostTxt: { fontFamily: FONT_MONO, color: T.textMuted, fontSize: 10, letterSpacing: 1.5, textDecorationLine: 'underline' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: T.cardBg, borderWidth: 1.5, borderColor: T.border, padding: 20 },
  modalImage: { width: '100%', height: 180, marginBottom: 16, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.inputBg },
  modalLabel: { fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 2, color: T.textMuted, marginBottom: 6 },
  modalInput: { backgroundColor: T.inputBg, borderWidth: 1.5, borderColor: T.secondary, paddingHorizontal: 14, height: 48, color: T.textMain, fontFamily: FONT_MONO, fontSize: 12, marginBottom: 14 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.border },
  modalCancelTxt: { fontFamily: FONT_MONO, color: T.textMain, fontSize: 10, letterSpacing: 1.5 },
  modalSaveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: T.primary, borderWidth: 1.5, borderColor: T.border },
  modalSaveTxt: { fontFamily: FONT_MONO, color: T.onPrimary, fontSize: 10, letterSpacing: 1.5 },
});