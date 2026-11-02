import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AnalyticsBanner from './components/AnalyticsBanner';
import MatchList from './components/MatchList';
import ReportsFeed from './components/ReportsFeed';
import ClaimsDesk from './components/ClaimsDesk';
import AuditTrail from './components/AuditTrail';
import AlgorithmSpecs from './components/AlgorithmSpecs';
import ReportModal from './components/ReportModal';
import MatchDetailModal from './components/MatchDetailModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [currentVenue, setCurrentVenue] = useState('airport');
  const [currentUserRole, setCurrentUserRole] = useState('staff');

  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [initialReportType, setInitialReportType] = useState('LOST');
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState(null);
  const [isRematching, setIsRematching] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    try {
      const [statsData, matchesData, reportsData, claimsData, auditData] = await Promise.all([
        api.getStats(),
        api.getMatches(),
        api.getReports(),
        api.getClaims(),
        api.getAuditLogs(),
      ]);

      setStats(statsData);
      setMatches(matchesData?.results || matchesData || []);
      setReports(reportsData?.results || reportsData || []);
      setClaims(claimsData?.results || claimsData || []);
      setAuditLogs(auditData?.results || auditData || []);
    } catch (err) {
      console.error("Error loading application data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenReportModal = (type = 'LOST') => {
    setInitialReportType(type);
    setIsReportModalOpen(true);
  };

  const handleReportCreated = async (newReport) => {
    await loadAllData();
    setActiveTab('matches');
  };

  const handleConfirmMatch = async (matchId) => {
    try {
      await api.confirmMatch(matchId, 1);
      await loadAllData();
    } catch (err) {
      alert(`Error confirming match: ${err.message}`);
    }
  };

  const handleRejectMatch = async (matchId) => {
    try {
      await api.rejectMatch(matchId, 1);
      await loadAllData();
    } catch (err) {
      alert(`Error rejecting match: ${err.message}`);
    }
  };

  const handleApproveClaim = async (claimId, notes) => {
    try {
      await api.approveClaim(claimId, 1, notes);
      await loadAllData();
    } catch (err) {
      alert(`Error approving claim: ${err.message}`);
    }
  };

  const handleRejectClaim = async (claimId, reason) => {
    try {
      await api.rejectClaim(claimId, 1, reason);
      await loadAllData();
    } catch (err) {
      alert(`Error rejecting claim: ${err.message}`);
    }
  };

  const handleTriggerMatch = async (reportId) => {
    try {
      await api.triggerMatch(reportId);
      await loadAllData();
      setActiveTab('matches');
    } catch (err) {
      alert(`Error triggering match: ${err.message}`);
    }
  };

  const handleRematchAll = async () => {
    setIsRematching(true);
    try {
      // Trigger match on each open report
      const openLost = reports.filter(r => r.report_type === 'LOST' && r.status === 'OPEN');
      for (const r of openLost) {
        await api.triggerMatch(r.id);
      }
      await loadAllData();
    } catch (err) {
      console.error("Error re-running batch matching:", err);
    } finally {
      setIsRematching(false);
    }
  };

  const handleCreateClaimForMatch = async (match) => {
    try {
      const claim = await api.createClaim({
        match_candidate: match.id,
        found_report: match.found_report.id,
        claimant: match.lost_report.reported_by,
        verification_notes: `Claim initiated for confirmed match #${match.id}. Verified owner of ${match.lost_report.title}.`
      });
      await loadAllData();
      setActiveTab('claims');
    } catch (err) {
      alert(`Error creating claim: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={handleOpenReportModal}
        currentVenue={currentVenue}
        setCurrentVenue={setCurrentVenue}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        matchCount={matches.filter(m => m.status === 'SUGGESTED').length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Analytics Banner */}
        <AnalyticsBanner
          stats={stats}
          onRematchAll={handleRematchAll}
          isRematching={isRematching}
        />

        {/* Tab Views */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Loading intelligent matching models and reports...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'matches' && (
              <MatchList
                matches={matches}
                onConfirm={handleConfirmMatch}
                onReject={handleRejectMatch}
                onSelectMatch={(m) => setSelectedMatchForDetail(m)}
                onCreateClaim={handleCreateClaimForMatch}
                currentUserRole={currentUserRole}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsFeed
                reports={reports}
                onSelectReport={(r) => {}}
                onTriggerMatch={handleTriggerMatch}
              />
            )}

            {activeTab === 'claims' && (
              <ClaimsDesk
                claims={claims}
                onApproveClaim={handleApproveClaim}
                onRejectClaim={handleRejectClaim}
                currentUserRole={currentUserRole}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrail auditLogs={auditLogs} />
            )}

            {activeTab === 'how-it-works' && (
              <AlgorithmSpecs />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialType={initialReportType}
        onReportCreated={handleReportCreated}
      />

      <MatchDetailModal
        match={selectedMatchForDetail}
        onClose={() => setSelectedMatchForDetail(null)}
        onConfirm={handleConfirmMatch}
        onReject={handleRejectMatch}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>Lost & Found Intelligent Matching System • Powered by Sentence-BERT, CLIP & pgvector</p>
      </footer>
    </div>
  );
}
