import { API_URL } from '../config';
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Platform,
  Animated, Dimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

// ─── Design Tokens (Obsidian Rose Theme) ───────────────────────────────────
const T = {
  baseBg:    '#171214', // Deepest charcoal/plum
  cardBg:    '#1F181B', // Slightly elevated dark background
  primary:   '#D67C8E', // The signature dusty rose/pink
  secondary: '#915C67', // Muted plum/rose
  textLight: '#F4EAEB', // Creamy off-white
  textMuted: '#A88C92', // Muted dusty text
  inputBg:   '#110C0E', // Almost black for inputs
  border:    '#D67C8E', // Pink borders for that brutalist pop
};

export default function LoginScreen({ navigation }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [isLoading, setIsLoading]     = useState(false);

  // ── Entrance animations ────────────────────────────────────────────────
  const leftColAnim  = useRef(new Animated.Value(0)).current;
  const rightColAnim = useRef(new Animated.Value(0)).current;
  const formAnim     = useRef(new Animated.Value(0)).current;
  const fieldAnim    = useRef(new Animated.Value(1)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const loadBarAnim  = useRef(new Animated.Value(0)).current;
  const btnScale     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(leftColAnim,  { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(rightColAnim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(formAnim,     { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Mode toggle — fade fields out/in ────────────────────────────────────
  const switchMode = () => {
    Animated.timing(fieldAnim, {
      toValue: 0, duration: 180, useNativeDriver: true,
    }).start(() => {
      setIsLoginMode(prev => !prev);
      setUsername('');
      setPassword('');
      Animated.timing(fieldAnim, {
        toValue: 1, duration: 220, useNativeDriver: true,
      }).start();
    });
  };

  // ── Card shake on empty fields ───────────────────────────────────────────
  const shakeCard = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // ── Button press micro-interaction ──────────────────────────────────────
  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1.0,  useNativeDriver: true }).start();

  // ── Load bar ────────────────────────────────────────────────────────────
  const runLoadBar = () => {
    loadBarAnim.setValue(0);
    Animated.timing(loadBarAnim, {
      toValue: 1, duration: 1400, useNativeDriver: false,
    }).start();
  };

  // ── Auth handler ────────────────────────────────────────────────────────
  const handleAuthentication = async () => {
    if (!username.trim() || !password.trim()) {
      shakeCard();
      return;
    }

    setIsLoading(true);
    runLoadBar();

    try {
      const endpoint = isLoginMode ? '/login' : '/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Transmission failed.');

      if (isLoginMode) {
        if (IS_WEB) {
          localStorage.setItem('userToken', data.token);
        } else {
          await SecureStore.setItemAsync('userToken', data.token);
        }
        navigation.replace('Home');
      } else {
        Alert.alert(
          'Archive Initialized',
          'Profile created. Proceeding to authentication.',
          [{ text: 'ENTER', onPress: () => setIsLoginMode(true) }]
        );
        setPassword('');
      }
    } catch (error) {
      Alert.alert('Transmission Blocked', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Animated derived values ──────────────────────────────────────────────
  const leftTranslate  = leftColAnim.interpolate({  inputRange:[0,1], outputRange:[-24,0] });
  const rightTranslate = rightColAnim.interpolate({ inputRange:[0,1], outputRange:[24,0]  });
  const formTranslate  = formAnim.interpolate({     inputRange:[0,1], outputRange:[20,0]  });
  const loadBarWidth   = loadBarAnim.interpolate({  inputRange:[0,1], outputRange:['0%','100%'] });

  const fieldTranslate = fieldAnim.interpolate({ inputRange:[0,1], outputRange:[5,0] });

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.responsiveFrame}>

        {/* ── Left editorial column ── */}
        <Animated.View style={[
          styles.leftColumn,
          { opacity: leftColAnim, transform: [{ translateX: leftTranslate }] }
        ]}>
          <Text style={styles.archiveTag}>SG / ARCHIVE</Text>
          <View style={styles.editionMark}>
            <Text style={styles.editionMarkText}>EST. MMXXVI</Text>
          </View>
          <Text style={styles.brandTitle}>{'Mai\nson'}</Text>
          <View style={styles.brandRule} />
          <Text style={styles.brandDescriptor}>
            {'CLIMATE-AWARE\nSTYLE CURATION\n——\nKARACHI'}
          </Text>
        </Animated.View>

        {/* ── Right form column ── */}
        <View style={styles.rightColumn}>
          <Animated.View style={[
            styles.formCard,
            {
              opacity:   formAnim,
              transform: [{ translateY: formTranslate }, { translateX: shakeAnim }],
            }
          ]}>

            {/* Animated load bar */}
            <Animated.View style={[styles.loadBar, { width: isLoading ? loadBarWidth : '0%' }]} />

            {/* LIVE dot */}
            <View style={styles.cornerMark}>
              <View style={styles.liveDot} />
              <Text style={styles.cornerMarkText}>LIVE</Text>
            </View>

            {/* Mode toggle tabs */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, isLoginMode && styles.modeTabActive]}
                onPress={() => !isLoginMode && switchMode()}
              >
                <Text style={[styles.modeTabText, isLoginMode && styles.modeTabTextActive]}>
                  AUTHENTICATE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, !isLoginMode && styles.modeTabActive]}
                onPress={() => isLoginMode && switchMode()}
              >
                <Text style={[styles.modeTabText, !isLoginMode && styles.modeTabTextActive]}>
                  INITIALIZE
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fields with fade transition */}
            <Animated.View style={{ opacity: fieldAnim, transform: [{ translateY: fieldTranslate }] }}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="archive handle"
                placeholderTextColor={T.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="access key"
                placeholderTextColor={T.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </Animated.View>

            {/* CTA Button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.actionBtn, isLoading && styles.actionBtnLoading]}
                onPress={handleAuthentication}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={isLoading}
                activeOpacity={1}
              >
                {isLoading
                  ? <ActivityIndicator color={T.baseBg} size="small" />
                  : <Text style={styles.actionBtnText}>
                      {isLoginMode ? 'ACCESS LOOKBOOK' : 'BUILD ACCOUNT'}
                    </Text>
                }
              </TouchableOpacity>
            </Animated.View>

            {/* Toggle */}
            <View style={styles.formFooter}>
              <TouchableOpacity onPress={switchMode} disabled={isLoading}>
                <Text style={styles.toggleText}>
                  {isLoginMode
                    ? "Don't have an archive profile? Create one"
                    : "Already registered? Sign in here"}
                </Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: T.baseBg,
  },
  responsiveFrame: {
    flex: 1,
    flexDirection: IS_WEB ? 'row' : 'column',
    maxWidth: IS_WEB ? 540 : '100%',
    alignSelf: 'center',
    width: '100%',
    borderLeftWidth:  IS_WEB ? 1.5 : 0,
    borderRightWidth: IS_WEB ? 1.5 : 0,
    borderColor: T.secondary,
  },

  // ── Left column (Top on Mobile) ──
  leftColumn: {
    width: IS_WEB ? '38%' : '100%',
    borderRightWidth: IS_WEB ? 1.5 : 0,
    borderBottomWidth: IS_WEB ? 0 : 1.5,
    borderColor: T.secondary,
    padding: IS_WEB ? 28 : 24,
    justifyContent: 'flex-end',
    paddingBottom: IS_WEB ? 32 : 24,
    paddingTop: IS_WEB ? 28 : 60, 
  },
  archiveTag: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9,
    letterSpacing: 2,
    color: T.secondary,
    marginBottom: 6,
  },
  editionMark: {
    borderWidth: 1,
    borderColor: T.secondary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: IS_WEB ? 32 : 20,
  },
  editionMarkText: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 8,
    letterSpacing: 1.5,
    color: T.secondary,
  },
  brandTitle: {
    fontFamily: 'Playfair-Bold',
    fontSize: IS_WEB ? 72 : 64,
    color: T.textLight,
    lineHeight: IS_WEB ? 65 : 58,
    letterSpacing: -2,
    marginBottom: IS_WEB ? 24 : 16,
  },
  brandRule: {
    width: '100%',
    height: 1,
    backgroundColor: T.secondary,
    marginBottom: 16,
  },
  brandDescriptor: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9,
    letterSpacing: 2,
    color: T.secondary,
    lineHeight: 18,
  },

  // ── Right column (Bottom on Mobile) ──
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
    padding: IS_WEB ? 28 : 20,
  },
  formCard: {
    backgroundColor: T.cardBg,
    borderWidth: 1.5,
    borderColor: T.border, // Pink border
    padding: IS_WEB ? 28 : 22,
    shadowColor: T.primary, // Pink drop shadow
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  loadBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: T.primary,
  },
  cornerMark: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: T.primary,
    marginRight: 5,
  },
  cornerMarkText: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 8,
    letterSpacing: 1,
    color: T.textMuted,
  },

  // ── Mode tabs ──
  modeTabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: T.border, // Pink border
    marginBottom: 24,
    marginTop: IS_WEB ? 0 : 8,
  },
  modeTab: {
    flex: 1,
    paddingVertical: IS_WEB ? 9 : 12,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: T.primary, // Solid pink background for active tab
  },
  modeTabText: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 8,
    letterSpacing: 1.5,
    color: T.textMuted,
  },
  modeTabTextActive: {
    color: T.baseBg, // Dark text on the active pink tab
  },

  // ── Form fields ──
  fieldLabel: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 8,
    letterSpacing: 2,
    color: T.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: T.inputBg,
    borderWidth: 1.5,
    borderColor: T.secondary,
    paddingHorizontal: 14,
    height: IS_WEB ? 50 : 55,
    color: T.textLight,
    fontFamily: 'SpaceMono-Bold',
    fontSize: 11,
    marginBottom: 14,
  },

  // ── Action button ──
  actionBtn: {
    backgroundColor: T.primary, // Dusty Rose button
    height: IS_WEB ? 50 : 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnLoading: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontFamily: 'SpaceMono-Bold',
    color: T.baseBg, // Dark text on pink button
    fontSize: 10,
    letterSpacing: 2,
  },

  // ── Footer toggle ──
  formFooter: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: T.secondary,
    paddingTop: 14,
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9,
    color: T.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});