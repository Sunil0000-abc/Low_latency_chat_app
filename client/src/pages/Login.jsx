import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isNewUserStep, setIsNewUserStep] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!isNewUserStep) {
        // Step 1: Login or Auto-register
        const res = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        
        if (res.data.isNewUser) {
          setIsNewUserStep(true);
        } else {
          // If existing user, just go to home
          window.dispatchEvent(new Event('storage'));
          navigate('/');
        }
      } else {
        // Step 2: Collected name for new user
        const token = localStorage.getItem('token');
        await axios.patch('/api/user/update-profile', 
          { username: name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        window.dispatchEvent(new Event('storage'));
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Authentication failed. Check your credentials.';
      setError(msg);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-screen z-50 absolute inset-0 w-full px-4">
      <div className="w-full max-w-[400px] p-8 bg-white flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-6 md:mb-10 drop-shadow-2xl">
          <Logo size={120} />
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-[32px] font-semibold text-black mb-3 text-center">
          {isNewUserStep ? "Your Name" : "Sign in to Chat"}
        </h2>
        <p className="text-[#707579] text-[16px] text-center mb-8 leading-snug">
          {isNewUserStep 
            ? "Please enter your name to complete registration." 
            : "Please enter your email or username and password."}
        </p>

        {error && <div className="mb-4 text-red-500 text-sm text-center font-medium">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {!isNewUserStep ? (
            <>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full h-[54px] px-4 pt-4 pb-1 border border-[#dfe1e5] rounded-xl text-[16px] text-black focus:border-[#3390ec] focus:ring-2 focus:ring-[#3390ec] focus:outline-none transition-all peer bg-transparent"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-[#a2a6aa] ${email ? 'top-1.5 text-[12px]' : 'top-4 text-[16px]'} peer-focus:top-1.5 peer-focus:text-[12px] peer-focus:text-[#3390ec]`}>
                  Email or Username
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full h-[54px] px-4 pt-4 pb-1 border border-[#dfe1e5] rounded-xl text-[16px] text-black focus:border-[#3390ec] focus:ring-2 focus:ring-[#3390ec] focus:outline-none transition-all peer bg-transparent"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-[#a2a6aa] ${password ? 'top-1.5 text-[12px]' : 'top-4 text-[16px]'} peer-focus:top-1.5 peer-focus:text-[12px] peer-focus:text-[#3390ec]`}>
                  Password
                </label>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in zoom-in duration-300 relative">
              <input
                type="text"
                required
                className="w-full h-[54px] px-4 pt-4 pb-1 border border-[#dfe1e5] rounded-xl text-[16px] text-black focus:border-[#3390ec] focus:ring-2 focus:ring-[#3390ec] focus:outline-none transition-all peer bg-transparent"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-[#a2a6aa] ${name ? 'top-1.5 text-[12px]' : 'top-4 text-[16px]'} peer-focus:top-1.5 peer-focus:text-[12px] peer-focus:text-[#3390ec]`}>
                Display Name
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-[54px] bg-[#3390ec] hover:bg-[#2b80d4] text-white rounded-xl font-medium text-[16px] transition-colors mt-4 uppercase tracking-wide shadow-sm"
          >
            NEXT
          </button>
        </form>
      </div>
    </div>
  );
}
