import React, { useState } from 'react';
import { UserPlus, Shield, Eye, EyeOff, Trash2, Power, Pencil, X, Save } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { AdminPermissions, AdminUser } from '@/src/types/cms';
import { formatShortDate } from '@/src/utils/formatters';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';
import { generateUuid } from '@/src/utils/formatters';

const PERMISSION_LABELS: { key: keyof AdminPermissions; label: string; desc: string }[] = [
  {
    key: 'manage_inquiries',
    label: 'View & Reply to Customer Inquiries',
    desc: 'Access incoming leads CRM, change status, and send WhatsApp replies.',
  },
  {
    key: 'manage_services',
    label: 'Add/Edit Services, Dual Prices & Images',
    desc: 'Manage service categories, sub-services, promo discounts, and card photos.',
  },
  {
    key: 'edit_site_content',
    label: 'Edit Website Pages, Headings & Sections',
    desc: 'Modify Hero slides, typewriter lines, page headings, body copy, and contact info.',
  },
  {
    key: 'manage_portfolio',
    label: 'Manage Portfolio Projects',
    desc: 'Add, feature, or remove client portfolio showcases.',
  },
  {
    key: 'manage_faqs',
    label: 'Manage FAQs',
    desc: 'Create and update categorized questions and answers.',
  },
];

export const TeamDelegationTab: React.FC = () => {
  const { db, currentAdmin, upsertAdminUser, toggleAdminActive, deleteAdminUser } = useCms();
  const { showToast } = useToast();

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
        <p className="font-heading text-base font-bold text-red-800">
          Super Admin Access Required
        </p>
        <p className="text-xs text-[#4B5563] mt-1">
          Only the Super Admin can create, delegate, suspend, or remove team member access.
        </p>
      </div>
    );
  }

  const startNewStaff = () => {
    setEditing({
      id: generateUuid(),
      full_name: '',
      email: '',
      password_hash: '',
      role: 'delegated_admin',
      role_title: 'Operations Assistant',
      permissions: {
        manage_inquiries: true,
        manage_services: false,
        edit_site_content: false,
        manage_portfolio: false,
        manage_faqs: false,
      },
      is_active: true,
      created_at: new Date().toISOString(),
    });
    setShowPass(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.full_name.trim() || !editing.email.trim() || editing.password_hash.length < 6) {
      showToast('Enter full name, valid email, and password (min 6 characters).', 'error');
      return;
    }
    const res = upsertAdminUser(editing);
    if (!res.ok) {
      showToast(res.error || 'Could not save staff account.', 'error');
      return;
    }
    showToast(`Saved credentials & permissions for ${editing.full_name}.`, 'success');
    setEditing(null);
  };

  const togglePerm = (key: keyof AdminPermissions) => {
    if (!editing) return;
    setEditing({
      ...editing,
      permissions: {
        ...editing.permissions,
        [key]: !editing.permissions[key],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-[#111827]">
            Team & Role-Based Delegation Manager
          </h2>
          <p className="text-xs text-[#4B5563]">
            Create dedicated login credentials for staff and grant exact CMS module permissions.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewStaff}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer self-start"
        >
          <UserPlus className="w-4 h-4 text-[#FEBD12]" />
          <span>Create Delegated Staff Login</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {db.admin_users.map((user) => {
          const isSuper = user.role === 'super_admin';
          const activePerms = PERMISSION_LABELS.filter((p) => user.permissions[p.key]);

          return (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Shield
                    className={`w-4 h-4 ${isSuper ? 'text-[#FEBD12]' : 'text-[#002815]'}`}
                  />
                  <h3 className="font-heading text-base font-bold text-[#111827]">
                    {user.full_name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isSuper
                        ? 'bg-[#002815] text-[#FEBD12]'
                        : 'bg-[#F3F5F2] text-[#002815]'
                    }`}
                  >
                    {isSuper ? 'Super Admin' : user.role_title}
                  </span>
                  {!user.is_active && (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-bold">
                      Suspended
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#4B5563]">
                  {user.email} · Created {formatShortDate(user.created_at)}
                </p>

                <p className="text-xs text-[#111827]">
                  <span className="font-semibold">Granted Access: </span>
                  {isSuper
                    ? 'Full System & Delegation Control'
                    : activePerms.length
                      ? activePerms.map((p) => p.label).join(' · ')
                      : 'No active modules assigned'}
                </p>
              </div>

              {!isSuper && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing({ ...user });
                      setShowPass(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-neutral-200 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    Permissions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleAdminActive(user.id);
                      showToast(
                        user.is_active
                          ? `Suspended ${user.full_name}'s access.`
                          : `Reactivated ${user.full_name}'s access.`,
                        'info'
                      );
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer ${
                      user.is_active
                        ? 'border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100'
                        : 'border-emerald-300 text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {user.is_active ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(user)}
                    aria-label={`Delete ${user.full_name}`}
                    className="p-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Staff Add/Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="bg-[#002815] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-heading text-base font-bold">
                {db.admin_users.some((u) => u.id === editing.id)
                  ? `Edit Staff Access: ${editing.full_name}`
                  : 'New Delegated Staff Credentials'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editing.full_name}
                    onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                    placeholder="e.g. Blessing Adewale"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={editing.role_title}
                    onChange={(e) => setEditing({ ...editing, role_title: e.target.value })}
                    placeholder="e.g. Client Desk & CAC Coordinator"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={editing.email}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    placeholder="staff@daagsdigital.com"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Assigned Password (min 6 chars) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={editing.password_hash}
                      onChange={(e) => setEditing({ ...editing, password_hash: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-md border border-neutral-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5563] cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                  Granular Module Permissions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERMISSION_LABELS.map((item) => {
                    const enabled = editing.permissions[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                          enabled
                            ? 'bg-[#F3F5F2] border-[#002815]/40'
                            : 'bg-white border-neutral-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => togglePerm(item.key)}
                          className="mt-0.5 w-4 h-4 accent-[#002815]"
                        />
                        <div>
                          <span className="block text-xs font-bold text-[#111827]">
                            {item.label}
                          </span>
                          <span className="block text-[11px] text-[#4B5563] mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-[#4B5563] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#FEBD12]" />
                Save Staff Account
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        title="Delete Staff Account"
        itemName={pendingDelete?.full_name || ''}
        description="This delegated staff member will lose all access to the Admin Portal immediately."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteAdminUser(pendingDelete.id);
            showToast(`Deleted delegated user ${pendingDelete.full_name}.`, 'info');
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
};
