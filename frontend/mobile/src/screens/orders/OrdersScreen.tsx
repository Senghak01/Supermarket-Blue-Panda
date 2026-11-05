import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ordersApi } from '../../api/orders';
import { OrderSummaryResponse } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';

export const OrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (targetPage = 1, append = false) => {
    try {
      const res = await ordersApi.getOrders(targetPage, 10);
      if (append) {
        setOrders((prev) => [...prev, ...res.items]);
      } else {
        setOrders(res.items);
      }
      setTotalPages(res.totalPages);
      setPage(targetPage);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders(1, false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(1, false);
  };

  const handleLoadMore = () => {
    if (!loading && page < totalPages) {
      fetchOrders(page + 1, true);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Orders Yet"
            subtitle="When you place an order, you can track its delivery status here."
            actionLabel="Start Shopping"
            onAction={() => navigation.navigate('CatalogTab')}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}
            activeOpacity={0.7}
          >
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>Order #{item.orderId}</Text>
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
              <Text style={styles.itemCount}>
                <Ionicons name="cart-outline" size={14} color={colors.textMuted} /> {item.itemCount} items
              </Text>
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total: </Text>
                <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
});

