import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-2xl border border-slate-700">
        <div className="flex items-center justify-center mb-8">
          <Shield className="w-12 h-12 text-green-500 mr-3" />
          <div>
            <h1 className="text-2xl text-white">Military Inventory System</h1>
            <p className="text-sm text-slate-400">Secure Access Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-green-500"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-green-500"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-700/50 rounded text-sm text-slate-300">
          <p className="mb-2">Demo Credentials:</p>
          <p>Admin: admin / admin123</p>
          <p>Supply Officer: supply / supply123</p>
        </div>
      </div>
    </div>
  );
}
