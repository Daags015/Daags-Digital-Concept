import React, { useEffect, useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { buildWhatsAppLink } from '@/src/utils/formatters';

export const InquiryModal: React.FC = () => {
  const { db, inquiryModal, closeInquiryModal, submitInquiry } = useCms();
  const { showToast } = useToast();

  const publishedCategories = db.service_categories.filter((c) => c.is_published);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [subService, setSubService] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (inquiryModal.isOpen) {
      setSubmitted(false);
      setServiceCategory(
        inquiryModal.serviceCategory || publishedCategories[0]?.name || 'General Inquiry'
      );
      setSubService(inquiryModal.subService || '');
    }
  }, [inquiryModal.isOpen, inquiryModal.serviceCategory, inquiryModal.subService]);

  if (!inquiryModal.isOpen) return null;

  const filteredSubs = db.sub_services.filter((s) => {
    const cat = db.service_categories.find((c) => c.id === s.category_id);
    return cat?.name === serviceCategory && s.is_published;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Please enter your full name and phone/WhatsApp number.', 'error');
      return;
    }
    submitInquiry({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      service_category: serviceCategory,
      sub_service: subService || 'General Service Inquiry',
      message: message.trim() || 'Interested in claiming the active promo offer.',
    });
    setSubmitted(true);
    showToast('Inquiry submitted! Our support desk will contact you shortly.', 'success');
  };

  const whatsappDirect = buildWhatsAppLink(
    db.site_settings.whatsapp,
    `Hello Daags Digital Concept, my name is ${fullName || 'a prospective client'}. I just submitted an inquiry for ${subService || serviceCategory}.`
  );

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
    >
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-[#002815] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 id="inquiry-modal-title" className="font-heading text-lg font-bold">
              Request Digital or Business Support
            </h2>
            <p className="text-xs text-white/75 mt-0.5">
              Direct response via call or WhatsApp ({db.site_settings.phone})
            </p>
          </div>
          <button
            type="button"
            onClick={closeInquiryModal}
            aria-label="Close modal"
            className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#F3F5F2] text-[#002815] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#111827]">
              Request Received Successfully
            </h3>
            <p className="text-sm text-[#4B5563]">
              Thank you, {fullName}. Your brief for <strong>{subService || serviceCategory}</strong> is now in our CRM queue. Want an instant response right now?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={whatsappDirect}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors"
              >
                Continue on WhatsApp
              </a>
              <button
                type="button"
                onClick={closeInquiryModal}
                className="px-4 py-2.5 rounded-md border border-neutral-300 text-sm font-medium text-[#111827] hover:bg-[#F3F5F2] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chinedu Okafor"
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815] focus:ring-1 focus:ring-[#002815]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08031234567"
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815] focus:ring-1 focus:ring-[#002815]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815] focus:ring-1 focus:ring-[#002815]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Service Category
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => {
                    setServiceCategory(e.target.value);
                    setSubService('');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 bg-white focus:outline-none focus:border-[#002815]"
                >
                  {publishedCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="Custom Consultation">Custom Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Specific Package
                </label>
                <select
                  value={subService}
                  onChange={(e) => setSubService(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 bg-white focus:outline-none focus:border-[#002815]"
                >
                  <option value="">Select Package (Optional)</option>
                  {filteredSubs.map((sub) => (
                    <option key={sub.id} value={sub.title}>
                      {sub.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Brief Project or Filing Details
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you need done, preferred timeline, or questions..."
                className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815] focus:ring-1 focus:ring-[#002815]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeInquiryModal}
                className="px-4 py-2.5 text-sm font-medium text-[#4B5563] hover:text-[#111827] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
