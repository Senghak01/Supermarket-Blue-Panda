import { Button, Card, InputNumber, Tag, Typography, message } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import type { ProductListItem } from '@/types';
import { money } from '@/utils/format';

export default function ProductCard({ product }: { product: ProductListItem }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!isAuthenticated) {
      message.info('Log in to start your cart.');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setAdding(true);
    const result = await dispatch(addToCart({ productId: product.productId, quantity: qty }));
    setAdding(false);
    if (addToCart.fulfilled.match(result)) message.success(`${product.name} added to your cart`);
    else message.error((result.payload as string) ?? 'Could not add this item');
  };

  return (
    <Card
      hoverable
      styles={{ body: { padding: 12 } }}
      cover={
        product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} style={{ height: 140, objectFit: 'cover' }} loading="lazy" />
        ) : (
          <div
            aria-hidden
            style={{ height: 140, display: 'grid', placeItems: 'center', background: '#e4eee3', color: '#1f6f43', fontSize: 40 }}
            className="display"
          >
            {product.name.charAt(0)}
          </div>
        )
      }
      onClick={() => navigate(`/products/${product.productId}`)}
    >
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{product.categoryName}</Typography.Text>
      <Typography.Title level={5} style={{ margin: '2px 0 4px' }} ellipsis={{ rows: 2 }}>
        {product.name}
      </Typography.Title>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <span className="price">{money(product.price)} <span className="muted" style={{ fontWeight: 400 }}>/ {product.unit}</span></span>
        {!product.inStock && <Tag color="red">Sold out</Tag>}
      </div>
      <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
        <InputNumber min={1} max={99} value={qty} onChange={(v) => setQty(v ?? 1)} size="small" style={{ width: 62 }} disabled={!product.inStock} aria-label="Quantity" />
        <Button type="primary" block icon={<ShoppingCartOutlined />} loading={adding} disabled={!product.inStock} onClick={add}>
          Add
        </Button>
      </div>
    </Card>
  );
}
