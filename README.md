# ☕ CaféPOS - Sistema de Punto de Venta para Cafeterías

MVP completo de sistema POS para locales de café. Visual, rápido, pensado para pantallas táctiles de mostrador.

---

## 📋 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Frontend | React 18 + Vite |
| Base de datos | MySQL 8+ |
| ORM | Sequelize 6 |
| Autenticación | JWT |
| Gráficos | Chart.js + react-chartjs-2 |
| Notificaciones | react-hot-toast |

---

## 🗂 Estructura del Proyecto

```
cafeteria-pos/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Configuración Sequelize
│   │   ├── controllers/
│   │   │   ├── authController.js    # Login y sesión
│   │   │   ├── productController.js # CRUD productos + stock
│   │   │   ├── salesController.js   # Ventas y cierre diario
│   │   │   ├── dashboardController.js # Estadísticas
│   │   │   ├── usersController.js   # Gestión de usuarios
│   │   │   └── categoriesController.js
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT + autorización por rol
│   │   ├── models/
│   │   │   ├── index.js             # Asociaciones entre modelos
│   │   │   ├── Role.js
│   │   │   ├── User.js
│   │   │   ├── Category.js
│   │   │   ├── Product.js
│   │   │   ├── Sale.js
│   │   │   ├── SaleItem.js
│   │   │   ├── StockMovement.js
│   │   │   └── DailyClosure.js
│   │   ├── routes/
│   │   │   └── index.js             # Todas las rutas API REST
│   │   └── index.js                 # Entry point del servidor
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Estado de autenticación global
│   │   │   └── CartContext.jsx      # Estado del carrito
│   │   ├── services/
│   │   │   └── api.js               # Axios + todos los endpoints
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Pantalla de login
│   │   │   ├── POS.jsx              # Punto de venta (pantalla principal)
│   │   │   ├── Cierre.jsx           # Cierre diario
│   │   │   ├── Dashboard.jsx        # Dashboard con gráficos
│   │   │   ├── Productos.jsx        # ABM de productos
│   │   │   ├── Stock.jsx            # Control de inventario
│   │   │   ├── Ventas.jsx           # Historial de ventas
│   │   │   └── Usuarios.jsx         # Gestión de usuarios
│   │   ├── components/
│   │   │   └── Layout.jsx           # Sidebar + layout principal
│   │   ├── App.jsx                  # Router y rutas protegidas
│   │   ├── main.jsx
│   │   └── index.css                # Sistema de diseño completo
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── database/
    └── schema.sql                   # Script completo de BD + seed
```

---

## ⚡ Instalación y Ejecución

### Requisitos previos

- Node.js 18+
- MySQL 8+
- npm 9+

---

### 1. Clonar / descomprimir el proyecto

```bash
# Navegar al directorio del proyecto
cd cafeteria-pos
```

---

### 2. Configurar la Base de Datos

```bash
# Conectarse a MySQL
mysql -u root -p

# Ejecutar el script completo (crea BD, tablas, índices y datos de prueba)
source /ruta/al/proyecto/cafeteria-pos/database/schema.sql

# O desde terminal:
mysql -u root -p < database/schema.sql
```

Esto crea automáticamente:
- Base de datos `cafeteria_pos`
- Todas las tablas con índices y claves foráneas
- **2 usuarios de prueba** (ver abajo)
- **7 categorías** (Espresso, Latte, Frío, Infusiones, Pastelería, Sandwich, Snacks)
- **15 productos** con imágenes y stock inicial

---

### 3. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales MySQL
nano .env
```

Variables a configurar en `.env`:
```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_AQUI
DB_NAME=cafeteria_pos
JWT_SECRET=un_secreto_largo_y_seguro
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

```bash
# Iniciar el backend
npm run dev    # Desarrollo con hot-reload
# o
npm start      # Producción
```

El servidor correrá en: `http://localhost:4000`

---

### 4. Configurar el Frontend

```bash
# Desde otra terminal
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend correrá en: `http://localhost:5173`

---

### 5. Acceder a la Aplicación

Abrir el navegador en: **http://localhost:5173**

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| Administrador | admin@cafeteria.com | admin123 | Admin |
| Cajero Demo | cajero@cafeteria.com | admin123 | Cajero |

---

## 🔑 Permisos por Rol

### Admin
- ✅ Punto de Venta (POS)
- ✅ Cierre Diario
- ✅ Dashboard con gráficos
- ✅ Gestión de Productos (CRUD)
- ✅ Control de Stock + ajustes manuales
- ✅ Historial de Ventas
- ✅ Gestión de Usuarios

