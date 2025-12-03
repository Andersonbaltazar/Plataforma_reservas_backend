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
  console.log('✅ Estrategia Google OAuth configurada');
} else {
  console.warn('⚠️  Google OAuth no configurado: faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env');
  console.warn(`   GOOGLE_CLIENT_ID: ${googleClientId ? '✅ configurado' : '❌ no encontrado'}`);
  console.warn(`   GOOGLE_CLIENT_SECRET: ${googleClientSecret ? '✅ configurado' : '❌ no encontrado'}`);
}

// Estrategia GitHub OAuth (solo si las credenciales están configuradas)
const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

if (githubClientId && githubClientSecret) {
  const baseURL = process.env.BACKEND_URL?.trim() || `http://localhost:${process.env.PORT || 3000}`;
  const callbackURL = process.env.GITHUB_CALLBACK_URL?.trim() || `${baseURL}/auth/github/callback`;
  
  passport.use(
    new GitHubStrategy(
      {
        clientID: githubClientId,
        clientSecret: githubClientSecret,
        callbackURL: callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser(profile, 'github');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Estrategia GitHub OAuth configurada');
} else {
  console.warn('⚠️  GitHub OAuth no configurado: faltan GITHUB_CLIENT_ID o GITHUB_CLIENT_SECRET en .env');
  console.warn(`   GITHUB_CLIENT_ID: ${githubClientId ? '✅ configurado' : '❌ no encontrado'}`);
  console.warn(`   GITHUB_CLIENT_SECRET: ${githubClientSecret ? '✅ configurado' : '❌ no encontrado'}`);
}

module.exports = passport;

