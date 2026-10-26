import { Card, Button, Typography, InputNumber, message } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import type { Product } from '@/types';
import { useState } from 'react';

const { Meta } = Card;
const { Text } = Typography;

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    dispatch(addToCart({ product, quantity: qty }));
    message.success(`${product.name} added to cart`);
    setQty(1);
  };

  return (
    <Card
      hoverable
      style={{ width: '100%' }}
      cover={
        product.imageUrl ? (
          <img alt={product.name} src={product.imageUrl} style={{ height: 200, objectFit: 'cover' }} />
        ) : (
          <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
            🛍️
          </div>
        )
      }
      onClick={() => navigate(`/products/${product.id}`)}
      actions={[
        <InputNumber
          key="qty"
          min={1}
          max={product.stockQuantity}
          value={qty}
          onChange={(v) => setQty(v || 1)}
          onClick={(e) => e.stopPropagation()}
          size="small"
          style={{ width: 60 }}
        />,
        <Button
          key="add"
          type="primary"
          icon={<ShoppingCartOutlined />}
          disabled={!product.inStock}
          onClick={handleAdd}
          size="small"
        >
          Add
        </Button>,
      ]}
    >
      <Meta
        title={product.name}
        description={
          <>
            <Text strong style={{ fontSize: 16 }}>${product.price.toFixed(2)}</Text>
            <br />
            <Text type={product.inStock ? 'success' : 'danger'}>
              {product.inStock ? `In Stock (${product.stockQuantity})` : 'Out of Stock'}
            </Text>
          </>
        }
      />
    </Card>
  );
}

