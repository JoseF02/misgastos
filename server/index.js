// server/index.js — servidor principal
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');
const { initDB } = require('./db');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ───────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   false,      // true si usás HTTPS
    httpOnly: true,
    maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 días
  },
}));

// ── Rutas API ─────────────────────────────────
app.use('/api', routes);

// ── SPA fallback ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Arrancar ──────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Error iniciando la base de datos:', err);
  process.exit(1);
});
