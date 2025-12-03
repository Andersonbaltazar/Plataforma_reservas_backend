// Middleware para verificar que la estrategia OAuth esté configurada
const checkOAuthStrategy = (strategyName, requiredEnvVars) => {
  return (req, res, next) => {
    // Verificar que todas las variables existan y no estén vacías (después de trim)
    const envStatus = requiredEnvVars.map(varName => {
      const value = process.env[varName];
      const trimmedValue = value?.trim();
      return {
        name: varName,
        exists: !!value,
        hasValue: trimmedValue && trimmedValue.length > 0,
        value: trimmedValue ? (trimmedValue.length > 20 ? trimmedValue.substring(0, 20) + '...' : trimmedValue) : undefined
      };
    });
    
    const hasAllEnvVars = envStatus.every(status => status.exists && status.hasValue);
    
    if (!hasAllEnvVars) {
      const missing = envStatus.filter(s => !s.exists || !s.hasValue).map(s => s.name);
      return res.status(500).json({
        error: `Estrategia OAuth "${strategyName}" no configurada`,
        message: `Por favor, configura las siguientes variables de entorno en tu archivo .env: ${missing.join(', ')}`,
        missingVariables: missing,
        envStatus: envStatus
      });
    }
    
    next();
  };
};

// Middleware específico para Google
exports.checkGoogleStrategy = checkOAuthStrategy('google', [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
]);

// Middleware específico para GitHub
exports.checkGitHubStrategy = checkOAuthStrategy('github', [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
]);

