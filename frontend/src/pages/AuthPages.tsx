import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Coffee, AlertCircle, CheckCircle, ArrowRight, Loader2, ShieldAlert, KeyRound, RefreshCw, Smartphone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deviceAuthInfo, setDeviceAuthInfo] = useState<{ deviceName: string; requestId?: number } | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const submitInProgress = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitInProgress.current) return;
    submitInProgress.current = true;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setDeviceAuthInfo(null);
      setUnverifiedEmail(null);

      const res = await login(username, password);
      if (res?.user?.role === 'admin') {
        navigate('/admin');
      } else if (res?.user?.role === 'business' || res?.user?.role === 'operator') {
        navigate('/business/dashboard');
      } else {
        navigate(redirect);
      }
    } catch (err: any) {
      if (err.data?.status === 'device_authorization_required') {
        setDeviceAuthInfo({
          deviceName: err.data.device_name || 'Current Browser',
          requestId: err.data.request_id,
        });
      } else if (err.data?.requires_verification) {
        setUnverifiedEmail(err.data.email || username);
        setErrorMsg(err.message || 'Your email address is not yet verified.');
      } else {
        setErrorMsg(err.message || 'Invalid username or password.');
      }
    } finally {
      submitInProgress.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-latte shadow-warm-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-espresso text-caramel flex items-center justify-center mx-auto shadow-warm">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
            Welcome Back
          </h1>
          <p className="text-xs text-subtext">Sign in to your CafeKhoj account</p>
        </div>

        {/* Device Authorization Alert */}
        {deviceAuthInfo && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Operator Device Authorization Required</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800/90">
              Cafe Operator accounts are strictly limited to <strong>1 active authorized device</strong>.
              An authorization request has been submitted for this device (<code>{deviceAuthInfo.deviceName}</code>)
              to platform administrators.
            </p>
            <div className="pt-1 text-[11px] font-semibold text-amber-900">
              Please contact your platform administrator or wait for approval before logging in from this device.
            </div>
          </div>
        )}

        {/* Unverified Email Alert */}
        {unverifiedEmail && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Email Verification Required</span>
            </div>
            <p className="text-[11px] text-rose-700">
              A 6-digit verification code was sent to <strong>{unverifiedEmail}</strong>. You must enter this code before you can log in.
            </p>
            <Link
              to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
              className="inline-flex items-center gap-1.5 font-bold text-caramel hover:underline text-xs pt-1"
            >
              <span>Enter 6-Digit Verification Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {errorMsg && !unverifiedEmail && !deviceAuthInfo && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
              Username or Email
            </label>
            <input
              autoComplete="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. cafe_owner or user@example.com"
              className="w-full text-xs p-3 rounded-xl border border-latte focus:outline-none focus:border-caramel bg-cream-50/50 text-espresso"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso">
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] text-caramel hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 pr-12 rounded-xl border border-latte focus:outline-none focus:border-caramel bg-cream-50/50 text-espresso"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-1 px-3 text-subtext hover:text-espresso"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-subtext pt-2 border-t border-latte/40 space-y-1">
          <div>
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-caramel hover:underline">
              Create an Account
            </Link>
          </div>
          <div>
            Are you a cafe owner?{' '}
            <Link to="/register?role=operator" className="font-bold text-espresso hover:underline">
              Register as Cafe Operator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'business'>(
    searchParams.get('role') === 'operator' || searchParams.get('role') === 'business' ? 'business' : 'customer'
  );
  const [operatorRelationship, setOperatorRelationship] = useState<'owner' | 'manager' | 'staff'>('owner');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Notice.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        role: role === 'business' ? 'operator' : 'customer',
        operator_relationship: role === 'business' ? operatorRelationship : undefined,
        terms_accepted: true,
      });

      // Always direct new registrants to verify their 6-digit OTP
      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-latte shadow-warm-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-caramel text-white flex items-center justify-center mx-auto shadow-warm">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
            {role === 'business' ? 'Register Cafe Operator' : 'Join CafeKhoj'}
          </h1>
          <p className="text-xs text-subtext">
            {role === 'business'
              ? 'Claim or register your cafe listing in Jhapa, Nepal'
              : 'Discover, bookmark, and review the finest cafes across Jhapa'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  role === 'customer'
                    ? 'bg-caramel text-white border-caramel shadow-warm'
                    : 'bg-cream-50 text-espresso border-latte'
                }`}
              >
                Coffee Lover / Public
              </button>
              <button
                type="button"
                onClick={() => setRole('business')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  role === 'business'
                    ? 'bg-espresso text-cream border-espresso shadow-warm'
                    : 'bg-cream-50 text-espresso border-latte'
                }`}
              >
                Cafe Operator
              </button>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">First Name</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ram"
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Last Name</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
              />
            </div>
          </div>

          {/* Username & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Username</label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ram_cafe"
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Phone Number</label>
              <input
                required={role === 'business'}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977-98XXXXXXXX"
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
              Email Address <span className="text-[10px] text-subtext font-normal">(OTP verification required)</span>
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@mycafe.com"
              className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
            />
          </div>

          {/* Operator Relationship (Only if business) */}
          {role === 'business' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
                Your Role at Cafe
              </label>
              <select
                value={operatorRelationship}
                onChange={(e) => setOperatorRelationship(e.target.value as any)}
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel font-medium"
              >
                <option value="owner">Owner / Founder</option>
                <option value="manager">General Manager</option>
                <option value="staff">Staff Member</option>
              </select>
              <p className="text-[10px] text-subtext mt-1">
                Operator accounts have 1 active authorized device session for merchant security.
              </p>
            </div>
          )}

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Password</label>
              <input
                required
                minLength={8}
                type={showPasswords ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full text-xs p-3 pr-12 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
              />
              <button
                type="button"
                onClick={() => setShowPasswords((visible) => !visible)}
                aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                className="mt-1 text-[11px] text-caramel hover:underline"
              >
                {showPasswords ? 'Hide passwords' : 'Show passwords'}
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Confirm Password</label>
              <input
                required
                minLength={8}
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
              />
            </div>
          </div>

          {/* Terms & Privacy */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-latte text-caramel focus:ring-caramel accent-caramel"
            />
            <label htmlFor="terms" className="text-[11px] text-subtext leading-tight cursor-pointer">
              I agree to the <Link to="/terms" className="text-caramel font-bold hover:underline" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="text-caramel font-bold hover:underline" target="_blank">Privacy Notice</Link>.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isLoading ? 'Sending Verification Code...' : 'Register Account'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-subtext pt-2 border-t border-latte/40">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-caramel hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(60);
  const [expirySeconds, setExpirySeconds] = useState<number>(300); // 5 minutes

  // Countdown timer for 5-minute expiry
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expirySeconds]);

  // Resend cooldown timer (60s)
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit code.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await api.verifyOTP(email.trim().toLowerCase(), code.trim());
      setSuccessMsg('Email verified successfully! You may now sign in to CafeKhoj.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setIsResending(true);
      setErrorMsg(null);
      await api.resendOTP(email.trim().toLowerCase());
      setCooldown(60);
      setExpirySeconds(300);
      setSuccessMsg('A fresh 6-digit verification code has been dispatched to your email.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-latte shadow-warm-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-espresso text-caramel flex items-center justify-center mx-auto shadow-warm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-espresso">
            Verify Your Email
          </h1>
          <p className="text-xs text-subtext">
            Enter the 6-digit cryptographic verification code sent to:
          </p>
          <div className="font-mono text-xs font-bold text-espresso bg-cream-100 py-1.5 px-3 rounded-xl inline-block border border-latte/60">
            {email || 'your registered email'}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-2 text-center">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono tracking-[12px] font-bold p-3 rounded-2xl border-2 border-caramel/40 focus:outline-none focus:border-caramel bg-cream-50/50 text-espresso"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-subtext px-1">
            <span>Code expires in: <strong className="text-espresso font-mono">{formatTime(expirySeconds)}</strong></span>
            {cooldown > 0 ? (
              <span className="text-subtext">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-caramel font-bold hover:underline flex items-center gap-1"
              >
                {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Resend Code</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full py-3 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isLoading ? 'Verifying Code...' : 'Verify Email & Activate Account'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-subtext pt-2 border-t border-latte/40">
          Already verified?{' '}
          <Link to="/login" className="font-bold text-caramel hover:underline">
            Proceed to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'confirm' | 'complete'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!resendAt) return;
    const update = () => setSecondsRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  const requestCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.requestPasswordReset(email.trim().toLowerCase());
      setStep('confirm');
      setResendAt(Date.now() + 60_000);
    } catch (err: any) {
      setError(err.message || 'Could not submit the reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.confirmPasswordReset({ email: email.trim().toLowerCase(), code: code.trim(), password, confirm_password: confirmPassword });
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'The code could not be verified. Request a new one and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-latte shadow-warm text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-espresso">Reset Your Password</h1>
        {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
        {step === 'complete' ? (
          <div role="status" className="p-4 bg-emerald-50 rounded-2xl text-sm text-emerald-800 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <p>Your password has been reset. Sign in with your new password.</p>
            <Link to="/login" className="inline-block mt-2 font-bold text-caramel hover:underline">Back to Login</Link>
          </div>
        ) : step === 'request' ? (
          <form onSubmit={(e) => { e.preventDefault(); void requestCode(); }} className="space-y-4 text-left">
            <p className="text-sm text-subtext">Enter your account email. If an active account uses it, we’ll send a one-time reset code. If no message arrives, contact support.</p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Email</label>
              <input autoComplete="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full min-h-[44px] py-2.5 rounded-full text-sm font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm disabled:opacity-60">
              {isLoading ? 'Requesting code…' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-4 text-left">
            <p className="text-sm text-subtext">Enter the 6-digit code sent to <strong>{email}</strong>, then choose a new password.</p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Reset code</label>
              <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full text-base tracking-[0.4em] p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">New password</label>
              <input required minLength={8} autoComplete="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-base p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Confirm new password</label>
              <input required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full text-base p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
            <button type="submit" disabled={isLoading || code.length !== 6} className="w-full min-h-[44px] py-2.5 rounded-full text-sm font-bold bg-espresso text-white disabled:opacity-60">
              {isLoading ? 'Resetting password…' : 'Reset Password'}
            </button>
            <button type="button" disabled={isLoading || secondsRemaining > 0} onClick={() => void requestCode()} className="w-full min-h-[44px] text-sm text-caramel disabled:opacity-60">
              {secondsRemaining > 0 ? `Resend code in ${secondsRemaining}s` : 'Resend code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
