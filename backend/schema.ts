import { z } from 'zod';

// ===== USERS SCHEMAS =====

export const userSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  password_hash: z.string(),
  name: z.string(),
  user_type: z.string(),
  profile_photo: z.string().nullable(),
  email_verified: z.boolean(),
  phone_verified: z.boolean(),
  verification_code: z.string().nullable(),
  verification_code_expires: z.string().nullable(),
  language: z.string(),
  currency: z.string(),
  notification_email: z.boolean(),
  notification_sms: z.boolean(),
  notification_push: z.boolean(),
  notification_whatsapp: z.boolean(),
  professional_license: z.string().nullable(),
  business_name: z.string().nullable(),
  business_registration: z.string().nullable(),
  bio: z.string().nullable(),
  website: z.string().nullable(),
  social_media_links: z.record(z.string()).nullable(),
  is_active: z.boolean(),
  last_login: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createUserInputSchema = z.object({
  email: z.string().email().max(255),
  phone: z.string().max(255).nullable(),
  password_hash: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  user_type: z.enum(['buyer', 'seller', 'agent']).default('buyer'),
  profile_photo: z.string().max(500).nullable(),
  language: z.enum(['ar', 'en']).default('ar'),
  currency: z.enum(['LYD', 'USD', 'EUR']).default('LYD'),
  notification_email: z.boolean().default(true),
  notification_sms: z.boolean().default(true),
  notification_push: z.boolean().default(true),
  notification_whatsapp: z.boolean().default(true),
  professional_license: z.string().max(255).nullable(),
  business_name: z.string().max(255).nullable(),
  business_registration: z.string().max(255).nullable(),
  bio: z.string().nullable(),
  website: z.string().url().max(500).nullable(),
  social_media_links: z.record(z.string()).nullable()
});

