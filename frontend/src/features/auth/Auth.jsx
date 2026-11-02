import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="max-w-sm mx-auto space-y-5 pt-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-xs text-gray-500">
          {isLogin ? 'Sign in to sync your eco-activities' : 'Start your sustainable journey today'}
        </p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        {!isLogin && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Display Name</label>
            <input
              type="text"
              placeholder="e.g. Shubham"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            type="email"
            placeholder="you@domain.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>

        <button
          type="button"
          className="w-full py-2.5 bg-eco-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-eco-700 transition mt-2"
        >
          {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
        </button>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-eco-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
