import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Upload, FileText, CheckCircle2, XCircle, AlertCircle,
  Eye, Users, Coffee, MessageSquare, Flag, Loader2, ArrowRight,
  Smartphone, Bell, Check, MapPin, Star, UserPlus, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BusinessClaim, DeviceAuthorizationRequest, AdminNotification,
  PlatformAdministrator, Cafe
} from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [deviceRequests, setDeviceRequests] = useState<DeviceAuthorizationRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [platformAdmins, setPlatformAdmins] = useState<PlatformAdministrator[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'cafes' | 'devices' | 'claims' | 'notifications' | 'administrators' | 'reports' | 'import'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Delegate Admin Form State
  const [delegateEmail, setDelegateEmail] = useState('');
  const [delegateName, setDelegateName] = useState('');
  const [delegateNotes, setDelegateNotes] = useState('');
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegateError, setDelegateError] = useState<string | null>(null);
  const [delegateSuccess, setDelegateSuccess] = useState<string | null>(null);

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
        const [dashStats, claimsRes, reportsRes, devRes, notifRes, adminRes, cafesRes] = await Promise.all([
          api.getAdminDashboard().catch(() => null),
          api.getUserClaims().catch(() => []),
          api.getAdminReports().catch(() => []),
          api.getAdminDeviceRequests().catch(() => []),
          api.getAdminNotifications().catch(() => []),
          api.getPlatformAdministrators().catch(() => []),
          api.getAdminCafes().catch(() => []),
        ]);
        const toArray = (res: any) => (Array.isArray(res) ? res : res?.results || []);
        setStats(dashStats);
        setClaims(toArray(claimsRes));
        setReports(toArray(reportsRes));
        setDeviceRequests(toArray(devRes));
        setNotifications(toArray(notifRes));
        setPlatformAdmins(toArray(adminRes));
        setCafes(toArray(cafesRes));
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

  const handleDeviceDecision = async (requestId: number, decision: 'approve' | 'reject') => {
    const adminNotes = window.prompt(`Enter verification notes for ${decision}:`, 'Verified operator identity via phone call');
    if (adminNotes === null) return;
    try {
      await api.reviewAdminDeviceRequest(requestId, decision, adminNotes);
      setDeviceRequests((prev) => prev.filter((r) => r.id !== requestId));
      alert(`Device authorization ${decision}d successfully.`);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleCafeModeration = async (cafeId: number, action: string) => {
    try {
      await api.reviewAdminCafe(cafeId, action);
      alert(`Cafe status updated.`);
      const updated = await api.getAdminCafes();
      setCafes(updated.results || updated);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleGoogleSync = async (cafe: Cafe) => {
    const placeId = window.prompt(`Enter Google Place ID for ${cafe.name} (leave empty to keep existing):`, cafe.google_place_id || '');
    if (placeId === null) return;
    try {
      const res = await api.syncAdminCafeGoogle(cafe.id, placeId.trim() || undefined);
      alert(res.success ? 'Google Places synchronized successfully!' : 'Google Places synchronization recorded status: ' + res.google_sync_status);
      const updated = await api.getAdminCafes();
      setCafes(updated.results || updated);
    } catch (err: any) {
      alert(err.message || 'Failed to sync Google Places.');
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markAdminNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelegateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (platformAdmins.length >= 2) {
      setDelegateError('Maximum limit of 2 platform administrators reached.');
      return;
    }
    try {
      setIsDelegating(true);
      setDelegateError(null);
      setDelegateSuccess(null);
      await api.delegatePlatformAdministrator({
        email: delegateEmail.trim().toLowerCase(),
        full_name: delegateName.trim(),
        notes: delegateNotes.trim(),
      });
      setDelegateSuccess(`Administrator successfully delegated. Count is now 2/2.`);
      setDelegateEmail('');
      setDelegateName('');
      setDelegateNotes('');
      const updated = await api.getPlatformAdministrators();
      setPlatformAdmins(Array.isArray(updated) ? updated : (updated as any)?.results || []);
    } catch (err: any) {
      setDelegateError(err.message || 'Delegation failed.');
    } finally {
      setIsDelegating(false);
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

  const pendingDevices = deviceRequests.filter((d) => d.status === 'pending');
  const pendingClaimsCount = claims.filter((c) => c.status === 'pending').length;
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

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
          <p className="text-xs text-subtext">Jhapa, Nepal &bull; Real Database Controls</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-latte text-xs font-semibold text-espresso flex items-center gap-2">
            <Users className="w-4 h-4 text-caramel" />
            <span>Admins: <strong>{platformAdmins.length}/2</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-latte/60 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'cafes', label: `Cafes (${cafes.length})` },
          { id: 'devices', label: `Device Authorizations (${pendingDevices.length})` },
          { id: 'claims', label: `Claims (${pendingClaimsCount})` },
          { id: 'notifications', label: `Alerts (${unreadNotifs})` },
          { id: 'administrators', label: `Administrators (${platformAdmins.length}/2)` },
          { id: 'reports', label: `Reports (${reports.filter((r) => r.status === 'pending').length})` },
          { id: 'import', label: 'CSV Bulk Import' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
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
              <span className="text-[11px] font-bold uppercase text-subtext">Published Cafes</span>
              <p className="font-serif text-2xl font-bold text-emerald-600 mt-1">{stats?.published_cafes || 0}</p>
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
              <span className="text-[11px] font-bold uppercase text-subtext">Pending Devices</span>
              <p className="font-serif text-2xl font-bold text-amber-600 mt-1">{pendingDevices.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-latte shadow-warm">
              <span className="text-[11px] font-bold uppercase text-subtext">Unread Alerts</span>
              <p className="font-serif text-2xl font-bold text-rose-600 mt-1">{unreadNotifs}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cafes Moderation & Google Places */}
      {activeTab === 'cafes' && (
        <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-espresso">Cafe Directory Moderation</h2>
            <span className="text-xs text-subtext">{cafes.length} total registered cafes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-cream-100 text-espresso font-bold uppercase border-b border-latte">
                <tr>
                  <th className="p-3">Cafe Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Publication</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Google Places</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-latte/50">
                {cafes.map((cafe) => (
                  <tr key={cafe.id} className="hover:bg-cream-50/50">
                    <td className="p-3 font-bold text-espresso">
                      <div>{cafe.name}</div>
                      <div className="text-[10px] text-subtext font-mono font-normal">slug: {cafe.slug}</div>
                    </td>
                    <td className="p-3 text-subtext">{cafe.address}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        cafe.publication_status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                        cafe.publication_status === 'pending_review' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {cafe.publication_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        cafe.verification_status === 'verified' ? 'bg-sage-100 text-sage-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {cafe.verification_status}
                      </span>
                    </td>
                    <td className="p-3 text-subtext">
                      {cafe.google_rating ? (
                        <div className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{cafe.google_rating} ({cafe.google_user_ratings_total || 0})</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-subtext italic">Rating unavailable</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      {cafe.publication_status !== 'published' && (
                        <button
                          onClick={() => handleCafeModeration(cafe.id, 'publish')}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Publish
                        </button>
                      )}
                      {cafe.publication_status === 'published' && (
                        <button
                          onClick={() => handleCafeModeration(cafe.id, 'suspend')}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300"
                        >
                          Suspend
                        </button>
                      )}
                      {cafe.verification_status !== 'verified' && (
                        <button
                          onClick={() => handleCafeModeration(cafe.id, 'verify')}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sage-600 text-white hover:bg-sage-700"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleGoogleSync(cafe)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cream-200 text-espresso hover:bg-latte-200 inline-flex items-center gap-1"
                        title="Sync with Google Places API"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Google Sync</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Operator Device Authorizations */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-espresso">Operator Device Authorizations</h2>
              <p className="text-xs text-subtext">Operators are restricted to 1 active device session. Review secondary device requests.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {pendingDevices.length} Pending
            </span>
          </div>

          {deviceRequests.length === 0 ? (
            <p className="text-xs text-subtext py-8 text-center">No operator device authorization requests recorded.</p>
          ) : (
            <div className="divide-y divide-latte/50">
              {deviceRequests.map((req) => (
                <div key={req.id} className="py-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-caramel" />
                      <strong className="text-espresso font-serif text-sm">{req.device_name}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-subtext">Operator: <strong>{req.username}</strong> ({req.user_email})</p>
                    <p className="text-subtext">IP: <code className="font-mono">{req.ip_address || 'unknown'}</code> &bull; Requested: {new Date(req.created_at).toLocaleString()}</p>
                    {req.admin_notes && (
                      <p className="text-espresso font-mono text-[11px] bg-cream-50 p-2 rounded-lg border border-latte mt-1">
                        Admin Note: {req.admin_notes}
                      </p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <button
                        onClick={() => handleDeviceDecision(req.id, 'approve')}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-warm"
                      >
                        Authorize Device
                      </button>
                      <button
                        onClick={() => handleDeviceDecision(req.id, 'reject')}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Business Claims */}
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
                    <p className="text-subtext">Contact: {claim.contact_phone} &bull; {claim.contact_email}</p>
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

      {/* Tab 5: Notifications Center */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-espresso">Admin Notification Center</h2>
            <button
              onClick={() => api.markAllAdminNotificationsRead().then(() => setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))))}
              className="text-xs font-bold text-caramel hover:underline"
            >
              Mark All Read
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-subtext py-6 text-center">No alerts at this time.</p>
          ) : (
            <div className="divide-y divide-latte/50">
              {notifications.map((notif) => (
                <div key={notif.id} className={`py-3.5 flex items-start justify-between gap-4 ${!notif.is_read ? 'bg-amber-50/50 -mx-3 px-3 rounded-xl' : ''}`}>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-3.5 h-3.5 ${notif.severity === 'warning' ? 'text-amber-600' : 'text-caramel'}`} />
                      <strong className="text-espresso">{notif.title}</strong>
                      <span className="text-[10px] text-subtext">{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-subtext">{notif.message}</p>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      className="text-xs text-subtext hover:text-espresso p-1"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Platform Administrators & 2-Admin Limit */}
      {activeTab === 'administrators' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Administrators List */}
          <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso">Platform Administrators</h2>
                <p className="text-xs text-subtext">CafeKhoj security policy strictly enforces a maximum of 2 administrators.</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                platformAdmins.length >= 2 ? 'bg-rose-100 text-rose-800' : 'bg-sage-100 text-sage-800'
              }`}>
                {platformAdmins.length}/2 Assigned
              </span>
            </div>

            <div className="divide-y divide-latte/50">
              {platformAdmins.map((adm) => (
                <div key={adm.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-espresso font-serif">{adm.first_name || adm.username} {adm.last_name}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.is_primary ? 'bg-caramel text-white' : 'bg-cream-200 text-espresso'
                      }`}>
                        {adm.is_primary ? 'Primary Project Owner' : 'Secondary Administrator'}
                      </span>
                    </div>
                    <div className="text-subtext mt-0.5">{adm.email}</div>
                    {adm.notes && <div className="text-[10px] text-subtext italic mt-0.5">{adm.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delegate Second Administrator Form */}
          <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
            <h2 className="font-serif text-xl font-bold text-espresso">Provision Second Administrator</h2>
            <p className="text-xs text-subtext">
              Designate a trusted secondary team member. Cannot exceed 2 total platform administrator accounts.
            </p>

            {delegateError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{delegateError}</span>
              </div>
            )}

            {delegateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{delegateSuccess}</span>
              </div>
            )}

            {platformAdmins.length >= 2 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <strong>Capacity Reached (2/2):</strong>
                <p>The maximum limit of 2 platform administrators is currently filled. To delegate to a different person, revoke an administrator first.</p>
              </div>
            ) : (
              <form onSubmit={handleDelegateAdmin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={delegateEmail}
                    onChange={(e) => setDelegateEmail(e.target.value)}
                    placeholder="second_admin@cafekhoj.np"
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Full Name</label>
                  <input
                    type="text"
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    placeholder="Operations Lead"
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">Assignment Notes</label>
                  <input
                    type="text"
                    value={delegateNotes}
                    onChange={(e) => setDelegateNotes(e.target.value)}
                    placeholder="Co-founder / Operations Lead"
                    className="w-full text-xs p-3 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDelegating}
                  className="w-full py-2.5 rounded-full text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 transition-colors shadow-warm flex items-center justify-center gap-2"
                >
                  {isDelegating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isDelegating ? 'Delegating...' : 'Designate 2nd Administrator'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-4">
          <h2 className="font-serif text-xl font-bold text-espresso">Content Moderation Reports</h2>
          {reports.length === 0 ? (
            <p className="text-xs text-subtext py-6 text-center">No community reports.</p>
          ) : (
            <div className="divide-y divide-latte/50">
              {reports.map((rep) => (
                <div key={rep.id} className="py-4 flex justify-between items-center text-xs">
                  <div>
                    <strong>{rep.reason}</strong>
                    <p className="text-subtext">{rep.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: CSV Bulk Import */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-3xl p-6 border border-latte shadow-warm space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-espresso">CSV Bulk Import & Verification</h2>
            <p className="text-xs text-subtext">Upload Jhapa cafe data with automated duplicate detection and schema validation.</p>
          </div>

          <form onSubmit={handleRunCSVImport} className="space-y-4">
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full font-mono text-xs p-4 rounded-2xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
            />

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded border-latte text-caramel focus:ring-caramel accent-caramel"
                />
                <span>Dry Run (Validate schema & duplicates without saving to database)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isImporting}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 transition-colors shadow-warm flex items-center gap-2"
            >
              {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isImporting ? 'Processing...' : dryRun ? 'Run Verification Dry-Run' : 'Execute Production Import'}</span>
            </button>
          </form>

          {importResult && (
            <div className="p-4 rounded-2xl bg-cream-100 border border-latte font-mono text-xs space-y-2">
              <div className="font-bold text-espresso">Import Results:</div>
              <pre className="whitespace-pre-wrap text-[11px] text-espresso-700">
                {JSON.stringify(importResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
