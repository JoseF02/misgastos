// server/db.js — conexión y schema inicial
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Esto es obligatorio para que Render acepte la conexión
  }
});

// Crea todas las tablas si no existen
async function initDB() {
  await pool.query(`
    -- Usuarios / perfiles
    CREATE TABLE IF NOT EXISTS usuarios (
      id         SERIAL PRIMARY KEY,
      nombre     VARCHAR(64) NOT NULL UNIQUE,
      emoji      VARCHAR(8)  NOT NULL DEFAULT '😊',
      color      VARCHAR(16) NOT NULL DEFAULT '#82b4f7',
      pw_hash    TEXT        NOT NULL,
      creado_en  TIMESTAMP   DEFAULT NOW()
    );

    -- Ingresos fijos por mes
    CREATE TABLE IF NOT EXISTS ingresos (
      id          SERIAL PRIMARY KEY,
      usuario_id  INT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      nombre      VARCHAR(64) NOT NULL,
      monto       NUMERIC(14,2) NOT NULL DEFAULT 0,
      color       VARCHAR(16) NOT NULL DEFAULT '#82b4f7',
      mes         VARCHAR(20) NOT NULL,  -- 'abril', 'mayo', etc.
      anio        INT         NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
      creado_en   TIMESTAMP   DEFAULT NOW()
    );

    -- Categorías personalizadas (las base se manejan en frontend)
    CREATE TABLE IF NOT EXISTS categorias (
      id          SERIAL PRIMARY KEY,
      usuario_id  INT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      clave       VARCHAR(64) NOT NULL,
      etiqueta    VARCHAR(64) NOT NULL,
      color       VARCHAR(16) NOT NULL DEFAULT '#a0a0c0',
      UNIQUE(usuario_id, clave)
    );

    -- Gastos
    CREATE TABLE IF NOT EXISTS gastos (
      id          SERIAL PRIMARY KEY,
      usuario_id  INT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      mes         VARCHAR(20) NOT NULL,
      anio        INT         NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
      descripcion VARCHAR(255) NOT NULL,
      monto       NUMERIC(14,2) NOT NULL DEFAULT 0,
      categoria   VARCHAR(64) NOT NULL DEFAULT 'otro',
      ingreso_id  INT         REFERENCES ingresos(id) ON DELETE SET NULL,
      recurrente  BOOLEAN     NOT NULL DEFAULT FALSE,
      pagado      BOOLEAN     NOT NULL DEFAULT FALSE,
      nota        TEXT,
      creado_en   TIMESTAMP   DEFAULT NOW()
    );

    -- Préstamos
    CREATE TABLE IF NOT EXISTS prestamos (
      id          SERIAL PRIMARY KEY,
      usuario_id  INT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      deudor      VARCHAR(128) NOT NULL,
      monto       NUMERIC(14,2) NOT NULL DEFAULT 0,
      fecha       DATE        NOT NULL,
      nota        TEXT,
      estado      VARCHAR(16) NOT NULL DEFAULT 'pendiente',  -- pendiente | cobrado
      fecha_cobro DATE,
      creado_en   TIMESTAMP   DEFAULT NOW()
    );
  `);
  console.log('✅ Base de datos lista');
}

module.exports = { pool, initDB };
