import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ordersApi } from '../../api/orders';
import { OrderDetailResponse, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { colors } from '../../theme/colors';

const ORDER_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'ReadyForDelivery',
  'OutForDelivery',
  'Delivered',
];

export const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const data = await ordersApi.getOrderById(orderId);
      setOrder(data);
    } catch {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleCancelOrder = () => {
    Alert.alert('Cancel Order', `Are you sure you want to cancel Order #${orderId}?`, [
      { text: 'No, Keep Order', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const updated = await ordersApi.cancelOrder(orderId);
            setOrder(updated);
            Alert.alert('Cancelled', 'Your order has been cancelled.');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to cancel order');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading || !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentStepIndex = ORDER_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header status */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orderTitle}>Order #{order.orderId}</Text>
            <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {/* Progress tracker */}
        {!isCancelled && currentStepIndex >= 0 && (
          <View style={styles.timeline}>
            <View style={styles.timelineTrack}>
              <View
                style={[
                  styles.timelineProgress,
                  { width: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.timelineSteps}>
              {['Pending', 'Confirmed', 'Preparing', 'On Way', 'Delivered'].map((step, idx) => {
                const stepThreshold = Math.round((idx / 4) * (ORDER_STEPS.length - 1));
                const isPassed = currentStepIndex >= stepThreshold;
                return (
                  <View key={step} style={styles.stepItem}>
                    <View style={[styles.stepDot, isPassed && styles.stepDotActive]} />
                    <Text style={[styles.stepLabel, isPassed && styles.stepLabelActive]}>{step}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Payment info / Pay Now action */}
      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="card-outline" size={18} color={colors.primary} />
          <Text style={styles.cardSectionTitle}>Payment Information</Text>
        </View>

        {order.payment ? (
          <View style={styles.paymentInfoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Method</Text>
              <Text style={styles.infoValue}>{order.payment.method}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <StatusBadge status={order.payment.status} />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={styles.infoValue}>${order.payment.amount.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.unpaidBox}>
            <Text style={styles.unpaidText}>No payment recorded yet.</Text>
            {order.status !== 'Cancelled' && (
              <TouchableOpacity
                style={styles.payNowButton}
                onPress={() => navigation.navigate('Payment', { orderId: order.orderId })}
                activeOpacity={0.8}
              >
                <Text style={styles.payNowText}>Select Payment Method</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Delivery Address */}
      {order.deliveryAddress && (
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.cardSectionTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressRecipient}>
            {order.deliveryAddress.recipientName} ({order.deliveryAddress.phoneNumber})
          </Text>
          <Text style={styles.addressFull}>
            {order.deliveryAddress.addressLine}, {order.deliveryAddress.city}
          </Text>
          {order.deliveryAddress.note && (
            <Text style={styles.addressNote}>Note: {order.deliveryAddress.note}</Text>
          )}
        </View>
      )}

      {/* Order items */}
      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="basket-outline" size={18} color={colors.primary} />
          <Text style={styles.cardSectionTitle}>Items Ordered ({order.items.length})</Text>
        </View>

        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)} each</Text>
            </View>
            <Text style={styles.itemSubtotal}>${item.subtotal.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Subtotal</Text>
          <Text style={styles.feeValue}>${order.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Delivery Fee</Text>
          <Text style={styles.feeValue}>${order.deliveryFee.toFixed(2)}</Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Discount</Text>
            <Text style={[styles.feeValue, { color: colors.success }]}>-${order.discount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.divider} />
        <View style={styles.feeRow}>
          <Text style={styles.grandTotalLabel}>Total Amount</Text>
          <Text style={styles.grandTotalValue}>${order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Cancel action */}
      {order.canCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, cancelling && styles.disabledButton]}
          onPress={handleCancelOrder}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          )}
        </TouchableOpacity>
      )}
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
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  timeline: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  timelineTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 10,
  },
  timelineProgress: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timelineSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  paymentInfoBox: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  unpaidBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  unpaidText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },
  payNowButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  addressRecipient: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addressFull: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  addressNote: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    width: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 13,
    color: colors.textMuted,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

