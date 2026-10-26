import React from 'react';
import { Plus, Minus, Navigation, Layers } from 'lucide-react';

export default function ActiveTestArea() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900 text-sm">Active Test Area</h2>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View Map</button>
      </div>

      {/* Satellite Map Mock Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 h-64 bg-slate-900 group">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
          alt="Satellite Test Area"
          className="w-full h-full object-cover opacity-80"
        />

        {/* Vector Overlay Boundary Box */}
        <div className="absolute inset-8 border-2 border-red-500/80 bg-red-500/20 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-xs">
          <button className="p-1 hover:bg-slate-100 rounded text-slate-700"><Plus className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-slate-100 rounded text-slate-700"><Minus className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-slate-100 rounded text-slate-700"><Navigation className="w-3.5 h-3.5" /></button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" /> AOI
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" /> Evidence Coverage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" /> Flood Risk (mode)
          </div>
        </div>
      </div>
    </div>
  );
}