export const updateUserInputSchema = z.object({
  user_id: z.string(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(255).nullable().optional(),
  name: z.string().min(1).max(255).optional(),
  user_type: z.enum(['buyer', 'seller', 'agent']).optional(),
  profile_photo: z.string().max(500).nullable().optional(),
  language: z.enum(['ar', 'en']).optional(),
  currency: z.enum(['LYD', 'USD', 'EUR']).optional(),
  notification_email: z.boolean().optional(),
  notification_sms: z.boolean().optional(),
  notification_push: z.boolean().optional(),
  notification_whatsapp: z.boolean().optional(),
  professional_license: z.string().max(255).nullable().optional(),
  business_name: z.string().max(255).nullable().optional(),
  business_registration: z.string().max(255).nullable().optional(),
  bio: z.string().nullable().optional(),
  website: z.string().url().max(500).nullable().optional(),
  social_media_links: z.record(z.string()).nullable().optional()
});

export const searchUsersInputSchema = z.object({
  query: z.string().optional(),
  user_type: z.enum(['buyer', 'seller', 'agent']).optional(),
  email_verified: z.boolean().optional(),
  phone_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['name', 'email', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== GOVERNORATES SCHEMAS =====

export const governorateSchema = z.object({
  governorate_id: z.string(),
  governorate: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  is_active: z.boolean()
});

export const createGovernorateInputSchema = z.object({
  governorate: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  is_active: z.boolean().default(true)
});

export const updateGovernorateInputSchema = z.object({
  governorate_id: z.string(),
  governorate: z.string().min(1).max(255).optional(),
  name_en: z.string().min(1).max(255).optional(),
  name_ar: z.string().min(1).max(255).optional(),
  is_active: z.boolean().optional()
});

export const searchGovernoratesInputSchema = z.object({
  query: z.string().optional(),
  is_active: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['governorate', 'name_en', 'name_ar']).default('governorate'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// ===== CITIES SCHEMAS =====

export const citySchema = z.object({
  city_id: z.string(),
  city: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  governorate_id: z.string(),
  is_active: z.boolean()
});

export const createCityInputSchema = z.object({
  city: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  governorate_id: z.string(),
  is_active: z.boolean().default(true)
});

export const updateCityInputSchema = z.object({
  city_id: z.string(),
  city: z.string().min(1).max(255).optional(),
  name_en: z.string().min(1).max(255).optional(),
  name_ar: z.string().min(1).max(255).optional(),
  governorate_id: z.string().optional(),
  is_active: z.boolean().optional()
});

export const searchCitiesInputSchema = z.object({
  query: z.string().optional(),
  governorate_id: z.string().optional(),
  is_active: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['city', 'name_en', 'name_ar']).default('city'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// ===== NEIGHBORHOODS SCHEMAS =====

export const neighborhoodSchema = z.object({
  neighborhood_id: z.string(),
  neighborhood: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  city_id: z.string(),
  is_active: z.boolean()
});

export const createNeighborhoodInputSchema = z.object({
  neighborhood: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  city_id: z.string(),
  is_active: z.boolean().default(true)
});

export const updateNeighborhoodInputSchema = z.object({
  neighborhood_id: z.string(),
  neighborhood: z.string().min(1).max(255).optional(),
  name_en: z.string().min(1).max(255).optional(),
  name_ar: z.string().min(1).max(255).optional(),
  city_id: z.string().optional(),
  is_active: z.boolean().optional()
});

export const searchNeighborhoodsInputSchema = z.object({
  query: z.string().optional(),
  city_id: z.string().optional(),
  is_active: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['neighborhood', 'name_en', 'name_ar']).default('neighborhood'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// ===== PROPERTIES SCHEMAS =====

export const propertySchema = z.object({
  property_id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  property_type: z.string(),
  transaction_type: z.string(),
  price: z.number(),
  price_negotiable: z.boolean(),
  currency: z.string(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  size: z.number(),
  size_unit: z.string(),
  property_age: z.string().nullable(),
  furnished_status: z.string().nullable(),
  floor_level: z.number().int().nullable(),
  total_floors: z.number().int().nullable(),
  parking_spaces: z.number().int(),
  has_garage: z.boolean(),
  has_elevator: z.boolean(),
  has_garden: z.boolean(),
  has_pool: z.boolean(),
  has_security: z.boolean(),
  governorate: z.string(),
  city: z.string(),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  rental_terms: z.record(z.any()).nullable(),
  deposit_amount: z.number().nullable(),
  utilities_included: z.record(z.any()).nullable(),
  lease_duration: z.string().nullable(),
  available_date: z.string().nullable(),
  payment_terms: z.record(z.any()).nullable(),
  property_features: z.record(z.any()).nullable(),
  nearby_amenities: z.record(z.any()).nullable(),
  status: z.string(),
  listing_duration: z.number().int(),
  expires_at: z.string(),
  is_featured: z.boolean(),
  is_verified: z.boolean(),
  verification_documents: z.record(z.any()).nullable(),
  view_count: z.number().int(),
  inquiry_count: z.number().int(),
  favorite_count: z.number().int(),
  contact_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createPropertyInputSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  property_type: z.enum(['apartment', 'villa', 'house', 'duplex', 'commercial', 'land']),
  transaction_type: z.enum(['sale', 'rent']),
  price: z.number().positive(),
  price_negotiable: z.boolean().default(false),
  currency: z.enum(['LYD', 'USD', 'EUR']).default('LYD'),
  bedrooms: z.number().int().min(0).max(20).nullable(),
  bathrooms: z.number().int().min(0).max(20).nullable(),
  size: z.number().positive(),
  size_unit: z.enum(['sqm', 'sqft']).default('sqm'),
  property_age: z.enum(['new', '1-5', '6-10', '11-20', '20+']).nullable(),
  furnished_status: z.enum(['furnished', 'semi_furnished', 'unfurnished']).nullable(),
  floor_level: z.number().int().min(0).max(200).nullable(),
  total_floors: z.number().int().min(1).max(200).nullable(),
  parking_spaces: z.number().int().min(0).max(50).default(0),
  has_garage: z.boolean().default(false),
  has_elevator: z.boolean().default(false),
  has_garden: z.boolean().default(false),
  has_pool: z.boolean().default(false),
  has_security: z.boolean().default(false),
  governorate: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  neighborhood: z.string().max(255).nullable(),
  address: z.string().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  rental_terms: z.record(z.any()).nullable(),
  deposit_amount: z.number().min(0).nullable(),
  utilities_included: z.record(z.any()).nullable(),
  lease_duration: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']).nullable(),
  available_date: z.string().nullable(),
  payment_terms: z.record(z.any()).nullable(),
  property_features: z.array(z.string()).nullable(),
  nearby_amenities: z.array(z.string()).nullable(),
  listing_duration: z.number().int().min(1).max(365).default(90)
});

export const updatePropertyInputSchema = z.object({
  property_id: z.string(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  property_type: z.enum(['apartment', 'villa', 'house', 'duplex', 'commercial', 'land']).optional(),
  transaction_type: z.enum(['sale', 'rent']).optional(),
  price: z.number().positive().optional(),
  price_negotiable: z.boolean().optional(),
  currency: z.enum(['LYD', 'USD', 'EUR']).optional(),
  bedrooms: z.number().int().min(0).max(20).nullable().optional(),
  bathrooms: z.number().int().min(0).max(20).nullable().optional(),
  size: z.number().positive().optional(),
  size_unit: z.enum(['sqm', 'sqft']).optional(),
  property_age: z.enum(['new', '1-5', '6-10', '11-20', '20+']).nullable().optional(),
  furnished_status: z.enum(['furnished', 'semi_furnished', 'unfurnished']).nullable().optional(),
  floor_level: z.number().int().min(0).max(200).nullable().optional(),
  total_floors: z.number().int().min(1).max(200).nullable().optional(),
  parking_spaces: z.number().int().min(0).max(50).optional(),
  has_garage: z.boolean().optional(),
  has_elevator: z.boolean().optional(),
  has_garden: z.boolean().optional(),
  has_pool: z.boolean().optional(),
  has_security: z.boolean().optional(),
  governorate: z.string().min(1).max(255).optional(),
  city: z.string().min(1).max(255).optional(),
  neighborhood: z.string().max(255).nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  rental_terms: z.record(z.any()).nullable().optional(),
  deposit_amount: z.number().min(0).nullable().optional(),
  utilities_included: z.record(z.any()).nullable().optional(),
  lease_duration: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']).nullable().optional(),
  available_date: z.string().nullable().optional(),
  payment_terms: z.record(z.any()).nullable().optional(),
  property_features: z.array(z.string()).nullable().optional(),
  nearby_amenities: z.array(z.string()).nullable().optional(),
  status: z.enum(['active', 'inactive', 'sold', 'rented', 'draft']).optional(),
  is_featured: z.boolean().optional()
});

export const searchPropertiesInputSchema = z.object({
  query: z.string().optional(),
  property_type: z.enum(['apartment', 'villa', 'house', 'duplex', 'commercial', 'land']).optional(),
  transaction_type: z.enum(['sale', 'rent']).optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  size_min: z.number().min(0).optional(),
  size_max: z.number().min(0).optional(),
  property_age: z.enum(['new', '1-5', '6-10', '11-20', '20+']).optional(),
  furnished_status: z.enum(['furnished', 'semi_furnished', 'unfurnished']).optional(),
  has_garage: z.boolean().optional(),
  has_elevator: z.boolean().optional(),
  has_garden: z.boolean().optional(),
  has_pool: z.boolean().optional(),
  has_security: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'sold', 'rented']).default('active'),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['price', 'size', 'created_at', 'updated_at', 'view_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== PROPERTY MEDIA SCHEMAS =====

export const propertyMediaSchema = z.object({
  media_id: z.string(),
  property_id: z.string(),
  media_type: z.string(),
  media_url: z.string(),
  thumbnail_url: z.string().nullable(),
  caption: z.string().nullable(),
  display_order: z.number().int(),
  is_primary: z.boolean(),
  file_size: z.number().int().nullable(),
  dimensions: z.record(z.any()).nullable(),
  created_at: z.string()
});

export const createPropertyMediaInputSchema = z.object({
  property_id: z.string(),
  media_type: z.enum(['image', 'video', 'tour_360']),
  media_url: z.string().url().max(500),
  thumbnail_url: z.string().url().max(500).nullable(),
  caption: z.string().max(500).nullable(),
  display_order: z.number().int().min(1),
  is_primary: z.boolean().default(false),
  file_size: z.number().int().min(0).nullable(),
  dimensions: z.object({
    width: z.number().int().min(0),
    height: z.number().int().min(0)
  }).nullable()
});

export const updatePropertyMediaInputSchema = z.object({
  media_id: z.string(),
  caption: z.string().max(500).nullable().optional(),
  display_order: z.number().int().min(1).optional(),
  is_primary: z.boolean().optional()
});

export const searchPropertyMediaInputSchema = z.object({
  property_id: z.string().optional(),
  media_type: z.enum(['image', 'video', 'tour_360']).optional(),
  is_primary: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['display_order', 'created_at']).default('display_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// ===== AMENITIES SCHEMAS =====

export const amenitySchema = z.object({
  amenity_id: z.string(),
  amenity_name: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  category: z.string(),
  icon: z.string().nullable(),
  is_active: z.boolean()
});

export const createAmenityInputSchema = z.object({
  amenity_name: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  category: z.enum(['convenience', 'safety', 'recreation', 'outdoor', 'comfort', 'technology']),
  icon: z.string().max(255).nullable(),
  is_active: z.boolean().default(true)
});

export const updateAmenityInputSchema = z.object({
  amenity_id: z.string(),
  amenity_name: z.string().min(1).max(255).optional(),
  name_en: z.string().min(1).max(255).optional(),
  name_ar: z.string().min(1).max(255).optional(),
  category: z.enum(['convenience', 'safety', 'recreation', 'outdoor', 'comfort', 'technology']).optional(),
  icon: z.string().max(255).nullable().optional(),
  is_active: z.boolean().optional()
});

export const searchAmenitiesInputSchema = z.object({
  query: z.string().optional(),
  category: z.enum(['convenience', 'safety', 'recreation', 'outdoor', 'comfort', 'technology']).optional(),
  is_active: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['amenity_name', 'category', 'name_en', 'name_ar']).default('category'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// ===== PROPERTY AMENITIES SCHEMAS =====

export const propertyAmenitySchema = z.object({
  property_amenity_id: z.string(),
  property_id: z.string(),
  amenity_id: z.string()
});

export const createPropertyAmenityInputSchema = z.object({
  property_id: z.string(),
  amenity_id: z.string()
});

export const bulkCreatePropertyAmenitiesInputSchema = z.object({
  property_id: z.string(),
  amenity_ids: z.array(z.string()).min(1)
});

// ===== FAVORITE LISTS SCHEMAS =====

export const favoriteListSchema = z.object({
  list_id: z.string(),
  user_id: z.string(),
  list_name: z.string(),
  description: z.string().nullable(),
  is_public: z.boolean(),
  share_token: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createFavoriteListInputSchema = z.object({
  user_id: z.string(),
  list_name: z.string().min(1).max(255),
  description: z.string().nullable(),
  is_public: z.boolean().default(false)
});

export const updateFavoriteListInputSchema = z.object({
  list_id: z.string(),
  list_name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  is_public: z.boolean().optional()
});

export const searchFavoriteListsInputSchema = z.object({
  user_id: z.string().optional(),
  is_public: z.boolean().optional(),
  query: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['list_name', 'created_at', 'updated_at']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== FAVORITES SCHEMAS =====

export const favoriteSchema = z.object({
  favorite_id: z.string(),
  user_id: z.string(),
  property_id: z.string(),
  favorite_list_id: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string()
});

export const createFavoriteInputSchema = z.object({
  user_id: z.string(),
  property_id: z.string(),
  favorite_list_id: z.string().nullable(),
  notes: z.string().max(1000).nullable()
});

export const updateFavoriteInputSchema = z.object({
  favorite_id: z.string(),
  favorite_list_id: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
});

export const searchFavoritesInputSchema = z.object({
  user_id: z.string().optional(),
  property_id: z.string().optional(),
  favorite_list_id: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== SAVED SEARCHES SCHEMAS =====

export const savedSearchSchema = z.object({
  search_id: z.string(),
  user_id: z.string(),
  search_name: z.string(),
  governorate: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  property_type: z.string().nullable(),
  transaction_type: z.string().nullable(),
  price_min: z.number().nullable(),
  price_max: z.number().nullable(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  size_min: z.number().nullable(),
  size_max: z.number().nullable(),
  property_age: z.string().nullable(),
  furnished_status: z.string().nullable(),
  amenities: z.record(z.any()).nullable(),
  additional_filters: z.record(z.any()).nullable(),
  alert_frequency: z.string(),
  is_active: z.boolean(),
  last_alert_sent: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createSavedSearchInputSchema = z.object({
  user_id: z.string(),
  search_name: z.string().min(1).max(255),
  governorate: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  property_type: z.enum(['apartment', 'villa', 'house', 'duplex', 'commercial', 'land']).nullable(),
  transaction_type: z.enum(['sale', 'rent']).nullable(),
  price_min: z.number().min(0).nullable(),
  price_max: z.number().min(0).nullable(),
  bedrooms: z.number().int().min(0).max(20).nullable(),
  bathrooms: z.number().int().min(0).max(20).nullable(),
  size_min: z.number().min(0).nullable(),
  size_max: z.number().min(0).nullable(),
  property_age: z.enum(['new', '1-5', '6-10', '11-20', '20+']).nullable(),
  furnished_status: z.enum(['furnished', 'semi_furnished', 'unfurnished']).nullable(),
  amenities: z.array(z.string()).nullable(),
  additional_filters: z.record(z.any()).nullable(),
  alert_frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  is_active: z.boolean().default(true)
});

export const updateSavedSearchInputSchema = z.object({
  search_id: z.string(),
  search_name: z.string().min(1).max(255).optional(),
  governorate: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  property_type: z.enum(['apartment', 'villa', 'house', 'duplex', 'commercial', 'land']).nullable().optional(),
  transaction_type: z.enum(['sale', 'rent']).nullable().optional(),
  price_min: z.number().min(0).nullable().optional(),
  price_max: z.number().min(0).nullable().optional(),
  bedrooms: z.number().int().min(0).max(20).nullable().optional(),
  bathrooms: z.number().int().min(0).max(20).nullable().optional(),
  size_min: z.number().min(0).nullable().optional(),
  size_max: z.number().min(0).nullable().optional(),
  property_age: z.enum(['new', '1-5', '6-10', '11-20', '20+']).nullable().optional(),
  furnished_status: z.enum(['furnished', 'semi_furnished', 'unfurnished']).nullable().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  additional_filters: z.record(z.any()).nullable().optional(),
  alert_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  is_active: z.boolean().optional()
});

export const searchSavedSearchesInputSchema = z.object({
  user_id: z.string().optional(),
  is_active: z.boolean().optional(),
  alert_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['search_name', 'created_at', 'updated_at']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== CONVERSATIONS SCHEMAS =====

export const conversationSchema = z.object({
  conversation_id: z.string(),
  property_id: z.string(),
  buyer_id: z.string(),
  seller_id: z.string(),
  last_message_at: z.string().nullable(),
  is_archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createConversationInputSchema = z.object({
  property_id: z.string(),
  buyer_id: z.string(),
  seller_id: z.string()
});

export const updateConversationInputSchema = z.object({
  conversation_id: z.string(),
  is_archived: z.boolean().optional()
});

export const searchConversationsInputSchema = z.object({
  user_id: z.string().optional(),
  property_id: z.string().optional(),
  is_archived: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['last_message_at', 'created_at', 'updated_at']).default('last_message_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== MESSAGES SCHEMAS =====

export const messageSchema = z.object({
  message_id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  recipient_id: z.string(),
  message_content: z.string(),
  message_type: z.string(),
  attachment_url: z.string().nullable(),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  is_system_message: z.boolean(),
  created_at: z.string()
});

export const createMessageInputSchema = z.object({
  conversation_id: z.string(),
  sender_id: z.string(),
  recipient_id: z.string(),
  message_content: z.string().min(1).max(5000),
  message_type: z.enum(['text', 'image', 'file', 'system']).default('text'),
  attachment_url: z.string().url().max(500).nullable(),
  is_system_message: z.boolean().default(false)
});

export const updateMessageInputSchema = z.object({
  message_id: z.string(),
  is_read: z.boolean().optional(),
  read_at: z.string().optional()
});

export const searchMessagesInputSchema = z.object({
  conversation_id: z.string().optional(),
  sender_id: z.string().optional(),
  recipient_id: z.string().optional(),
  message_type: z.enum(['text', 'image', 'file', 'system']).optional(),
  is_read: z.boolean().optional(),
  is_system_message: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== INQUIRIES SCHEMAS =====

export const inquirySchema = z.object({
  inquiry_id: z.string(),
  property_id: z.string(),
  user_id: z.string(),
  inquiry_type: z.string(),
  message: z.string(),
  contact_preference: z.string(),
  phone_number: z.string().nullable(),
  email: z.string().nullable(),
  preferred_viewing_date: z.string().nullable(),
  preferred_viewing_time: z.string().nullable(),
  status: z.string(),
  response_message: z.string().nullable(),
  responded_at: z.string().nullable(),
  response_time_hours: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createInquiryInputSchema = z.object({
  property_id: z.string(),
  user_id: z.string(),
  inquiry_type: z.enum(['viewing', 'general', 'price', 'availability']),
  message: z.string().min(1).max(2000),
  contact_preference: z.enum(['phone', 'email', 'whatsapp', 'message']),
  phone_number: z.string().max(255).nullable(),
  email: z.string().email().max(255).nullable(),
  preferred_viewing_date: z.string().nullable(),
  preferred_viewing_time: z.string().nullable()
});

export const updateInquiryInputSchema = z.object({
  inquiry_id: z.string(),
  status: z.enum(['pending', 'responded', 'closed']).optional(),
  response_message: z.string().max(2000).nullable().optional(),
  responded_at: z.string().optional()
});

export const searchInquiriesInputSchema = z.object({
  property_id: z.string().optional(),
  user_id: z.string().optional(),
  inquiry_type: z.enum(['viewing', 'general', 'price', 'availability']).optional(),
  status: z.enum(['pending', 'responded', 'closed']).optional(),
  contact_preference: z.enum(['phone', 'email', 'whatsapp', 'message']).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'updated_at', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== PROPERTY VIEWS SCHEMAS =====

export const propertyViewSchema = z.object({
  view_id: z.string(),
  property_id: z.string(),
  user_id: z.string().nullable(),
  session_id: z.string().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  referrer_url: z.string().nullable(),
  view_duration_seconds: z.number().int().nullable(),
  device_type: z.string().nullable(),
  created_at: z.string()
});

export const createPropertyViewInputSchema = z.object({
  property_id: z.string(),
  user_id: z.string().nullable(),
  session_id: z.string().max(255).nullable(),
  ip_address: z.string().max(45).nullable(),
  user_agent: z.string().nullable(),
  referrer_url: z.string().max(500).nullable(),
  view_duration_seconds: z.number().int().min(0).nullable(),
  device_type: z.enum(['desktop', 'mobile', 'tablet']).nullable()
});

export const searchPropertyViewsInputSchema = z.object({
  property_id: z.string().optional(),
  user_id: z.string().optional(),
  device_type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'view_duration_seconds']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== NOTIFICATIONS SCHEMAS =====

export const notificationSchema = z.object({
  notification_id: z.string(),
  user_id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).nullable(),
  property_id: z.string().nullable(),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  delivery_status: z.record(z.any()).nullable(),
  created_at: z.string()
});

export const createNotificationInputSchema = z.object({
  user_id: z.string(),
  type: z.enum(['new_property', 'price_drop', 'inquiry_response', 'viewing_confirmed', 'new_message', 'property_viewed', 'inquiry_received', 'favorite_added', 'message_received', 'viewing_request']),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  data: z.record(z.any()).nullable(),
  property_id: z.string().nullable()
});

export const updateNotificationInputSchema = z.object({
  notification_id: z.string(),
  is_read: z.boolean().optional(),
  read_at: z.string().optional()
});

export const searchNotificationsInputSchema = z.object({
  user_id: z.string().optional(),
  type: z.enum(['new_property', 'price_drop', 'inquiry_response', 'viewing_confirmed', 'new_message', 'property_viewed', 'inquiry_received', 'favorite_added', 'message_received', 'viewing_request']).optional(),
  is_read: z.boolean().optional(),
  property_id: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== USER SESSIONS SCHEMAS =====

export const userSessionSchema = z.object({
  session_id: z.string(),
  user_id: z.string(),
  token: z.string(),
  device_info: z.record(z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  is_active: z.boolean(),
  expires_at: z.string(),
  last_activity: z.string(),
  created_at: z.string()
});

export const createUserSessionInputSchema = z.object({
  user_id: z.string(),
  token: z.string().min(1).max(500),
  device_info: z.record(z.any()).nullable(),
  ip_address: z.string().max(45).nullable(),
  user_agent: z.string().nullable(),
  expires_at: z.string(),
  last_activity: z.string()
});

export const updateUserSessionInputSchema = z.object({
  session_id: z.string(),
  is_active: z.boolean().optional(),
  last_activity: z.string().optional()
});

// ===== PROPERTY REPORTS SCHEMAS =====

export const propertyReportSchema = z.object({
  report_id: z.string(),
  property_id: z.string(),
  reporter_id: z.string().nullable(),
  report_type: z.string(),
  reason: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  reviewed_by: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  resolution_notes: z.string().nullable(),
  created_at: z.string()
});

export const createPropertyReportInputSchema = z.object({
  property_id: z.string(),
  reporter_id: z.string().nullable(),
  report_type: z.enum(['misleading', 'inappropriate', 'spam', 'scam', 'outdated']),
  reason: z.string().min(1).max(255),
  description: z.string().max(2000).nullable()
});

export const updatePropertyReportInputSchema = z.object({
  report_id: z.string(),
  status: z.enum(['pending', 'under_review', 'resolved', 'rejected']).optional(),
  reviewed_by: z.string().optional(),
  reviewed_at: z.string().optional(),
  resolution_notes: z.string().max(2000).nullable().optional()
});

export const searchPropertyReportsInputSchema = z.object({
  property_id: z.string().optional(),
  reporter_id: z.string().optional(),
  report_type: z.enum(['misleading', 'inappropriate', 'spam', 'scam', 'outdated']).optional(),
  status: z.enum(['pending', 'under_review', 'resolved', 'rejected']).optional(),
  reviewed_by: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== USER VERIFICATION SCHEMAS =====

export const userVerificationSchema = z.object({
  verification_id: z.string(),
  user_id: z.string(),
  verification_type: z.string(),
  document_url: z.string().nullable(),
  verification_data: z.record(z.any()).nullable(),
  status: z.string(),
  verified_by: z.string().nullable(),
  verified_at: z.string().nullable(),
  rejection_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createUserVerificationInputSchema = z.object({
  user_id: z.string(),
  verification_type: z.enum(['identity', 'professional_license', 'business_license']),
  document_url: z.string().url().max(500).nullable(),
  verification_data: z.record(z.any()).nullable()
});

export const updateUserVerificationInputSchema = z.object({
  verification_id: z.string(),
  status: z.enum(['pending', 'verified', 'rejected']).optional(),
  verified_by: z.string().optional(),
  verified_at: z.string().optional(),
  rejection_reason: z.string().max(1000).nullable().optional()
});

export const searchUserVerificationsInputSchema = z.object({
  user_id: z.string().optional(),
  verification_type: z.enum(['identity', 'professional_license', 'business_license']).optional(),
  status: z.enum(['pending', 'verified', 'rejected']).optional(),
  verified_by: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'updated_at', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== COMPARISON SESSIONS SCHEMAS =====

export const comparisonSessionSchema = z.object({
  comparison_id: z.string(),
  user_id: z.string().nullable(),
  session_token: z.string().nullable(),
  property_ids: z.record(z.any()),
  comparison_data: z.record(z.any()).nullable(),
  share_token: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createComparisonSessionInputSchema = z.object({
  user_id: z.string().nullable(),
  session_token: z.string().max(255).nullable(),
  property_ids: z.array(z.string()).min(2).max(5),
  comparison_data: z.record(z.any()).nullable(),
  share_token: z.string().max(255).nullable()
});

export const updateComparisonSessionInputSchema = z.object({
  comparison_id: z.string(),
  property_ids: z.array(z.string()).min(2).max(5).optional(),
  comparison_data: z.record(z.any()).nullable().optional()
});

export const searchComparisonSessionsInputSchema = z.object({
  user_id: z.string().optional(),
  session_token: z.string().optional(),
  share_token: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'updated_at']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== SEARCH ANALYTICS SCHEMAS =====

export const searchAnalyticsSchema = z.object({
  search_id: z.string(),
  user_id: z.string().nullable(),
  session_id: z.string().nullable(),
  search_query: z.string().nullable(),
  filters_applied: z.record(z.any()).nullable(),
  results_count: z.number().int(),
  clicked_properties: z.record(z.any()).nullable(),
  search_duration_seconds: z.number().int().nullable(),
  created_at: z.string()
});

export const createSearchAnalyticsInputSchema = z.object({
  user_id: z.string().nullable(),
  session_id: z.string().max(255).nullable(),
  search_query: z.string().max(500).nullable(),
  filters_applied: z.record(z.any()).nullable(),
  results_count: z.number().int().min(0),
  clicked_properties: z.array(z.string()).nullable(),
  search_duration_seconds: z.number().int().min(0).nullable()
});

export const searchAnalyticsInputSchema = z.object({
  user_id: z.string().optional(),
  session_id: z.string().optional(),
  search_query: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'results_count', 'search_duration_seconds']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ===== TYPE EXPORTS =====

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;

export type Governorate = z.infer<typeof governorateSchema>;
export type CreateGovernorateInput = z.infer<typeof createGovernorateInputSchema>;
export type UpdateGovernorateInput = z.infer<typeof updateGovernorateInputSchema>;
export type SearchGovernoratesInput = z.infer<typeof searchGovernoratesInputSchema>;

export type City = z.infer<typeof citySchema>;
export type CreateCityInput = z.infer<typeof createCityInputSchema>;
export type UpdateCityInput = z.infer<typeof updateCityInputSchema>;
export type SearchCitiesInput = z.infer<typeof searchCitiesInputSchema>;

export type Neighborhood = z.infer<typeof neighborhoodSchema>;
export type CreateNeighborhoodInput = z.infer<typeof createNeighborhoodInputSchema>;
export type UpdateNeighborhoodInput = z.infer<typeof updateNeighborhoodInputSchema>;
export type SearchNeighborhoodsInput = z.infer<typeof searchNeighborhoodsInputSchema>;

export type Property = z.infer<typeof propertySchema>;
export type CreatePropertyInput = z.infer<typeof createPropertyInputSchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertyInputSchema>;
export type SearchPropertiesInput = z.infer<typeof searchPropertiesInputSchema>;

export type PropertyMedia = z.infer<typeof propertyMediaSchema>;
export type CreatePropertyMediaInput = z.infer<typeof createPropertyMediaInputSchema>;
export type UpdatePropertyMediaInput = z.infer<typeof updatePropertyMediaInputSchema>;
export type SearchPropertyMediaInput = z.infer<typeof searchPropertyMediaInputSchema>;

export type Amenity = z.infer<typeof amenitySchema>;
export type CreateAmenityInput = z.infer<typeof createAmenityInputSchema>;
export type UpdateAmenityInput = z.infer<typeof updateAmenityInputSchema>;
export type SearchAmenitiesInput = z.infer<typeof searchAmenitiesInputSchema>;

export type PropertyAmenity = z.infer<typeof propertyAmenitySchema>;
export type CreatePropertyAmenityInput = z.infer<typeof createPropertyAmenityInputSchema>;
export type BulkCreatePropertyAmenitiesInput = z.infer<typeof bulkCreatePropertyAmenitiesInputSchema>;

export type FavoriteList = z.infer<typeof favoriteListSchema>;
export type CreateFavoriteListInput = z.infer<typeof createFavoriteListInputSchema>;
export type UpdateFavoriteListInput = z.infer<typeof updateFavoriteListInputSchema>;
export type SearchFavoriteListsInput = z.infer<typeof searchFavoriteListsInputSchema>;

export type Favorite = z.infer<typeof favoriteSchema>;
export type CreateFavoriteInput = z.infer<typeof createFavoriteInputSchema>;
export type UpdateFavoriteInput = z.infer<typeof updateFavoriteInputSchema>;
export type SearchFavoritesInput = z.infer<typeof searchFavoritesInputSchema>;

export type SavedSearch = z.infer<typeof savedSearchSchema>;
export type CreateSavedSearchInput = z.infer<typeof createSavedSearchInputSchema>;
export type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchInputSchema>;
export type SearchSavedSearchesInput = z.infer<typeof searchSavedSearchesInputSchema>;

export type Conversation = z.infer<typeof conversationSchema>;
export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationInputSchema>;
export type SearchConversationsInput = z.infer<typeof searchConversationsInputSchema>;

export type Message = z.infer<typeof messageSchema>;
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageInputSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesInputSchema>;

export type Inquiry = z.infer<typeof inquirySchema>;
export type CreateInquiryInput = z.infer<typeof createInquiryInputSchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquiryInputSchema>;
export type SearchInquiriesInput = z.infer<typeof searchInquiriesInputSchema>;

export type PropertyView = z.infer<typeof propertyViewSchema>;
export type CreatePropertyViewInput = z.infer<typeof createPropertyViewInputSchema>;
export type SearchPropertyViewsInput = z.infer<typeof searchPropertyViewsInputSchema>;

export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationInputSchema>;
export type SearchNotificationsInput = z.infer<typeof searchNotificationsInputSchema>;

export type UserSession = z.infer<typeof userSessionSchema>;
export type CreateUserSessionInput = z.infer<typeof createUserSessionInputSchema>;
export type UpdateUserSessionInput = z.infer<typeof updateUserSessionInputSchema>;

export type PropertyReport = z.infer<typeof propertyReportSchema>;
export type CreatePropertyReportInput = z.infer<typeof createPropertyReportInputSchema>;
export type UpdatePropertyReportInput = z.infer<typeof updatePropertyReportInputSchema>;
export type SearchPropertyReportsInput = z.infer<typeof searchPropertyReportsInputSchema>;

export type UserVerification = z.infer<typeof userVerificationSchema>;
export type CreateUserVerificationInput = z.infer<typeof createUserVerificationInputSchema>;
export type UpdateUserVerificationInput = z.infer<typeof updateUserVerificationInputSchema>;
export type SearchUserVerificationsInput = z.infer<typeof searchUserVerificationsInputSchema>;

export type ComparisonSession = z.infer<typeof comparisonSessionSchema>;
export type CreateComparisonSessionInput = z.infer<typeof createComparisonSessionInputSchema>;
export type UpdateComparisonSessionInput = z.infer<typeof updateComparisonSessionInputSchema>;
export type SearchComparisonSessionsInput = z.infer<typeof searchComparisonSessionsInputSchema>;

export type SearchAnalytics = z.infer<typeof searchAnalyticsSchema>;
export type CreateSearchAnalyticsInput = z.infer<typeof createSearchAnalyticsInputSchema>;
export type SearchAnalyticsInput = z.infer<typeof searchAnalyticsInputSchema>;