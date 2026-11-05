import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi } from '../../api/catalog';
import { ProductDetailResponse } from '../../types';
import { QuantityStepper } from '../../components/QuantityStepper';
import { useCartStore } from '../../store/cartStore';
import { colors } from '../../theme/colors';

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await catalogApi.getProductById(productId);
        setProduct(data);
      } catch {
        Alert.alert('Error', 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [productId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'CartTab' })}
          style={{ marginRight: 12, padding: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.productId, quantity);
      Alert.alert(
        'Added to Cart',
        `${quantity}x ${product.name} added to your cart.`,
        [
          { text: 'Keep Shopping', style: 'cancel' },
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('MainTabs', { screen: 'CartTab' }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAvailable = product.inStock && product.stockQuantity > 0;
  const totalPrice = product.price * quantity;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="basket-outline" size={80} color={colors.textMuted} />
            </View>
          )}
          {!isAvailable && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
          )}
        </View>

        {/* Product Information */}
        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{product.categoryName}</Text>
            <Text style={styles.sku}>SKU: {product.sku}</Text>
          </View>

          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${product.price.toFixed(2)}</Text>
              <Text style={styles.unit}> / {product.unit}</Text>
            </View>

            <View style={[styles.stockStatus, { backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[styles.stockStatusText, { color: isAvailable ? '#15803d' : '#b91c1c' }]}>
                {isAvailable ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description || 'No detailed description available for this product.'}
          </Text>

          {isAvailable && (
            <>
              <View style={styles.divider} />
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Select Quantity:</Text>
                <QuantityStepper
                  quantity={quantity}
                  max={product.stockQuantity}
                  min={1}
                  onChange={setQuantity}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Action */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, (!isAvailable || adding) && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={!isAvailable || adding}
          activeOpacity={0.8}
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  scroll: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  soldOutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  sku: {
    fontSize: 12,
    color: colors.textMuted,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  unit: {
    fontSize: 15,
    color: colors.textMuted,
  },
  stockStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

