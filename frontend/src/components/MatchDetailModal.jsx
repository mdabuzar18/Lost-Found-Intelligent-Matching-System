import React from 'react';
import { X, Sparkles, MapPin, Clock, FileText, Image as ImageIcon, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export default function MatchDetailModal({ match, onClose, onConfirm, onReject }) {
  if (!match) return null;

  const lost = match.lost_report;
  const found = match.found_report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Match Candidate #{match.id} Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Confidence Score: <strong className="text-emerald-400">{match.final_confidence_score}%</strong> (Status: {match.status})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs sm:text-sm">
          
          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Lost Report */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  LOST REPORT #{lost.id}
                </span>
                <span className="text-xs text-slate-400">by {lost.reported_by_name}</span>
              </div>

              {lost.image ? (
                <div className="h-44 rounded-lg overflow-hidden bg-black border border-slate-700">
                  <img src={lost.image} alt={lost.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-44 rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                  <span>No photo attached</span>
                </div>
              )}

              <div>
                <h4 className="font-bold text-white text-sm">{lost.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  {lost.description}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  <span>{lost.location_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{new Date(lost.event_datetime).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Found Report */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FOUND REPORT #{found.id}
                </span>
                <span className="text-xs text-slate-400">by {found.reported_by_name}</span>
              </div>

              {found.image ? (
                <div className="h-44 rounded-lg overflow-hidden bg-black border border-slate-700">
                  <img src={found.image} alt={found.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-44 rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                  <span>No photo attached</span>
                </div>
              )}

              <div>
                <h4 className="font-bold text-white text-sm">{found.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  {found.description}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{found.location_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{new Date(found.event_datetime).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Mathematical Multi-Modal Breakdown */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <h5 className="font-semibold text-white text-xs uppercase tracking-wider">
              Mathematical Score Breakdown Formula
            </h5>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Sentence-BERT (35%)</div>
                <div className="text-base font-bold text-sky-400 font-mono">
                  {(match.text_similarity_score * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Cosine distance</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">CLIP Visual (35%)</div>
                <div className="text-base font-bold text-purple-400 font-mono">
                  {match.image_similarity_score !== null ? `${(match.image_similarity_score * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Vector dot product</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Location Proximity (15%)</div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {(match.location_score * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Haversine / token decay</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Temporal Decay (15%)</div>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {(match.time_score * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">max(0, 1 - days/14)</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 font-mono">
              Final Confidence = round((0.35 × {match.text_similarity_score.toFixed(3)} + 0.35 × {(match.image_similarity_score || 0).toFixed(3)} + 0.15 × {match.location_score.toFixed(3)} + 0.15 × {match.time_score.toFixed(3)}) × 100) = <span className="text-emerald-400 font-bold">{match.final_confidence_score}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Close
            </button>

            {match.status === 'SUGGESTED' && (
              <>
                <button
                  onClick={() => { onReject(match.id); onClose(); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject Match</span>
                </button>

                <button
                  onClick={() => { onConfirm(match.id); onClose(); }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm Match</span>
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
