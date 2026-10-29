export type UserRole = 'customer' | 'operator' | 'business' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  operator_relationship?: 'owner' | 'manager' | 'staff' | null;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  is_email_verified: boolean;
  created_at: string;
}

export interface Location {
  id: number;
  country: string;
  province: string;
  district: string;
  city: string;
  neighbourhood?: string;
  latitude?: number;
  longitude?: number;
  cafe_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_name: string;
  image_url?: string;
  cafe_count?: number;
}

export interface Facility {
  id: number;
  name: string;
  slug: string;
  icon_name: string;
}

export interface OpeningHour {
  id: number;
  day_of_week: number;
  day_name: string;
  opens_at?: string;
  closes_at?: string;
  is_closed: boolean;
  special_note?: string;
}

export interface CafePhoto {
  id: number;
  image_url: string;
  caption?: string;
  alt_text?: string;
  attribution?: string;
  display_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface MenuItem {
  id: number;
  cafe: number;
  menu_category: number;
  name: string;
  description?: string;
  price: string | number;
  currency: string;
  image_url?: string;
  availability_status: 'available' | 'out_of_stock' | 'seasonal';
  dietary_labels?: string;
  is_signature: boolean;
}

export interface MenuCategory {
  id: number;
  cafe: number;
  name: string;
  display_order: number;
  items: MenuItem[];
}

export interface Cafe {
  id: number;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  address: string;
  location: Location;
  latitude: number | string;
  longitude: number | string;
  phone?: string;
  email?: string;
  website?: string;
  social_instagram?: string;
  social_facebook?: string;
  price_range: 'budget' | 'moderate' | 'premium';
  verification_status: 'unverified' | 'pending' | 'pending_verification' | 'verified' | 'verification_rejected' | 'temp_closed' | 'permanently_closed' | 'archived';
  publication_status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'suspended' | 'archived';
  cover_image_url?: string;
  average_rating: number | string;
  review_count: number;
  google_place_id?: string | null;
  google_rating?: number | string | null;
  google_user_ratings_total?: number | null;
  google_maps_url?: string;
  google_sync_status?: string;
  google_last_synced_at?: string | null;
  admin_notes?: string;
  rejection_reason?: string;
  is_sample_data: boolean;
  source?: string;
  last_verified_at?: string;
  categories: Category[];
  facilities: Facility[];
  photos?: CafePhoto[];
  opening_hours?: OpeningHour[];
  menu_categories?: MenuCategory[];
  is_favourited?: boolean;
  claimed_by_current_user?: boolean;
  distance_km?: number;
  related_cafes?: Cafe[];
  created_at: string;
}

export interface ReviewResponse {
  id: number;
  business_user: number;
  business_username: string;
  response_text: string;
  created_at: string;
}

export interface Review {
  id: number;
  cafe: number;
  cafe_name?: string;
  cafe_slug?: string;
  user: User;
  rating: number;
  review_text: string;
  visit_date?: string;
  moderation_status: 'pending' | 'published' | 'rejected' | 'flagged';
  helpful_count: number;
  business_response?: ReviewResponse;
  photos?: { id: number; image_url: string }[];
  created_at: string;
}

export interface BusinessClaim {
  id: number;
  cafe: number;
  cafe_name?: string;
  claimant: number;
  claimant_username?: string;
  business_role: string;
  contact_phone: string;
  contact_email: string;
  evidence_reference: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface DeviceSession {
  id: number;
  device_id: string;
  device_name: string;
  ip_address?: string;
  is_active: boolean;
  is_current_device?: boolean;
  authorized_at: string;
  last_active_at: string;
}

export interface DeviceAuthorizationRequest {
  id: number;
  username: string;
  user_email: string;
  device_id: string;
  device_name: string;
  ip_address?: string;
  user_agent?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_username?: string;
  reviewed_at?: string;
  admin_notes?: string;
  created_at: string;
}

export interface PlatformAdministrator {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  notification_type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  code: string;
  price: string | number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  is_active: boolean;
  display_order: number;
}

export interface Promotion {
  id: number;
  cafe: number;
  cafe_name?: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: 'draft' | 'pending_approval' | 'active' | 'expired' | 'rejected';
  is_sponsored: boolean;
  banner_url?: string;
  discount_percentage?: number;
  terms?: string;
  click_count: number;
  created_at: string;
}
