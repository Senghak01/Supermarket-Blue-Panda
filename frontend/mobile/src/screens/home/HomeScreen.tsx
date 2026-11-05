import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi } from '../../api/catalog';
import { CategoryResponse, ProductListItem } from '../../types';
import { ProductCard } from '../../components/ProductCard';
import { CategoryChip } from '../../components/CategoryChip';
import { useCartStore } from '../../store/cartStore';
import { colors } from '../../theme/colors';

export const HomeScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [newProducts, setNewProducts] = useState<ProductListItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { addItem } = useCartStore();

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        catalogApi.getCategories(),
        catalogApi.getProducts({ sort: 'newest', inStockOnly: true, pageSize: 8 }),
      ]);
      setCategories(cats);
      setNewProducts(prods.items);
    } catch {
      // Ignore network errors on initial load
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddToCart = async (product: ProductListItem) => {
    try {
      await addItem(product.productId, 1);
      Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
    } catch (err: any) {
      Alert.alert('Cart Error', err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('CatalogTab')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search fresh groceries, drinks, snacks...</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTag}>🌱 Fresh Everyday</Text>
          <Text style={styles.bannerTitle}>Quality Groceries Delivered Fast</Text>
          <Text style={styles.bannerSubtitle}>Free delivery on orders over $20.00</Text>
        </View>
        <Ionicons name="basket" size={64} color="rgba(255,255,255,0.25)" style={styles.bannerIcon} />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CatalogTab', { resetCategory: true })}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <CategoryChip
            label="All"
            selected={selectedCategoryId === undefined}
            onPress={() => {
              setSelectedCategoryId(undefined);
              navigation.navigate('CatalogTab', { resetCategory: true });
            }}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.categoryId}
              label={cat.name}
              selected={selectedCategoryId === cat.categoryId}
              onPress={() => {
                setSelectedCategoryId(cat.categoryId);
                navigation.navigate('CatalogTab', { categoryId: cat.categoryId });
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* New Arrivals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CatalogTab', { sort: 'newest' })}>
            <Text style={styles.viewAllText}>See More</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={newProducts}
          numColumns={2}
          keyExtractor={(item) => item.productId.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
              onAddToCart={() => handleAddToCart(item)}
            />
          )}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 14,
    flex: 1,
  },
  banner: {
    margin: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    zIndex: 1,
  },
  bannerTag: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  bannerIcon: {
    position: 'absolute',
    right: 12,
    bottom: -8,
  },
  section: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: 4,
  },
});

