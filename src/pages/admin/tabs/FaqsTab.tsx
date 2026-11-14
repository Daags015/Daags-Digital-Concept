import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { FaqItem } from '@/src/types/cms';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';
import { generateUuid } from '@/src/utils/formatters';

export const FaqsTab: React.FC = () => {
  const { db, upsertFaq, deleteFaq } = useCms();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FaqItem | null>(null);

  const sortedFaqs = [...db.faqs].sort((a, b) => a.display_order - b.display_order);

  const startNew = () => {
    setEditing({
      id: generateUuid(),
      question: '',
      answer: '',
      category: 'General',
      display_order: sortedFaqs.length + 1,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.question.trim() || !editing.answer.trim()) return;
    upsertFaq(editing);
    showToast('FAQ saved and published.', 'success');
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-[#111827]">
            FAQs Manager
          </h2>
          <p className="text-xs text-[#4B5563]">
            Add, categorize, reorder, or update frequently asked customer questions.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer self-start"
        >
          <Plus className="w-3.5 h-3.5 text-[#FEBD12]" />
          <span>Add FAQ</span>
        </button>
      </div>

      <div className="space-y-3">
        {sortedFaqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-xs text-[#002815] font-semibold">
                <span>{faq.category}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#4B5563] tabular-nums">Order #{faq.display_order}</span>
              </div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#111827]">
                {faq.question}
              </h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">{faq.answer}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditing({ ...faq })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-neutral-200 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(faq)}
                aria-label={`Delete FAQ ${faq.question}`}
                className="p-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="bg-[#002815] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold">
                {editing.question ? 'Edit FAQ' : 'Create New FAQ'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Question *</label>
                  <input
                    type="text"
                    required
                    value={editing.question}
                    onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="e.g. CAC Registration"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Answer *</label>
                <textarea
                  rows={4}
                  required
                  value={editing.answer}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-semibold mb-1">Display Order</label>
                <input
                  type="number"
                  value={editing.display_order}
                  onChange={(e) =>
                    setEditing({ ...editing, display_order: Number(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 tabular-nums"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-md border border-neutral-300 bg-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#FEBD12]" />
                Save FAQ
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        title="Delete FAQ"
        itemName={pendingDelete?.question || ''}
        description="This FAQ will be permanently removed from the website."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteFaq(pendingDelete.id);
            showToast('FAQ deleted.', 'info');
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
};
