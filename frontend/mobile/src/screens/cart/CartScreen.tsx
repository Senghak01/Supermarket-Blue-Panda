import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { QuantityStepper } from '../../components/QuantityStepper';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';

export const CartScreen = ({ navigation }: any) => {
  const { cart, isLoading, fetchCart, updateQuantity, removeItem, clearCart } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to empty your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleRemoveItem = (cartItemId: number, name: string) => {
    Alert.alert('Remove Item', `Remove ${name} from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(cartItemId) },
    ]);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="cart-outline"
          title="Your Cart is Empty"
          subtitle="Explore our fresh items and add some to your basket!"
          actionLabel="Start Shopping"
          onAction={() => navigation.navigate('CatalogTab')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cart.hasIssues && (
        <View style={styles.issuesBanner}>
          <Ionicons name="warning-outline" size={20} color="#b45309" />
          <Text style={styles.issuesText}>
            Some items are out of stock or have insufficient quantity. Please adjust before checkout.
          </Text>
        </View>
      )}

      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.cartItemId.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={fetchCart}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.itemCountText}>{cart.itemCount} Items in Cart</Text>
            <TouchableOpacity onPress={handleClearCart}>
              <Text style={styles.clearCartText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.imageBox}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <Ionicons name="basket-outline" size={32} color={colors.textMuted} />
              )}
            </View>

            <View style={styles.itemDetails}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.cartItemId, item.name)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemPrice}>
                ${item.unitPrice.toFixed(2)} / {item.unit}
              </Text>

              {!item.isAvailable && (
                <Text style={styles.unavailableWarning}>Item currently unavailable</Text>
              )}

              {item.isAvailable && item.quantity > item.availableQuantity && (
                <Text style={styles.stockWarning}>Only {item.availableQuantity} available</Text>
              )}

              <View style={styles.itemFooter}>
                <QuantityStepper
                  quantity={item.quantity}
                  max={item.availableQuantity > 0 ? item.availableQuantity : 99}
                  min={1}
                  onChange={(newQty) => updateQuantity(item.cartItemId, newQty)}
                />
                <Text style={styles.lineTotal}>${item.lineTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>${cart.subtotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, cart.hasIssues && styles.disabledButton]}
          onPress={() => navigation.navigate('Checkout')}
          disabled={cart.hasIssues}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  issuesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    margin: 12,
    borderRadius: 8,
    gap: 8,
  },
  issuesText: {
    flex: 1,
    color: '#b45309',
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCountText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  clearCartText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  unavailableWarning: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  stockWarning: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtotalLabel: {
    fontSize: 15,
    color: colors.textMuted,
  },
  subtotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

