# Mis Gastos — Setup completo

App de control de gastos con backend Node.js + PostgreSQL.

---

## Requisitos

- Node.js 18+
- PostgreSQL 14+ corriendo en tu máquina

---

## 1. Instalar dependencias

```bash
npm install
```

---

## 2. Crear la base de datos en PostgreSQL

Abrí psql o cualquier cliente (DBeaver, TablePlus, pgAdmin) y ejecutá:

```sql
CREATE DATABASE misgastos;
```

---

## 3. Configurar variables de entorno

Editá el archivo `.env` con tus datos:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=misgastos
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

SESSION_SECRET=una_clave_larga_y_random_aqui

PORT=3000
```

> **SESSION_SECRET**: usá cualquier string largo y aleatorio, por ejemplo:
> `openssl rand -base64 32`

---

## 4. Iniciar el servidor

```bash
# Producción
npm start

# Desarrollo (con auto-reload)
npm run dev
```

El servidor va a crear las tablas automáticamente la primera vez que arranque.

---

## 5. Acceder a la app

Abrí el navegador en:

```
http://localhost:3000
```

---

## Estructura del proyecto

```
misgastos/
├── .env                  ← Variables de entorno (no subir a git)
├── package.json
├── server/
│   ├── index.js          ← Servidor Express principal
│   ├── db.js             ← Conexión PostgreSQL + schema
│   ├── routes.js         ← Todas las rutas API
│   └── auth.js           ← Middleware de autenticación
└── public/
    └── index.html        ← Frontend completo (HTML + CSS + JS)
```

---

## API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/perfiles` | Listar perfiles |
| POST | `/api/perfiles` | Crear perfil |
| POST | `/api/login` | Login |
| POST | `/api/logout` | Logout |
| GET | `/api/me` | Sesión actual |
| GET | `/api/ingresos/:mes/:anio` | Ingresos del mes |
| POST | `/api/ingresos` | Crear ingreso |
| PUT | `/api/ingresos/:id` | Editar ingreso |
| DELETE | `/api/ingresos/:id` | Borrar ingreso |
| GET | `/api/gastos/:mes/:anio` | Gastos del mes |
| POST | `/api/gastos` | Crear gasto |
| PUT | `/api/gastos/:id` | Editar gasto |
| DELETE | `/api/gastos/:id` | Borrar gasto |
| POST | `/api/gastos/copiar-recurrentes` | Copiar recurrentes al mes siguiente |
| GET | `/api/categorias` | Categorías custom |
| POST | `/api/categorias` | Crear categoría |
| DELETE | `/api/categorias/:clave` | Borrar categoría |
| GET | `/api/prestamos` | Préstamos |
| POST | `/api/prestamos` | Crear préstamo |
| PUT | `/api/prestamos/:id` | Editar / marcar cobrado |
| DELETE | `/api/prestamos/:id` | Borrar préstamo |
| GET | `/api/backup` | Backup completo en JSON |

---

## Para acceso desde otros dispositivos en la misma red

Cambiá `PORT=3000` por cualquier puerto, y en `.env`:

```env
PORT=3000
```

Luego en el firewall abrís ese puerto, y accedés desde otros dispositivos con la IP de tu máquina:

```
http://192.168.1.xxx:3000
```

---

## .gitignore recomendado

```
node_modules/
.env
```
