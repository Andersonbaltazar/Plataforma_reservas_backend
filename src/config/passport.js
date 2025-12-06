const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findOrCreateOAuthUser } = require('../models/users');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { findUserById } = require('../models/users');
    const user = await findUserById(id);
    done(null, user || null);
  } catch (error) {
    done(error, null);
  }
});

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (googleClientId && googleClientSecret) {
  const baseURL = process.env.BACKEND_URL?.trim() || `http://localhost:${process.env.PORT || 3000}`;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL?.trim() || `${baseURL}/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser(profile, 'google');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
}

module.exports = passport;
