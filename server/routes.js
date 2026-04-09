// server/routes.js — todas las rutas de la API
const express  = require('express');
const bcrypt   = require('bcryptjs');
const { pool } = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();

// ══════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════

// Listar perfiles (solo nombre, emoji, color — sin hash)
router.get('/perfiles', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, emoji, color FROM usuarios ORDER BY creado_en ASC'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Crear perfil
router.post('/perfiles', async (req, res) => {
  const { nombre, password, emoji, color } = req.body;
  if (!nombre || !password) return res.status(400).json({ error: 'Nombre y contraseña requeridos' });
  if (password.length < 4) return res.status(400).json({ error: 'Contraseña mínimo 4 caracteres' });
  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE LOWER(nombre)=LOWER($1)', [nombre]);
    if (existe.rows.length) return res.status(409).json({ error: 'Ya existe un perfil con ese nombre' });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nombre, emoji, color, pw_hash) VALUES ($1,$2,$3,$4) RETURNING id, nombre, emoji, color',
      [nombre.trim(), emoji || '😊', color || '#82b4f7', hash]
    );
    req.session.userId  = rows[0].id;
    req.session.usuario = rows[0];
    res.json({ ok: true, usuario: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login
router.post('/login', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Perfil no encontrado' });
    const ok = await bcrypt.compare(password, rows[0].pw_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });
    req.session.userId  = rows[0].id;
    req.session.usuario = { id: rows[0].id, nombre: rows[0].nombre, emoji: rows[0].emoji, color: rows[0].color };
    res.json({ ok: true, usuario: req.session.usuario });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Sesión actual
router.get('/me', requireAuth, (req, res) => {
  res.json({ usuario: req.session.usuario });
});

// Borrar perfil (requiere contraseña)
router.delete('/perfiles/:id', requireAuth, async (req, res) => {
  const { password } = req.body;
  const uid = parseInt(req.params.id);
  if (uid !== req.session.userId) return res.status(403).json({ error: 'No autorizado' });
  try {
    const { rows } = await pool.query('SELECT pw_hash FROM usuarios WHERE id=$1', [uid]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    const ok = await bcrypt.compare(password, rows[0].pw_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });
    await pool.query('DELETE FROM usuarios WHERE id=$1', [uid]);
    req.session.destroy(() => res.json({ ok: true }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════
// INGRESOS
// ══════════════════════════════════════════════════

router.get('/ingresos/:mes/:anio', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM ingresos WHERE usuario_id=$1 AND mes=$2 AND anio=$3 ORDER BY id ASC',
      [req.session.userId, req.params.mes, req.params.anio]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/ingresos', requireAuth, async (req, res) => {
  const { nombre, monto, color, mes, anio } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO ingresos (usuario_id,nombre,monto,color,mes,anio) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.session.userId, nombre, monto, color, mes, anio]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/ingresos/:id', requireAuth, async (req, res) => {
  const { nombre, monto, color } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE ingresos SET nombre=$1, monto=$2, color=$3 WHERE id=$4 AND usuario_id=$5 RETURNING *',
      [nombre, monto, color, req.params.id, req.session.userId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/ingresos/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM ingresos WHERE id=$1 AND usuario_id=$2', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════
// CATEGORÍAS
// ══════════════════════════════════════════════════

router.get('/categorias', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categorias WHERE usuario_id=$1 ORDER BY id ASC',
      [req.session.userId]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/categorias', requireAuth, async (req, res) => {
  const { clave, etiqueta, color } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categorias (usuario_id,clave,etiqueta,color) VALUES ($1,$2,$3,$4) ON CONFLICT (usuario_id,clave) DO UPDATE SET etiqueta=$3, color=$4 RETURNING *',
      [req.session.userId, clave, etiqueta, color]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/categorias/:clave', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM categorias WHERE usuario_id=$1 AND clave=$2', [req.session.userId, req.params.clave]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════
// GASTOS
// ══════════════════════════════════════════════════

router.get('/gastos/:mes/:anio', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM gastos WHERE usuario_id=$1 AND mes=$2 AND anio=$3 ORDER BY id ASC',
      [req.session.userId, req.params.mes, req.params.anio]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/gastos', requireAuth, async (req, res) => {
  const { descripcion, monto, categoria, ingreso_id, recurrente, pagado, nota, mes, anio } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO gastos (usuario_id,mes,anio,descripcion,monto,categoria,ingreso_id,recurrente,pagado,nota)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.session.userId, mes, anio, descripcion, monto, categoria, ingreso_id||null, !!recurrente, !!pagado, nota||null]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/gastos/:id', requireAuth, async (req, res) => {
  const { descripcion, monto, categoria, ingreso_id, recurrente, pagado, nota } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE gastos SET descripcion=$1, monto=$2, categoria=$3, ingreso_id=$4,
       recurrente=$5, pagado=$6, nota=$7 WHERE id=$8 AND usuario_id=$9 RETURNING *`,
      [descripcion, monto, categoria, ingreso_id||null, !!recurrente, !!pagado, nota||null, req.params.id, req.session.userId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/gastos/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM gastos WHERE id=$1 AND usuario_id=$2', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Copiar recurrentes al mes siguiente
router.post('/gastos/copiar-recurrentes', requireAuth, async (req, res) => {
  const { mes_origen, anio_origen, mes_destino, anio_destino } = req.body;
  try {
    // Verificar que destino esté vacío
    const { rows: existing } = await pool.query(
      'SELECT COUNT(*) FROM gastos WHERE usuario_id=$1 AND mes=$2 AND anio=$3',
      [req.session.userId, mes_destino, anio_destino]
    );
    if (parseInt(existing[0].count) > 0) return res.json({ ok: true, copiados: 0 });

    const { rows: recurrentes } = await pool.query(
      'SELECT * FROM gastos WHERE usuario_id=$1 AND mes=$2 AND anio=$3 AND recurrente=TRUE',
      [req.session.userId, mes_origen, anio_origen]
    );
    for (const g of recurrentes) {
      await pool.query(
        `INSERT INTO gastos (usuario_id,mes,anio,descripcion,monto,categoria,ingreso_id,recurrente,pagado,nota)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,$9)`,
        [req.session.userId, mes_destino, anio_destino, g.descripcion, g.monto, g.categoria, g.ingreso_id, true, g.nota]
      );
    }
    res.json({ ok: true, copiados: recurrentes.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════
// PRÉSTAMOS
// ══════════════════════════════════════════════════

router.get('/prestamos', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM prestamos WHERE usuario_id=$1 ORDER BY estado ASC, fecha DESC',
      [req.session.userId]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/prestamos', requireAuth, async (req, res) => {
  const { deudor, monto, fecha, nota } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO prestamos (usuario_id,deudor,monto,fecha,nota) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.session.userId, deudor, monto, fecha, nota||null]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/prestamos/:id', requireAuth, async (req, res) => {
  const { deudor, monto, fecha, nota, estado, fecha_cobro } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE prestamos SET deudor=$1, monto=$2, fecha=$3, nota=$4, estado=$5, fecha_cobro=$6
       WHERE id=$7 AND usuario_id=$8 RETURNING *`,
      [deudor, monto, fecha, nota||null, estado, fecha_cobro||null, req.params.id, req.session.userId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/prestamos/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM prestamos WHERE id=$1 AND usuario_id=$2', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════
// DATOS COMPLETOS (backup/restore)
// ══════════════════════════════════════════════════

router.get('/backup', requireAuth, async (req, res) => {
  try {
    const uid = req.session.userId;
    const [ing, gast, prest, cats] = await Promise.all([
      pool.query('SELECT * FROM ingresos   WHERE usuario_id=$1', [uid]),
      pool.query('SELECT * FROM gastos     WHERE usuario_id=$1', [uid]),
      pool.query('SELECT * FROM prestamos  WHERE usuario_id=$1', [uid]),
      pool.query('SELECT * FROM categorias WHERE usuario_id=$1', [uid]),
    ]);
    res.json({
      version: 1,
      exportado: new Date().toISOString(),
      ingresos:   ing.rows,
      gastos:     gast.rows,
      prestamos:  prest.rows,
      categorias: cats.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
