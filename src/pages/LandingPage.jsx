import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Welcome to SecureBank
          </h1>
          <p className="text-lg text-gray-400">
            Your trusted partner in digital banking
          </p>
        </div>
        
        <div className="space-y-4 pt-8">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Login
          </button>
          
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-3 px-4 border-2 border-primary hover:bg-background-lighter text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;