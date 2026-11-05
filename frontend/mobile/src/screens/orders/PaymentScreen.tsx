import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentsApi } from '../../api/payments';
import { PaymentMethod, PaymentResponse } from '../../types';
import { colors } from '../../theme/colors';

export const PaymentScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CashOnDelivery');
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [polling, setPolling] = useState(false);

  // Credit Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-format card number: 4 digits + space
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  // Auto-format expiry date: MM/YY
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const handleInitiatePayment = async () => {
    // If card payment is selected, validate card fields first
    if (selectedMethod === 'Card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        Alert.alert('Validation Error', 'Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardHolder.trim()) {
        Alert.alert('Validation Error', 'Please enter the name on the card.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        Alert.alert('Validation Error', 'Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        Alert.alert('Validation Error', 'Please enter a valid 3-digit CVV.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await paymentsApi.initiatePayment(orderId, { method: selectedMethod });
      setPayment(res);

      if (selectedMethod === 'CashOnDelivery') {
        Alert.alert(
          'Order Confirmed! 💵',
          'Please prepare the exact cash amount upon delivery.',
          [{ text: 'View Order', onPress: () => navigation.replace('OrderDetail', { orderId }) }]
        );
      } else if (selectedMethod === 'Khqr') {
        setPolling(true);
      } else if (selectedMethod === 'Card') {
        // Confirm the sandbox card payment with the backend
        try {
          await paymentsApi.sandboxConfirm(res.paymentId);
          Alert.alert(
            'Payment Approved! 💳',
            `Your card payment of $${res.amount.toFixed(2)} was successfully processed.`,
            [{ text: 'View Order', onPress: () => navigation.replace('OrderDetail', { orderId }) }]
          );
        } catch {
          Alert.alert(
            'Card Initiated',
            `Card authorization created for $${res.amount.toFixed(2)}.`,
            [{ text: 'View Order', onPress: () => navigation.replace('OrderDetail', { orderId }) }]
          );
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate payment';
      Alert.alert('Payment Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate Bakong KHQR payment approval for easy dev testing
  const handleSimulateKhqrPay = async () => {
    if (!payment) return;
    setSubmitting(true);
    try {
      await paymentsApi.sandboxConfirm(payment.paymentId);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setPolling(false);
      Alert.alert('Payment Successful! 🎉', 'Your KHQR payment has been verified.', [
        { text: 'View Order', onPress: () => navigation.replace('OrderDetail', { orderId }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not simulate KHQR scan');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll status for KHQR payments
  useEffect(() => {
    if (!polling || !payment) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const checkRes = await paymentsApi.checkPaymentStatus(payment.paymentId);
        if (checkRes.status === 'Paid') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPolling(false);
          Alert.alert('Payment Successful! 🎉', 'Your KHQR payment has been verified.', [
            { text: 'View Order', onPress: () => navigation.replace('OrderDetail', { orderId }) },
          ]);
        }
      } catch {
        // Continue polling
      }
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [polling, payment, orderId, navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Select Payment Method</Text>
      <Text style={styles.subtitle}>Choose how you want to pay for Order #{orderId}</Text>

      {/* Methods selection */}
      <View style={styles.options}>
        {/* COD */}
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'CashOnDelivery' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('CashOnDelivery')}
          activeOpacity={0.7}
        >
          <View style={styles.methodIconBox}>
            <Ionicons name="cash-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Cash on Delivery (COD)</Text>
            <Text style={styles.methodDesc}>Pay cash to our delivery courier</Text>
          </View>
          <View style={styles.radioCircle}>
            {selectedMethod === 'CashOnDelivery' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* KHQR */}
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'Khqr' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('Khqr')}
          activeOpacity={0.7}
        >
          <View style={styles.methodIconBox}>
            <Ionicons name="qr-code-outline" size={28} color="#dc2626" />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Bakong KHQR</Text>
            <Text style={styles.methodDesc}>Scan to pay with any Cambodian banking app</Text>
          </View>
          <View style={styles.radioCircle}>
            {selectedMethod === 'Khqr' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Card */}
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'Card' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('Card')}
          activeOpacity={0.7}
        >
          <View style={styles.methodIconBox}>
            <Ionicons name="card-outline" size={28} color="#2563eb" />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Credit / Debit Card</Text>
            <Text style={styles.methodDesc}>Visa, Mastercard, or UnionPay</Text>
          </View>
          <View style={styles.radioCircle}>
            {selectedMethod === 'Card' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* Credit / Debit Card Form */}
      {selectedMethod === 'Card' && (
        <View style={styles.cardForm}>
          {/* Card Preview Banner */}
          <View style={styles.creditCardVisual}>
            <View style={styles.cardVisualTop}>
              <Ionicons name="hardware-chip-outline" size={32} color="#fbbf24" />
              <Ionicons name="card" size={28} color="#fff" />
            </View>
            <Text style={styles.cardVisualNumber}>
              {cardNumber || '•••• •••• •••• ••••'}
            </Text>
            <View style={styles.cardVisualBottom}>
              <View>
                <Text style={styles.cardVisualLabel}>CARDHOLDER</Text>
                <Text style={styles.cardVisualName}>{cardHolder || 'YOUR NAME'}</Text>
              </View>
              <View>
                <Text style={styles.cardVisualLabel}>EXPIRES</Text>
                <Text style={styles.cardVisualExpiry}>{cardExpiry || 'MM/YY'}</Text>
              </View>
            </View>
          </View>

          {/* Form Inputs */}
          <Text style={styles.inputLabel}>Cardholder Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. John Doe"
              value={cardHolder}
              onChangeText={setCardHolder}
            />
          </View>

          <Text style={styles.inputLabel}>Card Number</Text>
          <View style={styles.inputBox}>
            <Ionicons name="card-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="1234 5678 9012 3456"
              keyboardType="number-pad"
              maxLength={19}
              value={cardNumber}
              onChangeText={handleCardNumberChange}
            />
          </View>

          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="MM/YY"
                  keyboardType="number-pad"
                  maxLength={5}
                  value={cardExpiry}
                  onChangeText={handleExpiryChange}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CVV / CVC</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="123"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={cardCvv}
                  onChangeText={setCardCvv}
                />
              </View>
            </View>
          </View>

          <View style={styles.secureNotice}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.secureNoticeText}>
              256-bit encrypted • Sandbox payments test gateway
            </Text>
          </View>
        </View>
      )}

      {/* KHQR Presentation Area */}
      {payment && payment.method === 'Khqr' && (
        <View style={styles.khqrContainer}>
          <Text style={styles.khqrTitle}>Scan Bakong KHQR</Text>
          <Text style={styles.khqrSubtitle}>Amount: ${payment.amount.toFixed(2)}</Text>

          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={160} color={colors.text} />
            <Text style={styles.qrDataText} numberOfLines={2}>
              {payment.qrData || 'KHQR Payload Ready'}
            </Text>
          </View>

          {polling && (
            <View style={styles.pollingStatus}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.pollingText}>Waiting for payment confirmation...</Text>
            </View>
          )}

          {/* Development simulation button */}
          <TouchableOpacity
            style={styles.simulateButton}
            onPress={handleSimulateKhqrPay}
            disabled={submitting}
          >
            <Ionicons name="flash" size={16} color="#fff" />
            <Text style={styles.simulateButtonText}>Simulate KHQR Scan (Sandbox)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Proceed Button */}
      {(!payment || payment.method !== 'Khqr') && (
        <TouchableOpacity
          style={[styles.payButton, submitting && styles.disabledButton]}
          onPress={handleInitiatePayment}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {selectedMethod === 'Card'
                ? 'Pay with Card'
                : selectedMethod === 'Khqr'
                ? 'Generate KHQR'
                : 'Confirm & Place Order'}
            </Text>
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
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedMethod: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  methodDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  // Credit Card Form Styles
  cardForm: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  creditCardVisual: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardVisualTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardVisualNumber: {
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  cardVisualBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardVisualLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardVisualName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  cardVisualExpiry: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
  },
  secureNoticeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },

  // KHQR presentation
  khqrContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  khqrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  khqrSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
    marginBottom: 16,
  },
  qrPlaceholder: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  qrDataText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  pollingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  pollingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  simulateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  payButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
