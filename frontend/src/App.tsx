import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from '@/routes/AppRouter';

const theme = {
  token: {
    colorPrimary: '#1f6f43',
    colorInfo: '#1f6f43',
    colorWarning: '#f4b400',
    colorError: '#d8452e',
    colorTextBase: '#16231b',
    colorBgLayout: '#f3f6f1',
    colorBorder: '#dde5da',
    borderRadius: 6,
    fontFamily: "'Figtree', 'Noto Sans Khmer', system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Menu: { itemSelectedColor: '#1f6f43', horizontalItemSelectedColor: '#1f6f43' },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ConfigProvider>
  );
}
