import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { clearError, registerThunk } from '@/store/authSlice';

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useAuth();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onFinish = async (v: { username: string; email: string; password: string }) => {
    const res = await dispatch(registerThunk({ username: v.username, email: v.email, password: v.password }));
    if (registerThunk.fulfilled.match(res)) navigate(from, { replace: true });
  };

  return (
    <div className="page-narrow" style={{ maxWidth: 440 }}>
      <Card>
        <Typography.Title level={2} className="page-title">Create your account</Typography.Title>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="username" label="Name" rules={[{ required: true, min: 3, max: 50, message: 'Use 3 to 50 characters' }]}>
            <Input autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email address' }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, max: 72, message: 'Use 8 to 72 characters' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Repeat password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Repeat your password' },
              ({ getFieldValue }) => ({
                validator: (_, value) => (!value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>Create account</Button>
        </Form>
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          Already registered? <Link to="/login" state={location.state}>Log in</Link>
        </p>
      </Card>
    </div>
  );
}
