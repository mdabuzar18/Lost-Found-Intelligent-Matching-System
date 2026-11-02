import React from 'react';
import { Cpu, Layers, Database, Shield, Sliders, CheckCircle2 } from 'lucide-react';

export default function AlgorithmSpecs() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="h-6 w-6 text-sky-400" />
          <span>Intelligent Matching System Architecture & Specs</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Technical design breakdown for examiners, technical reviewers, and venue administrators
        </p>
      </div>

      {/* Problem Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <h3 className="font-bold text-rose-300 text-sm mb-2 flex items-center gap-2">
            <span>❌ Traditional Keyword Systems</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Relies on exact string search (e.g. SQL <code className="text-rose-300">LIKE '%black laptop bag%'</code>).
            Completely misses when descriptions diverge:
          </p>
          <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div>"black Samsonite laptop bag, small scratch near handle"</div>
            <div className="text-rose-400">vs</div>
            <div>"lost black computer case near gate 3"</div>
            <div className="text-rose-400 font-bold pt-1">Result: ZERO MATCHES (Keyword mismatch)</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <h3 className="font-bold text-emerald-300 text-sm mb-2 flex items-center gap-2">
            <span>✅ Our Intelligent Matching System</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Extracts deep dense vector embeddings in high-dimensional continuous semantic space, combined with spatial & temporal decay functions:
          </p>
          <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-sky-300">• Sentence-BERT (384-dim): 82% semantic cosine similarity</div>
            <div className="text-purple-300">• CLIP Visual (512-dim): 94% visual embedding cosine similarity</div>
            <div className="text-emerald-300">• Haversine Proximity: 100% (Distance &lt; 50m)</div>
            <div className="text-amber-300">• Time Decay: 99% (Event time delta 15 mins)</div>
            <div className="text-emerald-400 font-bold pt-1">Result: 91.2% MATCH CONFIDENCE CONFIRMED</div>
          </div>
        </div>
      </div>

      {/* The 4 Sub-Score Formulas */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="h-5 w-5 text-sky-400" />
          <span>The Four Sub-Score Mathematical Formulations</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400 text-sm">1. Text Semantic Similarity</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300">Weight: 35%</span>
            </div>
            <p className="text-slate-300">
              Generates normalized dense unit vectors u, v in R³⁸⁴ using Sentence-BERT (<code className="text-slate-200">all-MiniLM-L6-v2</code>):
            </p>
            <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-sky-300">
              Score = (u · v) / (||u||₂ × ||v||₂)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-400 text-sm">2. Image Visual Similarity</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">Weight: 35%</span>
            </div>
            <p className="text-slate-300">
              Generates normalized visual feature embeddings x, y in R⁵¹² using OpenAI CLIP (<code className="text-slate-200">clip-ViT-B-32</code>):
            </p>
            <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-purple-300">
              Score = max(0, (x · y) / (||x||₂ × ||y||₂))
            </div>
            <span className="text-[10px] text-slate-400 block">
              *Weight redistributes dynamically to 60% text / 20% loc / 20% time if photo is missing.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-sm">3. Location Proximity</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">Weight: 15%</span>
            </div>
            <p className="text-slate-300">
              Computes spherical great-circle distance d_km via Haversine formula with decaying threshold:
            </p>
            <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-emerald-300">
              Score = max(0, 1 - distance_km / 5.0)
            </div>
            <span className="text-[10px] text-slate-400 block">
              Includes token-based location name intersection for indoor venues without GPS.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-sm">4. Temporal Proximity</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">Weight: 15%</span>
            </div>
            <p className="text-slate-300">
              Computes absolute timestamp difference in days with configurable ±14 day window decay:
            </p>
            <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-amber-300">
              Score = max(0, 1 - days_apart / 14.0)
            </div>
          </div>


        </div>
      </div>

      {/* Database & Vector Storage Architecture */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-400" />
          <span>Storage & Vector Indexing Architecture</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The database schema is engineered for PostgreSQL with the <strong>pgvector</strong> extension.
          It indexes vector embeddings using <strong>HNSW (Hierarchical Navigable Small World)</strong> or <strong>IVFFlat</strong> graphs, enabling sub-millisecond approximate nearest-neighbor retrieval without needing an external vector database.
        </p>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
          <div>-- PostgreSQL with pgvector extension</div>
          <div>CREATE EXTENSION IF NOT EXISTS vector;</div>
          <div className="text-sky-300">-- HNSW Index for ultra-fast cosine similarity search</div>
          <div>CREATE INDEX ON matching_system_report USING hnsw (text_embedding vector_cosine_ops);</div>
          <div>CREATE INDEX ON matching_system_report USING hnsw (image_embedding vector_cosine_ops);</div>
        </div>
      </div>
    </div>
  );
}
