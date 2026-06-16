import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, UserCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import HeaderNav from '../components/HeaderNav';
import WorkYaarLogo from '../components/WorkYaarLogo';
import { saveAuthUser, getAuthUser } from '../lib/auth';
import { GoogleLogin } from '@react-oauth/google';

const AuthPage = ({ mode = 'login' }: { mode?: 'login' | 'register' }) => {
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const authImage =
    role === 'candidate'
      ? '/assets/auth-professional-laptop.jpg'
      : '/assets/auth-hiring-team.jpg';

  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setOtpMode(false);
    setResetMode(false);
    setConfirmPassword('');
    setPassword('');
    setFullName('');
    setOtpCode('');
  }, [mode]);

  const goToDashboard = (explicitRole?: string) => {
    const userRole = explicitRole || getAuthUser()?.role || role;
    navigate(userRole === 'admin' ? '/dashboard/admin' : userRole === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer');
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match");
          setIsLoading(false);
          return;
        }
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, email, password, role })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        
        setSuccessMsg('Registration successful! Please check your email for the OTP.');
        setOtpMode(true); // Switch to OTP verification mode
        
      } else if (otpMode && !resetMode) {
        // Verifying OTP for registration/login
        const res = await fetch('/api/v1/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otpCode, purpose: 'verification' })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Invalid OTP');
        
        if (data.token && data.user) {
          saveAuthUser(data.user, data.token);
          goToDashboard();
        } else {
          setSuccessMsg('OTP Verified! You can now log in.');
          setOtpMode(false);
        }
      } else if (otpMode && resetMode) {
        // Resetting Password
        const res = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otpCode, newPassword: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to reset password');

        setSuccessMsg('Password reset successful! You can now log in.');
        setOtpMode(false);
        setResetMode(false);
        setPassword('');
      } else {
        // Standard Login
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        saveAuthUser(data.user, data.token);
        goToDashboard();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg("Please enter your email address first to reset your password.");
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to initiate password reset');
      
      setSuccessMsg("Reset code sent to your email!");
      setResetMode(true);
      setOtpMode(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans selection:bg-black selection:text-white">
      <HeaderNav variant="auth" />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-400/20 blur-[100px] mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-orange-400/10 blur-[120px] mix-blend-multiply pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row max-w-6xl w-full min-h-[680px] relative z-10"
        >
          {/* Left Side - Auth Image */}
          <div className="md:w-[45%] relative hidden md:flex flex-col justify-between overflow-hidden bg-black p-12 text-white">
            <div className="absolute inset-0 z-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={authImage}
                  src={authImage}
                  alt={role === 'candidate' ? 'Professional using a laptop at work' : 'Hiring team reviewing candidates'}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.5 }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/15" />
            </div>

            <div className="relative z-10">
              <WorkYaarLogo
                className="inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3"
                imageClassName="h-8 w-8"
                textClassName="text-2xl text-white tracking-tight"
              />
            </div>
            
            <div className="relative z-10 mt-auto">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-6"
              >
                {role === 'candidate' 
                  ? "Your career's next chapter begins here."
                  : "Build the team you've always envisioned."}
              </motion.h2>
              <div className="flex items-center gap-4 text-white/60">
                <div className="h-[1px] flex-1 bg-white/20" />
                <span className="text-sm font-medium tracking-wide uppercase">Join the top 1%</span>
              </div>
            </div>
          </div>

          {/* Right Side - Premium Minimalist Form */}
          <div className="md:w-[55%] p-8 md:p-16 flex flex-col justify-center bg-white relative">
            <div className="max-w-md w-full mx-auto">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                {mode === 'login' ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {mode === 'login' 
                  ? 'Enter your details to access your dashboard.'
                  : 'Join thousands of professionals already on WorkYaar.'}
              </p>

              {/* Role Toggle Switch */}
              <div className="flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl mb-8 relative">
                <motion.div 
                  className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
                  animate={{ left: role === 'candidate' ? '4px' : 'calc(50% + 2px)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button 
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'candidate' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Candidate
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'employer' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Employer
                </button>
              </div>

              {/* Single Google Auth Button */}
              <div className="flex justify-center mb-8">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (!credentialResponse.credential) return;
                    setIsLoading(true);
                    try {
                      // Send the real Google token to your backend
                      const res = await fetch('/api/v1/auth/google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          idToken: credentialResponse.credential, 
                          role 
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        saveAuthUser(data.user, data.token);
                        goToDashboard();
                      } else {
                        setErrorMsg(data.message || 'Google Auth Failed');
                      }
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Failed to connect to server');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onError={() => setErrorMsg('Google Login Failed')}
                  shape="rectangular"
                  width="100%"
                />
              </div>

              <div className="relative mb-8 text-center flex items-center justify-center">
                <div className="w-full border-t border-gray-100" />
                <span className="absolute px-4 bg-white text-xs font-semibold tracking-wider text-gray-400 uppercase">Or with email</span>
              </div>

              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 mb-6 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {errorMsg}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 mb-6 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-start gap-2">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-5">
                {!otpMode ? (
                  <>
                    {mode === 'register' && (
                      <div className="space-y-1.5 group">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full Name</label>
                        <div className="relative">
                          <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0047FF]" size={18} />
                          <input 
                            required
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)} 
                            type="text" 
                            placeholder="John Doe" 
                            className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-[15px] transition-all focus:bg-white focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] outline-none" 
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 group">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0047FF]" size={18} />
                        <input 
                          required
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          type="email" 
                          placeholder="you@example.com" 
                          className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-[15px] transition-all focus:bg-white focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] outline-none" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 group">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                        {mode === 'login' && (
                          <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-[#0047FF] hover:underline">Forgot?</button>
                        )}
                      </div>
                      <div className="relative">
                        <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0047FF]" size={18} />
                        <input
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-[15px] transition-all focus:bg-white focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] outline-none"
                        />
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div className="space-y-1.5 group">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confirm Password</label>
                        <div className="relative">
                          <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0047FF]" size={18} />
                          <input
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-[15px] transition-all focus:bg-white focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                    <div className="space-y-1.5 group">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Enter 6-Digit OTP</label>
                      <div className="relative">
                        <input 
                          required
                          value={otpCode} 
                          onChange={(e) => setOtpCode(e.target.value)} 
                          type="text" 
                          maxLength={6}
                          placeholder="123456" 
                          className="w-full bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl text-center text-2xl tracking-[0.5em] font-medium transition-all focus:bg-white focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] outline-none" 
                        />
                      </div>
                    </div>
                    {resetMode && (
                      <div className="space-y-1.5 group mt-4">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Password</label>
                        <div className="relative">
                          <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0047FF]" size={18} />
                          <input
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="Min 8 characters"
                            className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-[15px] transition-all focus:bg-white focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] outline-none"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-center">Check your backend terminal (or email) for the code!</p>
                  </motion.div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full relative group bg-black text-white py-4 rounded-xl text-[15px] font-medium overflow-hidden transition-all hover:bg-gray-900 hover:shadow-lg hover:shadow-black/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isLoading && <Loader2 className="animate-spin" size={18} />}
                      {!isLoading && (
                        otpMode ? 'Verify & Continue' : (mode === 'login' ? 'Sign In' : 'Create Account')
                      )}
                      {!isLoading && !otpMode && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                    </span>
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-gray-500 mt-8">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <Link to={mode === 'login' ? "/register" : "/login"} className="text-black font-semibold hover:underline decoration-2 underline-offset-4">
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
