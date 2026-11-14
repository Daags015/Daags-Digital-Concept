import React, { useMemo, useState } from 'react';
import { MessageCircle, Search, Trash2, Mail, Phone } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { Inquiry, InquiryStatus } from '@/src/types/cms';
import { buildWhatsAppLink, formatShortDate } from '@/src/utils/formatters';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';

export const InquiriesTab: React.FC = () => {
  const { db, updateInquiryStatus, deleteInquiry } = useCms();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Inquiry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.inquiries.filter((inq) => {
      if (statusFilter !== 'all' && inq.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inq.full_name.toLowerCase().includes(q) ||
        inq.phone.toLowerCase().includes(q) ||
        inq.service_category.toLowerCase().includes(q) ||
        inq.sub_service.toLowerCase().includes(q) ||
        inq.message.toLowerCase().includes(q)
      );
    });
  }, [db.inquiries, statusFilter, search]);

  const handleStatusChange = (id: string, nextStatus: InquiryStatus) => {
    updateInquiryStatus(id, nextStatus);
    showToast(`Inquiry marked as ${nextStatus}.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-[#111827]">
            Customer Inquiries CRM
          </h2>
          <p className="text-xs text-[#4B5563]">
            Track incoming service leads, update statuses, and reply directly via WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'new', 'contacted', 'completed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#002815] text-white'
                  : 'bg-white border border-neutral-200 text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client name, phone, or service..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-neutral-300 bg-white focus:outline-none focus:border-[#002815]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center text-sm text-[#4B5563]">
          No inquiries match your current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => {
            const replyText = `Hello ${inq.full_name}, thank you for contacting Daags Digital Concept regarding "${inq.sub_service || inq.service_category}". How can we proceed with your onboarding today?`;
            const waReplyHref = buildWhatsAppLink(inq.phone, replyText);

            return (
              <div
                key={inq.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-heading text-base font-bold text-[#111827]">
                      {inq.full_name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                        inq.status === 'new'
                          ? 'bg-amber-100 text-amber-900'
                          : inq.status === 'contacted'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {inq.status}
                    </span>
                    <span className="text-xs text-[#4B5563] tabular-nums">
                      {formatShortDate(inq.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#4B5563]">
                    <span className="inline-flex items-center gap-1 tabular-nums font-medium text-[#111827]">
                      <Phone className="w-3.5 h-3.5 text-[#002815]" />
                      {inq.phone}
                    </span>
                    {inq.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#002815]" />
                        {inq.email}
                      </span>
                    )}
                    <span className="font-semibold text-[#002815]">
                      {inq.service_category}
                      {inq.sub_service ? ` · ${inq.sub_service}` : ''}
                    </span>
                  </div>

                  <p className="text-sm text-[#4B5563] leading-relaxed">{inq.message}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <select
                    value={inq.status}
                    onChange={(e) => handleStatusChange(inq.id, e.target.value as InquiryStatus)}
                    aria-label={`Status for ${inq.full_name}`}
                    className="px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#002815]"
                  >
                    <option value="new">Status: New</option>
                    <option value="contacted">Status: Contacted</option>
                    <option value="completed">Status: Completed</option>
                  </select>

                  <a
                    href={waReplyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#FEBD12]" />
                    <span>Reply on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setPendingDelete(inq)}
                    aria-label={`Delete inquiry from ${inq.full_name}`}
                    className="p-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        title="Delete Customer Inquiry"
        itemName={pendingDelete?.full_name || ''}
        description="This inquiry record will be permanently deleted from your CRM."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteInquiry(pendingDelete.id);
            showToast(`Inquiry from "${pendingDelete.full_name}" deleted.`, 'info');
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
};
