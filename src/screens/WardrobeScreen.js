import { API_URL } from '../config';
import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Image,
  SafeAreaView, FlatList, ActivityIndicator, RefreshControl,
  Alert, useColorScheme, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// ─── Design Tokens (reuse same palette as the rest of the app) ────────────
const lightTheme = {
  baseBg:    '#D9CFCB',
  cardBg:    '#F4EFEB',
  primary:   '#D67C8E',
  onPrimary: '#F4EFEB',
  textMain:  '#1A1516',
  textMuted: '#706265',
  border:    '#1A1516',
  skeleton:  '#E0D8D5',
};

const darkTheme = {
  baseBg:    '#171214',
  cardBg:    '#1F181B',
  primary:   '#D67C8E',
  onPrimary: '#171214',
  textMain:  '#F4EAEB',
  textMuted: '#A88C92',
  border:    '#D67C8E',
  skeleton:  '#2A1F24',
};

const IS_WEB = Platform.OS === 'web';

// ─── Same IP as your other screens — update if it changes ─────────────────

export default function WardrobeScreen({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const T = isDark ? darkTheme : lightTheme;
  const styles = getStyles(T);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadWardrobe = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/wardrobe/list`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error('[Wardrobe] Load error:', e);
      Alert.alert('Error', 'Could not load your wardrobe. Check your connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Reload every time this screen comes into focus (e.g. after adding an item)
  useFocusEffect(
    useCallback(() => {
      loadWardrobe();
    }, [])
  );

  const confirmDelete = (item) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.name}" from your wardrobe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteItem(item.id) },
      ]
    );
  };

  const deleteItem = async (id) => {
    try {
      await fetch(`${API_URL}/wardrobe/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      Alert.alert('Error', 'Could not remove item.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => confirmDelete(item)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardFooter}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.outer}>
      <View style={styles.frame}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← HOME</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WARDROBE</Text>
          <Text style={styles.headerCount}>{items.length}</Text>
        </View>

        {isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={T.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerFill}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySub}>
              Go back and tap "Scan Your Wardrobe" to add your first piece.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => loadWardrobe(true)} tintColor={T.primary} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (T) => StyleSheet.create({
  outer: { flex: 1, backgroundColor: T.baseBg, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: IS_WEB ? 540 : '100%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1.5, borderColor: T.border,
  },
  backButton: { fontFamily: 'SpaceMono-Bold', fontSize: 11, color: T.textMain },
  headerTitle: { fontFamily: 'Playfair-Bold', fontSize: 18, color: T.textMain },
  headerCount: { fontFamily: 'SpaceMono-Bold', fontSize: 11, color: T.textMuted },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 28, color: T.primary, marginBottom: 10 },
  emptyTitle: { fontFamily: 'Playfair-Bold', fontSize: 20, color: T.textMain, marginBottom: 8 },
  emptySub: { fontFamily: 'SpaceMono-Bold', fontSize: 11, color: T.textMuted, textAlign: 'center', lineHeight: 18 },

  listContent: { padding: 16 },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: T.cardBg, borderWidth: 1.5, borderColor: T.border,
    marginBottom: 16, overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 160, backgroundColor: T.skeleton },
  cardFooter: { padding: 10, borderTopWidth: 1.5, borderColor: T.border },
  cardName: { fontFamily: 'SpaceMono-Bold', fontSize: 11, color: T.textMain, marginBottom: 2 },
  cardCategory: { fontFamily: 'SpaceMono-Bold', fontSize: 9, color: T.textMuted, letterSpacing: 0.5 },
});