import React, { useState } from 'react';
import { Calendar, MapPin, Info, ArrowRight, CheckCircle2 } from 'lucide-react';

const steps = [
  { id: 1, name: 'Claim Details', status: 'active' },
  { id: 2, name: 'Location & Time', status: 'upcoming' },
  { id: 3, name: 'Evidence Sources', status: 'upcoming' },
  { id: 4, name: 'Review & Submit', status: 'upcoming' },
];

export default function SubmitClaimPage() {
  const [claimText, setClaimText] = useState('Did flooding occur in Area A on 20 October?');
  const [eventType, setEventType] = useState('Flooding');
  const [priority, setPriority] = useState('Medium');
  const [aoi, setAoi] = useState('Area A - Bangalore');
  const [startDate, setStartDate] = useState('2026-10-12');
  const [endDate, setEndDate] = useState('2026-10-20');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit New Claim</h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide the claim details and configure the test parameters.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step.id === 1
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    step.id === 1 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-100 mx-4 max-w-[80px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left (2 cols), Map Side Card Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Container (2 Columns Wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Claim Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base">1. Claim Details</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Claim Text <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={4}
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  maxLength={500}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="Enter the natural language claim to verify..."
                />
                <span className="absolute bottom-3 right-3 text-[11px] font-mono text-slate-400">
                  {claimText.length}/500
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Flooding">Flooding</option>
                  <option value="Landslide">Landslide</option>
                  <option value="Vegetation Change">Vegetation Change</option>
                  <option value="Urban Heat">Urban Heat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Location & Time */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base">2. Location & Time</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area of Interest (AOI)
                </label>
                <select
                  value={aoi}
                  onChange={(e) => setAoi(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Area A - Bangalore">Area A - Bangalore</option>
                  <option value="Area B - Pune">Area B - Pune</option>
                  <option value="Area C - Delhi NCR">Area C - Delhi NCR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Card (1 Column Wide) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Example</h3>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
              alt="Area Preview"
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-6 border-2 border-red-500 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded shadow-xs">
                AOI: Area A
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">AOI: Area A</p>
            <p className="text-xs font-mono text-slate-500">12.9716°N, 77.5946°E</p>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              This is a synthetic example used for demonstration purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}