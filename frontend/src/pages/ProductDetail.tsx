import { Alert, Breadcrumb, Button, InputNumber, Result, Skeleton, Tag, Typography, message } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { money } from '@/utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const { data: p, loading, error } = useAsync(async () => (await catalogApi.product(Number(id))).data, [id]);

  if (loading) return <div className="page"><Skeleton active paragraph={{ rows: 8 }} /></div>;
  if (error || !p) return <Result status="404" title="Product not found" subTitle={error ?? undefined} extra={<Button onClick={() => navigate('/catalog')}>Back to shop</Button>} />;

  const add = async () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: location.pathname } });
    setAdding(true);
    const res = await dispatch(addToCart({ productId: p.productId, quantity: qty }));
    setAdding(false);
    if (addToCart.fulfilled.match(res)) message.success('Added to your cart');
    else message.error((res.payload as string) ?? 'Could not add this item');
  };

  return (
    <div className="page">
      <Breadcrumb items={[{ title: <Link to="/catalog">Shop</Link> }, { title: <Link to={`/catalog?categoryId=${p.categoryId}`}>{p.categoryName}</Link> }, { title: p.name }]} style={{ marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} style={{ width: '100%', borderRadius: 8, maxHeight: 420, objectFit: 'cover' }} />
        ) : (
          <div aria-hidden className="display" style={{ minHeight: 280, display: 'grid', placeItems: 'center', background: '#e4eee3', color: 'var(--leaf)', fontSize: 96, borderRadius: 8 }}>{p.name.charAt(0)}</div>
        )}
        <div>
          <Typography.Title level={1} className="page-title">{p.name}</Typography.Title>
          <p className="price" style={{ fontSize: 26, margin: '0 0 8px' }}>{money(p.price)} <span className="muted" style={{ fontSize: 16, fontWeight: 400 }}>/ {p.unit}</span></p>
          {p.inStock ? (
            p.stockQuantity <= 10 ? <Tag color="orange">Only {p.stockQuantity} left</Tag> : <Tag color="green">In stock</Tag>
          ) : <Tag color="red">Sold out</Tag>}
          {p.description && <p style={{ maxWidth: '60ch', marginTop: 16 }}>{p.description}</p>}
          <p className="muted">SKU {p.sku}</p>
          {p.inStock ? (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <InputNumber min={1} max={p.stockQuantity} value={qty} onChange={(v) => setQty(v ?? 1)} aria-label="Quantity" />
              <Button type="primary" icon={<ShoppingCartOutlined />} loading={adding} onClick={add}>Add to cart</Button>
            </div>
          ) : <Alert type="warning" showIcon message="This item is out of stock right now." style={{ maxWidth: 360, marginTop: 16 }} />}
        </div>
      </div>
    </div>
  );
}
