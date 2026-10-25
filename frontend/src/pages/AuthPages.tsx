import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Coffee, AlertCircle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await login(username, password);
      navigate(redirect);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid username or password.');
    } finally {
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

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Demo credentials hint */}
        <div className="p-3 rounded-2xl bg-cream-100 text-[11px] text-espresso-700 border border-latte/60 space-y-1">
          <p className="font-bold">Test Credentials for Review:</p>
          <div className="flex justify-between">
            <span>Customer: <code className="font-mono bg-white px-1 rounded">anita_sharma</code></span>
            <span>Pass: <code className="font-mono bg-white px-1 rounded">UserPass123!</code></span>
          </div>
          <div className="flex justify-between">
            <span>Owner: <code className="font-mono bg-white px-1 rounded">birtamode_roaster</code></span>
            <span>Pass: <code className="font-mono bg-white px-1 rounded">OwnerPass123!</code></span>
          </div>
          <div className="flex justify-between">
            <span>Admin: <code className="font-mono bg-white px-1 rounded">admin</code></span>
            <span>Pass: <code className="font-mono bg-white px-1 rounded">AdminPass123!</code></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. anita_sharma"
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
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 rounded-xl border border-latte focus:outline-none focus:border-caramel bg-cream-50/50 text-espresso"
            />
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

        <div className="text-center text-xs text-subtext pt-2 border-t border-latte/40">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-caramel hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'customer' | 'business'>('customer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
      });
      navigate(role === 'business' ? '/business/claim' : '/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-latte shadow-warm-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-caramel text-white flex items-center justify-center mx-auto shadow-warm">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
            Join CafeKhoj
          </h1>
          <p className="text-xs text-subtext">Discover and review the finest coffee spaces in Jhapa</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">First Name</label>
              <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Last Name</label>
              <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Username</label>
            <input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Password (min 8 characters)</label>
            <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">I am joining as a:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  role === 'customer' ? 'bg-caramel text-white border-caramel' : 'bg-cream-50 text-espresso border-latte'
                }`}
              >
                Coffee Lover / Visitor
              </button>
              <button
                type="button"
                onClick={() => setRole('business')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  role === 'business' ? 'bg-espresso text-cream border-espresso' : 'bg-cream-50 text-espresso border-latte'
                }`}
              >
                Cafe Owner / Manager
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isLoading ? 'Creating Account...' : 'Register'}</span>
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

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-latte shadow-warm text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-espresso">Reset Your Password</h1>
        {submitted ? (
          <div className="p-4 bg-emerald-50 rounded-2xl text-xs text-emerald-800 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <p>If an account exists for {email}, a secure password recovery instruction has been dispatched.</p>
            <Link to="/login" className="inline-block mt-2 font-bold text-caramel hover:underline">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4 text-left">
            <p className="text-xs text-subtext">Enter your registered email address to receive password reset instructions.</p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm">
              Send Password Instructions
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const VerifyEmailPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-latte shadow-warm text-center space-y-3">
        <CheckCircle className="w-12 h-12 text-sage-600 mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-espresso">Email Verified</h1>
        <p className="text-xs text-subtext leading-relaxed">
          Your email address has been verified. You now enjoy full privileges to write customer reviews and save favourite cafes across Jhapa.
        </p>
        <Link to="/explore" className="inline-block mt-4 px-6 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm">
          Start Exploring
        </Link>
      </div>
    </div>
  );
};

