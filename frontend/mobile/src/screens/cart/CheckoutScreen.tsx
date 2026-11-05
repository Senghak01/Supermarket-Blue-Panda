import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addressApi } from '../../api/addresses';
import { ordersApi } from '../../api/orders';
import { AddressResponse } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { colors } from '../../theme/colors';

export const CheckoutScreen = ({ navigation }: any) => {
  const { cart, resetCart } = useCartStore();
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const loadAddresses = async () => {
    try {
      const data = await addressApi.getAddresses();
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.addressId);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAddresses();
    });
    return unsubscribe;
  }, [navigation]);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Address Required', 'Please select or add a delivery address to proceed.');
      return;
    }

    setPlacing(true);
    try {
      const order = await ordersApi.placeOrder({ addressId: selectedAddressId });
      resetCart();
      Alert.alert(
        'Order Placed! 🎉',
        `Order #${order.orderId} has been created successfully. Proceed to select your payment method.`,
        [
          {
            text: 'View Payment / Order',
            onPress: () => {
              navigation.replace('OrderDetail', { orderId: order.orderId });
            },
          },
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to place order';
      Alert.alert('Checkout Failed', msg);
    } finally {
      setPlacing(false);
    }
  };

  if (loading || !cart) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Delivery fee logic from backend: Free delivery over $20, otherwise $2.00
  const deliveryFee = cart.subtotal >= 20 ? 0 : 2.0;
  const grandTotal = cart.subtotal + deliveryFee;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Address Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddressForm')}>
              <Text style={styles.addAddressText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyAddressBox}
              onPress={() => navigation.navigate('AddressForm')}
            >
              <Ionicons name="location-outline" size={32} color={colors.primary} />
              <Text style={styles.emptyAddressTitle}>No Address Saved</Text>
              <Text style={styles.emptyAddressSubtitle}>Tap here to add your delivery address</Text>
            </TouchableOpacity>
          ) : (
            addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.addressId;
              return (
                <TouchableOpacity
                  key={addr.addressId}
                  style={[styles.addressCard, isSelected && styles.selectedAddressCard]}
                  onPress={() => setSelectedAddressId(addr.addressId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioCircle}>
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                  <View style={styles.addressInfo}>
                    <View style={styles.addressTitleRow}>
                      <Text style={styles.addressLabel}>{addr.label}</Text>
                      {addr.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                    </View>
                    <Text style={styles.recipient}>
                      {addr.recipientName} ({addr.phoneNumber})
                    </Text>
                    <Text style={styles.addressLine}>
                      {addr.addressLine}, {addr.district ? `${addr.district}, ` : ''}{addr.city}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Order Items Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            {cart.items.map((item) => (
              <View key={item.cartItemId} style={styles.itemRow}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemAmount}>${item.lineTotal.toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Subtotal</Text>
              <Text style={styles.feeValue}>${cart.subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Delivery Fee</Text>
              <Text style={[styles.feeValue, deliveryFee === 0 && { color: colors.success }]}>
                {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.feeRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.barLabel}>Total to Pay</Text>
          <Text style={styles.barTotal}>${grandTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, (placing || !selectedAddressId) && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={placing || !selectedAddressId}
          activeOpacity={0.8}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  addAddressText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyAddressBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  emptyAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  emptyAddressSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedAddressCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  defaultBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  recipient: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    width: 28,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  barLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  barTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  placeOrderButton: {
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
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

