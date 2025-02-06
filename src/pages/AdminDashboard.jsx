// src/pages/AdminDashboard.jsx
import { useAuth } from '../contexts/AuthContext';
import UsersList from '../components/admin/UsersList';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background-lighter border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-xl font-bold text-white">ModernBank</span>
              <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                Admin Panel
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{currentUser.email}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-background hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-white">User Management</h1>
          </div>
          <UsersList />
        </div>
      </main>
    </div>
  );
}