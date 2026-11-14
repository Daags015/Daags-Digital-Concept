import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2, UserCheck } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { buildWhatsAppLink, formatBusinessScheduleLines } from '@/src/utils/formatters';

export const ContactPage: React.FC = () => {
  const { db, getSection, submitInquiry } = useCms();
  const { showToast } = useToast();
  const header = getSection('contact_header');

  const publishedCategories = db.service_categories.filter((c) => c.is_published);
  const contactPersons = db.site_settings.contact_persons || [];
  const scheduleLines = formatBusinessScheduleLines(db.site_settings.business_schedule || []);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceCategory, setServiceCategory] = useState(
    publishedCategories[0]?.name || 'CAC Registration'
  );
  const [subService, setSubService] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const filteredSubs = db.sub_services.filter((s) => {
    const cat = publishedCategories.find((c) => c.id === s.category_id);
    return cat?.name === serviceCategory && s.is_published;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Please provide your full name and phone/WhatsApp number.', 'error');
      return;
    }
    submitInquiry({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      service_category: serviceCategory,
      sub_service: subService || 'General Service Inquiry',
      message: message.trim() || 'Interested in starting a service request.',
    });
    setSubmitted(true);
    showToast('Your inquiry has been logged! Our desk will reach out shortly.', 'success');
  };

  return (
    <div className="bg-[#F3F5F2] min-h-screen">
      <section className="bg-[#002815] text-white py-14 border-b border-[#FEBD12]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              {header.heading}
            </h1>
            <p className="text-base text-white/85 leading-relaxed">{header.subheading}</p>
            {header.body_content && (
              <p className="text-xs text-white/75">{header.body_content}</p>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="font-heading text-xl font-bold text-[#111827]">
                Direct Support Channels
              </h2>

              <div className="space-y-4 text-sm text-[#4B5563]">
                {/* Named Contact Persons Directory */}
                {contactPersons.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="font-semibold text-[#111827] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#002815]" />
                      <span>Direct Contact Persons</span>
                    </p>
                    <div className="space-y-2 pl-6">
                      {contactPersons.map((person) => (
                        <div
                          key={person.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-neutral-100 last:border-b-0"
                        >
                          <div>
                            <span className="font-semibold text-[#111827]">
                              Contact {person.name}:
                            </span>{' '}
                            <a
                              href={`tel:${person.phone}`}
                              className="text-[#002815] font-bold hover:underline tabular-nums"
                            >
                              {person.phone}
                            </a>
                            {person.role && (
                              <span className="block text-xs text-[#4B5563]">{person.role}</span>
                            )}
                          </div>
                          <a
                            href={buildWhatsAppLink(
                              person.phone,
                              `Hello ${person.name} at Daags Digital Concept, I would like to make an inquiry.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#002815] hover:underline whitespace-nowrap"
                          >
                            WhatsApp
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#002815] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111827]">Call / WhatsApp Line</p>
                      <a
                        href={`tel:${db.site_settings.phone}`}
                        className="text-[#002815] font-semibold hover:underline tabular-nums"
                      >
                        {db.site_settings.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#002815] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#111827]">Official Email</p>
                    <a
                      href={`mailto:${db.site_settings.email}`}
                      className="hover:text-[#002815] break-all"
                    >
                      {db.site_settings.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#002815] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#111827]">Service Office & Desk</p>
                    <p>{db.site_settings.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#002815] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#111827]">Business Hours</p>
                    {scheduleLines.length > 0 ? (
                      <ul className="mt-1 space-y-1 text-xs sm:text-sm tabular-nums">
                        {scheduleLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{db.site_settings.business_hours}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={buildWhatsAppLink(
                    db.site_settings.whatsapp,
                    'Hello Daags Digital Concept, I would like to make an inquiry.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#FEBD12]" />
                  <span>Chat Instantly on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Lead Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
              {submitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#F3F5F2] text-[#002815] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="font-heading text-2xl font-extrabold text-[#111827]">
                    Thank You, {fullName}
                  </h2>
                  <p className="text-sm text-[#4B5563] max-w-md mx-auto">
                    Your inquiry has been saved to our client desk. A specialist will contact you on{' '}
                    <strong className="tabular-nums">{phone}</strong> shortly.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <a
                      href={buildWhatsAppLink(
                        db.site_settings.whatsapp,
                        `Hello Daags Digital Concept, I just sent an inquiry for ${subService || serviceCategory}. My name is ${fullName}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-md bg-[#002815] text-white text-sm font-semibold"
                    >
                      Fast-Track on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFullName('');
                        setPhone('');
                        setEmail('');
                        setMessage('');
                      }}
                      className="px-5 py-2.5 rounded-md border border-neutral-300 text-sm font-semibold text-[#111827] cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-[#111827]">
                      Submit an Online Inquiry
                    </h2>
                    <p className="text-xs text-[#4B5563] mt-1">
                      Complete the form below to lock in active promotional pricing.
                    </p>
                  </div>

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
                        placeholder="Your full name"
                        className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
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
                        placeholder="e.g. 08168779732"
                        className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
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
                        <option value="">Select package (optional)</option>
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
                      Project / Filing Details
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your business registration, website requirements, NIN/KYC support, or POS request..."
                      className="w-full px-3.5 py-2.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:border-[#002815]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#FEBD12]" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
