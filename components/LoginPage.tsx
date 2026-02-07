
import React, { useState } from 'react';
import { User } from '../types';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ users, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulasi delay loading agar terlihat lebih nyata
    setTimeout(() => {
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Username atau Password salah!');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
      {/* Dekorasi Background */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-md p-8 relative animate-fadeIn">
        <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[48px] border border-white/20 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-teal-500 rounded-3xl mx-auto flex items-center justify-center text-white font-black text-4xl italic shadow-2xl shadow-teal-500/20 animate-bounce">S</div>
             <div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Senyum Sehat</h1>
                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.4em] italic">Management System v1.0</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Username</label>
              <input 
                type="text" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 transition-all placeholder:text-slate-600"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Password</label>
              <input 
                type="password" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 transition-all placeholder:text-slate-600"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-rose-400 text-[10px] font-black uppercase text-center italic animate-bounce">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-teal-500 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-teal-500/20 transition-all active:scale-95 border-b-8 border-teal-700 active:border-b-0 flex items-center justify-center space-x-3 ${isLoading ? 'opacity-50 grayscale' : ''}`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span>MASUK KE SISTEM</span>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic opacity-50">Authorized Personnel Only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
