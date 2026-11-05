import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface QuantityStepperProps {
  quantity: number;
  max?: number;
  min?: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  max = 99,
  min = 1,
  onChange,
  disabled = false,
}) => {
  const handleDecrement = () => {
    if (quantity > min && !disabled) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max && !disabled) {
      onChange(quantity + 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, (quantity <= min || disabled) && styles.disabledButton]}
        onPress={handleDecrement}
        disabled={quantity <= min || disabled}
      >
        <Ionicons name="remove" size={16} color={quantity <= min || disabled ? colors.textMuted : colors.text} />
      </TouchableOpacity>

      <Text style={styles.quantityText}>{quantity}</Text>

      <TouchableOpacity
        style={[styles.button, (quantity >= max || disabled) && styles.disabledButton]}
        onPress={handleIncrement}
        disabled={quantity >= max || disabled}
      >
        <Ionicons name="add" size={16} color={quantity >= max || disabled ? colors.textMuted : colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  quantityText: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});

