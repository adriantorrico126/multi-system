
import { POSSystem } from '@/components/pos/POSSystem';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal'; // Import named export

const Index = () => {
  const { isAuthenticated, user, login } = useAuth();

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={() => {}} />;
  }

  return <POSSystem currentUserRole={user?.rol} />;
};

export default Index;
