import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { TabNavigator } from './TabNavigator';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

import { ProductDetailScreen } from '../screens/catalog/ProductDetailScreen';
import { CheckoutScreen } from '../screens/cart/CheckoutScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { PaymentScreen } from '../screens/orders/PaymentScreen';
import { AddressesScreen } from '../screens/profile/AddressesScreen';
import { AddressFormScreen } from '../screens/profile/AddressFormScreen';

import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { token, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.text,
        },
        headerTintColor: colors.primary,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {!token ? (
        // Unauthenticated Stack
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : (
        // Authenticated Stack
        <Stack.Group>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: 'Product Details' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: 'Order Details' }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ title: 'Payment' }}
          />
          <Stack.Screen
            name="Addresses"
            component={AddressesScreen}
            options={{ title: 'My Addresses' }}
          />
          <Stack.Screen
            name="AddressForm"
            component={AddressFormScreen}
            options={({ route }: any) => ({
              title: route?.params?.address ? 'Edit Address' : 'New Address',
            })}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Reset Password' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