### Cajero
- ✅ Punto de Venta (POS)
- ✅ Cierre Diario (solo lectura + cierre)
- ❌ Sin acceso al backoffice

---

## 📡 API REST - Endpoints Principales

### Autenticación
```
POST   /api/auth/login       # Login con email/password → JWT
GET    /api/auth/me          # Datos del usuario autenticado
```

### Productos
```
GET    /api/products          # Listar (filtros: type, category_id, active, search)
GET    /api/products/:id      # Obtener uno
POST   /api/products          # Crear [admin]
PUT    /api/products/:id      # Actualizar [admin]
DELETE /api/products/:id      # Desactivar [admin]
POST   /api/products/:id/stock # Ajustar stock [admin]
GET    /api/products/:id/movements # Historial de movimientos [admin]
```

### Categorías
```
GET    /api/categories        # Listar (filtro: type)
POST   /api/categories        # Crear [admin]
```

### Ventas
```
POST   /api/sales             # Crear venta (descuenta stock automáticamente)
GET    /api/sales             # Historial [admin] (filtros: from, to, payment_method)
GET    /api/sales/today       # Resumen del día
POST   /api/sales/close-day   # Cerrar el día
```

### Dashboard (solo admin)
```
GET    /api/dashboard         # Estadísticas con filtro de fechas
```

### Usuarios (solo admin)
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/roles
```

---

## 🗄 Modelo de Base de Datos

```
roles ──────────── users
                    │
categories ──── products ──── sale_items ──── sales ──── daily_closures
                    │                          │
                stock_movements ───────────────┘
```

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `roles` | admin, cajero |
| `users` | Usuarios con hash bcrypt |
| `categories` | Tipo cafe/comida + ícono |
| `products` | Productos con stock y stock_min |
| `sales` | Cabecera de venta |
| `sale_items` | Ítems de cada venta (snapshot de precio) |
| `stock_movements` | Historial de todos los movimientos |
| `daily_closures` | Cierres de caja diarios |

---

## ✨ Funcionalidades Destacadas

### Pantalla POS
- Tarjetas visuales con imagen, precio y stock en tiempo real
- Filtros por tipo (Café/Comida) y categoría con chips interactivos
- Búsqueda de productos en tiempo real
- Carrito lateral con edición de cantidades
- Alertas de stock bajo en las tarjetas
- Validación: no permite vender sin stock
- Validación: no permite confirmar sin método de pago
- Transacción atómica: descuenta stock + registra movimiento + genera número de venta

### Control de Stock
- Barra de progreso visual por producto
- Filtro por productos con stock bajo o sin stock
- Ajuste manual con registro de motivo y usuario
- Historial de movimientos por producto

### Cierre Diario
- Totales por método de pago
- Top 5 productos más vendidos
- Timestamp de cierre
- Bloqueo de eliminación de ventas post-cierre

### Dashboard
- Filtro por rango de fechas
- Gráfico de líneas: ventas por día
- Gráfico de barras: ventas por franja horaria
- Gráfico donut: distribución por método de pago
- Ranking de productos más vendidos
- KPIs: total, cantidad de ventas, ticket promedio

---

## 🚀 Scripts Disponibles

### Backend
```bash
npm run dev    # Servidor con nodemon (desarrollo)
npm start      # Servidor en producción
```

### Frontend
```bash
npm run dev    # Servidor Vite con HMR
npm run build  # Build de producción en /dist
npm run preview # Preview del build
```

---

## 🔧 Notas Técnicas

- Las contraseñas se almacenan con **bcryptjs** (10 rounds)
- Los JWT expiran en **8 horas** (configurable en .env)
- Las ventas usan **transacciones Sequelize** para garantizar consistencia
- Los precios en `sale_items` son un **snapshot** del momento de la venta (no cambian si el precio del producto cambia)
- El stock se valida con **lock de fila** durante la transacción para evitar race conditions
- Las imágenes de productos son URLs externas (compatible con Unsplash, etc.)

---

## 📦 Para Producción

1. Cambiar `JWT_SECRET` por un valor seguro largo
2. Configurar `NODE_ENV=production`
3. Usar un servidor MySQL dedicado
4. Ejecutar `npm run build` en el frontend
5. Servir `/dist` con Nginx o similar
6. Usar PM2 para el backend: `pm2 start src/index.js --name cafeteria-pos`
