import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Download, RotateCcw, Database } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';

export const AccountSecurityTab: React.FC = () => {
  const { db, currentAdmin, isSupabaseReady, changeCurrentPassword, resetAllToDefaults } = useCms();
  const { showToast } = useToast();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    const res = changeCurrentPassword(currentPass, newPass);
    if (!res.ok) {
      showToast(res.error || 'Could not update password.', 'error');
      return;
    }
    showToast('Your account password has been updated securely.', 'success');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daags-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CMS database backup downloaded.', 'success');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-heading text-xl font-extrabold text-[#111827]">
          Account Security & System Backup
        </h2>
        <p className="text-xs text-[#4B5563]">
          Update your login password, inspect storage persistence, or export a JSON backup.
        </p>
      </div>

      {/* Password Update Card */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
          <KeyRound className="w-5 h-5 text-[#002815]" />
          <div>
            <h3 className="font-heading text-base font-bold text-[#111827]">
              Change Your Password
            </h3>
            <p className="text-xs text-[#4B5563]">
              Signed in as <strong>{currentAdmin?.email}</strong> ({currentAdmin?.role_title})
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-sm rounded-md border border-neutral-300"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              aria-label="Toggle current password visibility"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5563] cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">New Password (min 6 chars)</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-sm rounded-md border border-neutral-300"
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                aria-label="Toggle new password visibility"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5563] cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer"
        >
          Update Password
        </button>
      </form>

      {/* Persistence & Backup Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-[#002815]" />
          <div>
            <h3 className="font-heading text-base font-bold text-[#111827]">
              Database & Persistence Status
            </h3>
            <p className="text-xs text-[#4B5563]">
              {isSupabaseReady
                ? 'Connected to Supabase PostgreSQL + Local Persistence Cache.'
                : 'Active Local Persistence Mode (Supabase-ready via supabase_schema.sql & VITE_SUPABASE_* env vars).'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-neutral-300 bg-[#F3F5F2] text-xs font-semibold text-[#111827] hover:bg-neutral-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CMS JSON Backup
          </button>

          {currentAdmin?.role === 'super_admin' && (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Initial Seed Data
            </button>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={confirmResetOpen}
        title="Restore Initial Seed Data"
        itemName="All Custom CMS Edits"
        description="This will reset all pages, services, portfolio projects, contacts, and settings back to the original factory seed data."
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          resetAllToDefaults();
          setConfirmResetOpen(false);
          showToast('CMS restored to initial seed defaults.', 'info');
        }}
      />
    </div>
  );
};
