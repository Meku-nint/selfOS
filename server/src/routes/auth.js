import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Resend } from 'resend';
import { prisma } from '../config/database.js';
import { generateToken, generateOTP } from '../middleware/auth.js';

const router = express.Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function sendOtpEmail({ email, firstName, otp }) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not configured. OTP email was not sent.');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: 'SelfOS verification code',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
          <h2 style="margin:0 0 12px;color:#7f1d1d">Welcome to SelfOS</h2>
          <p style="margin:0 0 10px">Hi ${firstName || 'there'},</p>
          <p style="margin:0 0 10px">Use this OTP to verify your account:</p>
          <p style="margin:0 0 12px;font-size:28px;font-weight:700;letter-spacing:3px;color:#111827">${otp}</p>
          <p style="margin:0;color:#6b7280">This code expires in 10 minutes.</p>
        </div>
      `,
      text: `Welcome to SelfOS. Your OTP is ${otp}. This code expires in 10 minutes.`,
    });

    if (error) {
      console.error('Resend OTP API error:', error);
      return false;
    }

    if (!data?.id) {
      console.error('Resend OTP API returned no message id');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Send OTP email error:', error);
    return false;
  }
}

function normalizeBaseUrl(rawUrl, fallbackUrl, protocol = 'https') {
  const value = (rawUrl || '').trim();
  const fallback = (fallbackUrl || '').trim();

  const resolved = value || fallback;
  if (!resolved) return '';

  const withProtocol = /^https?:\/\//i.test(resolved)
    ? resolved
    : `${protocol}://${resolved}`;

  return withProtocol.replace(/\/+$/, '');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SERVER_PORT = process.env.PORT || '4000';
const isProduction = process.env.NODE_ENV === 'production';
const urlProtocol = isProduction ? 'https' : 'http';
const SERVER_URL = normalizeBaseUrl(
  process.env.SERVER_URL,
  `localhost:${SERVER_PORT}`,
  urlProtocol
);
const CLIENT_URL = normalizeBaseUrl(
  process.env.CLIENT_URL,
  'localhost:3000',
  urlProtocol
);
const GOOGLE_CALLBACK_URL = normalizeBaseUrl(
  process.env.GOOGLE_CALLBACK_URL,
  `${SERVER_URL}/auth/google/callback`,
  urlProtocol
);

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && !globalThis._googleStrategyConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || null;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const avatar = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error('Google account email not available'));
          }

          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId }, { email }],
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId,
                email,
                firstName,
                lastName,
                avatar,
                isVerified: true,
              },
            });
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId, avatar: avatar || user.avatar },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  globalThis._googleStrategyConfigured = true;
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        otpCode: otp,
        otpExpiresAt,
      },
    });

    const emailSent = await sendOtpEmail({ email, firstName, otp });

    if (!emailSent) {
      console.log(`OTP fallback log for ${email}: ${otp}`);
    }

    res.status(201).json({ 
      message: emailSent
        ? 'User registered successfully. Please check your email for OTP.'
        : 'User registered, but OTP email could not be sent right now. Please use resend OTP.',
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email, isVerified: false }
    });

    if (!user || !user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null }
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Your email is already verified. Please sign in.' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt },
    });

    const emailSent = await sendOtpEmail({ email, firstName: user.firstName, otp });
    if (!emailSent) {
      console.log(`Resend OTP fallback log for ${email}: ${otp}`);
      return res.status(503).json({ message: 'Could not send OTP email right now. Please try again.' });
    }

    res.json({ message: 'A new OTP has been sent. Please check your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/login?error=google_auth_failed` }),
  (req, res) => {
    const user = req.user;
    const token = generateToken(user.id);
    const redirectUrl = new URL('/login', CLIENT_URL);
    redirectUrl.searchParams.set('token', token);
    res.redirect(redirectUrl.toString());
  }
);

export default router;
