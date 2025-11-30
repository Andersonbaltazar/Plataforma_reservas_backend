const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { findOrCreateOAuthUser } = require('../models/users');

// Serialización de usuario para sesiones
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const { findUserById } = require('../models/users');
  const user = findUserById(id);
  done(null, user || null);
});

// Estrategia Google OAuth (solo si las credenciales están configuradas)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = findOrCreateOAuthUser(profile, 'google');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Estrategia GitHub OAuth (solo si las credenciales están configuradas)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/auth/github/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = findOrCreateOAuthUser(profile, 'github');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

module.exports = passport;

