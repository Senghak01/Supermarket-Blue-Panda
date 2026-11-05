import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addressApi } from '../../api/addresses';
import { AddressResponse } from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';

export const AddressesScreen = ({ navigation }: any) => {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      const data = await addressApi.getAddresses();
      setAddresses(data);
    } catch {
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSetDefault = async (addressId: number) => {
    try {
      await addressApi.setDefaultAddress(addressId);
      await fetchAddresses();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to set default address');
    }
  };

  const handleDelete = (address: AddressResponse) => {
    Alert.alert('Delete Address', `Delete address "${address.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressApi.deleteAddress(address.addressId);
            await fetchAddresses();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete address');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.addressId.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="location-outline"
            title="No Saved Addresses"
            subtitle="Add a delivery address for quicker checkout."
            actionLabel="+ Add New Address"
            onAction={() => navigation.navigate('AddressForm')}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <View style={styles.labelRow}>
                <Ionicons name="home-outline" size={18} color={colors.primary} />
                <Text style={styles.label}>{item.label}</Text>
                {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddressForm', { address: item })}
                  style={styles.actionBtn}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.recipient}>
              {item.recipientName} ({item.phoneNumber})
            </Text>
            <Text style={styles.line}>
              {item.addressLine}, {item.district ? `${item.district}, ` : ''}{item.city}
            </Text>
            {item.note && <Text style={styles.note}>Note: {item.note}</Text>}

            {!item.isDefault && (
              <TouchableOpacity
                style={styles.setDefaultButton}
                onPress={() => handleSetDefault(item.addressId)}
              >
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddressForm')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Add Address</Text>
      </TouchableOpacity>
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
    paddingBottom: 80,
  },
  addressCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  recipient: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  line: {
    fontSize: 13,
    color: colors.textMuted,
  },
  note: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 4,
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
  },
  setDefaultText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

