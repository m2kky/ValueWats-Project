import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/client';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const PasswordRule = ({ met, text }) => (
  <div className="flex items-center gap-2 text-xs">
    <div className={`flex items-center justify-center w-4 h-4 rounded-full ${met ? 'bg-[#00D084]' : 'bg-[#2A2A2A]'} text-[#232318] transition-colors duration-300`}>
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className={met ? 'text-[#00D084]' : 'text-zinc-500'} style={{ transition: 'color 0.3s' }}>
      {text}
    </span>
  </div>
);

export default function Register() {
  const [step, setStep] = useState(1); // 1: Input, 2: OTP
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  // Validation rules
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLower = /[a-z]/.test(password);

  const isPasswordValid = hasSpecial && hasLength && hasUpper && hasNumber && hasLower;

  // Combine names for tenant
  const tenantName = `${firstName} ${lastName}`.trim() || 'My Workspace';

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.data.user,
        onboardingCompleted: response.data.tenant?.onboardingCompleted,
      }));
      if (response.data.tenant?.onboardingCompleted === false) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please meet all password requirements.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        tenantName,
        email,
        password,
      });

      if (response.data.needsOtp) {
        setRegistrationToken(response.data.registrationToken);
        setStep(2);
        setResendCooldown(60); // 60s cooldown
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        registrationToken,
        otp,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.data.user,
        onboardingCompleted: response.data.tenant?.onboardingCompleted,
      }));
      // New users always go to onboarding
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', { registrationToken });
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#232318] flex flex-col font-sans text-white relative selection:bg-[#e2f300]/30 selection:text-[#232318]">
      {/* Top Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5">
        <img src="/main-logo.svg" alt="Value chat" className="w-9 h-9 rounded-lg shadow-[0_0_15px_rgba(226,243,0,0.35)]" />
        <span className="text-xl font-bold tracking-tight text-white">Value chat</span>
      </div>

      {/* Language / Theme toggle mock */}
      <div className="absolute top-6 right-6 hidden sm:flex items-center gap-4">
        <button className="text-zinc-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
        </button>
        <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors border border-white/10 rounded-md px-3 py-1.5 bg-white/5">
          <span>EN</span>
          <span>Language</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {step === 1 ? 'Get started now!' : 'Verify your email'}
            </h2>
            <p className="text-zinc-400 text-sm">
              {step === 1 ? 'Continue with Google or get started with your email.' : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {step === 1 ? (
            <>
              {/* Google Sign-Up */}
              <div className="flex justify-center mb-6 [&_iframe]:!rounded-xl [&>div]:!w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  width="380"
                  text="continue_with"
                />
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#232318] px-3 text-zinc-600">Or</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-500 transition-colors"
                    placeholder="First name"
                  />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-500 transition-colors"
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-500 transition-colors"
                    placeholder="Email"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 bg-[#2a2a1f] border ${password && !isPasswordValid ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-[#e2f300] focus:ring-[#e2f300]'} rounded-xl focus:outline-none focus:ring-1 text-white placeholder-zinc-500 transition-colors pr-12`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Rules UI */}
                <div className="space-y-2 mt-3 mb-6 pl-1 border-b border-white/5 pb-5">
                  <PasswordRule met={hasSpecial} text="Contains at least 1 special character" />
                  <PasswordRule met={hasLength} text="Contains at least 8 characters" />
                  <PasswordRule met={hasUpper} text="Contains at least 1 uppercase" />
                  <PasswordRule met={hasNumber} text="Contains at least 1 number" />
                  <PasswordRule met={hasLower} text="Contains at least 1 lowercase" />
                </div>

                <p className="text-xs text-zinc-500 my-4 text-center">
                  By clicking on <strong className="text-zinc-300 font-medium">Get Started</strong>, you agree to the <a href="#" className="text-[#e2f300] hover:text-[#f2ff4f] transition-colors">terms of service</a> and <a href="#" className="text-[#e2f300] hover:text-[#f2ff4f] transition-colors">privacy policy</a>.
                </p>

                <button
                  type="submit"
                  disabled={loading || !email || !password || !firstName || !lastName || !isPasswordValid}
                  className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-[#232318] bg-[#e2f300] hover:bg-[#d0df00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#232318] focus:ring-[#e2f300] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(226,243,0,0.2)] hover:shadow-[0_0_25px_rgba(226,243,0,0.32)]"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-[#232318]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-zinc-400">
                Already have an account?{' '}
                <Link to="/login" className="text-[#e2f300] hover:text-[#f2ff4f] transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-700 transition-colors"
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-[#232318] bg-[#e2f300] hover:bg-[#d0df00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#232318] focus:ring-[#e2f300] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(226,243,0,0.2)] hover:shadow-[0_0_25px_rgba(226,243,0,0.32)]"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm font-medium text-[#e2f300] hover:text-[#f2ff4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

