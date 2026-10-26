import React from 'react';
import StatCards from '../components/StatCards';
import RecentClaims from '../components/RecentClaims';
import ActiveTestArea from '../components/ActiveTestArea';
import VerificationLog from '../components/VerificationLog';
import FailureBreakdown from '../components/FailureBreakdown';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, Devang!</h1>
          <p className="text-sm text-slate-500 mt-1">
            Test geospatial AI claims, inspect evidence, and compare workflows for reliable results.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
          Prototype • Synthetic Demo Data
        </span>
      </div>

      {/* Metric Stat Cards Row */}
      <StatCards />

      {/* Grid Row 2: Recent Claims Table & Active Map Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentClaims />
        </div>
        <div>
          <ActiveTestArea />
        </div>
      </div>

      {/* Grid Row 3: Audit Stream & Failure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VerificationLog />
        </div>
        <div>
          <FailureBreakdown />
        </div>
      </div>
    </div>
  );
}