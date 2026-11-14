import React, { useRef, useState } from 'react';
import { Upload, Link2, Trash2 } from 'lucide-react';
import { compressImageFile } from '@/src/utils/formatters';
import { uploadDataUrlToSupabaseStorage } from '@/src/lib/supabaseClient';
import { useToast } from '@/src/context/ToastContext';
import { ResilientImage } from '@/src/components/ResilientImage';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  helperText,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await compressImageFile(file, 900, 0.78);
      const storageUrl = await uploadDataUrlToSupabaseStorage(dataUrl, 'cms-images');
      onChange(storageUrl || dataUrl);
      showToast(
        storageUrl
          ? 'Image uploaded to Supabase Storage.'
          : 'Image uploaded and optimized for web.',
        'success'
      );
    } catch {
      showToast('Could not process selected image.', 'error');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyUrl = () => {
    if (!urlDraft.trim()) return;
    onChange(urlDraft.trim());
    setShowUrlInput(false);
    setUrlDraft('');
    showToast('Image URL updated.', 'success');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#111827]">{label}</label>
        {helperText && <span className="text-[11px] text-[#4B5563]">{helperText}</span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-lg border border-neutral-200 bg-[#F3F5F2]/60">
        <div className="w-28 h-20 rounded-md overflow-hidden border border-neutral-200 bg-white shrink-0">
          <ResilientImage
            src={value}
            alt={label}
            fallbackTitle="No image"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={processing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-[#FEBD12]" />
            <span>{processing ? 'Optimizing...' : 'Upload from Device'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neutral-300 bg-white text-xs font-medium text-[#111827] hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Paste URL</span>
          </button>

          {value && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-red-200 bg-white text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 text-xs rounded-md border border-neutral-300 bg-white focus:outline-none focus:border-[#002815]"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="px-3 py-2 rounded-md bg-[#FEBD12] text-[#002815] text-xs font-bold hover:bg-[#f2b207] cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={confirmClearOpen}
        title="Clear Uploaded Image"
        itemName={label}
        description="Are you sure you want to clear this image? You can upload a replacement anytime."
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          onChange('');
          setConfirmClearOpen(false);
          showToast('Image cleared.', 'info');
        }}
      />
    </div>
  );
};
