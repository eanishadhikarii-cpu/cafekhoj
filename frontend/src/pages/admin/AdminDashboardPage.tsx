import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Upload, FileText, CheckCircle2, XCircle, AlertCircle,
  Eye, Users, Coffee, MessageSquare, Flag, Loader2, ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BusinessClaim } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'import' | 'claims' | 'reports'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // CSV Import State
  const [csvText, setCsvText] = useState(
    'name,address,city,district,latitude,longitude,price_range,phone,tagline,description\n' +
    'Sunset Coffee Bar,Mukti Chowk,Birtamode,Jhapa,26.6340,87.9860,moderate,+977-23-549999,Sunset views,Cozy sunset hangout\n'
  );
  const [dryRun, setDryRun] = useState(true);
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/login?redirect=/admin');
      return;
    }

    const loadAdminData = async () => {
      try {
        setIsLoading(true);
        const [dashStats, claimsRes, reportsRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getUserClaims(),
          api.getAdminReports(),
        ]);
        setStats(dashStats);
        setClaims(claimsRes.results || claimsRes);
        setReports(reportsRes.results || reportsRes);
      } catch (err) {
        console.error('Admin loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, [user, isAdmin]);

  const handleClaimDecision = async (claimId: number, decision: 'approve' | 'reject') => {
    const adminNotes = window.prompt(`Enter notes for ${decision} action:`, 'Verified against PAN/business registration');
    if (adminNotes === null) return;
    try {
      await api.reviewAdminClaim(claimId, decision, adminNotes, decision === 'reject' ? adminNotes : '');
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      alert(`Claim successfully ${decision}d.`);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleResolveReport = async (reportId: number, newStatus: string) => {
    try {
      await api.resolveAdminReport(reportId, newStatus);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      alert(`Report marked as ${newStatus}.`);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleRunCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsImporting(true);
      setImportResult(null);
      const res = await api.importCafesCSVText(csvText, dryRun);
      setImportResult(res);
      if (!dryRun) {
        const freshStats = await api.getAdminDashboard();
        setStats(freshStats);
      }
    } catch (err: any) {
      alert(err.message || 'Import error.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sage-100 text-sage-600 border border-sage-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Panel</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso mt-1">Platform Operations</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-latte/60 pb-1">
        {[
          { id: 'overview', label: 'System Overview' },
          { id: 'claims', label: `Pending Claims (${claims.filter(c => c.status === 'pending').length})` },
          { id: 'reports', label: `User Reports (${reports.filter(r => r.status === 'pending').length})` },
          { id: 'import', label: 'CSV Bulk Import & Dry-Run' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-espresso text-cream shadow-warm'
                : 'text-subtext hover:text-espresso hover:bg-cream-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm">
              <span className="text-[11px] font-bold uppercase text-subtext">Total Cafes</span>
              <p className="font-serif text-2xl font-bold text-espresso mt-1">{stats?.total_cafes || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm">
              <span className="text-[11px] font-bold uppercase text-subtext">Verified Cafes</span>
              <p className="font-serif text-2xl font-bold text-sage-600 mt-1">{stats?.verified_cafes || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm">
              <span className="text-[11px] font-bold uppercase text-subtext">Total Users</span>
              <p className="font-serif text-2xl font-bold text-espresso mt-1">{stats?.total_users || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm">
              <span className="text-[11px] font-bold uppercase text-subtext">Published Reviews</span>
              <p className="font-serif text-2xl font-bold text-espresso mt-1">{stats?.published_reviews || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm">
              <span className="text-[11px] font-bold uppercase text-subtext">Pending Claims</span>
              <p className="font-serif text-2xl font-bold text-amber-600 mt-1">{stats?.pending_claims || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm">
              <span className="text-[11px] font-bold uppercase text-subtext">Reported Reviews</span>
              <p className="font-serif text-2xl font-bold text-rose-600 mt-1">{stats?.reported_reviews || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Claims Review */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
          <h2 className="font-serif text-xl font-bold text-espresso">Business Ownership Claims</h2>
          {claims.length === 0 ? (
            <p className="text-xs text-subtext py-6 text-center">No pending claims.</p>
          ) : (
            <div className="divide-y divide-latte/50">
              {claims.map((claim) => (
                <div key={claim.id} className="py-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <p className="font-serif text-base font-bold text-espresso">{claim.cafe_name}</p>
                    <p className="text-subtext">Claimant: <strong className="text-espresso">{claim.claimant_username}</strong> ({claim.business_role})</p>
                    <p className="text-subtext">Contact: {claim.contact_phone} • {claim.contact_email}</p>
                    <div className="mt-2 p-2.5 bg-cream-50 rounded-xl border border-latte text-espresso font-mono text-[11px]">
                      Proof: {claim.evidence_reference}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      type="button"
                      onClick={() => handleClaimDecision(claim.id, 'approve')}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-sage-600 text-white hover:bg-sage-700 shadow-warm"
                    >
                      Approve Claim
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClaimDecision(claim.id, 'reject')}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
          <h2 className="font-serif text-xl font-bold text-espresso">Reported Reviews Moderation</h2>
          {reports.length === 0 ? (
            <p className="text-xs text-subtext py-6 text-center">No reports filed.</p>
          ) : (
            <div className="divide-y divide-latte/50">
              {reports.map((rep) => (
                <div key={rep.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-espresso">Reason: {rep.reason}</p>
                    <p className="text-subtext">Status: {rep.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, 'action_taken')}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600 text-white"
                    >
                      Take Action
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-cream-200 text-espresso"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: CSV Bulk Import */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-espresso">CSV Bulk Import Tool</h2>
            <p className="text-xs text-subtext mt-1">
              Import verified cafe records with required header validation, coordinate range checks, duplicate detection, and dry-run safety.
            </p>
          </div>

          <form onSubmit={handleRunCSVImport} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-espresso mb-1">
                CSV Content (Header: name, address, city, district, latitude, longitude, price_range, phone, tagline, description)
              </label>
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full text-xs font-mono p-3.5 rounded-2xl border border-latte bg-cream-50 text-espresso focus:outline-none focus:border-caramel resize-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="dryRunCheck"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded text-caramel focus:ring-caramel"
              />
              <label htmlFor="dryRunCheck" className="font-bold text-espresso cursor-pointer">
                Dry Run Mode (validates rows and reports coordinate/duplicate errors without committing changes)
              </label>
            </div>

            <button
              type="submit"
              disabled={isImporting}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm flex items-center gap-2"
            >
              {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isImporting ? 'Processing...' : dryRun ? 'Run Validation Dry Run' : 'Execute Live Import'}</span>
            </button>
          </form>

          {/* Import Report */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-cream-50 border border-latte space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-espresso">{importResult.summary}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  importResult.dry_run ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {importResult.dry_run ? 'Dry Run Output' : 'Live Import Output'}
                </span>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-latte/40 text-rose-700">
                  <p className="font-bold">Errors Encountered:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {importResult.errors.map((err: any, i: number) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

