import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileCheck, UserCheck, AlertTriangle } from 'lucide-react';

export default function ClaimsDesk({ claims, onApproveClaim, onRejectClaim, currentUserRole }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openActionModal = (claim, type) => {
    setSelectedClaim(claim);
    setActionType(type);
    setResolutionNotes(type === 'approve' 
      ? 'Identity checked with government photo ID. Ownership validated against item serial number / purchase receipt.'
      : 'Claimant unable to provide matching passcode or serial number.'
    );
    setIsModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedClaim) return;
    if (actionType === 'approve') {
      onApproveClaim(selectedClaim.id, resolutionNotes);
    } else {
      onRejectClaim(selectedClaim.id, resolutionNotes);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-400" />
            <span>Staff Verification & Claims Desk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-logged custody verification pipeline for returning matched items to rightful owners
          </p>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-16 px-4 glass-panel rounded-2xl border border-slate-800">
          <FileCheck className="h-10 w-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No active claims filed</h3>
          <p className="text-xs text-slate-500 mt-1">
            When a match candidate is confirmed, a verification claim can be submitted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-white">Claim #{claim.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    claim.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    claim.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                  }`}>
                    {claim.status}
                  </span>
                </div>

                <span className="text-xs text-slate-400">
                  Filed: {new Date(claim.created_at).toLocaleString()}
                </span>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Claimant Details */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Claimant (Owner)
                  </span>
                  <div className="font-bold text-slate-100 text-sm">{claim.claimant_detail?.name}</div>
                  <div className="text-slate-400">{claim.claimant_detail?.email}</div>
                  <div className="text-slate-400">{claim.claimant_detail?.phone}</div>
                </div>

                {/* Associated Item */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Item in Custody (Found Report #{claim.found_report})
                  </span>
                  <div className="font-bold text-slate-100 text-sm truncate">
                    {claim.found_report_detail?.title}
                  </div>
                  <div className="text-slate-400">
                    Category: <strong className="text-slate-300">{claim.found_report_detail?.category}</strong>
                  </div>
                  <div className="text-slate-400 truncate">
                    Location: {claim.found_report_detail?.location_name}
                  </div>
                </div>

                {/* Verification Proof & Notes */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Verification Notes & Proof
                  </span>
                  <p className="text-slate-300 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {claim.verification_notes}
                  </p>
                </div>
              </div>

              {/* Action Buttons for Staff */}
              {claim.status === 'PENDING' && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openActionModal(claim, 'reject')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject Claim</span>
                  </button>

                  <button
                    onClick={() => openActionModal(claim, 'approve')}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verify & Approve Handover</span>
                  </button>
                </div>
              )}

              {claim.status === 'APPROVED' && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Item released and marked as CLAIMED. Chain of custody completed.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Staff Verification Modal */}
      {isModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span>Approve Claim & Release Item</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                  <span>Reject Verification Claim</span>
                </>
              )}
            </h3>

            <p className="text-xs text-slate-400">
              {actionType === 'approve'
                ? "This action marks both reports as CLAIMED, releases the item from venue custody, and logs a tamper-evident audit record."
                : "Specify the reason for rejection (e.g. proof mismatch, false claimant). This will be recorded in the audit log."
              }
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Staff Verification Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {actionType === 'approve' ? 'Confirm Approval & Handover' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
