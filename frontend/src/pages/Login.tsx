import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { clearError, loginThunk } from '@/store/authSlice';
import { useEffect } from 'react';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading, error } = useAuth();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onFinish = async (v: { email: string; password: string }) => {
    const res = await dispatch(loginThunk(v));
    if (loginThunk.fulfilled.match(res)) navigate(from, { replace: true });
  };

  return (
    <div className="page-narrow" style={{ maxWidth: 440 }}>
      <Card>
        <Typography.Title level={2} className="page-title">Log in</Typography.Title>
        {params.get('expired') && <Alert type="info" showIcon message="Your session ended. Log in again to continue." style={{ marginBottom: 16 }} />}
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email address' }]}>
            <Input autoComplete="email" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>Log in</Button>
        </Form>
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          New here? <Link to="/register" state={location.state}>Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
