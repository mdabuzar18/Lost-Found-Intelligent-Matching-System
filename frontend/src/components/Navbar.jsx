import React from 'react';
import { Sparkles, PlusCircle, ShieldCheck, UserCheck, Search, Building2 } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenReportModal, 
  currentVenue, 
  setCurrentVenue, 
  currentUserRole, 
  setCurrentUserRole,
  matchCount = 0 
}) {
  const venues = [
    { id: 'airport', name: 'SFO International Airport (T2)', icon: '✈️' },
    { id: 'campus', name: 'University Campus & Library', icon: '🎓' },
    { id: 'mall', name: 'Grand Metropolitan Mall', icon: '🛍️' },
    { id: 'transit', name: 'Central Metro Railway Station', icon: '🚆' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Lost & Found</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  AI Matching Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sentence-BERT • CLIP Vectors • Spatial Decay • Time Proximity
              </p>
            </div>
          </div>

          {/* Venue & Role Selectors */}
          <div className="hidden md:flex items-center gap-3">
            {/* Venue Dropdown */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <select 
                value={currentVenue} 
                onChange={(e) => setCurrentVenue(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer pr-1"
              >
                {venues.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-800 text-slate-100">
                    {v.icon} {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <button
              onClick={() => setCurrentUserRole(currentUserRole === 'staff' ? 'public' : 'staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                currentUserRole === 'staff'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {currentUserRole === 'staff' ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  Staff View (Alex Rivera)
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Passenger View (John Doe)
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReportModal('LOST')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Report Lost</span>
            </button>

            <button
              onClick={() => onOpenReportModal('FOUND')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Report Found</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-800/80 pt-1 -mb-px overflow-x-auto text-xs sm:text-sm">
          {[
            { id: 'matches', label: 'AI Matches', count: matchCount, badge: true },
            { id: 'reports', label: 'All Reports Feed' },
            { id: 'claims', label: 'Claims Desk (Staff)' },
            { id: 'audit', label: 'Audit Trail' },
            { id: 'how-it-works', label: 'Algorithm & Specs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
              {tab.badge && tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-white">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

      </div>
    </header>
  );
}
