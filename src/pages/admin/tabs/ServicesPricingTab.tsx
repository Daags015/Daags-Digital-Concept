import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { ServiceCategory, SubService } from '@/src/types/cms';
import { calculateDiscountPercent, formatNaira, generateUuid, slugify } from '@/src/utils/formatters';
import { ImageUploader } from '@/src/components/ImageUploader';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';

type DeleteTarget =
  | { kind: 'category'; id: string; name: string }
  | { kind: 'sub'; id: string; name: string };

export const ServicesPricingTab: React.FC = () => {
  const { db, upsertCategory, deleteCategory, upsertSubService, deleteSubService } = useCms();
  const { showToast } = useToast();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [editingSub, setEditingSub] = useState<SubService | null>(null);
  const [editingCat, setEditingCat] = useState<ServiceCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);
  const [saving, setSaving] = useState(false);

  const sortedCategories = [...db.service_categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  const visibleSubs = db.sub_services
    .filter((s) => activeCategoryId === 'all' || s.category_id === activeCategoryId)
    .sort((a, b) => a.display_order - b.display_order);

  const startNewSub = () => {
    const defaultCat = sortedCategories[0]?.id || '';
    setEditingSub({
      id: generateUuid(),
      category_id: activeCategoryId === 'all' ? defaultCat : activeCategoryId,
      title: '',
      slug: '',
      short_description: '',
      deliverables: ['Consultation & Onboarding', 'Verified Delivery'],
      original_price: 50000,
      ongoing_price: 35000,
      promo_label: 'Limited Offer',
      is_placeholder_price: false,
      turnaround_time: '3 – 5 Business Days',
      image_url: '',
      is_published: true,
      display_order: visibleSubs.length + 1,
    });
  };

  const startNewCat = () => {
    setEditingCat({
      id: generateUuid(),
      name: '',
      slug: '',
      description: '',
      icon_name: 'Briefcase',
      display_order: sortedCategories.length + 1,
      is_published: true,
    });
  };

  const saveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub || saving) return;
    if (!editingSub.title.trim()) {
      showToast('Please enter a service title.', 'error');
      return;
    }
    setSaving(true);
    const res = await upsertSubService({
      ...editingSub,
      title: editingSub.title.trim(),
      slug: editingSub.slug.trim() || slugify(editingSub.title),
      original_price: Number(editingSub.original_price) || 0,
      ongoing_price: Number(editingSub.ongoing_price) || 0,
      deliverables: editingSub.deliverables.filter((d) => d.trim().length > 0),
    });
    setSaving(false);
    if (res.ok) {
      showToast(
        res.synced
          ? `Saved "${editingSub.title}" and synced live to Supabase.`
          : `Saved "${editingSub.title}" locally in this browser.`,
        'success'
      );
      setEditingSub(null);
    }
  };

  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim() || saving) return;
    setSaving(true);
    const res = await upsertCategory({
      ...editingCat,
      name: editingCat.name.trim(),
      slug: editingCat.slug.trim() || slugify(editingCat.name),
    });
    setSaving(false);
    if (res.ok) {
      showToast(
        res.synced
          ? `Category "${editingCat.name}" saved and synced live.`
          : `Category "${editingCat.name}" saved locally.`,
        'success'
      );
      setEditingCat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-[#111827]">
            Services & Urgency Dual Pricing Manager
          </h2>
          <p className="text-xs text-[#4B5563]">
            Manage categories, sub-services, original strikethrough prices, ongoing promo rates, and images.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startNewCat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-[#111827] hover:bg-neutral-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
          <button
            type="button"
            onClick={startNewSub}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#FEBD12]" />
            <span>Add Sub-Service</span>
          </button>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategoryId('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
            activeCategoryId === 'all'
              ? 'bg-[#002815] text-white'
              : 'bg-white border border-neutral-200 text-[#4B5563]'
          }`}
        >
          All Categories ({db.sub_services.length})
        </button>
        {sortedCategories.map((cat) => (
          <div
            key={cat.id}
            className="inline-flex items-center rounded-md border border-neutral-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                activeCategoryId === cat.id
                  ? 'bg-[#002815] text-white'
                  : 'text-[#111827] hover:bg-[#F3F5F2]'
              }`}
            >
              {cat.name} {!cat.is_published && '(Hidden)'}
            </button>
            <button
              type="button"
              onClick={() => setEditingCat({ ...cat })}
              aria-label={`Edit category ${cat.name}`}
              className="px-2 py-1.5 text-[#4B5563] hover:text-[#002815] border-l border-neutral-200 cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F3F5F2] border-b border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Original</th>
                <th className="py-3 px-4 text-right">Ongoing Promo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {visibleSubs.map((sub) => {
                const cat = db.service_categories.find((c) => c.id === sub.category_id);
                const discount = calculateDiscountPercent(sub.original_price, sub.ongoing_price);
                return (
                  <tr key={sub.id} className="hover:bg-[#F3F5F2]/50">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#111827]">{sub.title}</p>
                      <p className="text-xs text-[#4B5563]">{sub.turnaround_time}</p>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#002815]">
                      {cat?.name || 'Uncategorized'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[#4B5563] line-through tabular-nums">
                      {formatNaira(sub.original_price)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span className="font-bold text-[#002815]">{formatNaira(sub.ongoing_price)}</span>
                      {discount > 0 && (
                        <span className="block text-[11px] text-red-700 font-semibold">
                          -{discount}% {sub.promo_label}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          sub.is_published
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {sub.is_published ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingSub({ ...sub })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-neutral-200 text-xs font-semibold text-[#111827] hover:bg-neutral-100 mr-2 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDelete({ kind: 'sub', id: sub.id, name: sub.title })
                        }
                        aria-label={`Delete ${sub.title}`}
                        className="inline-flex items-center p-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Editor Modal */}
      {editingCat && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveCat}
            className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="bg-[#002815] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold">
                {editingCat.name ? `Edit Category: ${editingCat.name}` : 'New Service Category'}
              </h3>
              <button type="button" onClick={() => setEditingCat(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCat.name}
                    onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingCat.display_order}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, display_order: Number(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Icon Name</label>
                <select
                  value={editingCat.icon_name}
                  onChange={(e) => setEditingCat({ ...editingCat, icon_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white"
                >
                  <option value="Building2">Building2 (CAC)</option>
                  <option value="Globe">Globe (Website)</option>
                  <option value="Fingerprint">Fingerprint (NIN)</option>
                  <option value="CreditCard">CreditCard (POS)</option>
                  <option value="MapPinCheck">MapPinCheck (Address)</option>
                  <option value="Briefcase">Briefcase (General)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCat.description}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCat.is_published}
                  onChange={(e) => setEditingCat({ ...editingCat, is_published: e.target.checked })}
                  className="accent-[#002815]"
                />
                Published on Live Site
              </label>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              {db.service_categories.some((c) => c.id === editingCat.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = editingCat;
                    setEditingCat(null);
                    setPendingDelete({ kind: 'category', id: target.id, name: target.name });
                  }}
                  className="px-3 py-2 rounded-md border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  Delete Category
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 rounded-md border border-neutral-300 bg-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#FEBD12]" />
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Service Editor Modal */}
      {editingSub && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveSub}
            className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="bg-[#002815] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-heading text-base font-bold">
                {editingSub.title ? `Editing: ${editingSub.title}` : 'Create New Sub-Service'}
              </h3>
              <button type="button" onClick={() => setEditingSub(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={editingSub.title}
                    onChange={(e) => setEditingSub({ ...editingSub, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Category *</label>
                  <select
                    value={editingSub.category_id}
                    onChange={(e) => setEditingSub({ ...editingSub, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white"
                  >
                    {sortedCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-[#F3F5F2] border border-neutral-200">
                <div>
                  <label className="block text-xs font-semibold mb-1">Original Price (₦)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    value={editingSub.original_price === 0 ? '' : editingSub.original_price}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setEditingSub({
                        ...editingSub,
                        original_price: raw === '' ? 0 : Math.max(0, Number(raw) || 0),
                      });
                    }}
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Ongoing Promo (₦)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    value={editingSub.ongoing_price === 0 ? '' : editingSub.ongoing_price}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setEditingSub({
                        ...editingSub,
                        ongoing_price: raw === '' ? 0 : Math.max(0, Number(raw) || 0),
                      });
                    }}
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white tabular-nums font-bold text-[#002815]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Promo Label</label>
                  <input
                    type="text"
                    value={editingSub.promo_label}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, promo_label: e.target.value })
                    }
                    placeholder="Limited Offer"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-medium text-[#4B5563]">Auto Discount:</span>
                  <span className="font-heading text-sm font-extrabold text-[#002815] tabular-nums">
                    {calculateDiscountPercent(editingSub.original_price, editingSub.ongoing_price) > 0
                      ? `Save ${calculateDiscountPercent(
                          editingSub.original_price,
                          editingSub.ongoing_price
                        )}%`
                      : 'No discount'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Short Description</label>
                  <textarea
                    rows={3}
                    value={editingSub.short_description}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, short_description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Deliverables (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={editingSub.deliverables.join('\n')}
                    onChange={(e) =>
                      setEditingSub({
                        ...editingSub,
                        deliverables: e.target.value.split('\n'),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Turnaround Time</label>
                  <input
                    type="text"
                    value={editingSub.turnaround_time}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, turnaround_time: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-5 pt-4">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSub.is_published}
                      onChange={(e) =>
                        setEditingSub({ ...editingSub, is_published: e.target.checked })
                      }
                      className="accent-[#002815]"
                    />
                    Published
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSub.is_placeholder_price}
                      onChange={(e) =>
                        setEditingSub({ ...editingSub, is_placeholder_price: e.target.checked })
                      }
                      className="accent-[#002815]"
                    />
                    Starting Estimate
                  </label>
                </div>
              </div>

              <ImageUploader
                label="Service Card Image (Mobile / Laptop Upload)"
                value={editingSub.image_url}
                onChange={(url) => setEditingSub({ ...editingSub, image_url: url })}
              />
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="px-4 py-2 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-[#4B5563] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] disabled:opacity-60 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#FEBD12]" />
                <span>{saving ? 'Saving...' : 'Save Service & Pricing'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete?.kind === 'category' ? 'Delete Category' : 'Delete Sub-Service'}
        itemName={pendingDelete?.name || ''}
        description={
          pendingDelete?.kind === 'category'
            ? 'Deleting this category will also remove all sub-services inside it.'
            : 'This sub-service will be permanently removed from your services catalog.'
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          const target = pendingDelete;
          setPendingDelete(null);
          if (target.kind === 'category') {
            const res = await deleteCategory(target.id);
            if (res.ok) {
              showToast(
                res.synced
                  ? `Category "${target.name}" permanently deleted from live site.`
                  : `Category "${target.name}" deleted locally.`,
                'info'
              );
            }
          } else {
            const res = await deleteSubService(target.id);
            if (res.ok) {
              showToast(
                res.synced
                  ? `Sub-service "${target.name}" permanently deleted from live site.`
                  : `Sub-service "${target.name}" deleted locally.`,
                'info'
              );
            }
          }
        }}
      />
    </div>
  );
};
