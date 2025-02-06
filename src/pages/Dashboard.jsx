// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import Balance from '../components/dashboard/Balance';
import TransferForm from '../components/dashboard/TransferForm';
import TransactionHistoryPanel from '../components/dashboard/TransactionHistoryPanel';
import BeneficiaryManager from '../components/dashboard/BeneficiaryManager';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  const handleSelectBeneficiary = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
  };

  const formatAccountNumber = (number) => {
    return `${number}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-background-lighter border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-white">ModernBank</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="text-primary" size={20} />
                <span className="text-gray-300">{currentUser.email}</span>
              </div>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            <Balance />
            
            {/* Account Information Section */}
            <div className="bg-background-lighter p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Full Name</p>
                  <p className="text-white">{currentUser.name}</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Account Number</p>
                  <p className="text-white font-mono">
                    {formatAccountNumber(currentUser.accountNumber)}
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Member Since</p>
                  <p className="text-white">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <TransactionHistoryPanel />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <TransferForm initialBeneficiary={selectedBeneficiary} />
            <BeneficiaryManager onSelectBeneficiary={handleSelectBeneficiary} />
          </div>
        </div>
      </main>
    </div>
  );
}