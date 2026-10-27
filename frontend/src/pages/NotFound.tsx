import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return <Result status="404" title="Page not found" subTitle="That page does not exist or has moved." extra={<Button type="primary" onClick={() => navigate('/')}>Back to home</Button>} />;
}
