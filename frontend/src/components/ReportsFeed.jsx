import React, { useState } from 'react';
import { Search, Filter, MapPin, Clock, Image as ImageIcon, Zap, AlertCircle } from 'lucide-react';

export default function ReportsFeed({ reports, onSelectReport, onTriggerMatch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'bags', label: 'Bags & Luggage' },
    { id: 'documents', label: 'Documents & IDs' },
    { id: 'jewelry', label: 'Jewelry & Watches' },
    { id: 'keys', label: 'Keys' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'other', label: 'Other' },
  ];

  const filteredReports = reports.filter((r) => {
    if (selectedType !== 'ALL' && r.report_type !== selectedType) return false;
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(term);
      const matchDesc = r.description.toLowerCase().includes(term);
      const matchLoc = r.location_name.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by keyword, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 transition"
            />
          </div>

          {/* Type Switcher */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700 text-xs w-full sm:w-auto">
            {['ALL', 'LOST', 'FOUND'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex-1 sm:flex-none ${
                  selectedType === t 
                    ? t === 'LOST' ? 'bg-rose-600 text-white' : t === 'FOUND' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Status Switcher */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="MATCHED">Matched</option>
            <option value="CLAIMED">Claimed</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition border ${
                selectedCategory === c.id
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 px-4 glass-panel rounded-2xl border border-slate-800">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No matching reports found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Header banner */}
                <div className="p-3.5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      report.report_type === 'LOST' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {report.report_type}
                    </span>
                    <span className="text-slate-400 text-[11px]">#{report.id}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    report.status === 'OPEN' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                    report.status === 'MATCHED' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' :
                    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {report.status}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {report.image ? (
                        <img src={report.image} alt={report.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {report.category}
                      </span>
                      <h4 className="font-semibold text-white text-sm truncate">{report.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{report.description}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{report.location_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-500 flex-shrink-0" />
                      <span>{new Date(report.event_datetime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {report.matches_count > 0 ? (
                    <strong className="text-sky-400">{report.matches_count} matches suggested</strong>
                  ) : (
                    'No matches yet'
                  )}
                </span>

                <button
                  onClick={() => onTriggerMatch(report.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Scan</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
