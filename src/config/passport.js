const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findOrCreateOAuthUser } = require('../models/users');

// Serialización de usuario para sesiones (no se usa con session: false, pero lo mantenemos por compatibilidad)
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

module.exports = passport;
