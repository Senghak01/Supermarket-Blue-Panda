import { Alert, Empty, Pagination, Select, Skeleton, Switch, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { catalogApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import type { ProductQuery } from '@/types';

const PAGE_SIZE = 12;

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? undefined;
  const categoryId = params.get('categoryId') ? Number(params.get('categoryId')) : undefined;
  const sort = (params.get('sort') as ProductQuery['sort']) ?? 'name';
  const inStockOnly = params.get('inStock') === '1';
  const page = Number(params.get('page') ?? 1);

  // One setter that keeps the URL as the single source of truth (shareable links, back button works)
  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const cats = useAsync(async () => (await catalogApi.categories()).data, []);
  const products = useAsync(
    async () => (await catalogApi.products({ search, categoryId, sort, inStockOnly, page, pageSize: PAGE_SIZE })).data,
    [search, categoryId, sort, inStockOnly, page],
  );

  return (
    <div className="page">
      <Typography.Title level={2} className="page-title">
        {search ? `Results for “${search}”` : cats.data?.find((c) => c.categoryId === categoryId)?.name ?? 'Shop'}
      </Typography.Title>

      <div className="row-between" style={{ marginBottom: 16, justifyContent: 'flex-start', gap: 16 }}>
        <Select
          allowClear
          placeholder="All aisles"
          style={{ minWidth: 200 }}
          value={categoryId}
          onChange={(v) => update({ categoryId: v ? String(v) : undefined })}
          options={cats.data?.map((c) => ({ value: c.categoryId, label: `${c.name} (${c.productCount})` }))}
        />
        <Select
          style={{ minWidth: 190 }}
          value={sort}
          onChange={(v) => update({ sort: v === 'name' ? undefined : v })}
          options={[
            { value: 'name', label: 'Name A to Z' },
            { value: 'price_asc', label: 'Price: low to high' },
            { value: 'price_desc', label: 'Price: high to low' },
            { value: 'newest', label: 'Newest first' },
          ]}
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Switch checked={inStockOnly} onChange={(v) => update({ inStock: v ? '1' : undefined })} /> In stock only
        </label>
      </div>

      {products.error && <Alert type="error" showIcon message={products.error} />}
      {products.loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : products.data && products.data.items.length > 0 ? (
        <>
          <div className="product-grid">
            {products.data.items.map((p) => <ProductCard key={p.productId} product={p} />)}
          </div>
          <Pagination
            style={{ marginTop: 24, textAlign: 'center' }}
            current={page}
            pageSize={PAGE_SIZE}
            total={products.data.totalCount}
            showSizeChanger={false}
            hideOnSinglePage
            onChange={(p) => update({ page: String(p) })}
          />
        </>
      ) : (
        !products.error && <Empty description="No products match. Try another search or aisle." />
      )}
    </div>
  );
}
