# 🔐 Endpoints de Autenticación

Documentación completa de los endpoints de autenticación del backend.

**Base URL:** `http://localhost:3001/auth`

---

## 📋 Tabla de Contenidos

1. [Autenticación por Credenciales](#-autenticación-por-credenciales)
   - [Registro](#1-registro)
   - [Login](#2-login)
   - [Obtener Usuario Actual](#3-obtener-usuario-actual)
2. [OAuth con Google](#-oauth-con-google)
   - [Iniciar Autenticación](#4-iniciar-autenticación-con-google)
   - [Callback de Google](#5-callback-de-google)
3. [OAuth con GitHub](#-oauth-con-github)
   - [Iniciar Autenticación](#6-iniciar-autenticación-con-github)
   - [Callback de GitHub](#7-callback-de-github)
4. [Manejo de Errores](#-manejo-de-errores)
5. [Estructura del JWT](#-estructura-del-jwt)
6. [Configuración Requerida](#-configuración-requerida)

---

## 🔑 Autenticación por Credenciales

### 1. Registro

Crea un nuevo usuario en el sistema.

**Endpoint:** `POST /auth/register`

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "apellido": "Pérez",
  "telefono": "+1234567890"
}
```

**Campos:**
- `email` (requerido): Email del usuario (formato válido requerido)
- `password` (requerido): Contraseña (mínimo 6 caracteres)
- `name` (opcional): Nombre del usuario
- `apellido` (opcional): Apellido del usuario
- `telefono` (opcional): Teléfono del usuario

**Validaciones:**
- ✅ Email debe tener formato válido
- ✅ Contraseña debe tener al menos 6 caracteres
- ✅ Email debe ser único en el sistema

**Response:** `201 Created`
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "usuario@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "name": "Juan Pérez"
  }
}
```

**Errores:**
- `400`: Email o contraseña faltantes, formato inválido
- `409`: El email ya está registrado
- `500`: Error del servidor

**Ejemplo:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123",
    "name": "Juan Pérez"
  }'
```

---

### 2. Login

Inicia sesión con email y contraseña.

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Campos:**
- `email` (requerido): Email del usuario
- `password` (requerido): Contraseña del usuario

**Response:** `200 OK`
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "usuario@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "name": "Juan Pérez",
    "roleId": 1,
    "rol_nombre": "PACIENTE"
  }
}
```

**Errores:**
- `400`: Email o contraseña faltantes, formato inválido
- `401`: Credenciales inválidas
- `403`: Cuenta desactivada
- `500`: Error del servidor

**Ejemplo:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123"
  }'
```

---

### 3. Obtener Usuario Actual

Obtiene la información del usuario autenticado.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "1",
    "email": "usuario@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "name": "Juan Pérez",
    "roleId": 1,
    "rol_nombre": "PACIENTE",
    "telefono": "+1234567890",
    "oauthProvider": null
  }
}
```

**Errores:**
- `401`: Token de acceso requerido
- `403`: Token inválido o expirado, cuenta desactivada
- `404`: Usuario no encontrado
- `500`: Error del servidor

**Ejemplo:**
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔵 OAuth con Google

### 4. Iniciar Autenticación con Google

Inicia el flujo de autenticación OAuth con Google.

**Endpoint:** `GET /auth/google`

**Descripción:**
- Redirige al usuario a la página de autenticación de Google
- El usuario autoriza la aplicación
- Google redirige de vuelta a `/auth/google/callback`

**Response:** `302 Redirect` → Google OAuth

**Ejemplo:**
```
GET http://localhost:3001/auth/google
```

**Flujo:**
1. Usuario visita `/auth/google`
2. Redirige a `https://accounts.google.com/o/oauth2/v2/auth?...`
3. Usuario autoriza la aplicación
4. Google redirige a `/auth/google/callback?code=...`

**Requisitos:**
- `GOOGLE_CLIENT_ID` configurado en `.env`
- `GOOGLE_CLIENT_SECRET` configurado en `.env`
- URL de callback configurada en Google Cloud Console: `http://localhost:3001/auth/google/callback`

---

### 5. Callback de Google

Maneja la respuesta de Google OAuth y genera el JWT.

**Endpoint:** `GET /auth/google/callback`

**Descripción:**
- Este endpoint es llamado automáticamente por Google
- No debe ser llamado directamente por el frontend
- Genera un JWT y redirige al frontend

**Query Parameters (automáticos):**
- `code`: Código de autorización de Google
- `scope`: Permisos otorgados

**Response:** `302 Redirect` → Frontend

**Redirección exitosa:**
```
GET {FRONTEND_URL}/auth/callback?token={jwt_token}
```

**Redirección con error:**
```
GET {FRONTEND_URL}/auth/error?message={mensaje_de_error}
```

**Ejemplo en Frontend (Next.js):**
```typescript
// pages/auth/callback.tsx
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('message');

  useEffect(() => {
    if (token) {
      // Guardar token en localStorage
      localStorage.setItem('auth_token', token);
      // Redirigir al dashboard
      router.push('/dashboard');
    } else if (error) {
      // Mostrar error
      console.error('Error de autenticación:', error);
      router.push('/login?error=' + encodeURIComponent(error));
    }
  }, [token, error, router]);

  return <div>Cargando...</div>;
}
```

**Comportamiento:**
- ✅ Si el usuario ya existe (por email), se vincula el OAuth a la cuenta existente
- ✅ Si el usuario no existe, se crea uno nuevo con rol PACIENTE por defecto
- ✅ El JWT incluye: `userId`, `email`, `roleId`

---

## 🐙 OAuth con GitHub

### 6. Iniciar Autenticación con GitHub

Inicia el flujo de autenticación OAuth con GitHub.

**Endpoint:** `GET /auth/github`

**Descripción:**
- Redirige al usuario a la página de autenticación de GitHub
- El usuario autoriza la aplicación
- GitHub redirige de vuelta a `/auth/github/callback`

**Response:** `302 Redirect` → GitHub OAuth

**Ejemplo:**
```
GET http://localhost:3001/auth/github
```

**Flujo:**
1. Usuario visita `/auth/github`
2. Redirige a `https://github.com/login/oauth/authorize?...`
3. Usuario autoriza la aplicación
4. GitHub redirige a `/auth/github/callback?code=...`

**Requisitos:**
- `GITHUB_CLIENT_ID` configurado en `.env`
- `GITHUB_CLIENT_SECRET` configurado en `.env`
- URL de callback configurada en GitHub: `http://localhost:3001/auth/github/callback`

---

### 7. Callback de GitHub

Maneja la respuesta de GitHub OAuth y genera el JWT.

**Endpoint:** `GET /auth/github/callback`

**Descripción:**
- Este endpoint es llamado automáticamente por GitHub
- No debe ser llamado directamente por el frontend
- Genera un JWT y redirige al frontend

**Query Parameters (automáticos):**
- `code`: Código de autorización de GitHub
- `scope`: Permisos otorgados

**Response:** `302 Redirect` → Frontend

**Redirección exitosa:**
```
GET {FRONTEND_URL}/auth/callback?token={jwt_token}
```

**Redirección con error:**
```
GET {FRONTEND_URL}/auth/error?message={mensaje_de_error}
```

**Comportamiento:**
- ✅ Si el usuario ya existe (por email), se vincula el OAuth a la cuenta existente
- ✅ Si el usuario no existe, se crea uno nuevo con rol PACIENTE por defecto
- ✅ El JWT incluye: `userId`, `email`, `roleId`

---

## ⚠️ Manejo de Errores

### Endpoint de Error OAuth

**Endpoint:** `GET /auth/error`

**Query Parameters:**
- `message` (opcional): Mensaje de error

**Response:** `500 Internal Server Error`
```json
{
  "error": "Error en autenticación OAuth",
  "message": "Usuario no autenticado"
}
```

**Errores Comunes:**

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `400` | Formato de email inválido | El email no tiene formato válido |
| `400` | La contraseña debe tener al menos 6 caracteres | Contraseña muy corta |
| `401` | Token de acceso requerido | No se envió el header Authorization |
| `401` | Credenciales inválidas | Email o contraseña incorrectos |
| `403` | Token expirado | El JWT expiró (válido por 24h) |
| `403` | Token inválido | El JWT no es válido |
| `403` | Cuenta desactivada | El usuario está desactivado |
| `409` | El email ya está registrado | Intento de registro con email existente |
| `500` | Error de configuración del servidor | JWT_SECRET no configurado |
| `500` | Error al registrar usuario | Error en base de datos |

---

## 📦 Estructura del JWT

El token JWT contiene la siguiente información:

```json
{
  "userId": "1",
  "email": "usuario@example.com",
  "roleId": 1,
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Campos:**
- `userId`: ID del usuario en la base de datos
- `email`: Email del usuario
- `roleId`: ID del rol (1 = PACIENTE, 2 = MEDICO)
- `iat`: Fecha de emisión (timestamp)
- `exp`: Fecha de expiración (timestamp, 24 horas después)

**Uso del Token:**
```javascript
// En cada request protegido
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## ⚙️ Configuración Requerida

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=tu_secret_jwt_super_seguro_aqui_minimo_32_caracteres

# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/database

# Frontend (puerto donde corre tu aplicación frontend)
FRONTEND_URL=http://localhost:3000

# Backend (para callbacks OAuth)
BACKEND_URL=http://localhost:3001

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
```

### Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita Google+ API
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Tipo de aplicación: "Aplicación web"
6. URIs de redirección autorizados: `http://localhost:3001/auth/google/callback`
7. Copia el Client ID y Client Secret a tu `.env`

### Configuración de GitHub OAuth

1. Ve a [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click en "New OAuth App"
3. Application name: Nombre de tu app
4. Homepage URL: `http://localhost:3001` (o la URL de tu frontend si es diferente)
5. Authorization callback URL: `http://localhost:3001/auth/github/callback`
6. Click en "Register application"
7. Copia el Client ID y Client Secret a tu `.env`

---

## 🔒 Seguridad

### Características de Seguridad Implementadas

✅ **Contraseñas hasheadas**: Usa bcrypt con salt rounds de 10
✅ **Validación de email**: Formato válido requerido
✅ **Validación de contraseña**: Mínimo 6 caracteres
✅ **JWT seguro**: Tokens firmados con secret, expiración de 24h
✅ **Unificación de cuentas**: Si un usuario se registra con email y luego usa OAuth con el mismo email, se vincula la cuenta
✅ **Protección contra timing attacks**: En login, se compara hash incluso si el usuario no existe
✅ **Verificación de cuenta activa**: Usuarios desactivados no pueden autenticarse

### Buenas Prácticas

1. **Nunca expongas el JWT_SECRET**: Manténlo seguro en `.env`
2. **Usa HTTPS en producción**: Los tokens viajan en headers HTTP
3. **Valida el token en cada request**: Usa el middleware `authenticateToken`
4. **Implementa rate limiting**: Protege contra ataques de fuerza bruta
5. **Logs de seguridad**: Monitorea intentos fallidos de login

---

## 📝 Notas Adicionales

- **Rol por defecto**: Los nuevos usuarios (registro y OAuth) reciben el rol PACIENTE (roleId = 1) por defecto
- **Unificación de cuentas**: Si un usuario se registra con email/password y luego usa OAuth con el mismo email, ambos métodos quedan vinculados a la misma cuenta
- **Persistencia**: Todos los usuarios se almacenan en PostgreSQL (no en memoria)
- **Sesiones**: No se usan sesiones en el servidor, todo es stateless con JWT

---

**Última actualización:** 2025-01-27  
**Versión:** 1.0.0

