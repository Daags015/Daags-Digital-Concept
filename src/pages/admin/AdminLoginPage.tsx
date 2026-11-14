import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';

export const AdminLoginPage: React.FC = () => {
  const { currentAdmin, loginAdmin, resetAdminPasswordByEmail, db } = useCms();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Recovery flow state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (currentAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginAdmin(email, password);
    if (!res.ok) {
      setErrorMsg(res.error || 'Login failed.');
      return;
    }
    showToast(`Welcome back, ${res.user?.full_name}`, 'success');
    navigate('/admin/dashboard', { replace: true });
  };

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const normalized = recoveryEmail.trim().toLowerCase();
    const exists = db.admin_users.find((u) => u.email.toLowerCase() === normalized);
    if (!exists) {
      setErrorMsg('No registered admin or delegated staff account uses this email.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);
    showToast('Verification code generated for your admin account.', 'info');
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (enteredCode.trim() !== generatedCode) {
      setErrorMsg('Invalid verification code. Please check the 6-digit code shown above.');
      return;
    }
    const res = resetAdminPasswordByEmail(recoveryEmail, newPassword);
    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to update password.');
      return;
    }
    showToast('Password reset successful. You can now sign in.', 'success');
    setMode('login');
    setEmail(recoveryEmail);
    setPassword('');
    setGeneratedCode(null);
    setEnteredCode('');
    setNewPassword('');
  };

  return (
    <div className="min-h-screen bg-[#002815] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between text-white">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-[#FEBD12] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Website</span>
          </Link>
          <span className="font-heading text-sm font-bold text-[#FEBD12]">
            {db.site_settings.brand_name}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden">
          <div className="px-6 py-6 bg-[#F3F5F2] border-b border-neutral-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#002815] text-[#FEBD12] flex items-center justify-center shrink-0">
              {mode === 'login' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="font-heading text-xl font-extrabold text-[#111827]">
                {mode === 'login' ? 'Admin & Staff Portal' : 'Reset Account Password'}
              </h1>
              <p className="text-xs text-[#4B5563]">
                {mode === 'login'
                  ? 'Sign in as Super Admin or Delegated Team Member'
                  : 'Verify your admin email and set a new password'}
              </p>
            </div>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800"
              >
                {errorMsg}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="daagsdigitalconcept@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setRecoveryEmail(email);
                        setMode('forgot');
                      }}
                      className="text-xs font-semibold text-[#002815] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-3.5 pr-11 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#4B5563] hover:text-[#111827] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors cursor-pointer"
                >
                  Sign In to Dashboard
                </button>

                {/* Quick Demo Fill Helper for Super Admin & Delegated Staff */}
                <div className="pt-4 border-t border-neutral-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4B5563]">
                    <ShieldCheck className="w-4 h-4 text-[#002815]" />
                    <span>Quick Access Presets</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('daagsdigitalconcept@gmail.com');
                        setPassword('DaagsAdmin2026!');
                      }}
                      className="px-3 py-2 rounded-md border border-neutral-200 bg-[#F3F5F2] hover:bg-neutral-200/70 text-xs font-medium text-[#111827] text-left cursor-pointer"
                    >
                      <span className="block font-semibold text-[#002815]">Super Admin</span>
                      <span className="text-[11px] text-[#4B5563]">Full CMS & Team</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('operations@daagsdigital.com');
                        setPassword('DaagsStaff2026!');
                      }}
                      className="px-3 py-2 rounded-md border border-neutral-200 bg-[#F3F5F2] hover:bg-neutral-200/70 text-xs font-medium text-[#111827] text-left cursor-pointer"
                    >
                      <span className="block font-semibold text-[#002815]">Delegated Staff</span>
                      <span className="text-[11px] text-[#4B5563]">Scoped Permissions</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : !generatedCode ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Registered Admin / Staff Email
                  </label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="daagsdigitalconcept@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] cursor-pointer"
                  >
                    Generate Recovery Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('login');
                    }}
                    className="px-4 py-2.5 rounded-md border border-neutral-300 text-sm font-medium text-[#4B5563] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                <div className="p-3 rounded-lg bg-[#F3F5F2] border border-[#002815]/25 text-xs text-[#111827]">
                  Your one-time verification code for <strong>{recoveryEmail}</strong> is:{' '}
                  <span className="font-mono font-bold text-[#002815] text-sm tracking-wider">
                    {generatedCode}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    New Password (min 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-3.5 pr-11 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#4B5563] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] cursor-pointer"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedCode(null);
                      setMode('login');
                    }}
                    className="px-4 py-2.5 rounded-md border border-neutral-300 text-sm font-medium text-[#4B5563] cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
