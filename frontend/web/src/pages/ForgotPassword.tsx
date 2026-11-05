import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Steps, Typography, message } from 'antd';
import { ArrowLeftOutlined, KeyOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { errorMessage } from '@/utils/errors';

const { Title, Text, Paragraph } = Typography;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<{ token?: string; code?: string } | null>(null);

  const [step1Form] = Form.useForm<{ email: string }>();
  const [step2Form] = Form.useForm<{ tokenOrCode: string; newPassword: string; confirmPassword: string }>();

  const handleRequestReset = async (values: { email: string }) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: values.email });
      setEmail(values.email);
      message.success(res.data.message || 'Password reset instructions sent.');

      if (res.data.resetCode || res.data.resetToken) {
        setDevToken({ token: res.data.resetToken, code: res.data.resetCode });
        step2Form.setFieldsValue({
          tokenOrCode: res.data.resetCode || res.data.resetToken || '',
        });
      }

      setCurrentStep(1);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: { tokenOrCode: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        tokenOrCode: values.tokenOrCode,
        newPassword: values.newPassword,
      });
      message.success('Password successfully reset! Please log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <Card style={{ width: '100%', maxWidth: 480, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
          <Title level={3} style={{ margin: 0, color: '#1f6f43' }}>
            Password Recovery
          </Title>
          <Text type="secondary">Supermarket Employee &amp; Operations Portal</Text>
        </div>

        <Steps
          current={currentStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Request Code' },
            { title: 'Reset Password' },
          ]}
        />

        {currentStep === 0 && (
          <Form form={step1Form} layout="vertical" onFinish={handleRequestReset} requiredMark={false}>
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
              Enter your registered staff email address. We will verify your account and provide a reset code.
            </Paragraph>

            <Form.Item
              name="email"
              label="Staff Email"
              rules={[{ required: true, type: 'email', message: 'Enter a valid staff email' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#8c8c8c' }} />}
                placeholder="staff@supermarket.com"
                autoComplete="email"
                autoFocus
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ marginTop: 8 }}>
              Send Reset Code
            </Button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')}>
                Back to Sign In
              </Button>
            </div>
          </Form>
        )}

        {currentStep === 1 && (
          <Form form={step2Form} layout="vertical" onFinish={handleResetPassword} requiredMark={false}>
            {devToken && (devToken.code || devToken.token) && (
              <Alert
                type="info"
                showIcon
                message="Development Verification Code"
                description={
                  <div>
                    {devToken.code && (
                      <div>
                        OTP Code: <strong>{devToken.code}</strong>
                      </div>
                    )}
                    {devToken.token && (
                      <div style={{ fontSize: 11, wordBreak: 'break-all', marginTop: 4 }}>
                        Token: {devToken.token}
                      </div>
                    )}
                  </div>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
              Resetting password for <strong>{email}</strong>. Enter the verification code and your new password.
            </Paragraph>

            <Form.Item
              name="tokenOrCode"
              label="Reset Code or Token"
              rules={[{ required: true, message: 'Please enter the verification code' }]}
            >
              <Input
                prefix={<SafetyCertificateOutlined style={{ color: '#8c8c8c' }} />}
                placeholder="6-digit code or reset token"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder="New password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<KeyOutlined style={{ color: '#8c8c8c' }} />} placeholder="Confirm password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ marginTop: 8 }}>
              Update Password
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <Button type="link" size="small" onClick={() => setCurrentStep(0)}>
                Resend Code
              </Button>
              <Button type="link" size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')}>
                Back to Sign In
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}

