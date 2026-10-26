import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, ExternalLink, Calendar, MapPin } from 'lucide-react';

const evidenceData = [
  {
    id: 'E1',
    title: 'E1 - Satellite image',
    type: 'Satellite Imagery',
    source: 'Sentinel-2',
    date: '12 Oct 2026',
    relevance: 'High',
    relevanceColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    details: {
      dateAcquired: '12 Oct 2026',
      satellite: 'Sentinel-2',
      resolution: '10 m',
      coverage: 'Area A',
      relevance: 'High',
      description: 'Shows water presence and high moisture in the area. Cannot establish extension conditions on 20 Oct due to 8-day temporal gap.'
    }
  },
  {
    id: 'E2',
    title: 'E2 - News Report',
    type: 'Reports',
    source: 'Source A',
    date: '20 Oct 2026',
    relevance: 'Medium',
    relevanceColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    image: null,
    details: {
      dateAcquired: '20 Oct 2026',
      satellite: 'N/A (Text Report)',
      resolution: 'Text Article',
      coverage: 'Area A',
      relevance: 'Medium',
      description: 'Published report supporting flooding claims in Area A on 20 October. Source credibility requires verification.'
    }
  },
  {
    id: 'E3',
    title: 'E3 - News Report',
    type: 'Reports',
    source: 'Source B',
    date: '20 Oct 2026',
    relevance: 'Medium',
    relevanceColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    image: null,
    details: {
      dateAcquired: '20 Oct 2026',
      satellite: 'N/A (Text Report)',
      resolution: 'Text Article',
      coverage: 'Area A',
      relevance: 'Medium',
      description: 'Published report disputing severe flood impact in Area A. Directly contradicts E2 payload.'
    }
  }
];

export default function EvidenceExplorerPage() {
  const [activeTab, setActiveTab] = useState('All Evidence');
  const [selectedEvidence, setSelectedEvidence] = useState(evidenceData[0]);

  const filteredEvidence = evidenceData.filter(item => {
    if (activeTab === 'Satellite Imagery') return item.type === 'Satellite Imagery';
    if (activeTab === 'Reports') return item.type === 'Reports';
    if (activeTab === 'Documents') return item.type === 'Documents';
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Evidence Explorer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore and analyze evidence related to your claim.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            S
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Claim: Did flooding occur in Area A on 20 October?
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> AOI: <strong className="text-slate-800 dark:text-slate-200">Area A</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Time: <strong className="text-slate-800 dark:text-slate-200">12–20 Oct 2026</strong>
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" /> Status: Completed
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {[
            { label: 'All Evidence', count: 3 },
            { label: 'Satellite Imagery', count: 1 },
            { label: 'Reports', count: 2 },
            { label: 'Documents', count: 0 },
          ].map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.label
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <button className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          {filteredEvidence.map((item) => {
            const isSelected = selectedEvidence.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedEvidence(item)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/40 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.relevanceColor}`}>
                        Relevance {item.relevance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.date} • {item.source}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          <div className="flex items-start gap-4">
            {selectedEvidence.image ? (
              <img
                src={selectedEvidence.image}
                alt={selectedEvidence.title}
                className="w-24 h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileText className="w-10 h-10" />
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedEvidence.title}</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs pt-1">
                <span className="text-slate-400 dark:text-slate-500">Date Acquired:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvidence.details.dateAcquired}</span>

                <span className="text-slate-400 dark:text-slate-500">Satellite / Source:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvidence.details.satellite}</span>

                <span className="text-slate-400 dark:text-slate-500">Resolution:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvidence.details.resolution}</span>

                <span className="text-slate-400 dark:text-slate-500">Coverage:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvidence.details.coverage}</span>

                <span className="text-slate-400 dark:text-slate-500">Relevance:</span>
                <span className={`inline-block font-bold text-[11px] px-2 py-0.5 rounded border w-fit ${selectedEvidence.relevanceColor}`}>
                  {selectedEvidence.details.relevance}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Description & Analysis
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {selectedEvidence.details.description}
            </p>
          </div>

          <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs">
            <ExternalLink className="w-4 h-4" /> View Full Metadata
          </button>
        </div>
      </div>
    </div>
  );
}