import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      setError(msg);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#202c33]/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="p-4 bg-[#00a884]/20 rounded-full">
            <MessageSquare className="w-10 h-10 text-[#00a884]" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-[#00a884] bg-clip-text text-transparent">Welcome Back</h2>
          <p className="text-gray-400">Sign in to your chat account</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm text-center border border-red-500/30">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#111b21] p-3 rounded-xl border border-gray-800 focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#111b21] p-3 rounded-xl border border-gray-800 focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white p-3 rounded-xl font-semibold transition-colors mt-2"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#00a884] hover:underline hover:text-emerald-400 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
