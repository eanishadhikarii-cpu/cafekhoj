import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, Navigation, Phone, Star, MessageSquare, Plus,
  CreditCard, Sparkles, CheckCircle2, ChevronRight, Edit3, Trash2,
  Loader2, Smartphone, Shield, AlertCircle, Clock, CheckCircle, Coffee
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StarRating } from '../../components/common/StarRating';
import { Cafe, Review, MenuItem, DeviceSession, BusinessClaim } from '../../types';

export const BusinessDashboardPage: React.FC = () => {
  const { user, isBusiness } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'reviews' | 'promotions' | 'devices' | 'claims'>('analytics');

  // New menu item modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemDiet, setNewItemDiet] = useState('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/business/dashboard');
      return;
    }

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [dashData, devData, claimsData] = await Promise.all([
          api.getBusinessDashboard().catch(() => null),
          api.getOperatorDevices().catch(() => []),
          api.getUserClaims().catch(() => []),
        ]);

        setDashboardData(dashData);
        setDevices(Array.isArray(devData) ? devData : (devData as any)?.results || []);
        setClaims(Array.isArray(claimsData) ? claimsData : (claimsData as any)?.results || []);

        if (dashData?.managed_cafes && dashData.managed_cafes.length > 0) {
          const firstCafe = dashData.managed_cafes[0];
          setSelectedCafe(firstCafe);
          const items = await api.getMenuItems(firstCafe.id).catch(() => []);
          setMenuItems(items);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const handleCafeSelect = async (cafe: Cafe) => {
    setSelectedCafe(cafe);
    try {
      const items = await api.getMenuItems(cafe.id);
      setMenuItems(items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafe) return;
    try {
      setIsSubmittingItem(true);
      const created = await api.createMenuItem({
        cafe: selectedCafe.id,
        name: newItemName.trim(),
        price: parseFloat(newItemPrice) || 0,
        currency: 'NPR',
        description: newItemDesc.trim(),
        dietary_labels: newItemDiet.trim(),
        availability_status: 'available',
        is_signature: false,
      });
      setMenuItems((prev) => [created, ...prev]);
      setShowAddItem(false);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDesc('');
      setNewItemDiet('');
    } catch (err: any) {
      alert(err.message || 'Failed to create menu item.');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(itemId);
      setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  const handleDeauthorizeDevice = async (deviceId: number) => {
    if (!window.confirm('Deauthorize this device? You will need to sign in again from an approved device.')) return;
    try {
      await api.deauthorizeDevice(deviceId);
      const updated = await api.getOperatorDevices();
      setDevices(Array.isArray(updated) ? updated : (updated as any)?.results || []);
      alert('Device deauthorized successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to deauthorize device.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-caramel" />
      </div>
    );
  }

  const managedCafes = dashboardData?.managed_cafes || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-caramel/10 text-caramel border border-caramel/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cafe Operator Portal</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso mt-1">Merchant Dashboard</h1>
          <p className="text-xs text-subtext">Manage your verified listing in Jhapa, menus, reviews, and security sessions.</p>
        </div>

        {/* Cafe Switcher & Action */}
        <div className="flex items-center gap-3">
          {managedCafes.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtext font-medium">Select Cafe:</span>
              <select
                value={selectedCafe?.id}
                onChange={(e) => {
                  const c = managedCafes.find((m: Cafe) => m.id === Number(e.target.value));
                  if (c) handleCafeSelect(c);
                }}
                className="px-3 py-1.5 rounded-xl border border-latte bg-white text-xs font-bold text-espresso focus:outline-none focus:border-caramel"
              >
                {managedCafes.map((c: Cafe) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <Link
            to="/business/claim"
            className="px-4 py-2 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register / Claim Cafe</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-latte shadow-warm space-y-1">
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-bold uppercase tracking-wider">Listing Views</span>
            <Eye className="w-4 h-4 text-caramel" />
          </div>
          <p className="font-serif text-3xl font-bold text-espresso">{dashboardData?.total_views || 0}</p>
          <p className="text-[10px] text-subtext">Measured unique visits</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-latte shadow-warm space-y-1">
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-bold uppercase tracking-wider">Direction Clicks</span>
            <Navigation className="w-4 h-4 text-sage-600" />
          </div>
          <p className="font-serif text-3xl font-bold text-espresso">{dashboardData?.total_direction_clicks || 0}</p>
          <p className="text-[10px] text-subtext">Navigations to venue</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-latte shadow-warm space-y-1">
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-bold uppercase tracking-wider">Contact Clicks</span>
            <Phone className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-serif text-3xl font-bold text-espresso">{dashboardData?.total_contact_clicks || 0}</p>
          <p className="text-[10px] text-subtext">Phone calls & inquiries</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-latte shadow-warm space-y-1">
          <div className="flex items-center justify-between text-subtext">
            <span className="text-xs font-bold uppercase tracking-wider">Average Rating</span>
            <Star className="w-4 h-4 text-caramel fill-caramel" />
          </div>
          <p className="font-serif text-3xl font-bold text-espresso">
            {dashboardData?.average_rating ? Number(dashboardData.average_rating).toFixed(1) : '5.0'}
          </p>
          <p className="text-[10px] text-subtext">{dashboardData?.total_reviews || 0} customer reviews</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-latte/60 pb-1 overflow-x-auto">
        {[
          { id: 'analytics', label: 'Listing Profile & Hours' },
          { id: 'menu', label: `Digital Menu (${menuItems.length})` },
          { id: 'reviews', label: `Reviews (${dashboardData?.recent_reviews?.length || 0})` },
          { id: 'promotions', label: 'Promotions & Deals' },
          { id: 'devices', label: `Authorized Devices (${devices.filter(d => d.is_active).length})` },
          { id: 'claims', label: `My Submissions (${claims.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-espresso text-cream shadow-warm'
                : 'text-subtext hover:text-espresso hover:bg-cream-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile & Hours */}
      {activeTab === 'analytics' && (
        selectedCafe ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso">{selectedCafe.name}</h2>
                <p className="text-xs text-subtext">{selectedCafe.address}, {selectedCafe.location?.city}</p>
              </div>
              <Link
                to={`/cafes/${selectedCafe.slug}`}
                className="px-4 py-2 rounded-full text-xs font-bold bg-cream-100 text-espresso hover:bg-latte-200 border border-latte"
              >
                Preview Public Page →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-latte/40">
              <div>
                <span className="font-bold text-subtext uppercase">Price Tier</span>
                <p className="font-semibold text-espresso capitalize mt-0.5">{selectedCafe.price_range}</p>
              </div>
              <div>
                <span className="font-bold text-subtext uppercase">Verification Status</span>
                <p className="font-semibold text-sage-600 capitalize mt-0.5">
                  {selectedCafe.verification_status || 'Verified Merchant'}
                </p>
              </div>
              <div>
                <span className="font-bold text-subtext uppercase">Contact Phone</span>
                <p className="font-semibold text-espresso mt-0.5">{selectedCafe.phone || 'Not set'}</p>
              </div>
              <div>
                <span className="font-bold text-subtext uppercase">Operating Coordinates</span>
                <p className="font-semibold text-espresso mt-0.5">{selectedCafe.latitude}, {selectedCafe.longitude}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-latte text-center space-y-3">
            <Coffee className="w-10 h-10 text-caramel mx-auto" />
            <h3 className="font-serif text-lg font-bold text-espresso">No Cafe Assigned Yet</h3>
            <p className="text-xs text-subtext max-w-sm mx-auto">
              You haven't claimed or registered a cafe listing yet. Claim your cafe or submit a new listing to start managing your digital presence.
            </p>
            <Link
              to="/business/claim"
              className="inline-block mt-2 px-5 py-2 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm"
            >
              Claim or Register a Cafe
            </Link>
          </div>
        )
      )}

      {/* Tab 2: Menu Editor */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl font-bold text-espresso">Manage Menu Items</h3>
              <p className="text-xs text-subtext">Prices are presented in Nepali Rupees (NPR) to customers</p>
            </div>
            {selectedCafe && (
              <button
                type="button"
                onClick={() => setShowAddItem(true)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Item</span>
              </button>
            )}
          </div>

          {showAddItem && (
            <form onSubmit={handleCreateMenuItem} className="bg-cream-100/80 p-5 rounded-3xl border border-latte space-y-4">
              <h4 className="font-serif text-sm font-bold text-espresso">New Menu Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso mb-1">Item Name</label>
                  <input required type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Spanish Iced Latte" className="w-full text-xs p-2.5 rounded-xl border border-latte bg-white text-espresso" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso mb-1">Price (NPR)</label>
                  <input required type="number" step="10" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} placeholder="e.g. 220" className="w-full text-xs p-2.5 rounded-xl border border-latte bg-white text-espresso" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-espresso mb-1">Description</label>
                <input type="text" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} placeholder="e.g. Double shot espresso with sweetened milk over ice" className="w-full text-xs p-2.5 rounded-xl border border-latte bg-white text-espresso" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddItem(false)} className="px-4 py-1.5 text-xs text-subtext">Cancel</button>
                <button type="submit" disabled={isSubmittingItem} className="px-5 py-1.5 rounded-full text-xs font-bold bg-caramel text-white">Save Item</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-latte shadow-warm flex justify-between items-center">
                <div>
                  <h4 className="font-serif text-sm font-bold text-espresso">{item.name}</h4>
                  <p className="text-xs text-subtext line-clamp-1">{item.description}</p>
                  <span className="text-xs font-bold text-caramel mt-1 inline-block">NPR {item.price}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMenuItem(item.id)}
                  className="p-2 text-subtext hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Reviews Stream */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-espresso">Customer Reviews & Feedback</h3>
          {dashboardData?.recent_reviews?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_reviews.map((rev: Review) => (
                <div key={rev.id} className="bg-white rounded-2xl p-5 border border-latte shadow-warm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-espresso">{rev.user.username}</span>
                    <StarRating rating={rev.rating} size="sm" showScore={false} />
                  </div>
                  <p className="text-xs text-subtext italic">"{rev.review_text}"</p>
                  {rev.business_response && (
                    <div className="p-2.5 rounded-xl bg-cream-100 text-xs italic text-espresso">
                      Your Reply: "{rev.business_response.response_text}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white rounded-2xl border border-latte text-center text-xs text-subtext">
              No customer reviews submitted yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Promotions */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl font-bold text-espresso">Special Offers & Promotions</h3>
              <p className="text-xs text-subtext">Promotions are transparently badged to maintain platform honesty</p>
            </div>
            <Link
              to="/business/promotions"
              className="px-4 py-2 rounded-full text-xs font-bold bg-caramel text-white hover:bg-caramel-600 shadow-warm"
            >
              Create Campaign
            </Link>
          </div>
          <p className="text-xs text-subtext">Manage live campaigns or configure sponsored slots from the promotions page.</p>
        </div>
      )}

      {/* Tab 5: Authorized Devices */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-espresso">Authorized Devices</h3>
              <p className="text-xs text-subtext">CafeKhoj operator security allows strictly <strong>1 active device session</strong> at a time.</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>1-Device Policy Active</span>
            </div>
          </div>

          <div className="divide-y divide-latte/50">
            {devices.map((dev) => (
              <div key={dev.id} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-caramel" />
                    <strong className="text-espresso font-serif text-sm">{dev.device_name}</strong>
                    {dev.is_current_device && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-caramel text-white">Current Browser</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dev.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {dev.is_active ? 'Active' : 'Deauthorized'}
                    </span>
                  </div>
                  <p className="text-subtext">IP: <code className="font-mono">{dev.ip_address || 'unknown'}</code> &bull; Last Active: {new Date(dev.last_active_at).toLocaleString()}</p>
                </div>

                {dev.is_active && (
                  <button
                    type="button"
                    onClick={() => handleDeauthorizeDevice(dev.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                  >
                    Deauthorize
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: My Submissions & Claims */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-latte shadow-warm space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-espresso">My Ownership Claims & Submissions</h3>
            <p className="text-xs text-subtext">Track the approval and verification progress of your submitted cafes.</p>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-8 text-xs text-subtext">
              No claims submitted yet. Use the <Link to="/business/claim" className="text-caramel font-bold hover:underline">Claim Cafe</Link> page to request access.
            </div>
          ) : (
            <div className="divide-y divide-latte/50">
              {claims.map((claim) => (
                <div key={claim.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-espresso font-serif text-sm">{claim.cafe_name}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        claim.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-subtext">Role: {claim.business_role} &bull; Submitted: {new Date(claim.created_at).toLocaleDateString()}</p>
                    {claim.admin_notes && (
                      <p className="text-espresso font-mono text-[11px] bg-cream-50 p-2 rounded-lg border border-latte">
                        Admin Note: {claim.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
