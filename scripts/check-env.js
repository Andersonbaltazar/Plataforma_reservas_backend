// Script de diagnóstico para verificar variables de entorno
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

console.log('🔍 Verificando variables de entorno...\n');

const requiredVars = {
  'Básicas': ['PORT', 'JWT_SECRET', 'FRONTEND_URL'],
  'Google OAuth': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  'GitHub OAuth': ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']
};

let allGood = true;

Object.entries(requiredVars).forEach(([category, vars]) => {
  console.log(`📋 ${category}:`);
  vars.forEach(varName => {
    const value = process.env[varName];
    const trimmedValue = value?.trim();
    const isSet = trimmedValue && trimmedValue.length > 0;
    
    if (isSet) {
      const displayValue = trimmedValue.length > 30 
        ? trimmedValue.substring(0, 30) + '...' 
        : trimmedValue;
      console.log(`   ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`   ❌ ${varName}: NO CONFIGURADO`);
      allGood = false;
    }
  });
  console.log('');
});

if (allGood) {
  console.log('✅ Todas las variables están configuradas correctamente!');
} else {
  console.log('⚠️  Faltan algunas variables. Por favor, verifica tu archivo .env');
  console.log('\n💡 Tips:');
  console.log('   - Asegúrate de que el archivo .env esté en la raíz del proyecto');
  console.log('   - No dejes espacios antes o después del signo =');
  console.log('   - No uses comillas a menos que el valor las requiera');
  console.log('   - Reinicia el servidor después de modificar el .env');
}

