// ============================================================================
// ENTERPRISE TYPE DEFINITIONS - HUME DATING APP
// ============================================================================
// Central type definitions for scalable, type-safe development
// Follows enterprise patterns for maintainability and developer experience
// ============================================================================

// ================================
// CORE ENTITY TYPES
// ================================

export interface User {
  id: string;
  email: string;
  username?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  subscription: SubscriptionPlan;
  verification: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName?: string;
  dateOfBirth: string;
  gender: Gender;
  location: Location;
  bio?: string;
  photos: ProfilePhoto[];
  interests: Interest[];
  occupation?: string;
  education?: string;
  height?: number;
  smoking?: SmokingStatus;
  drinking?: DrinkingStatus;
  children?: ChildrenStatus;
  religion?: string;
  
  // Islamic Specific Fields
  islamicPreferences?: IslamicPreferences;
}

export interface UserPreferences {
  ageRange: AgeRange;
  maxDistance: number;
  genderPreference: Gender[];
  showMe: ShowMePreference;
  dealBreakers: DealBreaker[];
}

// ================================
// MATCHING & DISCOVERY TYPES
// ================================

export interface Match {
  id: string;
  users: [string, string]; // User IDs
  matchedAt: string;
  chatId?: string;
  isActive: boolean;
  compatibility: CompatibilityScore;
}

export interface CompatibilityScore {
  overall: number; // 0-100
  breakdown: {
    interests: number;
    lifestyle: number;
    values: number;
    preferences: number;
  };
}

export interface SwipeAction {
  userId: string;
  targetUserId: string;
  action: SwipeType;
  timestamp: string;
  location?: Location;
}

// ================================
// CHAT & MESSAGING TYPES
// ================================

export interface ChatRoom {
  id: string;
  matchId: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: MessageContent;
  type: MessageType;
  timestamp: string;
  readBy: MessageRead[];
  edited?: boolean;
  editedAt?: string;
}

export interface MessageContent {
  text?: string;
  image?: MediaFile;
  gif?: GifData;
  sticker?: StickerData;
}

// ================================
// AUTHENTICATION & SECURITY TYPES
// ================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface AuthUser {
  id: string;
  email: string;
  isEmailVerified: boolean;
  phoneNumber?: string;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  roles: UserRole[];
}

export interface VerificationStatus {
  email: boolean;
  phone: boolean;
  identity: IdentityVerification;
  photos: PhotoVerification;
}

// ================================
// PAYMENT & SUBSCRIPTION TYPES
// ================================

export interface SubscriptionPlan {
  id: string;
  type: SubscriptionType;
  features: PremiumFeature[];
  expiresAt?: string;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  isDefault: boolean;
}

// ================================
// LOCATION & GEOSPATIAL TYPES
// ================================

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  accuracy?: number;
}

export interface LocationUpdate {
  userId: string;
  location: Location;
  timestamp: string;
}

// ================================
// API & NETWORK TYPES
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ================================
// FORM & VALIDATION TYPES
// ================================

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Record<keyof T, string | undefined>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

// ================================
// NOTIFICATION & PUSH TYPES
// ================================

export interface PushNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sent: boolean;
  sentAt?: string;
  readAt?: string;
}

// ================================
// ISLAMIC MARRIAGE TYPES
// ================================

export type MarriageType = 'first' | 'second' | 'third' | 'fourth';
export type MarriageIntention = 'monogamous' | 'polygamous' | 'accepting_polygamy';
export type ReligionLevel = 'practicing' | 'moderate' | 'cultural' | 'learning';
export type MadhahSchool = 'hanafi' | 'maliki' | 'shafii' | 'hanbali' | 'jafari' | 'other' | 'prefer_not_to_say';
export type PrayerFrequency = 'five_times' | 'sometimes' | 'friday_only' | 'rarely' | 'learning';
export type HijabPreference = 'always' | 'sometimes' | 'special_occasions' | 'personal_choice' | 'no_preference';

export interface IslamicPreferences {
  // Marriage Intentions
  marriageIntention: MarriageIntention;
  seekingMarriageType?: MarriageType[]; // For women: which marriage positions they'd accept
  currentWives?: number; // For men: how many wives they currently have (0-3)
  maxWives?: number; // For men: maximum number of wives they want (1-4)
  
  // Religious Practice
  religionLevel: ReligionLevel;
  madhahSchool?: MadhahSchool;
  prayerFrequency: PrayerFrequency;
  quranReading: boolean;
  islamicEducation: boolean;
  
  // Lifestyle Preferences
  hijabPreference?: HijabPreference; // Relevant for both genders
  halaalDiet: boolean;
  smoking: boolean;
  wantsChildren: boolean;
  hasChildren: boolean;
  numberOfChildren?: number;
  
