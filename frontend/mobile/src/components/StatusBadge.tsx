import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus, PaymentStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type?: 'order' | 'payment';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Pending':
        return { bg: '#fef3c7', text: '#b45309' };
      case 'Confirmed':
      case 'Preparing':
        return { bg: '#e0f2fe', text: '#0369a1' };
      case 'ReadyForDelivery':
      case 'OutForDelivery':
        return { bg: '#f3e8ff', text: '#7e22ce' };
      case 'Delivered':
      case 'Paid':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'Cancelled':
      case 'Failed':
      case 'Refunded':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const style = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

