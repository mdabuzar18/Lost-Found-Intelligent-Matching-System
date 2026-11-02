import React from 'react';
import { History, Shield, CheckCircle, XCircle, FileText, Sparkles } from 'lucide-react';

export default function AuditTrail({ auditLogs }) {
  const getActionBadge = (action) => {
    switch (action) {
      case 'REPORT_CREATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">REPORT CREATED</span>;
      case 'MATCH_SUGGESTED':
      case 'MATCH_UPDATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">MATCH GENERATED</span>;
      case 'MATCH_CONFIRMED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">MATCH CONFIRMED</span>;
      case 'MATCH_REJECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">MATCH REJECTED</span>;
      case 'CLAIM_SUBMITTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">CLAIM FILED</span>;
      case 'CLAIM_APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">CLAIM APPROVED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-sky-400" />
          <span>Security & Trust Audit Log</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tamper-evident trail of matching decisions, custody verifications, and staff approvals
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">References</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                      {log.performed_by_name || 'System Auto-Engine'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {log.report_reference && <span>Report #{log.report_reference} </span>}
                      {log.match_reference && <span>Match #{log.match_reference} </span>}
                      {log.claim_reference && <span>Claim #{log.claim_reference} </span>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
