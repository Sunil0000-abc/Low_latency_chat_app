import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/signup', { username, password, avatar });
      localStorage.setItem('token', res.data.token);
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Signup failed. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#202c33]/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="p-4 bg-indigo-500/20 rounded-full">
            {avatar ? <img src={avatar} className="w-10 h-10 rounded-full object-cover" /> : <UserPlus className="w-10 h-10 text-indigo-400" />}
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Create Account</h2>
          <p className="text-gray-400">Join the chat community</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm text-center border border-red-500/30">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#111b21] p-3 rounded-xl border border-gray-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#111b21] p-3 rounded-xl border border-gray-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL (Optional)</label>
            <input
              type="text"
              className="w-full bg-[#111b21] p-3 rounded-xl border border-gray-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all text-[14px]"
              placeholder="https://example.com/avatar.png"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-xl font-semibold transition-colors mt-2"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline hover:text-indigo-300 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
