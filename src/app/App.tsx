import { Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthTemp';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Outlet />
      </AppProvider>
    </AuthProvider>
  );
}