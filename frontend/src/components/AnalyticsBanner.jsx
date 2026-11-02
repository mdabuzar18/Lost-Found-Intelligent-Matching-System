import React from 'react';
import { Target, Zap, Clock, MapPin, Image as ImageIcon, FileText, CheckCircle2 } from 'lucide-react';

export default function AnalyticsBanner({ stats, onRematchAll, isRematching }) {
  if (!stats) return null;

  return (
    <div className="mb-8 space-y-4">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Reports</span>
            <Target className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.total_reports}</span>
            <span className="text-xs text-slate-400">
              ({stats.lost_reports} lost, {stats.found_reports} found)
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">AI Matches</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{stats.suggested_matches}</span>
            <span className="text-xs text-slate-400">suggested</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{stats.match_rate_percent}%</span>
            <span className="text-xs text-slate-400">recovered</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Claims</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">{stats.pending_claims}</span>
            <span className="text-xs text-slate-400">awaiting staff</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Batch Engine</span>
          <button
            onClick={onRematchAll}
            disabled={isRematching}
            className="w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Zap className={`h-3.5 w-3.5 ${isRematching ? 'animate-spin' : ''}`} />
            {isRematching ? 'Re-scoring...' : 'Re-run Matching'}
          </button>
        </div>

      </div>

      {/* Matching Pipeline Explainer Ribbon */}
      <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>4-Way Multi-Modal Fusion Active:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <FileText className="h-3.5 w-3.5 text-sky-400" />
            <span>Text: <strong className="text-slate-200">Sentence-BERT (35%)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
            <span>Vision: <strong className="text-slate-200">CLIP ViT-B-32 (35%)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>Location: <strong className="text-slate-200">Haversine Decay (15%)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Time: <strong className="text-slate-200">±14d Decay (15%)</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
