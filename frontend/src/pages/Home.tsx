import { Button, Skeleton, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { catalogApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';

export default function Home() {
  const navigate = useNavigate();
  const cats = useAsync(async () => (await catalogApi.categories()).data, []);
  const fresh = useAsync(async () => (await catalogApi.products({ sort: 'newest', inStockOnly: true, pageSize: 8 })).data, []);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>Groceries at your door, same day.</h1>
          <p>Browse the shelves, fill your cart and pay with Bakong KHQR or cash when it arrives.</p>
          <Button size="large" onClick={() => navigate('/catalog')} style={{ background: 'var(--mango)', borderColor: 'var(--mango)', color: 'var(--ink)', fontWeight: 600 }}>
            Start shopping
          </Button>
        </div>
      </section>
      <div className="page">
        <Typography.Title level={3}>Shop by aisle</Typography.Title>
        {cats.loading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
          <div className="chip-row" style={{ marginBottom: 32 }}>
            {cats.data?.map((c) => (
              <Tag
                key={c.categoryId}
                onClick={() => navigate(`/catalog?categoryId=${c.categoryId}`)}
                style={{ cursor: 'pointer', fontSize: 15, padding: '6px 12px', borderRadius: 6, background: '#fff' }}
              >
                {c.name} <span className="muted">({c.productCount})</span>
              </Tag>
            ))}
          </div>
        )}
        <div className="row-between">
          <Typography.Title level={3} style={{ margin: 0 }}>New on the shelves</Typography.Title>
          <Button type="link" onClick={() => navigate('/catalog?sort=newest')}>See everything</Button>
        </div>
        <div className="product-grid" style={{ marginTop: 16 }}>
          {fresh.loading ? <Skeleton active /> : fresh.data?.items.map((p) => <ProductCard key={p.productId} product={p} />)}
        </div>
        {fresh.error && <Typography.Text type="danger">{fresh.error}</Typography.Text>}
      </div>
    </>
  );
}
