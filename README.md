
### 1. Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/database
NODE_ENV=development
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Base de Datos
Ejecuta el script de setup para crear las tablas:
```bash
node db-setup.js
```

**Qué hace:**
- ✅ Crea todas las tablas necesarias
- ✅ Crea índices para mejor rendimiento
- ✅ Inserta roles iniciales (PACIENTE, MEDICO)
- ✅ Configura relaciones entre tablas

### 4. Ejecutar servidor en modo desarrollo
```bash
npm run dev
```

El servidor corre en: **http://localhost:3001**

---

## 📡 ENDPOINTS HABILITADOS

**Base URL:** `http://localhost:3001/api/medicos`

### 👨‍⚕️ MÉDICOS (3 endpoints)

#### 1. Obtener todos los médicos
```http
GET /
```
**Response:** `200 OK` - Array de médicos

---

#### 2. Obtener médico por ID
```http
GET /:id
```
**Example:** `GET /1`

**Response:** `200 OK` - Datos del médico con disponibilidades y citas

---

#### 3. Actualizar médico
```http
PUT /:id
```
**Body:**
```json
{
  "nombre": "Dr. Juan Carlos Pérez",
  "especialidad": "Cardiología y Cirugía",
  "email": "juan.carlos@hospital.com",
  "telefono": "+1234567890"
}
```
**Response:** `200 OK`

---

### 📅 DISPONIBILIDAD (6 endpoints)

#### 4. Marcar 1 día como NO disponible
```http
POST /:id/disponibilidad
```
**Body:**
```json
{
  "fecha": "2025-12-25"
}
```
**Response:** `201 Created`

**Nota:** `disponible: false` = médico NO disponible ese día

---

#### 5. Marcar RANGO de días como NO disponible
```http
POST /:id/disponibilidad-rango
```
**Body:**
```json
{
  "fechaInicio": "2025-12-15",
  "fechaFin": "2025-12-20"
}
```
**Response:** `201 Created` - Retorna array con los 6 días marcados

---

#### 6. Obtener días NO disponibles
```http
GET /:id/disponibilidades
```
**Query Parameters (opcionales):**
- `fechaInicio` - Filtro desde (YYYY-MM-DD)
- `fechaFin` - Filtro hasta (YYYY-MM-DD)

**Examples:**
- `GET /1/disponibilidades`
- `GET /1/disponibilidades?fechaInicio=2025-12-01&fechaFin=2025-12-31`

**Response:** `200 OK`
```json
{
  "total_no_disponibles": 8,
  "por_razon": {},
  "data": [...]
}
```

---

#### 7. Obtener CALENDARIO del mes
```http
GET /:id/calendario
```
**Query Parameters:**
- `mes` - Mes (1-12), por defecto: mes actual
- `ano` - Año (YYYY), por defecto: año actual

**Examples:**
- `GET /1/calendario?mes=12&ano=2025`
- `GET /1/calendario` (usa mes/año actual)

**Response:** `200 OK`
```json
{
  "mes": 12,
  "ano": 2025,
  "dias_no_disponibles_total": 8,
  "dias_disponibles_total": 23,
  "dias_total": 31,
  "calendario": {
    "1": {
      "fecha": "2025-12-01",
      "diaSemana": "Lun",
      "disponible": true,
      "detalleId": null
    },
    "15": {
      "fecha": "2025-12-15",
      "diaSemana": "Lun",
      "disponible": false,
      "detalleId": 10
    }
  }
}
```

---

#### 8. Eliminar 1 día marcado
```http
DELETE /disponibilidad/:disponibilidadId
```
**Example:** `DELETE /disponibilidad/10`

**Response:** `200 OK`

---

#### 9. Eliminar RANGO de días marcados
```http
DELETE /:id/disponibilidad-rango
```
**Body:**
```json
{
  "fechaInicio": "2025-12-15",
  "fechaFin": "2025-12-20"
}
```
**Response:** `200 OK`
```json
{
  "message": "6 días marcados nuevamente como DISPONIBLES",
  "dias_liberados": 6
}
```

---

### 🗓️ CITAS (2 endpoints)

#### 10. Obtener citas de un médico
```http
GET /:id/citas
```
**Example:** `GET /1/citas`

**Response:** `200 OK` - Array de citas

---

#### 11. Actualizar estado de cita
```http
PUT /cita/:citaId
```
**Body:**
```json
{
  "estado": "confirmada"
}
```
**Estados válidos:**
- `pendiente`
- `confirmada`
- `cancelada`
- `completada`

**Response:** `200 OK`

---

## 🔑 Notas Importantes

- **Formato de fechas:** Siempre usar `YYYY-MM-DD` (ej: `2025-12-25`)
- **Base de datos:** PostgreSQL (Supabase)
- **Disponibilidad:** `disponible: false` = médico NO disponible ese día
- **Errores:** 
  - `400` - Datos inválidos
  - `404` - Médico/Cita no encontrado
  - `500` - Error del servidor

---

**Total de endpoints:** 11
**Status:** ✅ Producción lista