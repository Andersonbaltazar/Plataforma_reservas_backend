// Mock de usuarios (almacenamiento temporal en memoria)
const users = [];

const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

const findUserById = (id) => {
  return users.find(user => user.id === id);
};

const createUser = (userData) => {
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  return newUser;
};

const findOrCreateOAuthUser = (profile, provider) => {
  const existingUser = users.find(
    user => user.oauthId === profile.id && user.provider === provider
  );
  
  if (existingUser) {
    return existingUser;
  }
  
  const newUser = {
    id: Date.now().toString(),
    email: profile.emails?.[0]?.value || `${profile.id}@${provider}.com`,
    name: profile.displayName || profile.username || 'Usuario',
    oauthId: profile.id,
    provider: provider,
    avatar: profile.photos?.[0]?.value || null,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  return newUser;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  findOrCreateOAuthUser
};

