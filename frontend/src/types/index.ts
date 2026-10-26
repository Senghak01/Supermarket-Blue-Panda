/* ============================================================
   Shared TypeScript types matching the backend DTOs exactly
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

export interface DecodedToken {
  nameid: string;        // ClaimTypes.NameIdentifier → customerId
  email: string;
  unique_name: string;   // ClaimTypes.Name → username
  role: string | string[];
  permission?: string | string[];
  exp: number;
  iss: string;
  aud: string;
}

export interface User {
  customerId: number;
  email: string;
  username: string;
  role: string;
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
  method: string;  // "CashOnDelivery" | "Khqr" | "Card"
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

// ---- Inventory (staff & admin) ------------------------------
export interface InventoryItemResponse {
  productId: number;
  productName: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  price: number;
  unit: string;
  quantity: number;
  isActive: boolean;
  updatedAt: string;
}

export interface InventoryQuery {
  search?: string;
  categoryId?: number;
  lowStockOnly?: boolean;
  lowStockThreshold?: number;
  page?: number;
  pageSize?: number;
}

export interface AdjustStockRequest {
  productId: number;
  deltaQuantity: number;
  movementType?: StockMovementType;
  note?: string;
}

export interface StockMovementResponse {
  stockMovementId: number;
  productId: number;
  productName: string;
  employeeId?: number;
  movementType: StockMovementType;
  quantity: number;
  referenceId?: number;
  createdAt: string;
}

// ---- Admin: Users -------------------------------------------
export interface AdminUserListItem {
  customerId: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  permissions: string[];
}

export interface CreateStaffUserRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
  permissions?: string[];
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface GrantPermissionRequest {
  permission: string;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

// ---- Admin: Catalog -----------------------------------------
export interface CreateProductRequest {
  categoryId: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  unit?: string;
  imageUrl?: string;
  initialStock?: number;
}

export interface UpdateProductRequest {
  categoryId: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  unit?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

// ---- Admin: Orders ------------------------------------------
export interface AdminOrderQuery {
  status?: OrderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// ---- Enums (serialized as strings) ---------------------------
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

export type StockMovementType = 'Purchase' | 'Sale' | 'Return' | 'Adjustment';

// ---- Pagination ---------------------------------------------
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

