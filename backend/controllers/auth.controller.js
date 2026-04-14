const bcrypt = require('bcrypt');
const crypto = require('crypto');

const pool = require('../config/db');
const generateToken = require('../utils/generateToken');
const { sendPasswordResetEmail, getSmtpConfig } = require('../utils/mailer');
const { setAuthCookie, clearAuthCookie } = require('../utils/auth-cookie');

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function pickOptionalString(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value).trim();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    privacy_consent: !!user.privacy_consent,
    privacy_consent_at: user.privacy_consent_at || null,
    phone: user.phone || '',
    address_line_1: user.address_line_1 || '',
    address_line_2: user.address_line_2 || '',
    city: user.city || '',
    parish: user.parish || '',
    country: user.country || '',
    postal_code: user.postal_code || '',
    preferred_payment_method: user.preferred_payment_method || '',
    created_at: user.created_at
  };
}

async function findUserByEmail(email) {
  const [rows] = await pool.query(`
    SELECT
      id,
      name,
      email,
      password,
      role,
      privacy_consent,
      privacy_consent_at,
      phone,
      address_line_1,
      address_line_2,
      city,
      parish,
      country,
      postal_code,
      preferred_payment_method,
      created_at
    FROM users
    WHERE email = ?
    LIMIT 1
  `, [normalizeEmail(email)]);

  return rows[0] || null;
}

async function registerCustomer(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '').trim();
    const privacyConsent = req.body.privacyConsent === true;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (!privacyConsent) {
      return res.status(400).json({ message: 'Privacy policy consent is required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(`
      INSERT INTO users (name, email, password, role, country, privacy_consent, privacy_consent_at)
      VALUES (?, ?, ?, 'customer', 'Jamaica', ?, NOW())
    `, [name, email, hashedPassword, privacyConsent]);

    const user = {
      id: result.insertId,
      name,
      email,
      role: 'customer',
      country: 'Jamaica',
      privacy_consent: privacyConsent,
      privacy_consent_at: new Date().toISOString()
    };

    setAuthCookie(res, generateToken(user));

    res.status(201).json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

async function customerLogin(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);

    if (!user || user.role !== 'customer') {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    setAuthCookie(res, generateToken(user));

    res.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    setAuthCookie(res, generateToken(user));

    res.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await findUserByEmail(email);

    if (!user || user.role !== 'customer') {
      return res.json({
        message: 'If that email exists, a password reset link has been prepared.'
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await pool.query(`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = ?
        AND used_at IS NULL
    `, [user.id]);

    await pool.query(`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `, [user.id, tokenHash, expiresAt]);

    const frontendBaseUrl = (process.env.FRONTEND_URL
      || process.env.CORS_ORIGIN
      || 'http://localhost:4200')
      .split(',')
      .map(value => value.trim())
      .find(Boolean) || 'http://localhost:4200';
    const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password/${rawToken}`;
    const smtpConfigured = !!getSmtpConfig();
    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl
    });

    res.json({
      message: 'If that email exists, a password reset link has been prepared.',
      resetUrl: mailResult.sent || smtpConfigured ? undefined : resetUrl
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const token = String(req.body.token || '').trim();
    const password = String(req.body.password || '').trim();

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(`
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY id DESC
      LIMIT 1
    `, [tokenHash]);

    const resetToken = rows[0];

    if (!resetToken) {
      return res.status(400).json({ message: 'This password reset link is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(`
      UPDATE users
      SET password = ?
      WHERE id = ?
    `, [hashedPassword, resetToken.user_id]);

    await pool.query(`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = ?
    `, [resetToken.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully.' });
}

async function getCurrentUser(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        email,
        role,
        privacy_consent,
        privacy_consent_at,
        phone,
        address_line_1,
        address_line_2,
        city,
        parish,
        country,
        postal_code,
        preferred_payment_method,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `, [req.user.id]);

    if (!rows[0]) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user: sanitizeUser(rows[0]) });
  } catch (error) {
    next(error);
  }
}

async function updateCurrentUser(req, res, next) {
  try {
    const name = pickOptionalString(req.body.name);
    const phone = pickOptionalString(req.body.phone);
    const addressLine1 = pickOptionalString(req.body.addressLine1);
    const addressLine2 = pickOptionalString(req.body.addressLine2);
    const city = pickOptionalString(req.body.city);
    const parish = pickOptionalString(req.body.parish);
    const country = pickOptionalString(req.body.country);
    const postalCode = pickOptionalString(req.body.postalCode);
    const preferredPaymentMethod = pickOptionalString(req.body.preferredPaymentMethod);
    const currentPassword = pickOptionalString(req.body.currentPassword);
    const newPassword = pickOptionalString(req.body.newPassword);

    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        email,
        password,
        role,
        privacy_consent,
        privacy_consent_at,
        phone,
        address_line_1,
        address_line_2,
        city,
        parish,
        country,
        postal_code,
        preferred_payment_method,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `, [req.user.id]);

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextName = name || user.name;
    const nextPhone = phone;
    const nextAddressLine1 = addressLine1;
    const nextAddressLine2 = addressLine2;
    const nextCity = city;
    const nextParish = parish;
    const nextCountry = country || 'Jamaica';
    const nextPostalCode = postalCode;
    const nextPreferredPaymentMethod = preferredPaymentMethod;
    let nextPassword = user.password;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }

      const matches = await bcrypt.compare(currentPassword, user.password);

      if (!matches) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
      }

      nextPassword = await bcrypt.hash(newPassword, 10);
    }

    await pool.query(`
      UPDATE users
      SET
        name = ?,
        phone = ?,
        address_line_1 = ?,
        address_line_2 = ?,
        city = ?,
        parish = ?,
        country = ?,
        postal_code = ?,
        preferred_payment_method = ?,
        password = ?
      WHERE id = ?
    `, [
      nextName,
      nextPhone,
      nextAddressLine1,
      nextAddressLine2,
      nextCity,
      nextParish,
      nextCountry,
      nextPostalCode,
      nextPreferredPaymentMethod,
      nextPassword,
      user.id
    ]);

    const updatedUser = {
      ...user,
      name: nextName,
      phone: nextPhone,
      address_line_1: nextAddressLine1,
      address_line_2: nextAddressLine2,
      city: nextCity,
      parish: nextParish,
      country: nextCountry,
      postal_code: nextPostalCode,
      preferred_payment_method: nextPreferredPaymentMethod
    };

    res.json({
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerCustomer,
  customerLogin,
  adminLogin,
  requestPasswordReset,
  resetPassword,
  logout,
  getCurrentUser,
  updateCurrentUser
};
