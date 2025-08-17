'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function SimpleAuth() {
  const { setUser, seedDemoData } = useApp();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent, withDemo = false) => {
    e.preventDefault();
    if (!email) return;

    setIsLoggingIn(true);
    
    // Simulate login with mock user data
    setTimeout(() => {
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      const userName = name || email.split('@')[0];
      
      setUser({
        id: userId,
        email,
        name: userName,
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      });
      
      if (withDemo) {
        seedDemoData(userId, email, userName);
      }
      
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-6xl mb-6 text-center">🐝</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Welcome to PayHive</h1>
      <p className="text-gray-600 mb-8 text-center">
        Split expenses seamlessly with friends using blockchain technology.
      </p>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={() => {
            setEmail('alice@example.com');
            setName('Alice Johnson');
            setTimeout(() => handleLogin({ preventDefault: () => {} } as any, true), 100);
          }}
          disabled={isLoggingIn}
          className="btn-primary w-full"
        >
          🚀 Quick Demo as Alice (with sample data)
        </button>
        
        <button
          onClick={() => {
            setEmail('bob@example.com');
            setName('Bob Smith');
            setTimeout(() => handleLogin({ preventDefault: () => {} } as any, true), 100);
          }}
          disabled={isLoggingIn}
          className="btn-secondary w-full"
        >
          🎯 Quick Demo as Bob (with sample data)
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or create custom account</span>
        </div>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4 mt-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name (Optional)
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Your Name"
          />
        </div>
        
        <button
          type="submit"
          disabled={!email || isLoggingIn}
          className="btn-primary w-full"
        >
          {isLoggingIn ? 'Creating Account...' : 'Continue'}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-4">Demo Features:</p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>🔐 Mock wallet creation</p>
          <p>💰 Simulated PYUSD settlements</p>
          <p>📱 Full expense management</p>
        </div>
      </div>
    </div>
  );
}
