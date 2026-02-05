// User Types
// NOTE: Python FastAPI backend returns snake_case fields (e.g., account_type, email_verified_at, phone_prefix)
// All field names match the backend response format
export interface User {
  id: number | string // Backend Python può usare UUID (string) o integer
  username: string
  email: string
  account_type: 'personal' | 'business' | 'private' // Backend uses 'private' for business accounts
  role?: string
  verified: boolean
  email_verified_at?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
  balance?: number
  // Personal fields - Backend Python restituisce first_name e last_name
  first_name?: string // Campo principale dal backend Python
  last_name?: string // Campo principale dal backend Python
  nome?: string // Variante legacy (mantenuta per retrocompatibilità)
  cognome?: string // Variante legacy (mantenuta per retrocompatibilità)
  // Business fields
  ragione_sociale?: string
  piva?: string
  // Contact fields
  country?: string
  phone_prefix?: string
  phone?: string // Backend Python usa 'phone'
  telefono?: string // Variante legacy (mantenuta per retrocompatibilità)
  // MFA fields (from backend)
  mfa_enabled?: boolean
  account_status?: string

  // User preferences (onboarding: theme, language)
  preferences?: {
    theme: 'light' | 'dark' | 'system'
    language: string
    is_onboarding_completed: boolean
  }
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  account_type: 'personal' | 'business' | 'private' // AWS usa 'private' invece di 'business'
  country: string
  phone_prefix: string
  phone?: string // AWS si aspetta 'phone'
  telefono?: string // Mantenuto per retrocompatibilità
  email: string
  username: string
  password: string
  password_confirmation: string
  // Consensi obbligatori (richiesti dal backend per compliance legale)
  termsAccepted: boolean
  privacyAccepted: boolean
  cancellationAccepted: boolean
  adultConfirmed: boolean
  // Personal fields - AWS accetta varianti: nome/firstName per first_name
  first_name?: string // Campo principale per AWS
  last_name?: string // Campo principale per AWS
  nome?: string // Variante accettata da AWS
  cognome?: string // Variante accettata da AWS
  // Business fields
  ragione_sociale?: string
  piva?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
  expires_in?: number
}

// MFA Response Types
export interface MFALoginResponse {
  pre_auth_token: string
  mfa_required: true
}

export interface DirectLoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface VerifyMFAData {
  pre_auth_token: string
  mfa_code: string
}

export interface VerifyEmailData {
  email: string
  code: string
}

