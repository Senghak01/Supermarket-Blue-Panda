/* ============================================================
   Customer Mobile App TypeScript types matching backend DTOs
   ============================================================ */

// ---- Auth ---------------------------------------------------
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  tokenOrCode: string;
  newPassword: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  resetCode?: string;
}

export interface CustomerResponse {
  customerId: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  customer: CustomerResponse;
}

export interface User {
  customerId: number;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

// ---- Profile ------------------------------------------------
export interface UpdateProfileRequest {
  username: string;
}

// ---- Address ------------------------------------------------
export interface AddressResponse {
  addressId: number;
  label: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  district?: string;
  city: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  label?: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  district?: string;
  city: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export type UpdateAddressRequest = CreateAddressRequest;

// ---- Catalog ------------------------------------------------
export interface CategoryResponse {
  categoryId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
}

export interface ProductListItem {
  productId: number;
  name: string;
  sku: string;
  price: number;
  unit: string;
  imageUrl?: string;
  categoryId: number;
  categoryName: string;
  inStock: boolean;
}

export interface ProductDetailResponse extends ProductListItem {
  description?: string;
  stockQuantity: number;
}

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: 'name' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  pageSize?: number;
}

// ---- Cart ---------------------------------------------------
export interface AddCartItemRequest {
  productId: number;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemResponse {
  cartItemId: number;
  productId: number;
  name: string;
  sku: string;
  unit: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableQuantity: number;
  isAvailable: boolean;
  canCheckout: boolean;
}

export interface CartResponse {
  items: CartItemResponse[];
  itemCount: number;
  subtotal: number;
  hasIssues: boolean;
}

// ---- Orders -------------------------------------------------
export interface PlaceOrderRequest {
  addressId: number;
}

export interface OrderSummaryResponse {
  orderId: number;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentSummaryResponse {
  paymentId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
}

export interface OrderDetailResponse {
  orderId: number;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  canCancel: boolean;
  payment?: PaymentSummaryResponse;
  deliveryAddress?: AddressResponse;
  items: OrderItemResponse[];
}

// ---- Payment ------------------------------------------------
export interface InitiatePaymentRequest {
  method: PaymentMethod;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
  paymentUrl?: string;
  qrData?: string;
  expiresAt?: string;
  createdAt: string;
  paidAt?: string;
}

// ---- Enums --------------------------------------------------
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'ReadyForDelivery'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'CashOnDelivery' | 'Khqr' | 'Card';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled' | 'Refunded';

// ---- Pagination ---------------------------------------------
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

