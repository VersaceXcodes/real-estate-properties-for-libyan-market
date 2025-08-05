import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Import Postgres
import pkg from 'pg';
const { Pool } = pkg;

// Import Zod schemas
import {
  userSchema, createUserInputSchema, updateUserInputSchema, searchUsersInputSchema,
  governorateSchema, createGovernorateInputSchema, updateGovernorateInputSchema, searchGovernoratesInputSchema,
  citySchema, createCityInputSchema, updateCityInputSchema, searchCitiesInputSchema,
  neighborhoodSchema, createNeighborhoodInputSchema, updateNeighborhoodInputSchema, searchNeighborhoodsInputSchema,
  propertySchema, createPropertyInputSchema, updatePropertyInputSchema, searchPropertiesInputSchema,
  propertyMediaSchema, createPropertyMediaInputSchema, updatePropertyMediaInputSchema, searchPropertyMediaInputSchema,
  amenitySchema, createAmenityInputSchema, updateAmenityInputSchema, searchAmenitiesInputSchema,
  propertyAmenitySchema, createPropertyAmenityInputSchema, bulkCreatePropertyAmenitiesInputSchema,
  favoriteListSchema, createFavoriteListInputSchema, updateFavoriteListInputSchema, searchFavoriteListsInputSchema,
  favoriteSchema, createFavoriteInputSchema, updateFavoriteInputSchema, searchFavoritesInputSchema,
  savedSearchSchema, createSavedSearchInputSchema, updateSavedSearchInputSchema, searchSavedSearchesInputSchema,
  conversationSchema, createConversationInputSchema, updateConversationInputSchema, searchConversationsInputSchema,
  messageSchema, createMessageInputSchema, updateMessageInputSchema, searchMessagesInputSchema,
  inquirySchema, createInquiryInputSchema, updateInquiryInputSchema, searchInquiriesInputSchema,
  propertyViewSchema, createPropertyViewInputSchema, searchPropertyViewsInputSchema,
  notificationSchema, createNotificationInputSchema, updateNotificationInputSchema, searchNotificationsInputSchema,
  userSessionSchema, createUserSessionInputSchema, updateUserSessionInputSchema,
  propertyReportSchema, createPropertyReportInputSchema, updatePropertyReportInputSchema, searchPropertyReportsInputSchema,
  userVerificationSchema, createUserVerificationInputSchema, updateUserVerificationInputSchema, searchUserVerificationsInputSchema,
  comparisonSessionSchema, createComparisonSessionInputSchema, updateComparisonSessionInputSchema, searchComparisonSessionsInputSchema,
  searchAnalyticsSchema, createSearchAnalyticsInputSchema, searchAnalyticsInputSchema
} from './schema.ts';

dotenv.config();

