-- Create Users table
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL DEFAULT 'buyer',
    profile_photo VARCHAR(500),
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    verification_code VARCHAR(255),
    verification_code_expires VARCHAR(255),
    language VARCHAR(10) NOT NULL DEFAULT 'ar',
    currency VARCHAR(10) NOT NULL DEFAULT 'LYD',
    notification_email BOOLEAN NOT NULL DEFAULT true,
    notification_sms BOOLEAN NOT NULL DEFAULT true,
    notification_push BOOLEAN NOT NULL DEFAULT true,
    notification_whatsapp BOOLEAN NOT NULL DEFAULT true,
    professional_license VARCHAR(255),
    business_name VARCHAR(255),
    business_registration VARCHAR(255),
    bio TEXT,
    website VARCHAR(500),
    social_media_links JSON,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login VARCHAR(255),
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Governorates table
CREATE TABLE governorates (
    governorate_id VARCHAR(255) PRIMARY KEY,
    governorate VARCHAR(255) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create Cities table
CREATE TABLE cities (
    city_id VARCHAR(255) PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    governorate_id VARCHAR(255) NOT NULL REFERENCES governorates(governorate_id),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create Neighborhoods table
CREATE TABLE neighborhoods (
    neighborhood_id VARCHAR(255) PRIMARY KEY,
    neighborhood VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    city_id VARCHAR(255) NOT NULL REFERENCES cities(city_id),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create Properties table
CREATE TABLE properties (
    property_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    property_type VARCHAR(100) NOT NULL,
    transaction_type VARCHAR(100) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    price_negotiable BOOLEAN NOT NULL DEFAULT false,
    currency VARCHAR(10) NOT NULL DEFAULT 'LYD',
    bedrooms INTEGER,
    bathrooms INTEGER,
    size DECIMAL(10,2) NOT NULL,
    size_unit VARCHAR(20) NOT NULL DEFAULT 'sqm',
    property_age VARCHAR(50),
    furnished_status VARCHAR(50),
    floor_level INTEGER,
    total_floors INTEGER,
    parking_spaces INTEGER NOT NULL DEFAULT 0,
    has_garage BOOLEAN NOT NULL DEFAULT false,
    has_elevator BOOLEAN NOT NULL DEFAULT false,
    has_garden BOOLEAN NOT NULL DEFAULT false,
    has_pool BOOLEAN NOT NULL DEFAULT false,
    has_security BOOLEAN NOT NULL DEFAULT false,
    governorate VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    rental_terms JSON,
    deposit_amount DECIMAL(15,2),
    utilities_included JSON,
    lease_duration VARCHAR(100),
    available_date VARCHAR(255),
    payment_terms JSON,
    property_features JSON,
    nearby_amenities JSON,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    listing_duration INTEGER NOT NULL DEFAULT 90,
    expires_at VARCHAR(255) NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_documents JSON,
    view_count INTEGER NOT NULL DEFAULT 0,
    inquiry_count INTEGER NOT NULL DEFAULT 0,
    favorite_count INTEGER NOT NULL DEFAULT 0,
    contact_count INTEGER NOT NULL DEFAULT 0,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Property Media table
CREATE TABLE property_media (
    media_id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL REFERENCES properties(property_id),
    media_type VARCHAR(50) NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption TEXT,
    display_order INTEGER NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    file_size INTEGER,
    dimensions JSON,
    created_at VARCHAR(255) NOT NULL
);

-- Create Amenities table
CREATE TABLE amenities (
    amenity_id VARCHAR(255) PRIMARY KEY,
    amenity_name VARCHAR(255) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    icon VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create Property Amenities junction table
CREATE TABLE property_amenities (
    property_amenity_id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL REFERENCES properties(property_id),
    amenity_id VARCHAR(255) NOT NULL REFERENCES amenities(amenity_id)
);

-- Create Favorite Lists table
CREATE TABLE favorite_lists (
    list_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    list_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    share_token VARCHAR(255),
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Favorites table
CREATE TABLE favorites (
    favorite_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    property_id VARCHAR(255) NOT NULL REFERENCES properties(property_id),
    favorite_list_id VARCHAR(255) REFERENCES favorite_lists(list_id),
    notes TEXT,
    created_at VARCHAR(255) NOT NULL
);

-- Create Saved Searches table
CREATE TABLE saved_searches (
    search_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    search_name VARCHAR(255) NOT NULL,
    governorate VARCHAR(255),
    city VARCHAR(255),
    neighborhood VARCHAR(255),
    property_type VARCHAR(100),
    transaction_type VARCHAR(100),
    price_min DECIMAL(15,2),
    price_max DECIMAL(15,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    size_min DECIMAL(10,2),
    size_max DECIMAL(10,2),
    property_age VARCHAR(50),
    furnished_status VARCHAR(50),
    amenities JSON,
    additional_filters JSON,
    alert_frequency VARCHAR(50) NOT NULL DEFAULT 'daily',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_alert_sent VARCHAR(255),
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Conversations table
CREATE TABLE conversations (
    conversation_id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL REFERENCES properties(property_id),
    buyer_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    seller_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    last_message_at VARCHAR(255),
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Messages table
CREATE TABLE messages (
    message_id VARCHAR(255) PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(conversation_id),
    sender_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    recipient_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'text',
    attachment_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at VARCHAR(255),
    is_system_message BOOLEAN NOT NULL DEFAULT false,
    created_at VARCHAR(255) NOT NULL
);

-- Create Inquiries table
CREATE TABLE inquiries (
    inquiry_id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL REFERENCES properties(property_id),
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    inquiry_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    contact_preference VARCHAR(100) NOT NULL,
    phone_number VARCHAR(255),
    email VARCHAR(255),
    preferred_viewing_date VARCHAR(255),
    preferred_viewing_time VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    response_message TEXT,
    responded_at VARCHAR(255),
    response_time_hours DECIMAL(10,2),
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Property Views table
CREATE TABLE property_views (
    view_id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL REFERENCES properties(property_id),
    user_id VARCHAR(255) REFERENCES users(user_id),
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer_url VARCHAR(500),
    view_duration_seconds INTEGER,
    device_type VARCHAR(50),
    created_at VARCHAR(255) NOT NULL
);

-- Create Notifications table
CREATE TABLE notifications (
    notification_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    property_id VARCHAR(255) REFERENCES properties(property_id),
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at VARCHAR(255),
    delivery_status JSON,
    created_at VARCHAR(255) NOT NULL
);

-- Create User Sessions table
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    token VARCHAR(500) NOT NULL,
    device_info JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at VARCHAR(255) NOT NULL,
    last_activity VARCHAR(255) NOT NULL,
    created_at VARCHAR(255) NOT NULL
);

-- Create Property Reports table
CREATE TABLE property_reports (
    report_id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL REFERENCES properties(property_id),
    reporter_id VARCHAR(255) REFERENCES users(user_id),
    report_type VARCHAR(100) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(255) REFERENCES users(user_id),
    reviewed_at VARCHAR(255),
    resolution_notes TEXT,
    created_at VARCHAR(255) NOT NULL
);

-- Create User Verification table
CREATE TABLE user_verification (
    verification_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    verification_type VARCHAR(100) NOT NULL,
    document_url VARCHAR(500),
    verification_data JSON,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    verified_by VARCHAR(255) REFERENCES users(user_id),
    verified_at VARCHAR(255),
    rejection_reason TEXT,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Comparison Sessions table
CREATE TABLE comparison_sessions (
    comparison_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    session_token VARCHAR(255),
    property_ids JSON NOT NULL,
    comparison_data JSON,
    share_token VARCHAR(255),
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

-- Create Search Analytics table
CREATE TABLE search_analytics (
    search_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    session_id VARCHAR(255),
    search_query VARCHAR(500),
    filters_applied JSON,
    results_count INTEGER NOT NULL,
    clicked_properties JSON,
    search_duration_seconds INTEGER,
    created_at VARCHAR(255) NOT NULL
);

-- Seed data starts here

-- Insert Governorates
INSERT INTO governorates (governorate_id, governorate, name_en, name_ar, is_active) VALUES
('gov_1', 'Tripoli', 'Tripoli', 'طرابلس', true),
('gov_2', 'Benghazi', 'Benghazi', 'بنغازي', true),
('gov_3', 'Misrata', 'Misrata', 'مصراتة', true),
('gov_4', 'Zawiya', 'Zawiya', 'الزاوية', true),
('gov_5', 'Sebha', 'Sebha', 'سبها', true);

-- Insert Cities
INSERT INTO cities (city_id, city, name_en, name_ar, governorate_id, is_active) VALUES
('city_1', 'Tripoli City', 'Tripoli City', 'مدينة طرابلس', 'gov_1', true),
('city_2', 'Tajoura', 'Tajoura', 'تاجوراء', 'gov_1', true),
('city_3', 'Janzour', 'Janzour', 'جنزور', 'gov_1', true),
('city_4', 'Benghazi City', 'Benghazi City', 'مدينة بنغازي', 'gov_2', true),
('city_5', 'Sidi Hsein', 'Sidi Hsein', 'سيدي حسين', 'gov_2', true),
('city_6', 'Misrata City', 'Misrata City', 'مدينة مصراتة', 'gov_3', true),
('city_7', 'Zawiya City', 'Zawiya City', 'مدينة الزاوية', 'gov_4', true),
('city_8', 'Sebha City', 'Sebha City', 'مدينة سبها', 'gov_5', true);

-- Insert Neighborhoods
INSERT INTO neighborhoods (neighborhood_id, neighborhood, name_en, name_ar, city_id, is_active) VALUES
('neigh_1', 'Hay Al Andalus', 'Hay Al Andalus', 'حي الأندلس', 'city_1', true),
('neigh_2', 'Souq Al Jumaa', 'Souq Al Jumaa', 'سوق الجمعة', 'city_1', true),
('neigh_3', 'Fashloom', 'Fashloom', 'فشلوم', 'city_1', true),
('neigh_4', 'Dahra', 'Dahra', 'الضهرة', 'city_1', true),
('neigh_5', 'Ben Ashour', 'Ben Ashour', 'بن عاشور', 'city_1', true),
('neigh_6', 'Tajoura Center', 'Tajoura Center', 'تاجوراء المركز', 'city_2', true),
('neigh_7', 'Janzour Center', 'Janzour Center', 'جنزور المركز', 'city_3', true),
('neigh_8', 'Keesh', 'Keesh', 'الكيش', 'city_4', true),
('neigh_9', 'Sidi Hsein Center', 'Sidi Hsein Center', 'سيدي حسين المركز', 'city_5', true),
('neigh_10', 'Misrata Center', 'Misrata Center', 'مصراتة المركز', 'city_6', true);

-- Insert Users
INSERT INTO users (user_id, email, phone, password_hash, name, user_type, profile_photo, email_verified, phone_verified, language, currency, social_media_links, is_active, created_at, updated_at) VALUES
('user_1', 'ahmed.salem@email.com', '+218911234567', 'password123', 'Ahmed Salem', 'seller', 'https://picsum.photos/200/200?random=1', true, true, 'ar', 'LYD', '{"facebook": "ahmed.salem", "instagram": "ahmed_salem_real"}', true, '2024-01-15T08:00:00Z', '2024-01-15T08:00:00Z'),
('user_2', 'fatima.omar@email.com', '+218921234567', 'password123', 'Fatima Omar', 'buyer', 'https://picsum.photos/200/200?random=2', true, false, 'ar', 'LYD', null, true, '2024-01-16T09:00:00Z', '2024-01-16T09:00:00Z'),
('user_3', 'mohammed.ali@email.com', '+218931234567', 'agent123', 'Mohammed Ali', 'agent', 'https://picsum.photos/200/200?random=3', true, true, 'ar', 'LYD', '{"website": "mohammed-properties.ly"}', true, '2024-01-17T10:00:00Z', '2024-01-17T10:00:00Z'),
('user_4', 'sara.hassan@email.com', '+218941234567', 'password123', 'Sara Hassan', 'buyer', 'https://picsum.photos/200/200?random=4', false, true, 'en', 'LYD', null, true, '2024-01-18T11:00:00Z', '2024-01-18T11:00:00Z'),
('user_5', 'omar.ahmed@email.com', '+218951234567', 'seller123', 'Omar Ahmed', 'seller', 'https://picsum.photos/200/200?random=5', true, true, 'ar', 'LYD', '{"instagram": "omar_properties"}', true, '2024-01-19T12:00:00Z', '2024-01-19T12:00:00Z'),
('user_6', 'layla.mohamed@email.com', '+218961234567', 'password123', 'Layla Mohamed', 'buyer', 'https://picsum.photos/200/200?random=6', true, false, 'ar', 'LYD', null, true, '2024-01-20T13:00:00Z', '2024-01-20T13:00:00Z'),
('user_7', 'khalid.ibrahim@email.com', '+218971234567', 'agent456', 'Khalid Ibrahim', 'agent', 'https://picsum.photos/200/200?random=7', true, true, 'en', 'LYD', '{"facebook": "khalid.properties", "website": "khalid-real-estate.ly"}', true, '2024-01-21T14:00:00Z', '2024-01-21T14:00:00Z'),
('user_8', 'nour.salem@email.com', '+218981234567', 'password123', 'Nour Salem', 'buyer', 'https://picsum.photos/200/200?random=8', true, true, 'ar', 'LYD', null, true, '2024-01-22T15:00:00Z', '2024-01-22T15:00:00Z'),
('user_9', 'youssef.omar@email.com', '+218991234567', 'seller789', 'Youssef Omar', 'seller', 'https://picsum.photos/200/200?random=9', true, false, 'ar', 'LYD', '{"instagram": "youssef_properties"}', true, '2024-01-23T16:00:00Z', '2024-01-23T16:00:00Z'),
('user_10', 'amina.ali@email.com', '+218901234567', 'password123', 'Amina Ali', 'buyer', 'https://picsum.photos/200/200?random=10', false, true, 'en', 'LYD', null, true, '2024-01-24T17:00:00Z', '2024-01-24T17:00:00Z');

-- Insert Properties
INSERT INTO properties (property_id, user_id, title, description, property_type, transaction_type, price, currency, bedrooms, bathrooms, size, governorate, city, neighborhood, address, latitude, longitude, property_features, status, expires_at, created_at, updated_at) VALUES
('prop_1', 'user_1', 'Modern Villa in Hay Al Andalus', 'Beautiful 4-bedroom villa with garden and garage. Perfect for families looking for comfort and luxury in a prime location.', 'villa', 'sale', 450000.00, 'LYD', 4, 3, 350.50, 'Tripoli', 'Tripoli City', 'Hay Al Andalus', 'Street 15, Building 23', 32.8872, 13.1913, '["parking", "garden", "security", "air_conditioning"]', 'active', '2024-04-15T08:00:00Z', '2024-01-15T08:30:00Z', '2024-01-15T08:30:00Z'),
('prop_2', 'user_3', 'Luxury Apartment in Ben Ashour', 'Spacious 3-bedroom apartment with sea view. Fully furnished with modern amenities and 24/7 security.', 'apartment', 'rent', 2500.00, 'LYD', 3, 2, 180.00, 'Tripoli', 'Tripoli City', 'Ben Ashour', 'Omar Mukhtar Street, Tower B, Floor 8', 32.8925, 13.1801, '["furnished", "sea_view", "elevator", "security"]', 'active', '2024-04-17T10:00:00Z', '2024-01-17T10:30:00Z', '2024-01-17T10:30:00Z'),
('prop_3', 'user_5', 'Commercial Shop in Souq Al Jumaa', 'Prime location commercial shop perfect for retail business. High foot traffic area with excellent visibility.', 'commercial', 'sale', 180000.00, 'LYD', 0, 1, 85.00, 'Tripoli', 'Tripoli City', 'Souq Al Jumaa', 'Main Market Street, Shop 45', 32.8654, 13.2043, '["high_traffic", "corner_location", "parking"]', 'active', '2024-04-19T12:00:00Z', '2024-01-19T12:30:00Z', '2024-01-19T12:30:00Z'),
('prop_4', 'user_7', 'Family House in Tajoura', 'Cozy 3-bedroom house with large yard. Great for families, close to schools and shopping centers.', 'house', 'rent', 1800.00, 'LYD', 3, 2, 200.00, 'Tripoli', 'Tajoura', 'Tajoura Center', 'Al Nasser Street, House 12', 32.8854, 13.2456, '["garden", "parking", "near_schools"]', 'active', '2024-04-21T14:00:00Z', '2024-01-21T14:30:00Z', '2024-01-21T14:30:00Z'),
('prop_5', 'user_9', 'Penthouse in Benghazi', 'Stunning penthouse with panoramic city views. 4 bedrooms, rooftop terrace, and premium finishes.', 'apartment', 'sale', 520000.00, 'LYD', 4, 3, 280.00, 'Benghazi', 'Benghazi City', 'Keesh', 'Tahrir Square, Building A, Top Floor', 32.1154, 20.0685, '["penthouse", "city_view", "terrace", "premium_finishes"]', 'active', '2024-04-23T16:00:00Z', '2024-01-23T16:30:00Z', '2024-01-23T16:30:00Z'),
('prop_6', 'user_1', 'Studio Apartment in Janzour', 'Modern studio apartment perfect for young professionals. Fully equipped kitchen and modern bathroom.', 'apartment', 'rent', 900.00, 'LYD', 1, 1, 45.00, 'Tripoli', 'Janzour', 'Janzour Center', 'Beach Road, Building 7, Apt 205', 32.8234, 13.0987, '["furnished", "beach_nearby", "modern"]', 'active', '2024-04-20T13:00:00Z', '2024-01-20T13:30:00Z', '2024-01-20T13:30:00Z'),
('prop_7', 'user_3', 'Office Space in Misrata', 'Professional office space in business district. Suitable for small to medium businesses.', 'commercial', 'rent', 3500.00, 'LYD', 0, 2, 120.00, 'Misrata', 'Misrata City', 'Misrata Center', 'Business District, Floor 3', 32.3743, 15.0919, '["business_district", "parking", "elevator"]', 'active', '2024-04-22T15:00:00Z', '2024-01-22T15:30:00Z', '2024-01-22T15:30:00Z'),
('prop_8', 'user_5', 'Land Plot in Zawiya', 'Residential land plot ready for construction. Great investment opportunity in developing area.', 'land', 'sale', 85000.00, 'LYD', 0, 0, 500.00, 'Zawiya', 'Zawiya City', null, 'New Development Area, Plot 18', 32.7569, 12.7278, '["residential_zoning", "utilities_ready"]', 'active', '2024-04-24T17:00:00Z', '2024-01-24T17:30:00Z', '2024-01-24T17:30:00Z'),
('prop_9', 'user_7', 'Duplex in Fashloom', 'Spacious duplex with 5 bedrooms. Perfect for large families, includes garage and garden.', 'duplex', 'sale', 380000.00, 'LYD', 5, 4, 320.00, 'Tripoli', 'Tripoli City', 'Fashloom', 'Green Valley Street, Villa 8', 32.8765, 13.1654, '["duplex", "large_family", "garage", "garden"]', 'active', '2024-04-25T18:00:00Z', '2024-01-25T18:30:00Z', '2024-01-25T18:30:00Z'),
('prop_10', 'user_9', 'Warehouse in Sebha', 'Large warehouse facility perfect for storage and distribution. Easy access to main roads.', 'commercial', 'rent', 5000.00, 'LYD', 0, 2, 800.00, 'Sebha', 'Sebha City', null, 'Industrial Zone, Warehouse 15', 27.0377, 14.4283, '["warehouse", "loading_dock", "security"]', 'active', '2024-04-26T19:00:00Z', '2024-01-26T19:30:00Z', '2024-01-26T19:30:00Z');

-- Insert Amenities
INSERT INTO amenities (amenity_id, amenity_name, name_en, name_ar, category, icon, is_active) VALUES
('amenity_1', 'parking', 'Parking', 'موقف سيارات', 'convenience', 'car', true),
('amenity_2', 'elevator', 'Elevator', 'مصعد', 'convenience', 'elevator', true),
('amenity_3', 'security', '24/7 Security', 'حراسة 24/7', 'safety', 'shield', true),
('amenity_4', 'pool', 'Swimming Pool', 'مسبح', 'recreation', 'pool', true),
('amenity_5', 'gym', 'Gym', 'صالة رياضية', 'recreation', 'gym', true),
('amenity_6', 'garden', 'Garden', 'حديقة', 'outdoor', 'tree', true),
('amenity_7', 'balcony', 'Balcony', 'شرفة', 'outdoor', 'balcony', true),
('amenity_8', 'air_conditioning', 'Air Conditioning', 'تكييف', 'comfort', 'snowflake', true),
('amenity_9', 'central_heating', 'Central Heating', 'تدفئة مركزية', 'comfort', 'thermometer', true),
('amenity_10', 'internet', 'Internet', 'إنترنت', 'technology', 'wifi', true);

-- Insert Property Media
INSERT INTO property_media (media_id, property_id, media_type, media_url, thumbnail_url, caption, display_order, is_primary, created_at) VALUES
('media_1', 'prop_1', 'image', 'https://picsum.photos/800/600?random=101', 'https://picsum.photos/200/150?random=101', 'Main entrance view', 1, true, '2024-01-15T08:35:00Z'),
('media_2', 'prop_1', 'image', 'https://picsum.photos/800/600?random=102', 'https://picsum.photos/200/150?random=102', 'Living room', 2, false, '2024-01-15T08:36:00Z'),
('media_3', 'prop_1', 'image', 'https://picsum.photos/800/600?random=103', 'https://picsum.photos/200/150?random=103', 'Master bedroom', 3, false, '2024-01-15T08:37:00Z'),
('media_4', 'prop_2', 'image', 'https://picsum.photos/800/600?random=104', 'https://picsum.photos/200/150?random=104', 'Apartment exterior', 1, true, '2024-01-17T10:35:00Z'),
('media_5', 'prop_2', 'image', 'https://picsum.photos/800/600?random=105', 'https://picsum.photos/200/150?random=105', 'Sea view from balcony', 2, false, '2024-01-17T10:36:00Z'),
('media_6', 'prop_3', 'image', 'https://picsum.photos/800/600?random=106', 'https://picsum.photos/200/150?random=106', 'Shop front view', 1, true, '2024-01-19T12:35:00Z'),
('media_7', 'prop_4', 'image', 'https://picsum.photos/800/600?random=107', 'https://picsum.photos/200/150?random=107', 'House exterior', 1, true, '2024-01-21T14:35:00Z'),
('media_8', 'prop_5', 'image', 'https://picsum.photos/800/600?random=108', 'https://picsum.photos/200/150?random=108', 'Penthouse view', 1, true, '2024-01-23T16:35:00Z'),
('media_9', 'prop_6', 'image', 'https://picsum.photos/800/600?random=109', 'https://picsum.photos/200/150?random=109', 'Studio interior', 1, true, '2024-01-20T13:35:00Z'),
('media_10', 'prop_7', 'image', 'https://picsum.photos/800/600?random=110', 'https://picsum.photos/200/150?random=110', 'Office space', 1, true, '2024-01-22T15:35:00Z');

-- Insert Property Amenities
INSERT INTO property_amenities (property_amenity_id, property_id, amenity_id) VALUES
('pa_1', 'prop_1', 'amenity_1'),
('pa_2', 'prop_1', 'amenity_6'),
('pa_3', 'prop_1', 'amenity_3'),
('pa_4', 'prop_2', 'amenity_2'),
('pa_5', 'prop_2', 'amenity_3'),
('pa_6', 'prop_2', 'amenity_8'),
('pa_7', 'prop_3', 'amenity_1'),
('pa_8', 'prop_4', 'amenity_6'),
('pa_9', 'prop_4', 'amenity_1'),
('pa_10', 'prop_5', 'amenity_2'),
('pa_11', 'prop_5', 'amenity_7'),
('pa_12', 'prop_6', 'amenity_8'),
('pa_13', 'prop_7', 'amenity_2'),
('pa_14', 'prop_7', 'amenity_1'),
('pa_15', 'prop_8', 'amenity_1');

-- Insert Favorite Lists
INSERT INTO favorite_lists (list_id, user_id, list_name, description, is_public, created_at, updated_at) VALUES
('list_1', 'user_2', 'Dream Homes', 'Properties I would love to buy in the future', false, '2024-01-16T09:30:00Z', '2024-01-16T09:30:00Z'),
('list_2', 'user_4', 'Investment Properties', 'Good investment opportunities', false, '2024-01-18T11:30:00Z', '2024-01-18T11:30:00Z'),
('list_3', 'user_6', 'Rental Options', 'Apartments and houses for rent', false, '2024-01-20T13:30:00Z', '2024-01-20T13:30:00Z'),
('list_4', 'user_8', 'Family Homes', 'Properties suitable for families', false, '2024-01-22T15:30:00Z', '2024-01-22T15:30:00Z'),
('list_5', 'user_10', 'Budget Friendly', 'Affordable properties', false, '2024-01-24T17:30:00Z', '2024-01-24T17:30:00Z');

-- Insert Favorites
INSERT INTO favorites (favorite_id, user_id, property_id, favorite_list_id, notes, created_at) VALUES
('fav_1', 'user_2', 'prop_1', 'list_1', 'Beautiful villa, perfect location', '2024-01-16T09:45:00Z'),
('fav_2', 'user_2', 'prop_2', 'list_1', 'Love the sea view', '2024-01-16T10:00:00Z'),
('fav_3', 'user_4', 'prop_3', 'list_2', 'Good commercial investment', '2024-01-18T11:45:00Z'),
('fav_4', 'user_4', 'prop_8', 'list_2', 'Land investment opportunity', '2024-01-18T12:00:00Z'),
('fav_5', 'user_6', 'prop_2', 'list_3', 'Suitable rental price', '2024-01-20T13:45:00Z'),
('fav_6', 'user_6', 'prop_4', 'list_3', 'Good family house', '2024-01-20T14:00:00Z'),
('fav_7', 'user_8', 'prop_1', 'list_4', 'Perfect for our family', '2024-01-22T15:45:00Z'),
('fav_8', 'user_8', 'prop_9', 'list_4', 'Spacious duplex', '2024-01-22T16:00:00Z'),
('fav_9', 'user_10', 'prop_6', 'list_5', 'Affordable studio', '2024-01-24T17:45:00Z'),
('fav_10', 'user_10', 'prop_4', 'list_5', 'Reasonable rent', '2024-01-24T18:00:00Z');

-- Insert Saved Searches
INSERT INTO saved_searches (search_id, user_id, search_name, governorate, property_type, transaction_type, price_min, price_max, bedrooms, alert_frequency, is_active, created_at, updated_at) VALUES
('search_1', 'user_2', 'Tripoli Villas', 'Tripoli', 'villa', 'sale', 300000.00, 500000.00, 3, 'daily', true, '2024-01-16T09:15:00Z', '2024-01-16T09:15:00Z'),
('search_2', 'user_4', 'Investment Properties', null, 'commercial', 'sale', 100000.00, 300000.00, null, 'weekly', true, '2024-01-18T11:15:00Z', '2024-01-18T11:15:00Z'),
('search_3', 'user_6', 'Rental Apartments', 'Tripoli', 'apartment', 'rent', 1000.00, 3000.00, 2, 'daily', true, '2024-01-20T13:15:00Z', '2024-01-20T13:15:00Z'),
('search_4', 'user_8', 'Family Houses', null, 'house', 'rent', 1500.00, 2500.00, 3, 'daily', true, '2024-01-22T15:15:00Z', '2024-01-22T15:15:00Z'),
('search_5', 'user_10', 'Benghazi Properties', 'Benghazi', null, 'sale', 200000.00, 600000.00, null, 'weekly', true, '2024-01-24T17:15:00Z', '2024-01-24T17:15:00Z');

-- Insert Conversations
INSERT INTO conversations (conversation_id, property_id, buyer_id, seller_id, last_message_at, is_archived, created_at, updated_at) VALUES
('conv_1', 'prop_1', 'user_2', 'user_1', '2024-01-16T10:30:00Z', false, '2024-01-16T10:00:00Z', '2024-01-16T10:30:00Z'),
('conv_2', 'prop_2', 'user_4', 'user_3', '2024-01-18T12:15:00Z', false, '2024-01-18T12:00:00Z', '2024-01-18T12:15:00Z'),
('conv_3', 'prop_3', 'user_6', 'user_5', '2024-01-20T14:45:00Z', false, '2024-01-20T14:30:00Z', '2024-01-20T14:45:00Z'),
('conv_4', 'prop_4', 'user_8', 'user_7', '2024-01-22T16:20:00Z', false, '2024-01-22T16:00:00Z', '2024-01-22T16:20:00Z'),
('conv_5', 'prop_5', 'user_10', 'user_9', '2024-01-24T18:10:00Z', false, '2024-01-24T18:00:00Z', '2024-01-24T18:10:00Z');

-- Insert Messages
INSERT INTO messages (message_id, conversation_id, sender_id, recipient_id, message_content, message_type, is_read, created_at) VALUES
('msg_1', 'conv_1', 'user_2', 'user_1', 'Hello, I am interested in your villa. Is it still available?', 'text', true, '2024-01-16T10:00:00Z'),
('msg_2', 'conv_1', 'user_1', 'user_2', 'Yes, it is still available. Would you like to schedule a viewing?', 'text', true, '2024-01-16T10:15:00Z'),
('msg_3', 'conv_1', 'user_2', 'user_1', 'That would be great! When are you available this week?', 'text', false, '2024-01-16T10:30:00Z'),
('msg_4', 'conv_2', 'user_4', 'user_3', 'Is the apartment furnished as shown in the pictures?', 'text', true, '2024-01-18T12:00:00Z'),
('msg_5', 'conv_2', 'user_3', 'user_4', 'Yes, it comes fully furnished with all the items shown.', 'text', false, '2024-01-18T12:15:00Z'),
('msg_6', 'conv_3', 'user_6', 'user_5', 'What is the exact location of this commercial property?', 'text', true, '2024-01-20T14:30:00Z'),
('msg_7', 'conv_3', 'user_5', 'user_6', 'It is located in the main market area with high foot traffic.', 'text', false, '2024-01-20T14:45:00Z'),
('msg_8', 'conv_4', 'user_8', 'user_7', 'Can I bring my family to view the house this weekend?', 'text', true, '2024-01-22T16:00:00Z'),
('msg_9', 'conv_4', 'user_7', 'user_8', 'Absolutely! Saturday or Sunday would work. What time is convenient?', 'text', false, '2024-01-22T16:20:00Z'),
('msg_10', 'conv_5', 'user_10', 'user_9', 'Is the price negotiable for this penthouse?', 'text', true, '2024-01-24T18:00:00Z');

-- Insert Inquiries
INSERT INTO inquiries (inquiry_id, property_id, user_id, inquiry_type, message, contact_preference, phone_number, email, status, created_at, updated_at) VALUES
('inq_1', 'prop_1', 'user_2', 'viewing', 'I would like to schedule a viewing for this beautiful villa', 'phone', '+218921234567', 'fatima.omar@email.com', 'pending', '2024-01-16T11:00:00Z', '2024-01-16T11:00:00Z'),
('inq_2', 'prop_2', 'user_4', 'general', 'Can you provide more details about the building amenities?', 'email', '+218941234567', 'sara.hassan@email.com', 'responded', '2024-01-18T13:00:00Z', '2024-01-18T14:00:00Z'),
('inq_3', 'prop_3', 'user_6', 'price', 'Is there any room for negotiation on the price?', 'phone', '+218961234567', 'layla.mohamed@email.com', 'pending', '2024-01-20T15:00:00Z', '2024-01-20T15:00:00Z'),
('inq_4', 'prop_4', 'user_8', 'viewing', 'Would like to bring family for house viewing this weekend', 'whatsapp', '+218981234567', 'nour.salem@email.com', 'responded', '2024-01-22T17:00:00Z', '2024-01-22T18:00:00Z'),
('inq_5', 'prop_5', 'user_10', 'general', 'What are the maintenance fees for this penthouse?', 'email', '+218901234567', 'amina.ali@email.com', 'pending', '2024-01-24T19:00:00Z', '2024-01-24T19:00:00Z');

-- Insert Property Views
INSERT INTO property_views (view_id, property_id, user_id, session_id, ip_address, device_type, view_duration_seconds, created_at) VALUES
('view_1', 'prop_1', 'user_2', 'sess_001', '192.168.1.100', 'mobile', 245, '2024-01-16T09:45:00Z'),
('view_2', 'prop_1', 'user_4', 'sess_002', '192.168.1.101', 'desktop', 180, '2024-01-16T14:30:00Z'),
('view_3', 'prop_2', 'user_6', 'sess_003', '192.168.1.102', 'tablet', 320, '2024-01-17T11:15:00Z'),
('view_4', 'prop_2', 'user_8', 'sess_004', '192.168.1.103', 'mobile', 195, '2024-01-17T16:45:00Z'),
('view_5', 'prop_3', 'user_10', 'sess_005', '192.168.1.104', 'desktop', 280, '2024-01-19T13:20:00Z'),
('view_6', 'prop_4', 'user_2', 'sess_006', '192.168.1.105', 'mobile', 150, '2024-01-21T15:10:00Z'),
('view_7', 'prop_5', 'user_4', 'sess_007', '192.168.1.106', 'desktop', 380, '2024-01-23T17:25:00Z'),
('view_8', 'prop_1', null, 'sess_008', '192.168.1.107', 'mobile', 120, '2024-01-25T10:00:00Z'),
('view_9', 'prop_2', null, 'sess_009', '192.168.1.108', 'desktop', 200, '2024-01-25T14:30:00Z'),
('view_10', 'prop_3', 'user_6', 'sess_010', '192.168.1.109', 'tablet', 340, '2024-01-25T18:15:00Z');

-- Insert Notifications
INSERT INTO notifications (notification_id, user_id, type, title, message, property_id, is_read, created_at) VALUES
('notif_1', 'user_2', 'new_property', 'New Property Match', 'A new villa in Tripoli matches your saved search criteria', 'prop_1', false, '2024-01-16T08:00:00Z'),
('notif_2', 'user_4', 'price_drop', 'Price Reduced', 'The price of a property in your favorites has been reduced', 'prop_2', true, '2024-01-18T10:00:00Z'),
('notif_3', 'user_6', 'inquiry_response', 'Inquiry Response', 'You have received a response to your property inquiry', 'prop_3', false, '2024-01-20T12:00:00Z'),
('notif_4', 'user_8', 'viewing_confirmed', 'Viewing Confirmed', 'Your property viewing has been confirmed for tomorrow', 'prop_4', true, '2024-01-22T14:00:00Z'),
('notif_5', 'user_10', 'new_message', 'New Message', 'You have a new message about your property inquiry', 'prop_5', false, '2024-01-24T16:00:00Z'),
('notif_6', 'user_1', 'property_viewed', 'Property Viewed', 'Your property has been viewed by a potential buyer', 'prop_1', true, '2024-01-16T09:45:00Z'),
('notif_7', 'user_3', 'inquiry_received', 'New Inquiry', 'You have received a new inquiry about your property', 'prop_2', false, '2024-01-18T13:00:00Z'),
('notif_8', 'user_5', 'favorite_added', 'Added to Favorites', 'Your property has been added to someone\'s favorites', 'prop_3', true, '2024-01-20T14:00:00Z'),
('notif_9', 'user_7', 'message_received', 'New Message', 'You have received a new message from a potential buyer', 'prop_4', false, '2024-01-22T16:00:00Z'),
('notif_10', 'user_9', 'viewing_request', 'Viewing Request', 'Someone has requested to view your property', 'prop_5', true, '2024-01-24T18:00:00Z');

-- Insert User Sessions
INSERT INTO user_sessions (session_id, user_id, token, device_info, ip_address, is_active, expires_at, last_activity, created_at) VALUES
('sess_user_1', 'user_1', 'token_123456789', '{"device": "iPhone 12", "os": "iOS 15.0", "browser": "Safari"}', '192.168.1.10', true, '2024-02-15T08:00:00Z', '2024-01-26T10:30:00Z', '2024-01-15T08:00:00Z'),
('sess_user_2', 'user_2', 'token_987654321', '{"device": "Samsung Galaxy", "os": "Android 12", "browser": "Chrome"}', '192.168.1.11', true, '2024-02-16T09:00:00Z', '2024-01-26T11:15:00Z', '2024-01-16T09:00:00Z'),
('sess_user_3', 'user_3', 'token_456789123', '{"device": "MacBook Pro", "os": "macOS 12", "browser": "Chrome"}', '192.168.1.12', true, '2024-02-17T10:00:00Z', '2024-01-26T09:45:00Z', '2024-01-17T10:00:00Z'),
('sess_user_4', 'user_4', 'token_789123456', '{"device": "Windows PC", "os": "Windows 11", "browser": "Edge"}', '192.168.1.13', false, '2024-02-18T11:00:00Z', '2024-01-25T16:20:00Z', '2024-01-18T11:00:00Z'),
('sess_user_5', 'user_5', 'token_321654987', '{"device": "iPad", "os": "iPadOS 15", "browser": "Safari"}', '192.168.1.14', true, '2024-02-19T12:00:00Z', '2024-01-26T14:10:00Z', '2024-01-19T12:00:00Z');

-- Insert Property Reports
INSERT INTO property_reports (report_id, property_id, reporter_id, report_type, reason, description, status, created_at) VALUES
('report_1', 'prop_3', 'user_2', 'misleading', 'Incorrect information', 'The property description does not match the actual condition', 'pending', '2024-01-20T16:00:00Z'),
('report_2', 'prop_5', 'user_4', 'inappropriate', 'Inappropriate photos', 'Some photos seem to be from a different property', 'under_review', '2024-01-24T20:00:00Z'),
('report_3', 'prop_7', 'user_6', 'spam', 'Duplicate listing', 'This property appears to be listed multiple times', 'resolved', '2024-01-23T12:00:00Z'),
('report_4', 'prop_2', 'user_8', 'scam', 'Suspicious pricing', 'The price seems too good to be true for this location', 'pending', '2024-01-18T15:00:00Z'),
('report_5', 'prop_9', 'user_10', 'outdated', 'Property no longer available', 'The owner confirmed this property is already sold', 'resolved', '2024-01-26T11:00:00Z');

-- Insert User Verification
INSERT INTO user_verification (verification_id, user_id, verification_type, document_url, status, created_at, updated_at) VALUES
('verif_1', 'user_1', 'identity', 'https://picsum.photos/600/400?random=201', 'verified', '2024-01-15T09:00:00Z', '2024-01-16T10:00:00Z'),
('verif_2', 'user_3', 'professional_license', 'https://picsum.photos/600/400?random=202', 'verified', '2024-01-17T11:00:00Z', '2024-01-18T09:00:00Z'),
('verif_3', 'user_5', 'identity', 'https://picsum.photos/600/400?random=203', 'pending', '2024-01-19T13:00:00Z', '2024-01-19T13:00:00Z'),
('verif_4', 'user_7', 'business_license', 'https://picsum.photos/600/400?random=204', 'verified', '2024-01-21T15:00:00Z', '2024-01-22T11:00:00Z'),
('verif_5', 'user_9', 'identity', 'https://picsum.photos/600/400?random=205', 'rejected', '2024-01-23T17:00:00Z', '2024-01-24T14:00:00Z');

-- Insert Comparison Sessions
INSERT INTO comparison_sessions (comparison_id, user_id, session_token, property_ids, share_token, created_at, updated_at) VALUES
('comp_1', 'user_2', 'comp_token_1', '["prop_1", "prop_2", "prop_4"]', 'share_123', '2024-01-20T10:00:00Z', '2024-01-20T10:30:00Z'),
('comp_2', 'user_4', 'comp_token_2', '["prop_3", "prop_7", "prop_10"]', 'share_456', '2024-01-22T14:00:00Z', '2024-01-22T14:45:00Z'),
('comp_3', 'user_6', 'comp_token_3', '["prop_2", "prop_6"]', null, '2024-01-24T16:00:00Z', '2024-01-24T16:15:00Z'),
('comp_4', null, 'comp_token_4', '["prop_1", "prop_5"]', 'share_789', '2024-01-25T11:00:00Z', '2024-01-25T11:20:00Z'),
('comp_5', 'user_8', 'comp_token_5', '["prop_4", "prop_9"]', null, '2024-01-26T13:00:00Z', '2024-01-26T13:25:00Z');

-- Insert Search Analytics
INSERT INTO search_analytics (search_id, user_id, session_id, search_query, filters_applied, results_count, clicked_properties, search_duration_seconds, created_at) VALUES
('analytics_1', 'user_2', 'sess_001', 'villa tripoli', '{"governorate": "Tripoli", "property_type": "villa", "price_max": 500000}', 15, '["prop_1", "prop_9"]', 180, '2024-01-16T09:30:00Z'),
('analytics_2', 'user_4', 'sess_002', 'commercial investment', '{"transaction_type": "sale", "property_type": "commercial"}', 8, '["prop_3", "prop_7"]', 240, '2024-01-18T11:45:00Z'),
('analytics_3', 'user_6', 'sess_003', 'apartment rent benashour', '{"city": "Tripoli City", "transaction_type": "rent", "bedrooms": 3}', 12, '["prop_2"]', 160, '2024-01-20T13:20:00Z'),
('analytics_4', null, 'sess_008', 'house family', '{"property_type": "house", "bedrooms": 3}', 20, '["prop_4", "prop_9"]', 300, '2024-01-22T15:10:00Z'),
('analytics_5', 'user_8', 'sess_004', 'penthouse luxury', '{"property_type": "apartment", "price_min": 400000}', 5, '["prop_5"]', 420, '2024-01-24T17:30:00Z'),
('analytics_6', 'user_10', 'sess_005', 'studio affordable', '{"property_type": "apartment", "bedrooms": 1, "price_max": 1000}', 18, '["prop_6"]', 95, '2024-01-25T12:15:00Z'),
('analytics_7', null, 'sess_009', 'warehouse sebha', '{"governorate": "Sebha", "property_type": "commercial"}', 3, '["prop_10"]', 200, '2024-01-25T16:45:00Z'),
('analytics_8', 'user_4', 'sess_007', 'land investment', '{"property_type": "land", "transaction_type": "sale"}', 25, '["prop_8"]', 350, '2024-01-26T09:20:00Z'),
('analytics_9', 'user_6', 'sess_010', 'duplex family', '{"property_type": "duplex", "bedrooms": 4}', 7, '["prop_9"]', 180, '2024-01-26T14:30:00Z'),
('analytics_10', null, 'sess_011', 'properties misrata', '{"governorate": "Misrata"}', 30, '["prop_6", "prop_7"]', 280, '2024-01-26T18:45:00Z');