import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { uploadProfileImage } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isNewUserStep, setIsNewUserStep] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
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
        let avatar = null;

        if (profileFile) {
          avatar = await uploadProfileImage(profileFile);
        }

        const resUpdate = await axios.patch('/api/user/update-profile', 
          { username: name, avatar },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (resUpdate.data.token) {
          localStorage.setItem('token', resUpdate.data.token);
        }
        window.dispatchEvent(new Event('storage'));
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Authentication failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white h-full z-50 absolute inset-0 w-full px-4">
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
            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center gap-6">
              {/* Profile Picture Upload */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#dfe1e5] group-hover:border-[#3390ec] overflow-hidden flex items-center justify-center transition-all bg-[#f4f4f5]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="flex flex-col items-center text-[#707579]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-[#3390ec] text-white p-1.5 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>

              <div className="relative w-full">
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
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[54px] bg-[#3390ec] hover:bg-[#2b80d4] disabled:bg-[#3390ec]/60 disabled:cursor-not-allowed text-white rounded-xl font-medium text-[16px] transition-colors mt-4 uppercase tracking-wide shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "NEXT"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