// Database setup
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432, JWT_SECRET = 'your-secret-key' } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'storage');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/*
Authentication middleware for protected routes
Validates JWT tokens and adds user information to request object
*/
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT user_id, email, name, user_type, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/*
Property ownership verification middleware
Ensures user can only modify their own properties
*/
const verifyPropertyOwnership = async (req, res, next) => {
  try {
    const propertyId = req.params.property_id;
    const userId = req.user.user_id;

    const result = await pool.query('SELECT user_id FROM properties WHERE property_id = $1', [propertyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (result.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to modify this property' });
    }

    next();
  } catch (error) {
    console.error('Property ownership verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ===== AUTHENTICATION ENDPOINTS =====

/*
User registration endpoint
Creates new user account with validation and JWT token generation
*/
app.post('/auth/register', async (req, res) => {
  try {
    const validatedData = createUserInputSchema.parse(req.body);
    const { email, password, name, user_type, phone, language = 'ar', business_name, professional_license } = validatedData;

    // Check if user exists
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate user ID and timestamps
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Create user - NO HASHING - store password directly for development
    const result = await pool.query(
      `INSERT INTO users (
        user_id, email, phone, password_hash, name, user_type, 
        email_verified, phone_verified, language, currency,
        notification_email, notification_sms, notification_push, notification_whatsapp,
        professional_license, business_name, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING user_id, email, name, user_type, language, currency, created_at`,
      [
        userId, email.toLowerCase().trim(), phone, password, name.trim(), user_type,
        false, false, language, 'LYD',
        true, true, true, true,
        professional_license, business_name, true, now, now
      ]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Create user session
    const sessionId = uuidv4();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await pool.query(
      `INSERT INTO user_sessions (session_id, user_id, token, device_info, ip_address, user_agent, is_active, expires_at, last_activity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        sessionId, userId, token, 
        JSON.stringify({ device: req.get('User-Agent') }), 
        req.ip, req.get('User-Agent'),
        true, sessionExpiry, now, now
      ]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        language: user.language,
        currency: user.currency,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
User login endpoint
Authenticates user credentials and returns JWT token
*/
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, remember_me = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user - NO HASHING - direct password comparison for development
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password (direct comparison for development)
    if (password !== user.password_hash) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = $1 WHERE user_id = $2', [new Date().toISOString(), user.user_id]);

    // Generate JWT
    const expiresIn = remember_me ? '30d' : '7d';
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn }
    );

    // Create user session
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    const sessionExpiry = new Date(Date.now() + (remember_me ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString();
    
    await pool.query(
      `INSERT INTO user_sessions (session_id, user_id, token, device_info, ip_address, user_agent, is_active, expires_at, last_activity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        sessionId, user.user_id, token,
        JSON.stringify({ device: req.get('User-Agent'), remember_me }),
        req.ip, req.get('User-Agent'),
        true, sessionExpiry, now, now
      ]
    );

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        language: user.language,
        currency: user.currency,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
User logout endpoint
Invalidates current user session
*/
app.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Invalidate session
    await pool.query('UPDATE user_sessions SET is_active = false WHERE token = $1', [token]);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Password reset request endpoint
@@need:external-api: Email service for sending password reset links
*/
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    
    if (result.rows.length > 0) {
      // Generate reset token
      const resetToken = uuidv4();
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      await pool.query(
        'UPDATE users SET verification_code = $1, verification_code_expires = $2 WHERE email = $3',
        [resetToken, expires, email.toLowerCase().trim()]
      );

      // Mock email service response
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'Password reset email sent if account exists' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Password reset with token endpoint
Validates reset token and updates user password
*/
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const result = await pool.query(
      'SELECT user_id FROM users WHERE verification_code = $1 AND verification_code_expires > $2',
      [token, new Date().toISOString()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, verification_code = NULL, verification_code_expires = NULL WHERE verification_code = $2',
      [password, token]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Email verification endpoint
@@need:external-api: Email service for sending verification emails
*/
app.post('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const result = await pool.query(
      'SELECT user_id FROM users WHERE verification_code = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    await pool.query(
      'UPDATE users SET email_verified = true, verification_code = NULL WHERE verification_code = $1',
      [token]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Phone verification endpoint
@@need:external-api: SMS service for sending verification codes
*/
app.post('/auth/verify-phone', authenticateToken, async (req, res) => {
  try {
    const { verification_code } = req.body;

    if (!verification_code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    const result = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND verification_code = $2',
      [req.user.user_id, verification_code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    await pool.query(
      'UPDATE users SET phone_verified = true, verification_code = NULL WHERE user_id = $1',
      [req.user.user_id]
    );

    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== USER MANAGEMENT ENDPOINTS =====

/*
Get current user profile endpoint
Returns authenticated user's profile information
*/
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, email, phone, name, user_type, profile_photo, email_verified, phone_verified,
       language, currency, notification_email, notification_sms, notification_push, notification_whatsapp,
       professional_license, business_name, business_registration, bio, website, social_media_links,
       is_active, last_login, created_at, updated_at
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update current user profile endpoint
Allows users to modify their profile information
*/
app.put('/users/me', authenticateToken, async (req, res) => {
  try {
    const validatedData = updateUserInputSchema.parse({ ...req.body, user_id: req.user.user_id });
    const {
      name, phone, profile_photo, language, currency,
      notification_email, notification_sms, notification_push, notification_whatsapp,
      business_name, bio, website, social_media_links
    } = validatedData;

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount++}`);
      updateValues.push(phone);
    }
    if (profile_photo !== undefined) {
      updateFields.push(`profile_photo = $${paramCount++}`);
      updateValues.push(profile_photo);
    }
    if (language !== undefined) {
      updateFields.push(`language = $${paramCount++}`);
      updateValues.push(language);
    }
    if (currency !== undefined) {
      updateFields.push(`currency = $${paramCount++}`);
      updateValues.push(currency);
    }
    if (notification_email !== undefined) {
      updateFields.push(`notification_email = $${paramCount++}`);
      updateValues.push(notification_email);
    }
    if (notification_sms !== undefined) {
      updateFields.push(`notification_sms = $${paramCount++}`);
      updateValues.push(notification_sms);
    }
    if (notification_push !== undefined) {
      updateFields.push(`notification_push = $${paramCount++}`);
      updateValues.push(notification_push);
    }
    if (notification_whatsapp !== undefined) {
      updateFields.push(`notification_whatsapp = $${paramCount++}`);
      updateValues.push(notification_whatsapp);
    }
    if (business_name !== undefined) {
      updateFields.push(`business_name = $${paramCount++}`);
      updateValues.push(business_name);
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      updateValues.push(bio);
    }
    if (website !== undefined) {
      updateFields.push(`website = $${paramCount++}`);
      updateValues.push(website);
    }
    if (social_media_links !== undefined) {
      updateFields.push(`social_media_links = $${paramCount++}`);
      updateValues.push(JSON.stringify(social_media_links));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date().toISOString());
    updateValues.push(req.user.user_id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Get public user profile endpoint
Returns limited public information about any user
*/
app.get('/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT user_id, name, user_type, profile_photo, email_verified, phone_verified,
       business_name, bio, website, created_at
       FROM users WHERE user_id = $1 AND is_active = true`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== LOCATION ENDPOINTS =====

/*
Get governorates endpoint
Returns all active governorates with bilingual names
*/
app.get('/governorates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM governorates WHERE is_active = true ORDER BY name_en ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get governorates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Get cities endpoint
Returns cities filtered by governorate with bilingual names
*/
app.get('/cities', async (req, res) => {
  try {
    const { governorate_id } = req.query;
    let query = 'SELECT * FROM cities WHERE is_active = true';
    const params = [];

    if (governorate_id) {
      query += ' AND governorate_id = $1';
      params.push(governorate_id);
    }

    query += ' ORDER BY name_en ASC';
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Get neighborhoods endpoint
Returns neighborhoods filtered by city with bilingual names
*/
app.get('/neighborhoods', async (req, res) => {
  try {
    const { city_id } = req.query;
    let query = 'SELECT * FROM neighborhoods WHERE is_active = true';
    const params = [];

    if (city_id) {
      query += ' AND city_id = $1';
      params.push(city_id);
    }

    query += ' ORDER BY name_en ASC';
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get neighborhoods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== AMENITIES ENDPOINTS =====

/*
Get amenities endpoint
Returns all available amenities with category filtering
*/
app.get('/amenities', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM amenities WHERE is_active = true';
    const params = [];

    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, name_en ASC';
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get amenities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== PROPERTY ENDPOINTS =====

/*
Property search endpoint with advanced filtering
Supports complex queries with location, price, specifications, and amenities
*/
app.get('/properties', async (req, res) => {
  try {
    const {
      query, governorate, city, neighborhood, property_type, transaction_type,
      price_min, price_max, bedrooms, bathrooms, size_min, size_max,
      property_age, furnished_status, has_garage, has_elevator, has_garden,
      has_pool, has_security, amenities, is_featured, is_verified,
      page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = [];
    const params = [];
    let paramCount = 1;

    // Base condition - only active properties
    whereConditions.push("p.status = 'active'");

    // Text search
    if (query) {
      whereConditions.push(`(p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
      params.push(`%${query}%`);
      paramCount++;
    }

    // Location filters
    if (governorate) {
      whereConditions.push(`p.governorate = $${paramCount}`);
      params.push(governorate);
      paramCount++;
    }
    if (city) {
      whereConditions.push(`p.city = $${paramCount}`);
      params.push(city);
      paramCount++;
    }
    if (neighborhood) {
      whereConditions.push(`p.neighborhood = $${paramCount}`);
      params.push(neighborhood);
      paramCount++;
    }

    // Property filters
    if (property_type) {
      whereConditions.push(`p.property_type = $${paramCount}`);
      params.push(property_type);
      paramCount++;
    }
    if (transaction_type) {
      whereConditions.push(`p.transaction_type = $${paramCount}`);
      params.push(transaction_type);
      paramCount++;
    }

    // Price range
    if (price_min) {
      whereConditions.push(`p.price >= $${paramCount}`);
      params.push(parseFloat(price_min));
      paramCount++;
    }
    if (price_max) {
      whereConditions.push(`p.price <= $${paramCount}`);
      params.push(parseFloat(price_max));
      paramCount++;
    }

    // Property specifications
    if (bedrooms) {
      whereConditions.push(`p.bedrooms = $${paramCount}`);
      params.push(parseInt(bedrooms));
      paramCount++;
    }
    if (bathrooms) {
      whereConditions.push(`p.bathrooms = $${paramCount}`);
      params.push(parseInt(bathrooms));
      paramCount++;
    }

    // Size range
    if (size_min) {
      whereConditions.push(`p.size >= $${paramCount}`);
      params.push(parseFloat(size_min));
      paramCount++;
    }
    if (size_max) {
      whereConditions.push(`p.size <= $${paramCount}`);
      params.push(parseFloat(size_max));
      paramCount++;
    }

    // Property characteristics
    if (property_age) {
      whereConditions.push(`p.property_age = $${paramCount}`);
      params.push(property_age);
      paramCount++;
    }
    if (furnished_status) {
      whereConditions.push(`p.furnished_status = $${paramCount}`);
      params.push(furnished_status);
      paramCount++;
    }

    // Boolean filters
    if (has_garage === 'true') {
      whereConditions.push('p.has_garage = true');
    }
    if (has_elevator === 'true') {
      whereConditions.push('p.has_elevator = true');
    }
    if (has_garden === 'true') {
      whereConditions.push('p.has_garden = true');
    }
    if (has_pool === 'true') {
      whereConditions.push('p.has_pool = true');
    }
    if (has_security === 'true') {
      whereConditions.push('p.has_security = true');
    }
    if (is_featured === 'true') {
      whereConditions.push('p.is_featured = true');
    }
    if (is_verified === 'true') {
      whereConditions.push('p.is_verified = true');
    }

    // Build main query
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Sorting
    const validSortFields = ['price', 'size', 'created_at', 'updated_at', 'view_count'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    const searchQuery = `
      SELECT 
        p.*,
        u.name as owner_name, u.user_type as owner_type, u.profile_photo as owner_photo,
        pm.media_url as primary_image, pm.thumbnail_url
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN property_media pm ON p.property_id = pm.property_id AND pm.is_primary = true
      ${whereClause}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(parseInt(limit), offset);

    const [propertiesResult, countResult] = await Promise.all([
      pool.query(searchQuery, params),
      pool.query(`SELECT COUNT(*) FROM properties p ${whereClause}`, params.slice(0, -2))
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Track search analytics
    const analyticsId = uuidv4();
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    const userId = req.user?.user_id || null;
    
    await pool.query(
      `INSERT INTO search_analytics (search_id, user_id, session_id, search_query, filters_applied, results_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        analyticsId, userId, sessionId, query || '', 
        JSON.stringify(req.query), totalCount, new Date().toISOString()
      ]
    );

    res.json({
      properties: propertiesResult.rows,
      total_count: totalCount,
      current_page: parseInt(page),
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    });
  } catch (error) {
    console.error('Property search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Get single property details endpoint
Returns comprehensive property information with media and amenities
*/
app.get('/properties/:property_id', async (req, res) => {
  try {
    const { property_id } = req.params;

    // Get property details
    const propertyResult = await pool.query(
      `SELECT p.*, u.name as owner_name, u.user_type as owner_type, u.profile_photo as owner_photo,
       u.email_verified as owner_email_verified, u.phone_verified as owner_phone_verified,
       u.business_name as owner_business_name
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.user_id
       WHERE p.property_id = $1`,
      [property_id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const property = propertyResult.rows[0];

    // Get property media
    const mediaResult = await pool.query(
      'SELECT * FROM property_media WHERE property_id = $1 ORDER BY display_order ASC',
      [property_id]
    );

    // Get property amenities
    const amenitiesResult = await pool.query(
      `SELECT a.* FROM amenities a
       JOIN property_amenities pa ON a.amenity_id = pa.amenity_id
       WHERE pa.property_id = $1 AND a.is_active = true`,
      [property_id]
    );

    // Increment view count
    await pool.query(
      'UPDATE properties SET view_count = view_count + 1 WHERE property_id = $1',
      [property_id]
    );

    // Track property view
    const viewId = uuidv4();
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    const userId = req.user?.user_id || null;
    
    await pool.query(
      `INSERT INTO property_views (view_id, property_id, user_id, session_id, ip_address, user_agent, device_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        viewId, property_id, userId, sessionId, 
        req.ip, req.get('User-Agent'), 
        req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
        new Date().toISOString()
      ]
    );

    res.json({
      ...property,
      media: mediaResult.rows,
      amenities: amenitiesResult.rows,
      owner: {
        name: property.owner_name,
        user_type: property.owner_type,
        profile_photo: property.owner_photo,
        email_verified: property.owner_email_verified,
        phone_verified: property.owner_phone_verified,
        business_name: property.owner_business_name
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Create property endpoint
Creates new property listing with comprehensive validation
*/
app.post('/properties', authenticateToken, async (req, res) => {
  try {
    const validatedData = createPropertyInputSchema.parse({ ...req.body, user_id: req.user.user_id });
    
    const propertyId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (validatedData.listing_duration || 90) * 24 * 60 * 60 * 1000).toISOString();

    const {
      title, description, property_type, transaction_type, price, price_negotiable = false,
      currency = 'LYD', bedrooms, bathrooms, size, size_unit = 'sqm',
      property_age, furnished_status, floor_level, total_floors, parking_spaces = 0,
      has_garage = false, has_elevator = false, has_garden = false, has_pool = false, has_security = false,
      governorate, city, neighborhood, address, latitude, longitude,
      rental_terms, deposit_amount, utilities_included, lease_duration, available_date,
      payment_terms, property_features, nearby_amenities, listing_duration = 90
    } = validatedData;

    const result = await pool.query(
      `INSERT INTO properties (
        property_id, user_id, title, description, property_type, transaction_type,
        price, price_negotiable, currency, bedrooms, bathrooms, size, size_unit,
        property_age, furnished_status, floor_level, total_floors, parking_spaces,
        has_garage, has_elevator, has_garden, has_pool, has_security,
        governorate, city, neighborhood, address, latitude, longitude,
        rental_terms, deposit_amount, utilities_included, lease_duration, available_date,
        payment_terms, property_features, nearby_amenities, status, listing_duration,
        expires_at, view_count, inquiry_count, favorite_count, contact_count,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
        $35, $36, $37, $38, $39, $40, $41, $42, $43, $44
      ) RETURNING *`,
      [
        propertyId, req.user.user_id, title, description, property_type, transaction_type,
        price, price_negotiable, currency, bedrooms, bathrooms, size, size_unit,
        property_age, furnished_status, floor_level, total_floors, parking_spaces,
        has_garage, has_elevator, has_garden, has_pool, has_security,
        governorate, city, neighborhood, address, latitude, longitude,
        JSON.stringify(rental_terms), deposit_amount, JSON.stringify(utilities_included),
        lease_duration, available_date, JSON.stringify(payment_terms),
        JSON.stringify(property_features), JSON.stringify(nearby_amenities),
        'draft', listing_duration, expiresAt, 0, 0, 0, 0, now, now
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create property error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update property endpoint
Allows property owners to modify their listings
*/
app.put('/properties/:property_id', authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    const validatedData = updatePropertyInputSchema.parse({ ...req.body, property_id });

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(validatedData).forEach(key => {
      if (key !== 'property_id' && validatedData[key] !== undefined) {
        if (['rental_terms', 'utilities_included', 'payment_terms', 'property_features', 'nearby_amenities'].includes(key)) {
          updateFields.push(`${key} = $${paramCount++}`);
          updateValues.push(JSON.stringify(validatedData[key]));
        } else {
          updateFields.push(`${key} = $${paramCount++}`);
          updateValues.push(validatedData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date().toISOString());
    updateValues.push(property_id);

    const query = `UPDATE properties SET ${updateFields.join(', ')} WHERE property_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update property error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Delete property endpoint
Removes property listing (soft delete by setting status to inactive)
*/
app.delete('/properties/:property_id', authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;

    await pool.query(
      "UPDATE properties SET status = 'inactive', updated_at = $1 WHERE property_id = $2",
      [new Date().toISOString(), property_id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update property status endpoint
Changes property status (active, inactive, sold, rented, draft)
*/
app.patch('/properties/:property_id/status', authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'sold', 'rented', 'draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    await pool.query(
      'UPDATE properties SET status = $1, updated_at = $2 WHERE property_id = $3',
      [status, new Date().toISOString(), property_id]
    );

    res.json({ message: 'Property status updated successfully' });
  } catch (error) {
    console.error('Update property status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== PROPERTY MEDIA ENDPOINTS =====

/*
Get property media endpoint
Returns all media files for a specific property
*/
app.get('/properties/:property_id/media', async (req, res) => {
  try {
    const { property_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM property_media WHERE property_id = $1 ORDER BY display_order ASC',
      [property_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get property media error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Upload property media endpoint
Handles media file uploads for properties
@@need:external-api: Cloud storage service for file uploads and CDN distribution
*/
app.post('/properties/:property_id/media', authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    const validatedData = createPropertyMediaInputSchema.parse({ ...req.body, property_id });

    const mediaId = uuidv4();
    const now = new Date().toISOString();

    // If this is set as primary, unset others
    if (validatedData.is_primary) {
      await pool.query(
        'UPDATE property_media SET is_primary = false WHERE property_id = $1',
        [property_id]
      );
    }

    const result = await pool.query(
      `INSERT INTO property_media (
        media_id, property_id, media_type, media_url, thumbnail_url,
        caption, display_order, is_primary, file_size, dimensions, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        mediaId, property_id, validatedData.media_type, validatedData.media_url,
        validatedData.thumbnail_url, validatedData.caption, validatedData.display_order,
        validatedData.is_primary, validatedData.file_size, 
        JSON.stringify(validatedData.dimensions), now
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload property media error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update media details endpoint
Allows modification of media metadata
*/
app.put('/media/:media_id', authenticateToken, async (req, res) => {
  try {
    const { media_id } = req.params;
    const validatedData = updatePropertyMediaInputSchema.parse({ ...req.body, media_id });

    // Verify media ownership through property ownership
    const ownershipResult = await pool.query(
      `SELECT pm.property_id FROM property_media pm
       JOIN properties p ON pm.property_id = p.property_id
       WHERE pm.media_id = $1 AND p.user_id = $2`,
      [media_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to modify this media' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.caption !== undefined) {
      updateFields.push(`caption = $${paramCount++}`);
      updateValues.push(validatedData.caption);
    }
    if (validatedData.display_order !== undefined) {
      updateFields.push(`display_order = $${paramCount++}`);
      updateValues.push(validatedData.display_order);
    }
    if (validatedData.is_primary !== undefined) {
      if (validatedData.is_primary) {
        // Unset other primary media for this property
        await pool.query(
          'UPDATE property_media SET is_primary = false WHERE property_id = $1',
          [ownershipResult.rows[0].property_id]
        );
      }
      updateFields.push(`is_primary = $${paramCount++}`);
      updateValues.push(validatedData.is_primary);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(media_id);
    const query = `UPDATE property_media SET ${updateFields.join(', ')} WHERE media_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update media error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Delete media file endpoint
Removes media from property listing
*/
app.delete('/media/:media_id', authenticateToken, async (req, res) => {
  try {
    const { media_id } = req.params;

    // Verify media ownership through property ownership
    const ownershipResult = await pool.query(
      `SELECT pm.property_id FROM property_media pm
       JOIN properties p ON pm.property_id = p.property_id
       WHERE pm.media_id = $1 AND p.user_id = $2`,
      [media_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to delete this media' });
    }

    await pool.query('DELETE FROM property_media WHERE media_id = $1', [media_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update property amenities endpoint
Bulk update of property amenities
*/
app.patch('/properties/:property_id/amenities', authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    const { amenity_ids } = req.body;

    if (!Array.isArray(amenity_ids)) {
      return res.status(400).json({ message: 'amenity_ids must be an array' });
    }

    // Delete existing amenities
    await pool.query('DELETE FROM property_amenities WHERE property_id = $1', [property_id]);

    // Insert new amenities
    if (amenity_ids.length > 0) {
      const insertValues = amenity_ids.map((amenityId, index) => 
        `('${uuidv4()}', '${property_id}', '${amenityId}')`
      ).join(', ');

      await pool.query(
        `INSERT INTO property_amenities (property_amenity_id, property_id, amenity_id) VALUES ${insertValues}`
      );
    }

    res.json({ message: 'Property amenities updated successfully' });
  } catch (error) {
    console.error('Update property amenities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== FAVORITES ENDPOINTS =====

/*
Get user favorites endpoint
Returns user's favorite properties with optional list filtering
*/
app.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const { favorite_list_id, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT f.*, p.title, p.price, p.currency, p.property_type, p.transaction_type,
             p.governorate, p.city, p.neighborhood, pm.media_url as primary_image
      FROM favorites f
      JOIN properties p ON f.property_id = p.property_id
      LEFT JOIN property_media pm ON p.property_id = pm.property_id AND pm.is_primary = true
      WHERE f.user_id = $1
    `;
    const params = [req.user.user_id];
    let paramCount = 2;

    if (favorite_list_id) {
      query += ` AND f.favorite_list_id = $${paramCount}`;
      params.push(favorite_list_id);
      paramCount++;
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const [favoritesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) FROM favorites WHERE user_id = $1${favorite_list_id ? ' AND favorite_list_id = $2' : ''}`,
        favorite_list_id ? [req.user.user_id, favorite_list_id] : [req.user.user_id]
      )
    ]);

    res.json({
      favorites: favoritesResult.rows,
      total_count: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Add to favorites endpoint
Adds property to user's favorites with duplicate prevention
*/
app.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const validatedData = createFavoriteInputSchema.parse({ ...req.body, user_id: req.user.user_id });

    // Check if already favorited
    const existingResult = await pool.query(
      'SELECT favorite_id FROM favorites WHERE user_id = $1 AND property_id = $2',
      [req.user.user_id, validatedData.property_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'Property already in favorites' });
    }

    // Verify property exists
    const propertyResult = await pool.query(
      'SELECT property_id FROM properties WHERE property_id = $1',
      [validatedData.property_id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const favoriteId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO favorites (favorite_id, user_id, property_id, favorite_list_id, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [favoriteId, req.user.user_id, validatedData.property_id, validatedData.favorite_list_id, validatedData.notes, now]
    );

    // Update property favorite count
    await pool.query(
      'UPDATE properties SET favorite_count = favorite_count + 1 WHERE property_id = $1',
      [validatedData.property_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add favorite error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update favorite endpoint
Modifies favorite notes or list assignment
*/
app.put('/favorites/:favorite_id', authenticateToken, async (req, res) => {
  try {
    const { favorite_id } = req.params;
    const validatedData = updateFavoriteInputSchema.parse({ ...req.body, favorite_id });

    // Verify favorite ownership
    const ownershipResult = await pool.query(
      'SELECT favorite_id FROM favorites WHERE favorite_id = $1 AND user_id = $2',
      [favorite_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.favorite_list_id !== undefined) {
      updateFields.push(`favorite_list_id = $${paramCount++}`);
      updateValues.push(validatedData.favorite_list_id);
    }
    if (validatedData.notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateValues.push(validatedData.notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(favorite_id);
    const query = `UPDATE favorites SET ${updateFields.join(', ')} WHERE favorite_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update favorite error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Remove from favorites endpoint
Removes property from user's favorites
*/
app.delete('/favorites/:favorite_id', authenticateToken, async (req, res) => {
  try {
    const { favorite_id } = req.params;

    // Get property ID before deletion for count update
    const favoriteResult = await pool.query(
      'SELECT property_id FROM favorites WHERE favorite_id = $1 AND user_id = $2',
      [favorite_id, req.user.user_id]
    );

    if (favoriteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    const propertyId = favoriteResult.rows[0].property_id;

    // Delete favorite
    await pool.query('DELETE FROM favorites WHERE favorite_id = $1', [favorite_id]);

    // Update property favorite count
    await pool.query(
      'UPDATE properties SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE property_id = $1',
      [propertyId]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== FAVORITE LISTS ENDPOINTS =====

/*
Get favorite lists endpoint
Returns user's favorite lists
*/
app.get('/favorite-lists', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fl.*, COUNT(f.favorite_id) as property_count
       FROM favorite_lists fl
       LEFT JOIN favorites f ON fl.list_id = f.favorite_list_id
       WHERE fl.user_id = $1
       GROUP BY fl.list_id
       ORDER BY fl.updated_at DESC`,
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get favorite lists error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Create favorite list endpoint
Creates new custom favorite list for organizing properties
*/
app.post('/favorite-lists', authenticateToken, async (req, res) => {
  try {
    const validatedData = createFavoriteListInputSchema.parse({ ...req.body, user_id: req.user.user_id });

    const listId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO favorite_lists (list_id, user_id, list_name, description, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [listId, req.user.user_id, validatedData.list_name, validatedData.description, validatedData.is_public, now, now]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create favorite list error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update favorite list endpoint
Modifies favorite list properties
*/
app.put('/favorite-lists/:list_id', authenticateToken, async (req, res) => {
  try {
    const { list_id } = req.params;
    const validatedData = updateFavoriteListInputSchema.parse({ ...req.body, list_id });

    // Verify list ownership
    const ownershipResult = await pool.query(
      'SELECT list_id FROM favorite_lists WHERE list_id = $1 AND user_id = $2',
      [list_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Favorite list not found' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.list_name !== undefined) {
      updateFields.push(`list_name = $${paramCount++}`);
      updateValues.push(validatedData.list_name);
    }
    if (validatedData.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(validatedData.description);
    }
    if (validatedData.is_public !== undefined) {
      updateFields.push(`is_public = $${paramCount++}`);
      updateValues.push(validatedData.is_public);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date().toISOString());
    updateValues.push(list_id);

    const query = `UPDATE favorite_lists SET ${updateFields.join(', ')} WHERE list_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update favorite list error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Delete favorite list endpoint
Removes favorite list and updates contained favorites
*/
app.delete('/favorite-lists/:list_id', authenticateToken, async (req, res) => {
  try {
    const { list_id } = req.params;

    // Verify list ownership
    const ownershipResult = await pool.query(
      'SELECT list_id FROM favorite_lists WHERE list_id = $1 AND user_id = $2',
      [list_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Favorite list not found' });
    }

    // Update favorites to remove list association
    await pool.query(
      'UPDATE favorites SET favorite_list_id = NULL WHERE favorite_list_id = $1',
      [list_id]
    );

    // Delete the list
    await pool.query('DELETE FROM favorite_lists WHERE list_id = $1', [list_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete favorite list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== SAVED SEARCHES ENDPOINTS =====

/*
Get saved searches endpoint
Returns user's saved search criteria and alert preferences
*/
app.get('/saved-searches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Create saved search endpoint
Saves search criteria for future alerts and quick access
*/
app.post('/saved-searches', authenticateToken, async (req, res) => {
  try {
    const validatedData = createSavedSearchInputSchema.parse({ ...req.body, user_id: req.user.user_id });

    const searchId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO saved_searches (
        search_id, user_id, search_name, governorate, city, neighborhood,
        property_type, transaction_type, price_min, price_max, bedrooms, bathrooms,
        size_min, size_max, property_age, furnished_status, amenities, additional_filters,
        alert_frequency, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *`,
      [
        searchId, req.user.user_id, validatedData.search_name, validatedData.governorate,
        validatedData.city, validatedData.neighborhood, validatedData.property_type,
        validatedData.transaction_type, validatedData.price_min, validatedData.price_max,
        validatedData.bedrooms, validatedData.bathrooms, validatedData.size_min, validatedData.size_max,
        validatedData.property_age, validatedData.furnished_status, JSON.stringify(validatedData.amenities),
        JSON.stringify(validatedData.additional_filters), validatedData.alert_frequency,
        validatedData.is_active, now, now
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create saved search error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update saved search endpoint
Modifies saved search criteria and preferences
*/
app.put('/saved-searches/:search_id', authenticateToken, async (req, res) => {
  try {
    const { search_id } = req.params;
    const validatedData = updateSavedSearchInputSchema.parse({ ...req.body, search_id });

    // Verify search ownership
    const ownershipResult = await pool.query(
      'SELECT search_id FROM saved_searches WHERE search_id = $1 AND user_id = $2',
      [search_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Saved search not found' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(validatedData).forEach(key => {
      if (key !== 'search_id' && validatedData[key] !== undefined) {
        if (['amenities', 'additional_filters'].includes(key)) {
          updateFields.push(`${key} = $${paramCount++}`);
          updateValues.push(JSON.stringify(validatedData[key]));
        } else {
          updateFields.push(`${key} = $${paramCount++}`);
          updateValues.push(validatedData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date().toISOString());
    updateValues.push(search_id);

    const query = `UPDATE saved_searches SET ${updateFields.join(', ')} WHERE search_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update saved search error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Delete saved search endpoint
Removes saved search and associated alerts
*/
app.delete('/saved-searches/:search_id', authenticateToken, async (req, res) => {
  try {
    const { search_id } = req.params;

    // Verify search ownership
    const ownershipResult = await pool.query(
      'SELECT search_id FROM saved_searches WHERE search_id = $1 AND user_id = $2',
      [search_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Saved search not found' });
    }

    await pool.query('DELETE FROM saved_searches WHERE search_id = $1', [search_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== MESSAGING ENDPOINTS =====

/*
Get conversations endpoint
Returns user's conversation list with latest message info
*/
app.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { property_id, is_archived = false } = req.query;

    let whereClause = 'WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND c.is_archived = $2';
    const params = [req.user.user_id, is_archived];
    let paramCount = 3;

    if (property_id) {
      whereClause += ` AND c.property_id = $${paramCount}`;
      params.push(property_id);
      paramCount++;
    }

    const query = `
      SELECT c.*, p.title as property_title, p.price as property_price, p.currency as property_currency,
             buyer.name as buyer_name, buyer.profile_photo as buyer_photo,
             seller.name as seller_name, seller.profile_photo as seller_photo,
             m.message_content as last_message_content, m.created_at as last_message_time,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.conversation_id AND recipient_id = $1 AND is_read = false) as unread_count
      FROM conversations c
      JOIN properties p ON c.property_id = p.property_id
      JOIN users buyer ON c.buyer_id = buyer.user_id
      JOIN users seller ON c.seller_id = seller.user_id
      LEFT JOIN messages m ON c.conversation_id = m.conversation_id AND m.created_at = c.last_message_at
      ${whereClause}
      ORDER BY c.last_message_at DESC NULLS LAST
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Create conversation endpoint
Initiates new conversation between buyer and seller
*/
app.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const validatedData = createConversationInputSchema.parse({ ...req.body, buyer_id: req.user.user_id });

    // Verify property exists and get seller info
    const propertyResult = await pool.query(
      'SELECT user_id as seller_id FROM properties WHERE property_id = $1',
      [validatedData.property_id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const actualSellerId = propertyResult.rows[0].seller_id;

    // Check if conversation already exists
    const existingResult = await pool.query(
      'SELECT conversation_id FROM conversations WHERE property_id = $1 AND buyer_id = $2 AND seller_id = $3',
      [validatedData.property_id, req.user.user_id, actualSellerId]
    );

    if (existingResult.rows.length > 0) {
      // Return existing conversation
      const existingConversation = await pool.query(
        'SELECT * FROM conversations WHERE conversation_id = $1',
        [existingResult.rows[0].conversation_id]
      );
      return res.json(existingConversation.rows[0]);
    }

    const conversationId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO conversations (conversation_id, property_id, buyer_id, seller_id, is_archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [conversationId, validatedData.property_id, req.user.user_id, actualSellerId, false, now, now]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create conversation error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Get conversation messages endpoint
Returns paginated messages for a specific conversation
*/
app.get('/conversations/:conversation_id/messages', authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is participant in conversation
    const participantResult = await pool.query(
      'SELECT conversation_id FROM conversations WHERE conversation_id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversation_id, req.user.user_id]
    );

    if (participantResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    const [messagesResult, countResult] = await Promise.all([
      pool.query(
        `SELECT m.*, u.name as sender_name, u.profile_photo as sender_photo
         FROM messages m
         JOIN users u ON m.sender_id = u.user_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [conversation_id, parseInt(limit), parseInt(offset)]
      ),
      pool.query(
        'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
        [conversation_id]
      )
    ]);

    res.json({
      messages: messagesResult.rows.reverse(), // Reverse to show chronological order
      total_count: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Send message endpoint
Sends new message in conversation with real-time delivery
*/
app.post('/conversations/:conversation_id/messages', authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const validatedData = createMessageInputSchema.parse({ ...req.body, conversation_id });

    // Verify user is participant in conversation
    const conversationResult = await pool.query(
      'SELECT buyer_id, seller_id FROM conversations WHERE conversation_id = $1',
      [conversation_id]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const { buyer_id, seller_id } = conversationResult.rows[0];
    
    if (req.user.user_id !== buyer_id && req.user.user_id !== seller_id) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    // Determine recipient
    const recipientId = req.user.user_id === buyer_id ? seller_id : buyer_id;

    const messageId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO messages (
        message_id, conversation_id, sender_id, recipient_id, message_content,
        message_type, attachment_url, is_read, is_system_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        messageId, conversation_id, req.user.user_id, recipientId,
        validatedData.message_content, validatedData.message_type,
        validatedData.attachment_url, false, validatedData.is_system_message, now
      ]
    );

    // Update conversation last message time
    await pool.query(
      'UPDATE conversations SET last_message_at = $1, updated_at = $1 WHERE conversation_id = $2',
      [now, conversation_id]
    );

    // Get sender info for real-time broadcast
    const senderResult = await pool.query(
      'SELECT name, profile_photo, user_type FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    const messageWithSender = {
      ...result.rows[0],
      sender_name: senderResult.rows[0].name,
      sender_photo: senderResult.rows[0].profile_photo,
      sender_type: senderResult.rows[0].user_type
    };

    // Emit real-time message
    io.to(`conversation_${conversation_id}`).emit('new_message', messageWithSender);
    io.to(`user_${recipientId}`).emit('notification', {
      type: 'new_message',
      conversation_id,
      message: messageWithSender
    });

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Send message error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Mark message as read endpoint
Updates message read status and triggers read receipts
*/
app.patch('/messages/:message_id/read', authenticateToken, async (req, res) => {
  try {
    const { message_id } = req.params;

    // Verify user is recipient of the message
    const messageResult = await pool.query(
      'SELECT conversation_id, sender_id FROM messages WHERE message_id = $1 AND recipient_id = $2',
      [message_id, req.user.user_id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    const now = new Date().toISOString();

    await pool.query(
      'UPDATE messages SET is_read = true, read_at = $1 WHERE message_id = $2',
      [now, message_id]
    );

    // Emit read receipt
    const { conversation_id, sender_id } = messageResult.rows[0];
    io.to(`conversation_${conversation_id}`).emit('message_read', {
      message_id,
      reader_id: req.user.user_id,
      read_at: now
    });

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== INQUIRIES ENDPOINTS =====

/*
Get inquiries endpoint
Returns property inquiries with filtering options
*/
app.get('/inquiries', authenticateToken, async (req, res) => {
  try {
    const { property_id, status, inquiry_type } = req.query;

    let whereClause = '';
    const params = [];
    let paramCount = 1;

    if (property_id) {
      // Get inquiries for specific property (owner only)
      const propertyResult = await pool.query(
        'SELECT user_id FROM properties WHERE property_id = $1',
        [property_id]
      );

      if (propertyResult.rows.length === 0) {
        return res.status(404).json({ message: 'Property not found' });
      }

      if (propertyResult.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json({ message: 'Not authorized to view inquiries for this property' });
      }

      whereClause = `WHERE i.property_id = $${paramCount}`;
      params.push(property_id);
      paramCount++;
    } else {
      // Get user's own inquiries
      whereClause = `WHERE i.user_id = $${paramCount}`;
      params.push(req.user.user_id);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND i.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (inquiry_type) {
      whereClause += ` AND i.inquiry_type = $${paramCount}`;
      params.push(inquiry_type);
      paramCount++;
    }

    const query = `
      SELECT i.*, p.title as property_title, p.price as property_price, p.currency as property_currency,
             u.name as inquirer_name, u.profile_photo as inquirer_photo, u.user_type as inquirer_type
      FROM inquiries i
      JOIN properties p ON i.property_id = p.property_id
      JOIN users u ON i.user_id = u.user_id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Create inquiry endpoint
Submits new property inquiry with notification to owner
*/
app.post('/inquiries', authenticateToken, async (req, res) => {
  try {
    const validatedData = createInquiryInputSchema.parse({ ...req.body, user_id: req.user.user_id });

    // Verify property exists
    const propertyResult = await pool.query(
      'SELECT user_id, title FROM properties WHERE property_id = $1',
      [validatedData.property_id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const inquiryId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO inquiries (
        inquiry_id, property_id, user_id, inquiry_type, message, contact_preference,
        phone_number, email, preferred_viewing_date, preferred_viewing_time,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        inquiryId, validatedData.property_id, req.user.user_id, validatedData.inquiry_type,
        validatedData.message, validatedData.contact_preference, validatedData.phone_number,
        validatedData.email, validatedData.preferred_viewing_date, validatedData.preferred_viewing_time,
        'pending', now, now
      ]
    );

    // Update property inquiry count
    await pool.query(
      'UPDATE properties SET inquiry_count = inquiry_count + 1 WHERE property_id = $1',
      [validatedData.property_id]
    );

    // Create notification for property owner
    const notificationId = uuidv4();
    const ownerId = propertyResult.rows[0].user_id;

    await pool.query(
      `INSERT INTO notifications (notification_id, user_id, type, title, message, property_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        notificationId, ownerId, 'inquiry_received',
        'New Property Inquiry',
        `You have received a new ${validatedData.inquiry_type} inquiry for your property`,
        validatedData.property_id, false, now
      ]
    );

    // Emit real-time notification
    io.to(`user_${ownerId}`).emit('new_inquiry', {
      inquiry_id: inquiryId,
      property_id: validatedData.property_id,
      property_title: propertyResult.rows[0].title,
      inquiry_type: validatedData.inquiry_type,
      message: validatedData.message,
      created_at: now
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create inquiry error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update inquiry endpoint
Updates inquiry status and response for property owners
*/
app.put('/inquiries/:inquiry_id', authenticateToken, async (req, res) => {
  try {
    const { inquiry_id } = req.params;
    const validatedData = updateInquiryInputSchema.parse({ ...req.body, inquiry_id });

    // Verify user owns the property for this inquiry
    const inquiryResult = await pool.query(
      `SELECT i.property_id, i.user_id as inquirer_id, p.user_id as property_owner_id
       FROM inquiries i
       JOIN properties p ON i.property_id = p.property_id
       WHERE i.inquiry_id = $1`,
      [inquiry_id]
    );

    if (inquiryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    if (inquiryResult.rows[0].property_owner_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Not authorized to update this inquiry' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(validatedData.status);
    }
    if (validatedData.response_message !== undefined) {
      updateFields.push(`response_message = $${paramCount++}`);
      updateValues.push(validatedData.response_message);
    }
    if (validatedData.responded_at !== undefined) {
      updateFields.push(`responded_at = $${paramCount++}`);
      updateValues.push(validatedData.responded_at);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date().toISOString());
    updateValues.push(inquiry_id);

    const query = `UPDATE inquiries SET ${updateFields.join(', ')} WHERE inquiry_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    // Create notification for inquirer if response provided
    if (validatedData.response_message) {
      const notificationId = uuidv4();
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO notifications (notification_id, user_id, type, title, message, property_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          notificationId, inquiryResult.rows[0].inquirer_id, 'inquiry_response',
          'Inquiry Response Received',
          'You have received a response to your property inquiry',
          inquiryResult.rows[0].property_id, false, now
        ]
      );

      // Emit real-time notification
      io.to(`user_${inquiryResult.rows[0].inquirer_id}`).emit('inquiry_response', {
        inquiry_id,
        status: validatedData.status,
        response_message: validatedData.response_message
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update inquiry error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== NOTIFICATIONS ENDPOINTS =====

/*
Get notifications endpoint
Returns user's notifications with filtering options
*/
app.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { is_read, type, limit = 20 } = req.query;

    let whereClause = 'WHERE user_id = $1';
    const params = [req.user.user_id];
    let paramCount = 2;

    if (is_read !== undefined) {
      whereClause += ` AND is_read = $${paramCount}`;
      params.push(is_read === 'true');
      paramCount++;
    }

    if (type) {
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    const [notificationsResult, unreadCountResult] = await Promise.all([
      pool.query(
        `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount}`,
        [...params, parseInt(limit)]
      ),
      pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [req.user.user_id]
      )
    ]);

    res.json({
      notifications: notificationsResult.rows,
      unread_count: parseInt(unreadCountResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Mark notification as read endpoint
Updates individual notification read status
*/
app.patch('/notifications/:notification_id/read', authenticateToken, async (req, res) => {
  try {
    const { notification_id } = req.params;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = $1 WHERE notification_id = $2 AND user_id = $3',
      [new Date().toISOString(), notification_id, req.user.user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Mark all notifications as read endpoint
Bulk update for all user notifications
*/
app.patch('/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true, read_at = $1 WHERE user_id = $2 AND is_read = false',
      [new Date().toISOString(), req.user.user_id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== COMPARISON ENDPOINTS =====

/*
Get comparisons endpoint
Returns user's property comparison sessions
*/
app.get('/comparisons', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM comparison_sessions WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Create comparison endpoint
Creates new property comparison session
*/
app.post('/comparisons', authenticateToken, async (req, res) => {
  try {
    const validatedData = createComparisonSessionInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    // Verify all properties exist
    const propertyIds = validatedData.property_ids;
    const propertyResult = await pool.query(
      `SELECT property_id, title, price, currency FROM properties WHERE property_id = ANY($1)`,
      [propertyIds]
    );

    if (propertyResult.rows.length !== propertyIds.length) {
      return res.status(400).json({ message: 'One or more properties not found' });
    }

    const comparisonId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO comparison_sessions (
        comparison_id, user_id, session_token, property_ids, comparison_data, share_token, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        comparisonId, req.user.user_id, validatedData.session_token,
        JSON.stringify(propertyIds), JSON.stringify(validatedData.comparison_data),
        validatedData.share_token, now, now
      ]
    );

    // Include property details in response
    const comparisonWithProperties = {
      ...result.rows[0],
      properties: propertyResult.rows
    };

    res.status(201).json(comparisonWithProperties);
  } catch (error) {
    console.error('Create comparison error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Get comparison details endpoint
Returns specific comparison with property details
*/
app.get('/comparisons/:comparison_id', async (req, res) => {
  try {
    const { comparison_id } = req.params;

    const comparisonResult = await pool.query(
      'SELECT * FROM comparison_sessions WHERE comparison_id = $1',
      [comparison_id]
    );

    if (comparisonResult.rows.length === 0) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    const comparison = comparisonResult.rows[0];
    const propertyIds = JSON.parse(comparison.property_ids);

    // Get property details
    const propertiesResult = await pool.query(
      `SELECT p.*, pm.media_url as primary_image
       FROM properties p
       LEFT JOIN property_media pm ON p.property_id = pm.property_id AND pm.is_primary = true
       WHERE p.property_id = ANY($1)`,
      [propertyIds]
    );

    res.json({
      ...comparison,
      properties: propertiesResult.rows
    });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Update comparison endpoint
Modifies comparison property list or data
*/
app.put('/comparisons/:comparison_id', authenticateToken, async (req, res) => {
  try {
    const { comparison_id } = req.params;
    const validatedData = updateComparisonSessionInputSchema.parse({ ...req.body, comparison_id });

    // Verify comparison ownership
    const ownershipResult = await pool.query(
      'SELECT comparison_id FROM comparison_sessions WHERE comparison_id = $1 AND user_id = $2',
      [comparison_id, req.user.user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.property_ids !== undefined) {
      updateFields.push(`property_ids = $${paramCount++}`);
      updateValues.push(JSON.stringify(validatedData.property_ids));
    }
    if (validatedData.comparison_data !== undefined) {
      updateFields.push(`comparison_data = $${paramCount++}`);
      updateValues.push(JSON.stringify(validatedData.comparison_data));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date().toISOString());
    updateValues.push(comparison_id);

    const query = `UPDATE comparison_sessions SET ${updateFields.join(', ')} WHERE comparison_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update comparison error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Delete comparison endpoint
Removes comparison session
*/
app.delete('/comparisons/:comparison_id', authenticateToken, async (req, res) => {
  try {
    const { comparison_id } = req.params;

    const result = await pool.query(
      'DELETE FROM comparison_sessions WHERE comparison_id = $1 AND user_id = $2',
      [comparison_id, req.user.user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete comparison error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== ANALYTICS ENDPOINTS =====

/*
Record property view endpoint
Tracks property views for analytics
*/
app.post('/property-views', async (req, res) => {
  try {
    const validatedData = createPropertyViewInputSchema.parse({
      ...req.body,
      user_id: req.user?.user_id || null
    });

    const viewId = uuidv4();
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO property_views (
        view_id, property_id, user_id, session_id, ip_address, user_agent,
        referrer_url, view_duration_seconds, device_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        viewId, validatedData.property_id, validatedData.user_id, validatedData.session_id,
        validatedData.ip_address || req.ip, validatedData.user_agent || req.get('User-Agent'),
        validatedData.referrer_url, validatedData.view_duration_seconds,
        validatedData.device_type, now
      ]
    );

    res.status(201).json({ message: 'Property view recorded' });
  } catch (error) {
    console.error('Record property view error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
Get property analytics endpoint
Returns comprehensive analytics for property owners
*/
app.get('/properties/:property_id/analytics', authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;

    // Get basic metrics
    const metricsResult = await pool.query(
      'SELECT view_count, inquiry_count, favorite_count, contact_count FROM properties WHERE property_id = $1',
      [property_id]
    );

    if (metricsResult.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get views by day for the last 30 days
    const viewsByDayResult = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM property_views
       WHERE property_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [property_id]
    );

    // Get device type breakdown
    const deviceBreakdownResult = await pool.query(
      `SELECT device_type, COUNT(*) as count
       FROM property_views
       WHERE property_id = $1 AND device_type IS NOT NULL
       GROUP BY device_type`,
      [property_id]
    );

    res.json({
      ...metricsResult.rows[0],
      views_by_day: viewsByDayResult.rows,
      device_breakdown: deviceBreakdownResult.rows
    });
  } catch (error) {
    console.error('Get property analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== REPORTS ENDPOINTS =====

/*
Report property endpoint
Allows users to report inappropriate property listings
*/
app.post('/property-reports', authenticateToken, async (req, res) => {
  try {
    const validatedData = createPropertyReportInputSchema.parse({
      ...req.body,
      reporter_id: req.user.user_id
    });

    const reportId = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO property_reports (
        report_id, property_id, reporter_id, report_type, reason, description, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        reportId, validatedData.property_id, validatedData.reporter_id,
        validatedData.report_type, validatedData.reason, validatedData.description,
        'pending', now
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Report property error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== WEBSOCKET IMPLEMENTATION =====

/*
WebSocket connection handler for real-time features
Manages user presence, messaging, and live notifications
*/
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT user_id, email, name FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return next(new Error('Invalid token'));
    }

    socket.user = result.rows[0];
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.user.user_id} connected`);

  // Join user-specific room for notifications
  socket.join(`user_${socket.user.user_id}`);

  /*
  Join room event handler
  Allows users to join specific conversation or property rooms
  */
  socket.on('join_room', async (data) => {
    try {
      const { room_type, room_id } = data;

      if (room_type === 'conversation') {
        // Verify user is participant in conversation
        const result = await pool.query(
          'SELECT conversation_id FROM conversations WHERE conversation_id = $1 AND (buyer_id = $2 OR seller_id = $2)',
          [room_id, socket.user.user_id]
        );

        if (result.rows.length > 0) {
          socket.join(`conversation_${room_id}`);
          socket.emit('room_joined', { room_type, room_id, status: 'joined' });
        } else {
          socket.emit('room_error', { message: 'Not authorized to join this conversation' });
        }
      } else if (room_type === 'property') {
        socket.join(`property_${room_id}`);
        socket.emit('room_joined', { room_type, room_id, status: 'joined' });
      }
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('room_error', { message: 'Failed to join room' });
    }
  });

  /*
  Typing indicator event handlers
  Manages real-time typing status in conversations
  */
  socket.on('typing_start', (data) => {
    const { conversation_id } = data;
    socket.to(`conversation_${conversation_id}`).emit('typing_indicator', {
      conversation_id,
      user_id: socket.user.user_id,
      user_name: socket.user.name,
      is_typing: true,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing_stop', (data) => {
    const { conversation_id } = data;
    socket.to(`conversation_${conversation_id}`).emit('typing_indicator', {
      conversation_id,
      user_id: socket.user.user_id,
      user_name: socket.user.name,
      is_typing: false,
      timestamp: new Date().toISOString()
    });
  });

  /*
  User presence management
  Tracks online/offline status for conversation participants
  */
  socket.on('update_presence', async (data) => {
    const { status } = data;
    
    // Update user session
    await pool.query(
      'UPDATE user_sessions SET last_activity = $1 WHERE user_id = $2 AND is_active = true',
      [new Date().toISOString(), socket.user.user_id]
    );

    // Broadcast presence update
    socket.broadcast.emit('user_presence', {
      user_id: socket.user.user_id,
      status,
      timestamp: new Date().toISOString()
    });
  });

  /*
  Disconnect handler
  Manages user offline status and cleanup
  */
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.user_id} disconnected`);
    
    // Update presence to offline
    socket.broadcast.emit('user_presence', {
      user_id: socket.user.user_id,
      status: 'offline',
      timestamp: new Date().toISOString()
    });
  });
});

/*
Mock function for sending email notifications
@@need:external-api: Email service integration for transactional emails and alerts
*/
async function sendEmailNotification({ to, subject, content, template_type }) {
  // Mock email service - replace with actual email provider integration
  console.log(`📧 Email sent to ${to}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Template: ${template_type}`);
  console.log(`Content: ${content}`);
  
  return {
    status: 'sent',
    message_id: uuidv4(),
    timestamp: new Date().toISOString()
  };
}

/*
Mock function for sending SMS notifications
@@need:external-api: SMS service integration for verification codes and urgent alerts
*/
async function sendSMSNotification({ phone, message, template_type }) {
  // Mock SMS service - replace with actual SMS provider integration
  console.log(`📱 SMS sent to ${phone}:`);
  console.log(`Template: ${template_type}`);
  console.log(`Message: ${message}`);
  
  return {
    status: 'sent',
    message_id: uuidv4(),
    timestamp: new Date().toISOString()
  };
}

/*
Mock function for geocoding addresses
@@need:external-api: Geocoding service for converting addresses to coordinates
*/
async function geocodeAddress({ address, city, governorate }) {
  // Mock geocoding service - replace with actual geocoding provider
  const mockCoordinates = {
    'Tripoli': { latitude: 32.8872, longitude: 13.1913 },
    'Benghazi': { latitude: 32.1154, longitude: 20.0685 },
    'Misrata': { latitude: 32.3743, longitude: 15.0919 },
    'Zawiya': { latitude: 32.7569, longitude: 12.7278 },
    'Sebha': { latitude: 27.0377, longitude: 14.4283 }
  };
  
  const coords = mockCoordinates[governorate] || { latitude: 32.8872, longitude: 13.1913 };
  
  return {
    latitude: coords.latitude + (Math.random() - 0.5) * 0.1,
    longitude: coords.longitude + (Math.random() - 0.5) * 0.1,
    formatted_address: `${address}, ${city}, ${governorate}, Libya`,
    accuracy: 'high'
  };
}

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'LibyanHomes Real Estate API', 
    version: '1.0.0',
    status: 'active',
    features: ['REST API', 'WebSocket', 'Authentication', 'Real-time Messaging']
  });
});

// Catch-all route for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export { app, pool };

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LibyanHomes API server running on port ${PORT}`);
  console.log(`📱 WebSocket server ready for real-time features`);
  console.log(`🗄️  Database connected and ready`);
  console.log(`🌐 Listening on 0.0.0.0:${PORT}`);
});