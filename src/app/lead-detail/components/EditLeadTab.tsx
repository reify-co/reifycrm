'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Sparkles, X, Loader2, Upload } from 'lucide-react';
import { AGENTS, type Lead, type LeadSource, type LeadStatus } from '@/data/mockData';

const ALL_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost'];
const ALL_SOURCES: LeadSource[] = ['Google Ads', 'WhatsApp', 'Phone Call', 'Email', 'Referral'];
const PACKAGE_TYPES = ['Honeymoon', 'Family Tour', 'Group Tour', 'Solo Adventure', 'Couple Tour', 'Corporate', 'Pilgrimage'];
const DESTINATIONS = ['Maldives', 'Bali', 'Switzerland', 'Paris + Rome', 'Greece', 'Dubai', 'Singapore + Malaysia', 'Thailand', 'Turkey', 'Japan', 'Other'];

interface FormData {
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  adCampaign: string;
  status: LeadStatus;
  assignedAgentId: string;
  destination: string;
  packageType: string;
  travelDates: string;
  paxCount: number;
  budget: number;
  specialRequests: string;
  notes: string;
}

interface Props {
  lead: Lead;
  onSave: (updated: Lead) => void;
}

// Mock extracted data from ad screenshot
const MOCK_EXTRACTED_DATA = {
  name: 'Kiran Malhotra',
  phone: '+91 95678 12345',
  email: 'kiran.malhotra@gmail.com',
  source: 'Google Ads' as LeadSource,
  adCampaign: 'Maldives Summer 2026',
  destination: 'Maldives',
  budget: 4500,
};