  // Family Structure Preferences
  acceptsPolygamy: boolean; // For women: willing to be in polygamous marriage
  wantsPolygamy?: boolean; // For men: interested in plural marriage
  familyLivingArrangement: 'separate_homes' | 'same_home_separate_quarters' | 'shared_home' | 'flexible';
  
  // Cultural Background
  ethnicBackground?: string[];
  languagesSpoken: string[];
  countryOfOrigin?: string;
  currentCountry: string;
}

// ================================
// ENUM TYPES
// ================================

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum SwipeType {
  LIKE = 'like',
  PASS = 'pass',
  SUPER_LIKE = 'super_like',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  GIF = 'gif',
  STICKER = 'sticker',
  SYSTEM = 'system',
}

export enum SubscriptionType {
  FREE = 'free',
  PREMIUM = 'premium',
  PLATINUM = 'platinum',
}

export enum NotificationType {
  NEW_MATCH = 'new_match',
  NEW_MESSAGE = 'new_message',
  PROFILE_VISIT = 'profile_visit',
  SUPER_LIKE = 'super_like',
  SYSTEM = 'system',
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  GOOGLE_PAY = 'google_pay',
  APPLE_PAY = 'apple_pay',
  PAYPAL = 'paypal',
}

// ================================
// UTILITY TYPES
// ================================

export type AgeRange = [number, number]; // [min, max]
export type ShowMePreference = 'men' | 'women' | 'everyone';
export type SmokingStatus = 'never' | 'socially' | 'regularly' | 'prefer_not_to_say';
export type DrinkingStatus = 'never' | 'socially' | 'regularly' | 'prefer_not_to_say';
export type ChildrenStatus = 'none' | 'have_children' | 'want_children' | 'prefer_not_to_say';

export interface Interest {
  id: string;
  name: string;
  category: string;
  emoji?: string;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  isVerified: boolean;
  uploadedAt: string;
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface GifData {
  id: string;
  url: string;
  thumbnailUrl: string;
  title?: string;
}

export interface StickerData {
  id: string;
  url: string;
  packId: string;
  name: string;
}

export interface MessageRead {
  userId: string;
  readAt: string;
}

export interface IdentityVerification {
  status: 'pending' | 'verified' | 'rejected';
  submittedAt?: string;
  verifiedAt?: string;
  documents: VerificationDocument[];
}

export interface PhotoVerification {
  status: 'pending' | 'verified' | 'rejected';
  submittedAt?: string;
  verifiedAt?: string;
  photos: string[]; // Photo IDs
}

export interface VerificationDocument {
  id: string;
  type: 'government_id' | 'passport' | 'drivers_license';
  url: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface DealBreaker {
  type: 'smoking' | 'drinking' | 'children' | 'distance' | 'age';
  value: any;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

// ================================
// COMPONENT PROPS TYPES
// ================================

export interface BaseComponentProps {
  testID?: string;
  style?: any;
  children?: React.ReactNode;
}

export interface NavigationProps {
  navigation: any; // TODO: Type properly with navigation types
  route: any;
}

// ================================
// STATE MANAGEMENT TYPES
// ================================

export interface AppState {
  auth: AuthState;
  user: UserState;
  matches: MatchState;
  chat: ChatState;
  discovery: DiscoveryState;
  notifications: NotificationState;
  ui: UIState;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
}

export interface UserState {
  profile: User | null;
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
}

export interface MatchState {
  matches: Match[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface ChatState {
  rooms: ChatRoom[];
  activeRoom: string | null;
  loading: boolean;
  error: string | null;
}

export interface DiscoveryState {
  candidates: User[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface NotificationState {
  notifications: PushNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  loading: Record<string, boolean>;
  modals: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// ================================
// API ENDPOINT TYPES
// ================================

export interface ApiEndpoints {
  // Authentication
  LOGIN: '/auth/login';
  REGISTER: '/auth/register';
  REFRESH: '/auth/refresh';
  LOGOUT: '/auth/logout';
  FORGOT_PASSWORD: '/auth/forgot-password';
  RESET_PASSWORD: '/auth/reset-password';
  
  // User Management
  PROFILE: '/users/profile';
  UPDATE_PROFILE: '/users/profile';
  UPLOAD_PHOTO: '/users/photos';
  DELETE_PHOTO: '/users/photos/:id';
  
  // Discovery & Matching
  DISCOVER: '/discovery/candidates';
  SWIPE: '/discovery/swipe';
  MATCHES: '/matches';
  
  // Chat
  CHAT_ROOMS: '/chat/rooms';
  MESSAGES: '/chat/rooms/:roomId/messages';
  SEND_MESSAGE: '/chat/rooms/:roomId/messages';
  
  // Notifications
  NOTIFICATIONS: '/notifications';
  MARK_READ: '/notifications/:id/read';
  PUSH_TOKENS: '/notifications/push-tokens';
}
