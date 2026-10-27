import { Alert, Button, Empty, Table, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { orderApi } from '@/api';
import { OrderStatusTag } from '@/components/StatusTags';
import { useAsync } from '@/hooks/useAsync';
import { dateTime, money } from '@/utils/format';

export default function Orders() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsync(async () => (await orderApi.list(page, 10)).data, [page]);

  return (
    <div className="page">
      <Typography.Title level={2} className="page-title">My orders</Typography.Title>
      {error && <Alert type="error" showIcon message={error} />}
      <Table
        rowKey="orderId"
        loading={loading}
        dataSource={data?.items}
        scroll={{ x: 520 }}
        locale={{ emptyText: <Empty description="No orders yet."><Button type="primary" onClick={() => navigate('/catalog')}>Start shopping</Button></Empty> }}
        pagination={{ current: page, pageSize: 10, total: data?.totalCount ?? 0, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Order', render: (_, o) => <Link to={`/orders/${o.orderId}`}>#{o.orderId}</Link> },
          { title: 'Placed', render: (_, o) => dateTime(o.createdAt) },
          { title: 'Items', dataIndex: 'itemCount', align: 'right' },
          { title: 'Total', align: 'right', render: (_, o) => <span className="price">{money(o.totalAmount)}</span> },
          { title: 'Status', render: (_, o) => <OrderStatusTag status={o.status} /> },
        ]}
      />
    </div>
  );
}
