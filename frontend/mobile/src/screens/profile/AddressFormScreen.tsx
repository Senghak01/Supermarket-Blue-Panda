import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { addressApi } from '../../api/addresses';
import { AddressResponse } from '../../types';
import { colors } from '../../theme/colors';

export const AddressFormScreen = ({ route, navigation }: any) => {
  const existingAddress: AddressResponse | undefined = route?.params?.address;

  const [label, setLabel] = useState(existingAddress?.label || 'Home');
  const [recipientName, setRecipientName] = useState(existingAddress?.recipientName || '');
  const [phoneNumber, setPhoneNumber] = useState(existingAddress?.phoneNumber || '');
  const [addressLine, setAddressLine] = useState(existingAddress?.addressLine || '');
  const [district, setDistrict] = useState(existingAddress?.district || '');
  const [city, setCity] = useState(existingAddress?.city || 'Phnom Penh');
  const [note, setNote] = useState(existingAddress?.note || '');
  const [isDefault, setIsDefault] = useState(existingAddress?.isDefault ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!recipientName.trim() || !phoneNumber.trim() || !addressLine.trim() || !city.trim()) {
      Alert.alert('Validation Error', 'Please complete the required fields: Recipient, Phone, Address Line, and City.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: label.trim(),
        recipientName: recipientName.trim(),
        phoneNumber: phoneNumber.trim(),
        addressLine: addressLine.trim(),
        district: district.trim() || undefined,
        city: city.trim(),
        note: note.trim() || undefined,
        isDefault,
      };

      if (existingAddress) {
        await addressApi.updateAddress(existingAddress.addressId, payload);
        Alert.alert('Success', 'Address updated successfully');
      } else {
        await addressApi.createAddress(payload);
        Alert.alert('Success', 'Address created successfully');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionHeader}>Address Details</Text>

        {/* Quick Label selection */}
        <Text style={styles.labelTitle}>Label</Text>
        <View style={styles.labelChips}>
          {['Home', 'Work', 'Office', 'Other'].map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.chip, label === l && styles.selectedChip]}
              onPress={() => setLabel(l)}
            >
              <Text style={[styles.chipText, label === l && styles.selectedChipText]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Recipient Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Doe"
          value={recipientName}
          onChangeText={setRecipientName}
        />

        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 012 345 678"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <Text style={styles.inputLabel}>Address Line (Street, Building, House No.) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. St 271, Borey Peng Huoth, #45"
          value={addressLine}
          onChangeText={setAddressLine}
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>District / Khan</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chamkarmon"
              value={district}
              onChangeText={setDistrict}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="Phnom Penh"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Delivery Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g. Gate code, ring doorbell, call on arrival"
          multiline
          numberOfLines={3}
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.defaultRow}>
          <View>
            <Text style={styles.defaultTitle}>Set as Default Address</Text>
            <Text style={styles.defaultSubtitle}>Use this address automatically for checkouts</Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: '#cbd5e1', true: colors.primaryLight }}
            thumbColor={isDefault ? colors.primary : '#f8fafc'}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingAddress ? 'Update Address' : 'Save Address'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  labelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  labelChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  selectedChipText: {
    color: colors.primary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: colors.text,
  },
  multilineInput: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    marginBottom: 24,
  },
  defaultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  defaultSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

