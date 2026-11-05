import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { clearError, loginThunk } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

const { Title, Text } = Typography;

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading, error, isAdmin, isStaff } = useAuth();
  const [customerWarning, setCustomerWarning] = useState(false);
  const [form] = Form.useForm<{ email: string; password: string }>();

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // If already authenticated with Staff or Admin, redirect to destination
  if (isAuthenticated && (isAdmin || isStaff)) {
    return <Navigate to={from} replace />;
  }

  const onFinish = async (v: { email: string; password: string }) => {
    setCustomerWarning(false);
    const res = await dispatch(loginThunk(v));
    if (loginThunk.fulfilled.match(res)) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <Card style={{ width: '100%', maxWidth: 440, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
          <Title level={3} style={{ margin: 0, color: '#1f6f43' }}>
            Supermarket Ops
          </Title>
          <Text type="secondary">Employee &amp; Management Portal</Text>
        </div>

        {params.get('expired') && (
          <Alert type="info" showIcon message="Your employee session ended. Please log in again." style={{ marginBottom: 16 }} />
        )}

        {(params.get('customer_access_denied') || customerWarning) && (
          <Alert
            type="error"
            showIcon
            message="Access Restricted"
            description="This web portal is restricted to authorized store staff and administrators. Customers please use the Supermarket Mobile App."
            style={{ marginBottom: 16 }}
          />
        )}

        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Employee Email"
            rules={[{ required: true, type: 'email', message: 'Enter a valid staff email' }]}
          >
            <Input prefix={<MailOutlined style={{ color: '#8c8c8c' }} />} placeholder="staff@supermarket.com" autoComplete="email" autoFocus />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Enter your password' }]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder="••••••••" autoComplete="current-password" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button
              type="link"
              style={{ padding: 0, fontSize: 13 }}
              onClick={() => navigate('/forgot-password')}
            >
              Forgot password?
            </Button>
          </div>

          <Button type="primary" htmlType="submit" block size="large" loading={isLoading} style={{ marginTop: 8 }}>
            Sign In to Portal
          </Button>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center', background: '#fafafa', padding: '12px', borderRadius: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            🛒 Looking to buy groceries? Customer shopping is supported via the <strong>Supermarket Mobile App</strong>.
          </Text>
        </div>
      </Card>
    </div>
  );
}