export default function EditLeadTab({ lead, onSave }: Props) {
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [pastedImageName, setPastedImageName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    defaultValues: {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      adCampaign: lead.adCampaign ?? '',
      status: lead.status,
      assignedAgentId: lead.assignedAgentId,
      destination: lead.destination,
      packageType: lead.packageType,
      travelDates: lead.travelDates,
      paxCount: lead.paxCount,
      budget: lead.budget,
      specialRequests: lead.specialRequests ?? '',
      notes: lead.notes ?? '',
    },
  });

  function onSubmit(data: FormData) {
    setIsSaving(true);
    // TODO: Backend integration — PATCH /api/leads/:id with data
    setTimeout(() => {
      setIsSaving(false);
      onSave({ ...lead, ...data });
    }, 800);
  }

  function handleExtract() {
    setExtracting(true);
    // TODO: Backend integration — POST /api/leads/extract-screenshot with image file
    // Should call an AI/OCR service to extract contact details from the ad screenshot
    setTimeout(() => {
      setExtracting(false);
      setExtracted(true);
    }, 2000);
  }

  function applyExtracted() {
    setValue('name', MOCK_EXTRACTED_DATA.name, { shouldDirty: true });
    setValue('phone', MOCK_EXTRACTED_DATA.phone, { shouldDirty: true });
    setValue('email', MOCK_EXTRACTED_DATA.email, { shouldDirty: true });
    setValue('source', MOCK_EXTRACTED_DATA.source, { shouldDirty: true });
    setValue('adCampaign', MOCK_EXTRACTED_DATA.adCampaign, { shouldDirty: true });
    setValue('destination', MOCK_EXTRACTED_DATA.destination, { shouldDirty: true });
    setValue('budget', MOCK_EXTRACTED_DATA.budget, { shouldDirty: true });
    setExtractModalOpen(false);
    setExtracted(false);
    setPastedImageName('');
  }

  return (
    <div>
      {/* Screenshot extract banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Camera size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-600 text-foreground">Import from Ad Screenshot</p>
            <p className="text-xs text-muted-foreground">Paste a Google Ads lead screenshot to auto-fill contact details</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExtractModalOpen(true)}
          className="flex items-center gap-1.5 text-sm font-500 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Sparkles size={14} />
          Extract Data
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Section: Contact */}
        <div className="mb-6">
          <h3 className="text-sm font-600 text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border">
            <span className="w-1 h-4 bg-primary rounded-full" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone', { required: 'Phone is required' })}
                type="tel"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                type="email"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Lead Source</label>
              <select
                {...register('source')}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {ALL_SOURCES.map((s) => <option key={`edit-source-${s}`} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Ad Campaign</label>
              <p className="text-[11px] text-muted-foreground mb-1">For Google Ads leads — enter campaign name</p>
              <input
                {...register('adCampaign')}
                placeholder="e.g. Maldives Summer 2026"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section: Travel Details */}
        <div className="mb-6">
          <h3 className="text-sm font-600 text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border">
            <span className="w-1 h-4 bg-accent rounded-full" />
            Travel Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">
                Destination <span className="text-red-500">*</span>
              </label>
              <select
                {...register('destination', { required: 'Destination is required' })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {DESTINATIONS.map((d) => <option key={`edit-dest-${d}`} value={d}>{d}</option>)}
              </select>
              {errors.destination && <p className="text-xs text-red-600 mt-1">{errors.destination.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Package Type</label>
              <select
                {...register('packageType')}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {PACKAGE_TYPES.map((p) => <option key={`edit-pkg-${p}`} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Travel Dates</label>
              <input
                {...register('travelDates')}
                placeholder="e.g. Jun 10 – Jun 17, 2026"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">
                No. of Travellers (Pax) <span className="text-red-500">*</span>
              </label>
              <input
                {...register('paxCount', {
                  required: 'Pax count is required',
                  min: { value: 1, message: 'Minimum 1 traveller' },
                  valueAsNumber: true,
                })}
                type="number"
                min={1}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {errors.paxCount && <p className="text-xs text-red-600 mt-1">{errors.paxCount.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">
                Budget (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  {...register('budget', {
                    required: 'Budget is required',
                    min: { value: 100, message: 'Minimum $100' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  min={0}
                  className="w-full text-sm border border-border rounded-lg pl-7 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {errors.budget && <p className="text-xs text-red-600 mt-1">{errors.budget.message}</p>}
            </div>
            <div className="md:col-span-2 xl:col-span-1 2xl:col-span-1">
              <label className="block text-xs font-500 text-foreground mb-1">Special Requests</label>
              <input
                {...register('specialRequests')}
                placeholder="e.g. Water villa, anniversary setup, wheelchair access"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section: Assignment & Status */}
        <div className="mb-6">
          <h3 className="text-sm font-600 text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border">
            <span className="w-1 h-4 bg-purple-500 rounded-full" />
            Assignment & Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Assigned Agent</label>
              <select
                {...register('assignedAgentId')}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {AGENTS.map((a) => (
                  <option key={`edit-agent-${a.id}`} value={a.id}>
                    {a.name}{a.isOnLeave ? ' (On Leave)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Lead Status</label>
              <select
                {...register('status')}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {ALL_STATUSES.map((s) => <option key={`edit-status-${s}`} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section: Notes */}
        <div className="mb-8">
          <h3 className="text-sm font-600 text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border">
            <span className="w-1 h-4 bg-green-500 rounded-full" />
            Internal Notes
          </h3>
          <textarea
            {...register('notes')}
            rows={4}
            placeholder="Internal notes visible to all team members — context, observations, competitive intel..."
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 bg-white border-t border-border -mx-5 px-5 py-3 flex items-center justify-between">
          {isDirty && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              Unsaved changes
            </p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onSave(lead)}
              className="px-4 py-2 text-sm font-500 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-all active:scale-95"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-500 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-70 transition-all active:scale-95 flex items-center gap-2 min-w-[130px] justify-center"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Lead Details'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Screenshot Extract Modal */}
      {extractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <h2 className="text-base font-600 text-foreground">Extract Lead from Screenshot</h2>
              </div>
              <button
                onClick={() => { setExtractModalOpen(false); setExtracted(false); setPastedImageName(''); setExtracting(false); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {!extracted ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Paste or upload a screenshot of a Google Ads lead form submission. The system will extract the contact details automatically.
                  </p>
                  {/* Paste area */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      pastedImageName ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onPaste={(e) => {
                      const items = Array.from(e.clipboardData.items);
                      const img = items.find((item) => item.type.startsWith('image/'));
                      if (img) setPastedImageName('screenshot_pasted.png');
                    }}
                    onClick={() => setPastedImageName('screenshot_uploaded.png')}
                  >
                    {pastedImageName ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Camera size={20} className="text-primary" />
                        </div>
                        <p className="text-sm font-500 text-primary">{pastedImageName}</p>
                        <p className="text-xs text-muted-foreground">Screenshot ready for extraction</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-muted-foreground" />
                        <p className="text-sm font-500 text-foreground">Paste screenshot here</p>
                        <p className="text-xs text-muted-foreground">Ctrl+V to paste · or click to simulate upload</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setExtractModalOpen(false); setPastedImageName(''); }}
                      className="px-3 py-2 text-sm font-500 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExtract}
                      disabled={!pastedImageName || extracting}
                      className="px-4 py-2 text-sm font-500 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 min-w-[130px] justify-center"
                    >
                      {extracting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Extract Data
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px]">✓</span>
                    </span>
                    <p className="text-sm font-500 text-green-800">Data extracted successfully</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Review the extracted fields before applying:</p>
                  <dl className="space-y-2 bg-muted/30 rounded-xl p-4">
                    {Object.entries(MOCK_EXTRACTED_DATA).map(([key, val]) => (
                      <div key={`extracted-${key}`} className="flex items-center gap-3">
                        <dt className="text-xs font-500 text-muted-foreground w-28 flex-shrink-0 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </dt>
                        <dd className="text-sm font-500 text-foreground">
                          {typeof val === 'number' ? `$${val.toLocaleString()}` : String(val)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setExtracted(false); setPastedImageName(''); }}
                      className="px-3 py-2 text-sm font-500 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-all active:scale-95"
                    >
                      Re-extract
                    </button>
                    <button
                      type="button"
                      onClick={applyExtracted}
                      className="px-4 py-2 text-sm font-500 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all active:scale-95"
                    >
                      Apply to Form
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}