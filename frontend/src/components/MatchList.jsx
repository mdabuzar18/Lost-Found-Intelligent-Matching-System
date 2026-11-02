import React from 'react';
import { 
  CheckCircle, XCircle, Eye, Sparkles, MapPin, Clock, 
  FileText, Image as ImageIcon, ArrowRight, ShieldAlert 
} from 'lucide-react';

export default function MatchList({ 
  matches, 
  onConfirm, 
  onReject, 
  onSelectMatch, 
  onCreateClaim,
  currentUserRole 
}) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16 px-4 glass-panel rounded-2xl border border-slate-800">
        <Sparkles className="h-12 w-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No active matches found</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
          When new lost or found reports are submitted, the intelligent matching engine will automatically compare text, images, location, and event timestamps.
        </p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getBarColor = (score) => {
    if (score >= 0.8) return 'bg-emerald-500';
    if (score >= 0.6) return 'bg-sky-500';
    if (score >= 0.4) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>AI Suggested Matches</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {matches.length} Candidates
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by multi-modal aggregate confidence percentage
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {matches.map((match) => {
          const lost = match.lost_report;
          const found = match.found_report;

          return (
            <div 
              key={match.id}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all shadow-xl shadow-black/20"
            >
              {/* Header Bar */}
              <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full font-bold text-sm border flex items-center gap-1.5 shadow-sm ${getScoreColor(match.final_confidence_score)}`}>
                    <Sparkles className="h-4 w-4" />
                    <span>Possible Match: {match.final_confidence_score}%</span>
                  </div>

                  <span className={`text-xs px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                    match.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    match.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {match.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectMatch(match)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Side-by-Side</span>
                  </button>

                  {match.status === 'SUGGESTED' && (
                    <>
                      <button
                        onClick={() => onReject(match.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => onConfirm(match.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Confirm Match</span>
                      </button>
                    </>
                  )}

                  {match.status === 'CONFIRMED' && (
                    <button
                      onClick={() => onCreateClaim(match)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition shadow-sm"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Process Claim</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Side-by-Side Item Cards */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Lost Report Card */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 relative">
                    {lost.image ? (
                      <img src={lost.image} alt={lost.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                        <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                        <span className="text-[10px]">No Photo</span>
                      </div>
                    )}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600/90 text-white uppercase">
                      LOST
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase tracking-wider">
                        {lost.category}
                      </span>
                      <span className="text-xs text-slate-400 truncate">by {lost.reported_by_name}</span>
                    </div>

                    <h4 className="font-semibold text-slate-100 text-sm truncate">{lost.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{lost.description}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-rose-400" />
                        <span className="truncate">{lost.location_name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{new Date(lost.event_datetime).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Found Report Card */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 relative">
                    {found.image ? (
                      <img src={found.image} alt={found.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                        <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                        <span className="text-[10px]">No Photo</span>
                      </div>
                    )}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600/90 text-white uppercase">
                      FOUND
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase tracking-wider">
                        {found.category}
                      </span>
                      <span className="text-xs text-slate-400 truncate">by {found.reported_by_name}</span>
                    </div>

                    <h4 className="font-semibold text-slate-100 text-sm truncate">{found.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{found.description}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-400" />
                        <span className="truncate">{found.location_name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{new Date(found.event_datetime).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 4-Way Sub-Score Breakdown Meters */}
              <div className="px-5 py-3.5 bg-slate-900/60 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                
                {/* Text Similarity */}
                <div>
                  <div className="flex justify-between items-center text-slate-400 mb-1">
                    <span className="flex items-center gap-1 text-[11px]">
                      <FileText className="h-3 w-3 text-sky-400" /> Text Semantic
                    </span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {(match.text_similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getBarColor(match.text_similarity_score)}`}
                      style={{ width: `${Math.min(100, match.text_similarity_score * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Visual Similarity */}
                <div>
                  <div className="flex justify-between items-center text-slate-400 mb-1">
                    <span className="flex items-center gap-1 text-[11px]">
                      <ImageIcon className="h-3 w-3 text-purple-400" /> Image CLIP
                    </span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {match.image_similarity_score !== null ? `${(match.image_similarity_score * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getBarColor(match.image_similarity_score || 0)}`}
                      style={{ width: `${match.image_similarity_score !== null ? Math.min(100, match.image_similarity_score * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Location Score */}
                <div>
                  <div className="flex justify-between items-center text-slate-400 mb-1">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="h-3 w-3 text-emerald-400" /> Location
                    </span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {(match.location_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getBarColor(match.location_score)}`}
                      style={{ width: `${Math.min(100, match.location_score * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Time Score */}
                <div>
                  <div className="flex justify-between items-center text-slate-400 mb-1">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-amber-400" /> Time Decay
                    </span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {(match.time_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getBarColor(match.time_score)}`}
                      style={{ width: `${Math.min(100, match.time_score * 100)}%` }}
                    />
                  </div>
                </div>

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