export interface ResendVerificationData {
  email: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetData {
  email: string
  password: string
  password_confirmation: string
  token: string
}

export interface PasswordResetVerifyToken {
  email: string
  token: string
}

export interface EmailVerificationSend {
  email?: string // Opzionale se autenticato
}

export interface EmailVerificationVerify {
  code: string
  email?: string // Opzionale se autenticato
}

// Card Types
export interface Card {
  id: number
  name: string
  set_name: string
  image_url?: string
  price?: number
  rarity?: string
  collector_number?: string
  multiverse_id?: string
}

// Collection Types
export interface CollectionCard extends Card {
  quantity: number
  condition?: string
  is_tradeable?: boolean
  user_id: number
}

// Collection Item (from Collection Service)
export interface CollectionItem {
  id: string
  user_id: string
  card_id: string
  card_name?: string
  set_name?: string
  quantity: number
  condition: 'NM' | 'LP' | 'GD' | 'MP' | 'HP' | 'PO'
  language: string
  is_foil: boolean
  is_signed: boolean
  is_altered: boolean
  notes?: string
  source: 'manual' | 'cardtrader'
  cardtrader_id?: string | null
  front_image_url?: string
  created_at: string
  updated_at: string
}

export interface CollectionFilters {
  condition?: string[]
  language?: string[]
  is_foil?: boolean | null
  source?: string[]
  search?: string
}

export interface CollectionPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

// Trade Types
export interface Trade {
  id: number
  from_user_id: number
  to_user_id: number
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// Health Check
export interface HealthCheck {
  status: 'ok' | 'error'
  timestamp: string
  version?: string
  database?: 'connected' | 'disconnected'
}

// Account Types
export interface Order {
  id: number
  order_number: string
  date: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  seller_username?: string
  buyer_username?: string
  items_count: number
  total_value: number
}

export interface UserProfileData {
  id: number
  username: string
  email: string
  nome?: string
  cognome?: string
  ragione_sociale?: string
  piva?: string
  country: string
  phone_prefix: string
  telefono: string
  date_of_birth?: string
  address_street?: string
  address_city?: string
  address_zip?: string
  address_country?: string
  iban?: string
  seller_type?: 'private' | 'commercial'
  seller_country?: string
  created_at: string
}

export interface Message {
  id: number
  from_username?: string
  to_username?: string
  subject: string
  preview: string
  date: string
  read: boolean
  conversation_id: number
}

export interface CartItem {
  id: number
  card_name: string
  set_name: string
  image_url: string
  seller_username: string
  condition: 'NM' | 'SP' | 'MP' | 'HP' | 'PO'
  language: string
  is_foil: boolean
  quantity: number
  unit_price: number
  total_price: number
}

export interface ListedArticle {
  id: number
  card_name: string
  set_name: string
  image_url: string
  language: string
  condition: 'NM' | 'SP' | 'MP' | 'HP' | 'PO'
  is_foil: boolean
  quantity: number
  price: number
  listed_date: string
  views: number
  status: 'active' | 'paused' | 'sold_out'
}

export interface WantsListItem {
  id: number
  card_name: string
  set_name: string
  min_condition: 'NM' | 'SP' | 'MP' | 'HP' | 'PO'
  language: string
  is_foil: boolean
  max_price?: number
  created_at: string
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type CardCondition = 'NM' | 'SP' | 'MP' | 'HP' | 'PO'
export type SortDirection = 'asc' | 'desc'

// Export account types
export type {
  MainAddress,
  SecondaryAddress,
  AddressesResponse,
} from './account'

// Navigation API Types (for Sets and Cards endpoints)
export interface NavigationSet {
  code: string
  name: string
  set_type: string
  release_date: string
  icon_svg_uri: string | null
}

export interface NavigationPrinting {
  id: string
  card_oracle_id: string
  oracle_id?: string // ID oracle della carta (aggiunto dalla nuova query)
  card_name?: string // Nome inglese standard della carta (es. "Black Cat")
  set_code: string
  printed_name: string // Nome stampato sulla carta (potrebbe variare per varianti)
  printed_type_line: string
  collector_number: string
  image_uri_small: string | null
  image_uri_normal?: string | null // Immagine normale (più grande) per la pagina dettaglio
  rarity: string
  set_name: string
  release_date: string
  eur: string | null
  eur_foil: string | null
  lang?: string // Codice lingua (es. 'en', 'it', 'de', 'fr')
}

export interface NavigationCardInfo {
  oracle_id: string
  name: string
  type_line: string
  oracle_text: string | null
  mana_cost: string | null
  power: string | null
  toughness: string | null
}

export interface SetListResponse {
  success: boolean
  cached: boolean
  data: NavigationSet[]
  error?: string
}

export interface SetDetailResponse {
  success: boolean
  cached: boolean
  data: {
    set_info: NavigationSet | null
    cards: NavigationPrinting[]
  }
  error?: string
}

export interface CardDetailResponse {
  success: boolean
  cached: boolean
  data: {
    card_info: NavigationCardInfo | null
    selected_printing: NavigationPrinting | null
    printings?: NavigationPrinting[] // Opzionale per pagina dettaglio
  }
  error?: string
}

export interface CardPrintingsResponse {
  success: boolean
  cached: boolean
  data: {
    card_name: string
    card_oracle_id: string
    printings: NavigationPrinting[]
  }
  error?: string
}

/** Hit from Meilisearch index "cards" (Global Search) */
export interface CardHit {
  id: string
  name: string
  set_name: string
  game_slug: 'mtg' | 'pk' | 'op'
  image: string | null
}

