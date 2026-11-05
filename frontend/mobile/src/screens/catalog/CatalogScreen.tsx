import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi } from '../../api/catalog';
import { CategoryResponse, ProductListItem } from '../../types';
import { ProductCard } from '../../components/ProductCard';
import { CategoryChip } from '../../components/CategoryChip';
import { EmptyState } from '../../components/EmptyState';
import { useCartStore } from '../../store/cartStore';
import { colors } from '../../theme/colors';

export const CatalogScreen = ({ navigation, route }: any) => {
  const initialCategoryId = route?.params?.categoryId;

  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(initialCategoryId);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'name'>('newest');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { addItem } = useCartStore();

  const loadCategories = async () => {
    try {
      const data = await catalogApi.getCategories();
      setCategories(data);
    } catch {
      // Ignore
    }
  };

  const fetchProducts = useCallback(
    async (currentPage = 1, append = false) => {
      setLoading(true);
      try {
        const res = await catalogApi.getProducts({
          search: search.trim() || undefined,
          categoryId: selectedCategoryId,
          inStockOnly: inStockOnly ? true : undefined,
          sort,
          page: currentPage,
          pageSize: 12,
        });

        if (append) {
          setProducts((prev) => [...prev, ...res.items]);
        } else {
          setProducts(res.items);
        }
        setTotalPages(res.totalPages);
        setPage(currentPage);
      } catch {
        // Failed
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, selectedCategoryId, inStockOnly, sort]
  );

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (route?.params?.categoryId !== undefined) {
      setSelectedCategoryId(route.params.categoryId);
    } else if (route?.params?.resetCategory) {
      setSelectedCategoryId(undefined);
    }
    if (route?.params?.sort !== undefined) {
      setSort(route.params.sort);
    }
  }, [route?.params?.categoryId, route?.params?.sort, route?.params?.resetCategory]);

  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, false);
  };

  const handleLoadMore = () => {
    if (!loading && page < totalPages) {
      fetchProducts(page + 1, true);
    }
  };

  const handleAddToCart = async (product: ProductListItem) => {
    try {
      await addItem(product.productId, 1);
      Alert.alert('Added', `${product.name} added to cart`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  const toggleSort = () => {
    if (sort === 'newest') setSort('price_asc');
    else if (sort === 'price_asc') setSort('price_desc');
    else if (sort === 'price_desc') setSort('name');
    else setSort('newest');
  };

  const getSortLabel = () => {
    switch (sort) {
      case 'newest':
        return 'Newest';
      case 'price_asc':
        return 'Price: Low to High';
      case 'price_desc':
        return 'Price: High to Low';
      case 'name':
        return 'Name: A-Z';
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groceries..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => fetchProducts(1, false)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Bar */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ categoryId: -1, name: 'All' }, ...categories]}
          keyExtractor={(item) => item.categoryId.toString()}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.name}
              selected={
                item.categoryId === -1
                  ? selectedCategoryId === undefined
                  : selectedCategoryId === item.categoryId
              }
              onPress={() => {
                setSelectedCategoryId(item.categoryId === -1 ? undefined : item.categoryId);
              }}
            />
          )}
        />

        {/* Filters and Sorting bar */}
        <View style={styles.controlsBar}>
          <TouchableOpacity style={styles.sortButton} onPress={toggleSort} activeOpacity={0.7}>
            <Ionicons name="swap-vertical" size={16} color={colors.primary} />
            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
          </TouchableOpacity>

          <View style={styles.stockToggle}>
            <Text style={styles.stockLabel}>In Stock</Text>
            <Switch
              value={inStockOnly}
              onValueChange={setInStockOnly}
              trackColor={{ false: '#cbd5e1', true: colors.primaryLight }}
              thumbColor={inStockOnly ? colors.primary : '#f8fafc'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.productId.toString()}
        contentContainerStyle={styles.gridContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
          ) : undefined
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="search-outline"
              title="No Products Found"
              subtitle="Try searching with different keywords or clearing filters."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearch('');
                setSelectedCategoryId(undefined);
                setInStockOnly(false);
                setSort('newest');
              }}
            />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
            onAddToCart={() => handleAddToCart(item)}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  stockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  gridContent: {
    padding: 8,
    flexGrow: 1,
  },
});

