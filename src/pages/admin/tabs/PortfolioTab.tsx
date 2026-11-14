import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Star, ExternalLink } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { PortfolioProject } from '@/src/types/cms';
import { ImageUploader } from '@/src/components/ImageUploader';
import { ResilientImage } from '@/src/components/ResilientImage';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';
import { generateUuid } from '@/src/utils/formatters';

export const PortfolioTab: React.FC = () => {
  const { db, upsertPortfolioProject, deletePortfolioProject } = useCms();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PortfolioProject | null>(null);

  const startNew = () => {
    setEditing({
      id: generateUuid(),
      title: '',
      client_name: '',
      category: 'Corporate & Fintech',
      description: '',
      outcome_metric: '',
      image_url: '',
      live_url: '',
      is_featured: true,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title.trim() || !editing.client_name.trim()) {
      showToast('Please enter both Project Title and Client Name.', 'error');
      return;
    }
    upsertPortfolioProject({
      ...editing,
      title: editing.title.trim(),
      client_name: editing.client_name.trim(),
      category: editing.category.trim() || 'Corporate & Fintech',
      live_url: editing.live_url.trim(),
    });
    showToast(`Portfolio project "${editing.title}" saved.`, 'success');
    setEditing(null);
  };

  const toggleFeatured = (proj: PortfolioProject) => {
    upsertPortfolioProject({ ...proj, is_featured: !proj.is_featured });
    showToast(
      !proj.is_featured
        ? `"${proj.title}" is now featured on the Home page.`
        : `"${proj.title}" removed from Home page featured list.`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-[#111827]">
            Portfolio Projects Manager
          </h2>
          <p className="text-xs text-[#4B5563]">
            Add, edit, feature/unfeature, upload screenshots, or remove client portfolio showcases.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer self-start"
        >
          <Plus className="w-3.5 h-3.5 text-[#FEBD12]" />
          <span>Add Portfolio Project</span>
        </button>
      </div>

      {/* Portfolio Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {db.portfolio_projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[4/3] bg-[#F3F5F2] relative">
                <ResilientImage
                  src={proj.image_url}
                  alt={proj.title}
                  fallbackTitle={proj.title}
                  className="w-full h-full object-cover"
                />
                {proj.is_featured && (
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FEBD12] text-[#002815] text-[11px] font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              <div className="p-4 space-y-1.5">
                <p className="text-xs font-semibold text-[#002815]">{proj.category}</p>
                <h3 className="font-heading text-base font-bold text-[#111827]">{proj.title}</h3>
                <p className="text-xs text-[#4B5563]">{proj.client_name}</p>
                {proj.outcome_metric && (
                  <p className="text-[11px] font-medium text-[#002815] pt-1">
                    {proj.outcome_metric}
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleFeatured(proj)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer ${
                  proj.is_featured
                    ? 'border-[#FEBD12] bg-[#FEBD12]/15 text-[#002815]'
                    : 'border-neutral-200 text-[#4B5563] hover:bg-neutral-50'
                }`}
              >
                <Star className={`w-3 h-3 ${proj.is_featured ? 'fill-[#FEBD12] text-[#002815]' : ''}`} />
                <span>{proj.is_featured ? 'Featured' : 'Feature'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                {proj.live_url && (
                  <a
                    href={proj.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${proj.title} live link`}
                    className="p-1.5 rounded border border-neutral-200 text-[#4B5563] hover:text-[#002815] hover:bg-neutral-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setEditing({ ...proj })}
                  aria-label={`Edit ${proj.title}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-neutral-200 text-xs font-semibold text-[#111827] hover:bg-neutral-50 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(proj)}
                  aria-label={`Delete ${proj.title}`}
                  className="p-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Portfolio Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portfolio-modal-title"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="bg-[#002815] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 id="portfolio-modal-title" className="font-heading text-base font-bold">
                {db.portfolio_projects.some((p) => p.id === editing.id)
                  ? `Edit Project: ${editing.title || 'Untitled'}`
                  : 'Add New Portfolio Project'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close editor"
                className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="e.g. Synergy Fintech Hub"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={editing.client_name}
                    onChange={(e) => setEditing({ ...editing, client_name: e.target.value })}
                    placeholder="e.g. Synergy Capital Ltd"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="e.g. Corporate & Fintech, E-Commerce"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Outcome / Impact Metric</label>
                  <input
                    type="text"
                    value={editing.outcome_metric}
                    onChange={(e) => setEditing({ ...editing, outcome_metric: e.target.value })}
                    placeholder="e.g. +140% Qualified Inbound Leads"
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Live Website URL</label>
                <input
                  type="text"
                  value={editing.live_url}
                  onChange={(e) => setEditing({ ...editing, live_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                />
              </div>

              <ImageUploader
                label="Project Screenshot / Mockup"
                value={editing.image_url}
                onChange={(url) => setEditing({ ...editing, image_url: url })}
              />

              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editing.is_featured}
                  onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
                  className="accent-[#002815] w-4 h-4"
                />
                Feature this project on the Home Page
              </label>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
              {db.portfolio_projects.some((p) => p.id === editing.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = editing;
                    setEditing(null);
                    setPendingDelete(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Project
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2.5">
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
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        title="Delete Portfolio Project"
        itemName={pendingDelete?.title || ''}
        description="This portfolio showcase will be permanently removed from the website."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deletePortfolioProject(pendingDelete.id);
            showToast(`Deleted "${pendingDelete.title}".`, 'info');
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
};
