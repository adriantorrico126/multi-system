import { useNavigate } from 'react-router-dom';
import { LoginModal } from '@/components/auth/LoginModal';

export default function Login() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50">
      <LoginModal onLoginSuccess={handleLoginSuccess} />
    </div>
  );
} 