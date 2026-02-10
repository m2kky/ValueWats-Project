import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  MegaphoneIcon, 
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon as LogoutIcon 
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GlobalProgressBar from './GlobalProgressBar';

export default function Layout({ children }) {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [socket, setSocket] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user && user.tenantId) {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const baseUrl = socketUrl.replace('/api', '');
      
      const newSocket = io(baseUrl);

      newSocket.on('connect', () => {
        // console.log('Layout socket connected, joining tenant:', user.tenantId);
        newSocket.emit('join_tenant', user.tenantId);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Campaigns', path: '/campaigns', icon: MegaphoneIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ValueWats
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 pr-2 max-w-[150px] truncate">{user?.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogoutIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
      <GlobalProgressBar socket={socket} />
    </div>
  );
}
