import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
} from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';
import { compressImageFile } from '@/src/utils/formatters';
import { uploadDataUrlToSupabaseStorage } from '@/src/lib/supabaseClient';

export const LogoManagementTab: React.FC = () => {
  const { db, currentAdmin, updateSiteSettings } = useCms();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const savedLogoUrl = db.site_settings.logo_url || '';
  const [draftLogoUrl, setDraftLogoUrl] = useState<string>(savedLogoUrl);
  const [urlInput, setUrlInput] = useState<string>(
    savedLogoUrl.startsWith('data:') ? '' : savedLogoUrl
  );
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    setDraftLogoUrl(savedLogoUrl);
    setUrlInput(savedLogoUrl.startsWith('data:') ? '' : savedLogoUrl);
    setPreviewError(false);
  }, [savedLogoUrl]);

  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading text-base font-bold text-[#111827]">
            Super Admin Access Required
          </h3>
          <p className="text-xs text-[#4B5563] mt-1">
            Only the Super Admin can upload, update, or remove the official company logo.
          </p>
        </div>
      </div>
    );
  }

  const hasUnsavedChanges = draftLogoUrl.trim() !== savedLogoUrl.trim();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isAllowedMime =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png');

    if (!isAllowedMime) {
      showToast('Only JPG and PNG logo files are supported.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Please select an image smaller than 5 MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file, 600, 0.9);
      const storageUrl = await uploadDataUrlToSupabaseStorage(dataUrl, 'logos');
      setDraftLogoUrl(storageUrl || dataUrl);
      setUrlInput(storageUrl || '');
      setPreviewError(false);
      showToast(
        storageUrl
          ? 'Logo uploaded to Supabase Storage. Click "Save Company Logo" to publish.'
          : 'Logo ready. Click "Save Company Logo" to publish to header & footer.',
        'info'
      );
    } catch {
      showToast('Could not process selected logo image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      showToast('Enter a valid JPG or PNG image URL first.', 'error');
      return;
    }
    setDraftLogoUrl(trimmed);
    setPreviewError(false);
  };

  const handleSaveLogo = () => {
    if (draftLogoUrl.trim() && previewError) {
      showToast('The selected logo preview failed to load. Please choose another file or URL.', 'error');
      return;
    }
    updateSiteSettings({
      ...db.site_settings,
      logo_url: draftLogoUrl.trim(),
    });
    showToast('Company logo saved and updated across website header and footer.', 'success');
  };

  const handleConfirmRemoveLogo = () => {
    setDraftLogoUrl('');
    setUrlInput('');
    setPreviewError(false);
    updateSiteSettings({
      ...db.site_settings,
      logo_url: '',
    });
    setConfirmClearOpen(false);
    showToast('Company logo removed. Website header and footer reverted to text wordmark.', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-[#111827]">
            Logo Management
          </h2>
          <p className="text-xs text-[#4B5563]">
            Upload your official company logo (JPG or PNG). Saved logos appear automatically in the website header and footer.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {(draftLogoUrl || savedLogoUrl) && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Logo</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveLogo}
            disabled={!hasUnsavedChanges}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#FEBD12]" />
            <span>Save Company Logo</span>
          </button>
        </div>
      </div>

      {/* Upload & URL Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-bold text-[#111827]">
              Upload Brand Logo File
            </h3>
            <p className="text-xs text-[#4B5563]">
              Accepted formats: <strong>JPG, JPEG, PNG</strong> (transparent PNG supported). Recommended horizontal or square mark.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#FEBD12] text-[#002815] text-xs font-bold hover:bg-[#f5b300] transition-colors cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing Logo...' : 'Choose JPG / PNG Logo'}</span>
          </button>
        </div>

        {/* Optional direct URL input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#111827]">
            Or Paste Hosted Logo URL (JPG / PNG)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://yourdomain.com/logo.png"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#FEBD12]"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-4 py-2 rounded-md border border-neutral-300 bg-[#F3F5F2] text-xs font-semibold text-[#111827] hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
            >
              Preview URL
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            {savedLogoUrl ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Active logo is published on the website header &amp; footer.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#4B5563]">
                <ImageIcon className="w-4 h-4" />
                No image logo active — displaying clean text wordmark ({db.site_settings.brand_name}).
              </span>
            )}
          </div>
          {hasUnsavedChanges && (
            <span className="text-amber-700 font-semibold">Unsaved draft change</span>
          )}
        </div>
      </div>

      {/* Live Header & Footer Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Header Preview */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F3F5F2] border-b border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-bold text-[#111827]">Live Website Header Preview</span>
            <span className="text-[11px] text-[#4B5563]">Light Surface</span>
          </div>
          <div className="p-5">
            <div className="h-14 px-4 rounded-lg border border-neutral-200 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {draftLogoUrl && !previewError ? (
                  <img
                    src={draftLogoUrl}
                    alt={`${db.site_settings.brand_name} logo preview`}
                    referrerPolicy="no-referrer"
                    onError={() => setPreviewError(true)}
                    className="h-9 w-auto max-w-[130px] object-contain shrink-0"
                  />
                ) : null}
                <span className="font-heading text-sm font-extrabold text-[#002815] whitespace-nowrap truncate">
                  {db.site_settings.brand_name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#4B5563] shrink-0">
                <span>Home</span>
                <span>Services</span>
                <span className="px-2.5 py-1 rounded bg-[#002815] text-white font-semibold">
                  Request
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Preview */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F3F5F2] border-b border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-bold text-[#111827]">Live Website Footer Preview</span>
            <span className="text-[11px] text-[#4B5563]">Deep Forest Green (#002815)</span>
          </div>
          <div className="p-5">
            <div className="rounded-lg bg-[#002815] p-5 text-white space-y-2.5">
              <div className="flex items-center gap-3">
                {draftLogoUrl && !previewError ? (
                  <div className="inline-flex items-center bg-white/95 px-2.5 py-1.5 rounded-md shrink-0">
                    <img
                      src={draftLogoUrl}
                      alt={`${db.site_settings.brand_name} footer logo preview`}
                      referrerPolicy="no-referrer"
                      onError={() => setPreviewError(true)}
                      className="h-9 w-auto max-w-[150px] object-contain"
                    />
                  </div>
                ) : null}
                <span className="font-heading text-base font-extrabold text-white tracking-tight">
                  {db.site_settings.brand_name}
                </span>
              </div>
              <p className="text-[11px] text-white/75 line-clamp-2">
                {db.site_settings.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={confirmClearOpen}
        title="Remove Company Logo"
        itemName="Official Company Logo"
        description="Removing the logo will clear it from the database and revert the website header and footer back to the brand wordmark."
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={handleConfirmRemoveLogo}
      />
    </div>
  );
};
