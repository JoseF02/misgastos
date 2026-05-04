// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// API HELPER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const API = '/api';

async function api(method, path, body) {
  const opts = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en servidor');
  return data;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TOAST
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let toastTimer;
function showToast(msg, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = (type==='ok'?'âœ“ ':'âœ— ') + msg;
  t.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast hidden', 3000);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LOADING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function showLoading(v) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !v);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STATE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let mesActual = 'abril';
let anioActual = new Date().getFullYear();
let currentUser = null;
let ingresos = [];   // [{id, nombre, monto, color, mes, anio}]
let gastos = [];     // [{id, descripcion, monto, categoria, ingreso_id, recurrente, pagado, nota}]
let prestamos = [];  // [{id, deudor, monto, fecha, nota, estado, fecha_cobro}]
let cats = {};       // { clave: { label, color, builtin? } }
let filterCat = null;
let charts = {};
let miColor = '#82b4f7';
let ncColor = '#82b4f7';
let ncEmoji = 'ðŸ“¦';
let notaEditId = null;
let editingPrestId = null;
let prestFilter = 'todos';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CATEGORÃAS BASE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const BUILTIN_CATS = {
  hogar:      { label:'ðŸ  Hogar',      color:'#82b4f7', builtin:true },
  comida:     { label:'ðŸ” Comida',     color:'#f7c47e', builtin:true },
  salud:      { label:'ðŸ’Š Salud',      color:'#f77eb8', builtin:true },
  ocio:       { label:'ðŸŽ® Ocio',       color:'#b87ef7', builtin:true },
  transporte: { label:'ðŸš— Transporte', color:'#7ef7d4', builtin:true },
  educacion:  { label:'ðŸ“š EducaciÃ³n',  color:'#f7e07e', builtin:true },
  servicios:  { label:'âš¡ Servicios',  color:'#7eb8f7', builtin:true },
  otro:       { label:'ðŸ“¦ Otro',       color:'#a0a0c0', builtin:true },
};

const PALETTE=['#ff6b6b','#ff9f7e','#ffca7e','#ffe07e','#f7f77e','#b8f0a0','#7ef7c4','#7ef7f7','#7eb8f7','#7e8ef7','#b87ef7','#f77eb8','#f77e7e','#82b4f7','#f7a97e','#f7c47e','#f7e07e','#7ef7d4','#a0f0c0','#f0a0d0','#ffffff','#d0d0e8','#a0a0c0','#707090'];
const INGRESO_COLORS = PALETTE.slice(0, 20);
const DEFAULT_COLORS = PALETTE.slice(0, 16);

const EMOJI_DB = {
  'ðŸ˜€ Caras':['ðŸ˜€','ðŸ˜ƒ','ðŸ˜„','ðŸ˜','ðŸ˜†','ðŸ˜…','ðŸ¤£','ðŸ˜‚','ðŸ™‚','ðŸ˜‰','ðŸ˜Š','ðŸ˜‡','ðŸ¥°','ðŸ˜','ðŸ¤©','ðŸ˜Ž','ðŸ¤“','ðŸ˜','ðŸ˜’','ðŸ™„','ðŸ˜¤','ðŸ˜¡','ðŸ˜ ','ðŸ¤¬','ðŸ˜ˆ','ðŸ‘¿'],
  'ðŸ‘‹ Gestos':['ðŸ‘‹','ðŸ¤š','âœ‹','ðŸ‘Œ','âœŒï¸','ðŸ¤ž','ðŸ‘','ðŸ‘Ž','âœŠ','ðŸ‘Š','ðŸ‘','ðŸ™Œ','ðŸ™','ðŸ’ª','ðŸ¤³','âœï¸','ðŸ’…'],
  'ðŸ  Hogar':['ðŸ ','ðŸ¡','ðŸ›‹','ðŸª‘','ðŸ›','ðŸš¿','ðŸ›','ðŸ§´','ðŸ§¹','ðŸ§º','ðŸ§»','ðŸ§¼','ðŸ’¡','ðŸ”¦','ðŸ•¯','ðŸ”Œ','ðŸ”‹','ðŸ›’','ðŸšª','ðŸªœ'],
  'ðŸ” Comida':['ðŸ”','ðŸ•','ðŸŒ®','ðŸŒ¯','ðŸ³','ðŸ¥˜','ðŸ²','ðŸ¥—','ðŸ¥ž','ðŸ—','ðŸ–','ðŸŒ­','ðŸŸ','ðŸ±','ðŸ£','ðŸœ','ðŸ','ðŸŽ‚','ðŸ°','ðŸ­','ðŸ¬','ðŸ«','ðŸ¿','ðŸ©','ðŸª','ðŸŽ','ðŸŒ','ðŸ‰','ðŸ‡','ðŸ“','â˜•','ðŸµ','ðŸº','ðŸ·','ðŸ¥¤'],
  'ðŸ’Š Salud':['ðŸ’Š','ðŸ’‰','ðŸ©¸','ðŸ©¹','ðŸ©º','ðŸ¥','ðŸš‘','ðŸ§¬','ðŸ”¬','ðŸ§ª','ðŸ‹ï¸','ðŸ¤¸','ðŸ§˜','ðŸš´','ðŸŠ','ðŸ¥‹','ðŸ¥Š','â›·ï¸','ðŸŽ¿'],
  'ðŸŽ® Ocio':['ðŸŽ®','ðŸ•¹','ðŸŽ²','â™Ÿ','ðŸŽ­','ðŸŽ¨','ðŸŽ¬','ðŸŽ¥','ðŸ“º','ðŸ“»','ðŸŽ¼','ðŸŽ¤','ðŸŽ§','ðŸŽ·','ðŸŽ¸','ðŸŽ¹','ðŸŽº','ðŸŽ»','ðŸ¥','ðŸŽ¯','ðŸŽ±','ðŸŽ³','ðŸŽŸ','ðŸŽ«','ðŸŽ‰','ðŸŽŠ','ðŸŽˆ'],
  'ðŸš— Transporte':['ðŸš—','ðŸš•','ðŸš™','ðŸšŒ','ðŸŽ','ðŸš“','ðŸš‘','ðŸš’','ðŸš²','ðŸ›µ','ðŸ','âœˆï¸','ðŸš¢','ðŸš‚','ðŸš†','ðŸš‡','â›½','ðŸ›‘','ðŸš¦'],
  'ðŸ“š EducaciÃ³n':['ðŸ“š','ðŸ“–','ðŸ“','âœï¸','ðŸ–Š','ðŸ““','ðŸ“”','ðŸ“’','ðŸ“•','ðŸ“—','ðŸ“˜','ðŸ“™','ðŸŽ“','ðŸ«','ðŸ”­','ðŸ”¬','ðŸ’¡','ðŸ“Š','ðŸ“ˆ','ðŸ“‰'],
  'âš¡ Servicios':['âš¡','ðŸ’¡','ðŸ”Œ','ðŸ”‹','ðŸ“±','ðŸ’»','ðŸ–¥','ðŸ“ž','â˜Žï¸','ðŸ“º','ðŸ“¡','ðŸ› ','ðŸ”§','ðŸ”©','âš™ï¸','ðŸ§°'],
  'ðŸ’° Finanzas':['ðŸ’°','ðŸ’µ','ðŸ’´','ðŸ’¶','ðŸ’·','ðŸ’¸','ðŸ’³','ðŸ’²','ðŸª™','ðŸ¦','ðŸ“Š','ðŸ“ˆ','ðŸ“‰','ðŸ§¾','ðŸ’¹','ðŸ’¼'],
  'ðŸŒ± Naturaleza':['ðŸŒ±','ðŸŒ¿','â˜˜ï¸','ðŸ€','ðŸŒ·','ðŸŒ¹','ðŸŒº','ðŸŒ¸','ðŸŒ¼','ðŸŒ»','ðŸŒž','ðŸŒ™','â­','â„ï¸','ðŸ”¥','ðŸ’§','ðŸŒŠ','ðŸŒˆ','ðŸ¶','ðŸ±','ðŸ¸','ðŸ¦‹','ðŸŒ'],
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROFILES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const PROFILE_COLORS=['#82b4f7','#f7a97e','#b8f0a0','#f77eb8','#b87ef7','#7ef7d4','#f7c47e','#ff6b6b'];
const PROFILE_EMOJIS=['ðŸ˜Š','ðŸ¦','ðŸ¯','ðŸ¸','ðŸ¦Š','ðŸ¼','ðŸ¨','ðŸ¦‹','ðŸŒŸ','ðŸŽ¯','ðŸš€','ðŸŽ¸'];
let loginTargetProfile = null;

async function cargarPerfiles() {
  showLoading(true);
  try {
    const perfiles = await api('GET', '/perfiles');
    renderProfileList(perfiles);
  } catch(e) { showToast(e.message,'err'); }
  showLoading(false);
}

function renderProfileList(perfiles) {
  const list = document.getElementById('profileList');
  if (!perfiles.length) {
    list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:.78rem;">Sin perfiles Â· creÃ¡ el primero abajo â†“</div>';
    return;
  }
  list.innerHTML = perfiles.map(p => `
    <div class="profile-item" onclick="pedirLogin(${JSON.stringify(p).replace(/"/g,'&quot;')})">
      <div class="profile-avatar" style="background:${p.color}20;color:${p.color}">${p.emoji}</div>
      <div>
        <div class="profile-name">${p.nombre}</div>
        <div class="profile-meta">ðŸ”’ protegido</div>
      </div>
    </div>`).join('');
}

async function crearPerfil() {
  const nombre = document.getElementById('newProfileName').value.trim();
  const pw     = document.getElementById('newProfilePw').value;
  const errEl  = document.getElementById('newProfileErr');
  if (!nombre) { errEl.textContent='EscribÃ­ un nombre.'; return; }
  if (pw.length < 4) { errEl.textContent='ContraseÃ±a mÃ­nimo 4 caracteres.'; return; }
  errEl.textContent='';
  const idx = (await api('GET','/perfiles')).length;
  const color = PROFILE_COLORS[idx % PROFILE_COLORS.length];
  const emoji = PROFILE_EMOJIS[idx % PROFILE_EMOJIS.length];
  try {
    showLoading(true);
    const res = await api('POST','/perfiles',{ nombre, password:pw, emoji, color });
    currentUser = res.usuario;
    document.getElementById('newProfileName').value='';
    document.getElementById('newProfilePw').value='';
    abrirApp();
  } catch(e) { errEl.textContent=e.message; }
  showLoading(false);
}

function pedirLogin(p) {
  loginTargetProfile = p;
  const av = document.getElementById('loginAvatar');
  av.textContent = p.emoji;
  av.style.background = p.color+'20';
  av.style.borderColor = p.color+'50';
  document.getElementById('loginName').textContent = p.nombre;
  document.getElementById('loginPw').value='';
  document.getElementById('loginPw').type='password';
  document.getElementById('loginErr').textContent='';
  const lo = document.getElementById('loginOverlay');
  lo.classList.add('open'); lo.style.display='flex';
  setTimeout(()=>document.getElementById('loginPw').focus(),120);
}

async function verificarLogin() {
  const pw = document.getElementById('loginPw').value;
  try {
    showLoading(true);
    const res = await api('POST','/login',{ id: loginTargetProfile.id, password: pw });
    currentUser = res.usuario;
    const lo=document.getElementById('loginOverlay');
    lo.classList.remove('open'); lo.style.display='none';
    loginTargetProfile=null;
    abrirApp();
  } catch(e) {
    showLoading(false);
    const inp=document.getElementById('loginPw');
    inp.classList.add('error');
    document.getElementById('loginErr').textContent=e.message;
    inp.value='';
    setTimeout(()=>{ inp.classList.remove('error'); inp.focus(); },350);
  }
}

function cancelarLogin() {
  const lo=document.getElementById('loginOverlay');
  lo.classList.remove('open'); lo.style.display='none';
  loginTargetProfile=null;
}

function togglePwVis(id,btn){
  const inp=document.getElementById(id);
  inp.type=inp.type==='password'?'text':'password';
  btn.textContent=inp.type==='password'?'ðŸ‘':'ðŸ™ˆ';
}

async function logout() {
  if(!confirm('Â¿Cerrar sesiÃ³n?')) return;
  await api('POST','/logout');
  currentUser=null; ingresos=[]; gastos=[]; prestamos=[]; cats={...BUILTIN_CATS};
  Object.keys(charts).forEach(k=>{ try{charts[k].destroy();}catch(e){} }); charts={};
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-gastos').classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(el=>el.classList.remove('active'));
  document.querySelector('.tab-btn').classList.add('active');
  const ps=document.getElementById('profileScreen');
  ps.classList.remove('hidden'); ps.style.display='flex';
  cargarPerfiles();
}

function abrirApp() {
  showLoading(false);
  document.getElementById('navUserName').textContent=currentUser.nombre;
  const dot=document.getElementById('navUserDot');
  dot.textContent=currentUser.emoji;
  dot.style.background=currentUser.color+'25';
  const ps=document.getElementById('profileScreen');
  ps.classList.add('hidden'); ps.style.display='none';
  cats={...BUILTIN_CATS};
  cargarMes();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NAVIGATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function showPage(p, btn) {
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  if(btn) btn.classList.add('active');
  if(p==='graficos') renderCharts();
  if(p==='comparativa') renderComparativa();
  if(p==='prestamos') cargarPrestamos();
}

function fmt(n){ return Number(n).toLocaleString('es-PY'); }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CARGAR MES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function cargarMes() {
  showLoading(true);
  try {
    mesActual = document.getElementById('mesSelect').value;
    const [ings, gasts, catRows] = await Promise.all([
      api('GET', `/ingresos/${mesActual}/${anioActual}`),
      api('GET', `/gastos/${mesActual}/${anioActual}`),
      api('GET', '/categorias'),
    ]);
    ingresos = ings;
    gastos   = gasts;
    cats = {...BUILTIN_CATS};
    catRows.forEach(c=>{ cats[c.clave]={ label:c.etiqueta, color:c.color }; });

    if(gastos.length===0) {
      const mesAnteriorIdx = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'].indexOf(mesActual)-1;
      if(mesAnteriorIdx>=0) {
        const mesAnterior = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][mesAnteriorIdx];
        await api('POST','/gastos/copiar-recurrentes',{
          mes_origen:mesAnterior, anio_origen:anioActual,
          mes_destino:mesActual,  anio_destino:anioActual
        });
        gastos = await api('GET',`/gastos/${mesActual}/${anioActual}`);
      }
    }

    if(ingresos.length===0) {
      const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      const idx=meses.indexOf(mesActual)-1;
      if(idx>=0) {
        const anterior=await api('GET',`/ingresos/${meses[idx]}/${anioActual}`);
        for(const i of anterior) {
          const ni=await api('POST','/ingresos',{...i,mes:mesActual,anio:anioActual,id:undefined});
          ingresos.push(ni);
        }
      }
    }

    filterCat=null;
    if(document.getElementById('searchInput')) document.getElementById('searchInput').value='';
    renderIngresos(); renderGastos(); recalcular();
  } catch(e) { showToast(e.message,'err'); }
  showLoading(false);
}

async function cambiarMes() {
  await cargarMes();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INGRESOS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderIngresos() {
  const sec=document.getElementById('ingresosSection');
  if(!ingresos.length){
    sec.innerHTML='<div class="empty-state">sin ingresos Â· agregÃ¡ el primero arriba â†‘</div>'; return;
  }
  sec.innerHTML=ingresos.map(ing=>{
    const gastosIng=gastos.filter(g=>g.ingreso_id===ing.id).reduce((s,g)=>s+parseFloat(g.monto),0);
    const pct=ing.monto>0?Math.min((gastosIng/ing.monto)*100,100):0;
    return `<div class="ingreso-item">
      <div class="ingreso-color-dot" style="background:${ing.color}"></div>
      <input class="ingreso-name-input" type="text" value="${ing.nombre}"
        onblur="editIngreso(${ing.id},'nombre',this.value)">
      <input class="ingreso-amount-input" type="number" value="${ing.monto}"
        onblur="editIngreso(${ing.id},'monto',this.value)">
      <div class="ingreso-prog">
        <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${pct>=100?'var(--red)':ing.color}"></div></div>
        <div style="font-size:.62rem;color:var(--muted);text-align:right;margin-top:.2rem">${Math.round(pct)}%</div>
      </div>
      <button class="btn-del" onclick="eliminarIngreso(${ing.id})">Ã—</button>
    </div>`;
  }).join('');
}

async function editIngreso(id, campo, val) {
  const ing=ingresos.find(i=>i.id===id);
  if(!ing) return;
  ing[campo]=campo==='monto'?(parseFloat(val)||0):val;
  try { await api('PUT',`/ingresos/${id}`,{ nombre:ing.nombre, monto:ing.monto, color:ing.color }); recalcular(); }
  catch(e){ showToast(e.message,'err'); }
}

async function eliminarIngreso(id) {
  if(!confirm('Â¿Quitar este ingreso?')) return;
  try {
    await api('DELETE',`/ingresos/${id}`);
    ingresos=ingresos.filter(i=>i.id!==id);
    gastos.forEach(g=>{ if(g.ingreso_id===id) g.ingreso_id=ingresos[0]?.id||null; });
    renderIngresos(); renderGastos(); recalcular();
  } catch(e){ showToast(e.message,'err'); }
}

let miColorVal='#82b4f7';
function openAddIngreso(){
  document.getElementById('mi-nombre').value='';
  document.getElementById('mi-monto').value='';
  miColorVal=INGRESO_COLORS[ingresos.length%INGRESO_COLORS.length];
  renderColorGrid('mi-colorGrid',INGRESO_COLORS,()=>miColorVal);
  syncColorUI('mi',miColorVal);
  document.getElementById('modalIngreso').classList.add('open');
  setTimeout(()=>document.getElementById('mi-nombre').focus(),100);
}

async function confirmarIngreso(){
  const nombre=document.getElementById('mi-nombre').value.trim()||'Ingreso';
  const monto=parseFloat(document.getElementById('mi-monto').value)||0;
  try {
    const ni=await api('POST','/ingresos',{ nombre, monto, color:miColorVal, mes:mesActual, anio:anioActual });
    ingresos.push(ni);
    closeModal('modalIngreso');
    renderIngresos(); renderGastos(); recalcular();
    showToast('Ingreso agregado');
  } catch(e){ showToast(e.message,'err'); }
}

function renderDesglose(){
  const grid=document.getElementById('desgloseGrid');
  if(!ingresos.length){ grid.innerHTML=''; return; }
  grid.innerHTML=ingresos.map(ing=>{
    const g=gastos.filter(x=>x.ingreso_id===ing.id).reduce((s,x)=>s+parseFloat(x.monto),0);
    const resto=ing.monto-g;
    const pct=ing.monto>0?Math.min((g/ing.monto)*100,100):0;
    return `<div class="card" style="border-top:3px solid ${ing.color};padding-top:1rem">
      <div class="card-label">${ing.nombre}</div>
      <div class="card-value neg" style="font-size:1.3rem">${fmt(g)}</div>
      <div class="card-sub">Resto: <span style="color:${resto<0?'var(--red)':'var(--text)'}">${fmt(resto)}</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${pct>=100?'var(--red)':ing.color}"></div></div>
    </div>`;
  }).join('');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CATEGORÃAS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function getCatOptions(sel){
  return Object.entries(cats).map(([k,v])=>`<option value="${k}" ${sel===k?'selected':''}>${v.label}</option>`).join('');
}

function buildPagoOptions(selId){
  if(!ingresos.length) return '<option value="">â€” sin ingresos â€”</option>';
  return ingresos.map(i=>`<option value="${i.id}" ${selId===i.id?'selected':''}>${i.nombre}</option>`).join('');
}

function renderCatLegend(){
  const totals={};
  gastos.forEach(g=>{ totals[g.categoria]=(totals[g.categoria]||0)+parseFloat(g.monto); });
  const used=Object.keys(cats).filter(k=>totals[k]);
  document.getElementById('catLegend').innerHTML=`
    <div class="cat-chip ${!filterCat?'selected':''}" onclick="setFilter(null)">
      <div class="cat-chip-dot" style="background:var(--muted)"></div>Todos
    </div>
    ${used.map(k=>`
      <div class="cat-chip ${filterCat===k?'selected':''}" onclick="setFilter('${k}')">
        <div class="cat-chip-dot" style="background:${cats[k].color}"></div>
        ${cats[k].label}<span class="cat-chip-amount">${fmt(totals[k])}</span>
      </div>`).join('')}`;
}

function setFilter(cat){ filterCat=cat; renderGastos(); }

function openCatManager(){
  ncColor='#82b4f7'; ncEmoji='ðŸ“¦';
  document.getElementById('nc-nombre').value='';
  renderCatManagerList(); renderEmojiTabs(); renderEmojiGrid();
  renderColorGrid('nc-colorGrid',DEFAULT_COLORS,()=>ncColor);
  syncColorUI('nc',ncColor); updateCatPreview();
  document.getElementById('modalCats').classList.add('open');
}

function renderCatManagerList(){
  document.getElementById('catManagerList').innerHTML=
    Object.entries(cats).map(([k,v])=>`
      <div class="cat-manage-row">
        <div class="dot" style="background:${v.color}"></div>
        <span>${v.label}</span>
        ${v.builtin?'<span class="built-in-tag">base</span>'
          :`<button class="btn-del-cat" onclick="eliminarCategoria('${k}')">Ã—</button>`}
      </div>`).join('');
}

async function agregarCategoria(){
  const nombre=document.getElementById('nc-nombre').value.trim();
  if(!nombre) return;
  const clave='cat_'+Date.now();
  const etiqueta=`${ncEmoji} ${nombre}`;
  try {
    await api('POST','/categorias',{ clave, etiqueta, color:ncColor });
    cats[clave]={ label:etiqueta, color:ncColor };
    renderCatManagerList(); renderGastos();
    document.getElementById('nc-nombre').value=''; updateCatPreview();
    showToast('CategorÃ­a agregada');
  } catch(e){ showToast(e.message,'err'); }
}

async function eliminarCategoria(clave){
  if(cats[clave]?.builtin) return;
  try {
    await api('DELETE',`/categorias/${clave}`);
    gastos.forEach(g=>{ if(g.categoria===clave) g.categoria='otro'; });
    delete cats[clave];
    renderCatManagerList(); renderGastos(); renderCatLegend();
  } catch(e){ showToast(e.message,'err'); }
}

function updateCatPreview(){
  const n=document.getElementById('nc-nombre').value.trim()||'Nombre';
  document.getElementById('catPrevDot').style.background=ncColor;
  document.getElementById('catPrevLabel').textContent=`${ncEmoji} ${n}`;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GASTOS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function getFilteredSorted(){
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const sort=document.getElementById('sortSel')?.value||'default';
  let list=[...gastos];
  if(filterCat) list=list.filter(g=>g.categoria===filterCat);
  if(q) list=list.filter(g=>g.descripcion.toLowerCase().includes(q)||(g.nota||'').toLowerCase().includes(q));
  if(sort==='monto-desc') list.sort((a,b)=>b.monto-a.monto);
  else if(sort==='monto-asc') list.sort((a,b)=>a.monto-b.monto);
  else if(sort==='cat') list.sort((a,b)=>a.categoria.localeCompare(b.categoria));
  return list;
}

function renderGastos(){
  const container=document.getElementById('gastosContainer');
  const list=getFilteredSorted();
  if(!list.length){
    const q=document.getElementById('searchInput')?.value||'';
    container.innerHTML=`<div class="empty-state">${q?`sin resultados para "${q}"`:'sin gastos aÃºn Â· agregÃ¡ el primero abajo â†“'}</div>`;
  } else {
    container.innerHTML=list.map(g=>{
      const cat=cats[g.categoria]||cats.otro;
      const pagado=!!g.pagado;
      return `<div class="gasto-row ${pagado?'pagado':''}">
        <button class="btn-pagado ${pagado?'pagado':''}" onclick="togglePagadoGasto(${g.id})">${pagado?'âœ…':'â¬œ'}</button>
        <div class="cat-dot" style="background:${cat.color}"></div>
        <div class="gasto-main">
          <div style="display:flex;align-items:center;gap:.3rem;min-width:0">
            <input type="text" value="${g.descripcion}" onblur="editGasto(${g.id},'descripcion',this.value)" style="min-width:0">
            ${pagado?'<span class="pagado-badge">pagado</span>':''}
            ${g.recurrente?'<span class="rec-badge">â†»</span>':''}
          </div>
          <div class="gasto-nota ${g.nota?'':'placeholder'}" onclick="openNota(${g.id})" style="cursor:pointer">
            ${g.nota||'+ agregar nota'}
          </div>
        </div>
        <select class="cat-select" onchange="editGasto(${g.id},'categoria',this.value)">${getCatOptions(g.categoria)}</select>
        <input type="number" value="${g.monto}" onblur="editGasto(${g.id},'monto',this.value)">
        <select class="pago-select" onchange="editGasto(${g.id},'ingreso_id',parseInt(this.value)||null)">${buildPagoOptions(g.ingreso_id)}</select>
        <div class="gasto-actions">
          <button class="btn-nota ${g.nota?'has-nota':''}" onclick="openNota(${g.id})">ðŸ“</button>
          <span class="recurring-icon ${g.recurrente?'on':''}" onclick="toggleRecurrente(${g.id})">â†»</span>
          <button class="btn-del" onclick="eliminarGasto(${g.id})">Ã—</button>
        </div>
      </div>`;
    }).join('');
  }

  const nc=document.getElementById('newCat');
  const pv=nc.value; nc.innerHTML=getCatOptions(); if(pv&&cats[pv]) nc.value=pv;
  const np=document.getElementById('newPago');
  const pvp=np.value; np.innerHTML=buildPagoOptions(null); if(pvp) np.value=pvp;

  const recCount=gastos.filter(g=>g.recurrente).length;
  const pagCount=gastos.filter(g=>g.pagado).length;
  document.getElementById('recCount').textContent=
    (recCount>0?`Â· ${recCount} recurrente${recCount>1?'s':''} `:'')
    +(gastos.length>0?`Â· ${pagCount}/${gastos.length} pagados`:'');

  renderCatLegend();
}

async function agregarGasto(){
  const desc=document.getElementById('newDesc').value.trim();
  const monto=parseFloat(document.getElementById('newMonto').value)||0;
  const ingresoId=parseInt(document.getElementById('newPago').value)||null;
  const cat=document.getElementById('newCat').value;
  if(!desc||monto<=0) return;
  try {
    const ng=await api('POST','/gastos',{
      descripcion:desc, monto, categoria:cat, ingreso_id:ingresoId,
      recurrente:false, pagado:false, nota:'', mes:mesActual, anio:anioActual
    });
    gastos.push(ng);
    document.getElementById('newDesc').value='';
    document.getElementById('newMonto').value='';
    document.getElementById('newDesc').focus();
    renderGastos(); recalcular();
  } catch(e){ showToast(e.message,'err'); }
}

function enterAdd(e){ if(e.key==='Enter') agregarGasto(); }

async function editGasto(id, campo, val){
  const g=gastos.find(x=>x.id===id);
  if(!g) return;
  g[campo]=campo==='monto'?(parseFloat(val)||0):(campo==='ingreso_id'?(parseInt(val)||null):val);
  try {
    await api('PUT',`/gastos/${id}`,{
      descripcion:g.descripcion, monto:g.monto, categoria:g.categoria,
      ingreso_id:g.ingreso_id, recurrente:g.recurrente, pagado:g.pagado, nota:g.nota
    });
    renderGastos(); recalcular();
  } catch(e){ showToast(e.message,'err'); }
}

async function eliminarGasto(id){
  try {
    await api('DELETE',`/gastos/${id}`);
    gastos=gastos.filter(g=>g.id!==id);
    renderGastos(); recalcular();
  } catch(e){ showToast(e.message,'err'); }
}

async function togglePagadoGasto(id){
  const g=gastos.find(x=>x.id===id);
  if(!g) return;
  g.pagado=!g.pagado;
  await editGasto(id,'pagado',g.pagado);
}

async function toggleRecurrente(id){
  const g=gastos.find(x=>x.id===id);
  if(!g) return;
  g.recurrente=!g.recurrente;
  await editGasto(id,'recurrente',g.recurrente);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NOTAS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openNota(id){
  notaEditId=id;
  const g=gastos.find(x=>x.id===id);
  document.getElementById('notaInput').value=g?.nota||'';
  document.getElementById('modalNota').classList.add('open');
  setTimeout(()=>document.getElementById('notaInput').focus(),100);
}
async function guardarNota(){
  if(!notaEditId) return;
  const nota=document.getElementById('notaInput').value.trim();
  await editGasto(notaEditId,'nota',nota);
  closeModal('modalNota');
}
async function borrarNota(){
  if(!notaEditId) return;
  await editGasto(notaEditId,'nota','');
  closeModal('modalNota');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// RECALCULAR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function recalcular(){
  const totalI=ingresos.reduce((s,i)=>s+parseFloat(i.monto),0);
  const totalG=gastos.reduce((s,g)=>s+parseFloat(g.monto),0);
  const pagado=gastos.filter(g=>g.pagado).reduce((s,g)=>s+parseFloat(g.monto),0);
  const disp=totalI-totalG;
  document.getElementById('totalIngresos').textContent=fmt(totalI);
  document.getElementById('totalGastos').textContent=fmt(totalG);
  const el=document.getElementById('disponible');
  el.textContent=fmt(disp);
  el.className='card-value '+(disp>=0?'pos':'neg');
  const sub=document.getElementById('subGastos');
  if(sub) sub.innerHTML=`<span style="color:var(--green)">âœ“ ${fmt(pagado)} pagado</span> Â· <span style="color:var(--muted)">${fmt(totalG-pagado)} pendiente</span>`;
  renderDesglose(); renderIngresos();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRÃ‰STAMOS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function deudorColor(name){
  const COLS=['#82b4f7','#f7a97e','#f77eb8','#b87ef7','#7ef7d4','#f7c47e','#b8f0a0','#ff9f7e'];
  let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
  return COLS[Math.abs(h)%COLS.length];
}
function deudorInitials(name){
  return name.trim().split(' ').map(w=>w[0]||'').slice(0,2).join('').toUpperCase()||'?';
}

async function cargarPrestamos(){
  try {
    prestamos=await api('GET','/prestamos');
    renderPrestamos(); renderStatsPrestamos();
  } catch(e){ showToast(e.message,'err'); }
}

function setPrestFilter(f,btn){
  prestFilter=f;
  document.querySelectorAll('.prest-filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderPrestamos();
}

function openModalPrestamo(id=null){
  editingPrestId=id;
  const title=document.getElementById('modalPrestamoTitle');
  if(id!==null){
    title.innerHTML='editar <em>prÃ©stamo</em>';
    const p=prestamos.find(x=>x.id===id);
    document.getElementById('prest-deudor').value=p.deudor;
    document.getElementById('prest-monto').value=p.monto;
    document.getElementById('prest-fecha').value=p.fecha?.slice(0,10)||'';
    document.getElementById('prest-nota').value=p.nota||'';
  } else {
    title.innerHTML='nuevo <em>prÃ©stamo</em>';
    document.getElementById('prest-deudor').value='';
    document.getElementById('prest-monto').value='';
    document.getElementById('prest-fecha').value=new Date().toISOString().slice(0,10);
    document.getElementById('prest-nota').value='';
  }
  document.getElementById('modalPrestamo').classList.add('open');
  setTimeout(()=>document.getElementById('prest-deudor').focus(),100);
}

async function guardarPrestamo(){
  const deudor=document.getElementById('prest-deudor').value.trim();
  const monto=parseFloat(document.getElementById('prest-monto').value)||0;
  const fecha=document.getElementById('prest-fecha').value;
  const nota=document.getElementById('prest-nota').value.trim();
  if(!deudor||monto<=0) return;
  try {
    if(editingPrestId!==null){
      const p=prestamos.find(x=>x.id===editingPrestId);
      const updated=await api('PUT',`/prestamos/${editingPrestId}`,{
        deudor,monto,fecha,nota,estado:p.estado,fecha_cobro:p.fecha_cobro||null
      });
      const idx=prestamos.findIndex(x=>x.id===editingPrestId);
      prestamos[idx]=updated;
    } else {
      const np=await api('POST','/prestamos',{deudor,monto,fecha,nota});
      prestamos.push(np);
    }
    closeModal('modalPrestamo');
    renderPrestamos(); renderStatsPrestamos();
    showToast(editingPrestId?'PrÃ©stamo actualizado':'PrÃ©stamo registrado');
  } catch(e){ showToast(e.message,'err'); }
}

async function toggleCobrado(id){
  const p=prestamos.find(x=>x.id===id);
  if(!p) return;
  const nuevoEstado=p.estado==='pendiente'?'cobrado':'pendiente';
  const fechaCobro=nuevoEstado==='cobrado'?new Date().toISOString().slice(0,10):null;
  try {
    const updated=await api('PUT',`/prestamos/${id}`,{
      deudor:p.deudor,monto:p.monto,fecha:p.fecha?.slice(0,10),nota:p.nota,
      estado:nuevoEstado,fecha_cobro:fechaCobro
    });
    const idx=prestamos.findIndex(x=>x.id===id);
    prestamos[idx]=updated;
    renderPrestamos(); renderStatsPrestamos();
  } catch(e){ showToast(e.message,'err'); }
}

async function eliminarPrestamo(id){
  if(!confirm('Â¿Eliminar este prÃ©stamo?')) return;
  try {
    await api('DELETE',`/prestamos/${id}`);
    prestamos=prestamos.filter(x=>x.id!==id);
    renderPrestamos(); renderStatsPrestamos();
  } catch(e){ showToast(e.message,'err'); }
}

function renderStatsPrestamos(){
  const pend=prestamos.filter(p=>p.estado==='pendiente');
  const cob=prestamos.filter(p=>p.estado==='cobrado');
  document.getElementById('statTotalPrestado').textContent=fmt(prestamos.reduce((s,p)=>s+parseFloat(p.monto),0));
  document.getElementById('statPendiente').textContent=fmt(pend.reduce((s,p)=>s+parseFloat(p.monto),0));
  document.getElementById('statPendienteCount').innerHTML=`<span>${pend.length} pendiente${pend.length!==1?'s':''}</span>`;
  document.getElementById('statCobrado').textContent=fmt(cob.reduce((s,p)=>s+parseFloat(p.monto),0));
  document.getElementById('statCobradoCount').innerHTML=`<span>${cob.length} cobrado${cob.length!==1?'s':''}</span>`;
}

function renderPrestamos(){
  const container=document.getElementById('prestamosList');
  let visible=[...prestamos];
  if(prestFilter==='pendiente') visible=visible.filter(p=>p.estado==='pendiente');
  if(prestFilter==='cobrado')   visible=visible.filter(p=>p.estado==='cobrado');
  visible.sort((a,b)=>{
    if(a.estado!==b.estado) return a.estado==='pendiente'?-1:1;
    return new Date(b.fecha)-new Date(a.fecha);
  });
  if(!visible.length){
    const msgs={todos:'ðŸ¤ Sin prÃ©stamos registrados',pendiente:'âœ… No tenÃ©s prÃ©stamos pendientes',cobrado:'ðŸ’° TodavÃ­a no cobraste ningÃºn prÃ©stamo'};
    container.innerHTML=`<div class="prest-empty">${msgs[prestFilter]}</div>`; return;
  }
  container.innerHTML=visible.map(p=>{
    const color=deudorColor(p.deudor);
    const esCobrado=p.estado==='cobrado';
    const fechaFmt=p.fecha?new Date(p.fecha+'T00:00:00').toLocaleDateString('es-PY',{day:'2-digit',month:'short',year:'numeric'}):'â€”';
    const fechaCobroFmt=p.fecha_cobro?new Date(p.fecha_cobro+'T00:00:00').toLocaleDateString('es-PY',{day:'2-digit',month:'short',year:'numeric'}):null;
    return `<div class="prest-row ${esCobrado?'cobrado-row':''}">
      <div class="prest-avatar" style="background:${color}18;color:${color};border:1.5px solid ${color}40">${deudorInitials(p.deudor)}</div>
      <div class="prest-info">
        <div class="prest-name">${p.deudor}<span class="prest-status ${p.estado}">${esCobrado?'cobrado':'pendiente'}</span></div>
        <div class="prest-meta">
          <span>ðŸ“… ${fechaFmt}</span>
          ${fechaCobroFmt?`<span>âœ… Cobrado ${fechaCobroFmt}</span>`:''}
          ${p.nota?`<span style="font-style:italic">ðŸ“ ${p.nota}</span>`:''}
        </div>
      </div>
      <div class="prest-monto ${esCobrado?'cobrado-amt':'pendiente-amt'}">${fmt(p.monto)}</div>
      <div class="prest-actions">
        <button class="btn-cobrar ${esCobrado?'cobrado':''}" onclick="toggleCobrado(${p.id})">${esCobrado?'â†© Revertir':'âœ“ Cobrado'}</button>
        <button class="btn-sm" onclick="openModalPrestamo(${p.id})" style="padding:.3rem .5rem">âœï¸</button>
        <button class="btn-del" onclick="eliminarPrestamo(${p.id})">Ã—</button>
      </div>
    </div>`;
  }).join('');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CHARTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const CD={plugins:{legend:{labels:{color:'#5a5870',font:{family:'DM Mono',size:11},boxWidth:10,padding:12}}}};
function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

function renderCharts(){
  document.getElementById('chartMesLabel').textContent=mesActual.charAt(0).toUpperCase()+mesActual.slice(1);
  destroyChart('cat');
  const ct={};
  gastos.forEach(g=>{ ct[g.categoria]=(ct[g.categoria]||0)+parseFloat(g.monto); });
  const uc=Object.keys(ct);
  charts['cat']=new Chart(document.getElementById('chartCat'),{
    type:'doughnut',
    data:{labels:uc.map(k=>cats[k]?.label||k),datasets:[{data:uc.map(k=>ct[k]),backgroundColor:uc.map(k=>cats[k]?.color||'#999'),borderWidth:2,borderColor:'#13131a'}]},
    options:{...CD,cutout:'65%'}
  });
  destroyChart('pago');
  const it=ingresos.map(i=>({label:i.nombre,color:i.color,val:gastos.filter(g=>g.ingreso_id===i.id).reduce((s,g)=>s+parseFloat(g.monto),0)})).filter(x=>x.val>0);
  charts['pago']=new Chart(document.getElementById('chartPago'),{
    type:'doughnut',
    data:{labels:it.map(x=>x.label),datasets:[{data:it.map(x=>x.val),backgroundColor:it.map(x=>x.color),borderWidth:2,borderColor:'#13131a'}]},
    options:{...CD,cutout:'65%'}
  });
  destroyChart('evol');
  const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const topSorted=[...gastos].sort((a,b)=>parseFloat(b.monto)-parseFloat(a.monto)).slice(0,5);
  const maxM=parseFloat(topSorted[0]?.monto)||1;
  document.getElementById('topGastos').innerHTML=topSorted.length
    ?topSorted.map(g=>{
        const cat=cats[g.categoria]||cats.otro;
        return `<div class="gasto-row" style="grid-template-columns:10px 1fr 1fr 110px">
          <div class="cat-dot" style="background:${cat.color}"></div>
          <div><div>${g.descripcion}</div>${g.nota?`<div class="gasto-nota">${g.nota}</div>`:''}</div>
          <div class="bar-inline"><div class="bar-mini"><div class="bar-mini-fill" style="width:${(parseFloat(g.monto)/maxM)*100}%;background:${cat.color}"></div></div></div>
          <div style="text-align:right;color:var(--red)">${fmt(g.monto)}</div>
        </div>`;}).join('')
    :'<div class="empty-state">sin gastos este mes</div>';
}

async function renderComparativa(){
  const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  showLoading(true);
  try {
    const allData=await Promise.all(meses.map(m=>Promise.all([
      api('GET',`/ingresos/${m}/${anioActual}`),
      api('GET',`/gastos/${m}/${anioActual}`)
    ])));
    const stats=allData.map(([ings,gasts],idx)=>({
      mes:meses[idx],
      ing:ings.reduce((s,i)=>s+parseFloat(i.monto),0),
      gast:gasts.reduce((s,g)=>s+parseFloat(g.monto),0),
    })).filter(x=>x.ing>0||x.gast>0);

    const allGast=stats.map(x=>x.gast);
    const avg=allGast.length?allGast.reduce((a,b)=>a+b,0)/allGast.length:0;
    const mx=allGast.length?Math.max(...allGast):0;
    const mn=allGast.length?Math.min(...allGast):0;

    document.getElementById('compStats').innerHTML=`
      <div class="card"><div class="card-label">Meses con datos</div><div class="card-value">${stats.length}</div></div>
      <div class="card"><div class="card-label">Promedio mensual</div><div class="card-value neg" style="font-size:1.3rem">${fmt(Math.round(avg))}</div></div>
      <div class="card"><div class="card-label">Mes mÃ¡s caro</div><div class="card-value" style="font-size:1.1rem">${stats[allGast.indexOf(mx)]?.mes||'â€”'}</div><div class="card-sub"><span>${fmt(mx)}</span></div></div>
      <div class="card"><div class="card-label">Mes mÃ¡s barato</div><div class="card-value" style="font-size:1.1rem">${stats[allGast.indexOf(mn)]?.mes||'â€”'}</div><div class="card-sub"><span>${fmt(mn)}</span></div></div>`;

    document.getElementById('compTable').innerHTML=`
      <div class="comp-row header"><div>Mes</div><div class="comp-cell">Ingresos</div><div class="comp-cell">Gastos</div><div class="comp-cell">Disponible</div></div>
      ${stats.map(x=>{
        const disp=x.ing-x.gast;
        return `<div class="comp-row ${x.mes===mesActual?'total-row':''}">
          <div>${x.mes}</div>
          <div class="comp-cell pos">${fmt(x.ing)}</div>
          <div class="comp-cell neg">${fmt(x.gast)}</div>
          <div class="comp-cell ${disp>=0?'pos':'neg'}">${fmt(disp)}</div>
        </div>`;
      }).join('')}`;
  } catch(e){ showToast(e.message,'err'); }
  showLoading(false);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPORTAR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function exportarJSON(){
  try {
    const data=await api('GET','/backup');
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`mis-gastos-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Backup descargado');
  } catch(e){ showToast(e.message,'err'); }
}

async function borrarMesActual(){
  if(!confirm(`Â¿Borrar todos los datos de ${mesActual}?`)) return;
  try {
    const ids=gastos.map(g=>g.id);
    await Promise.all(ids.map(id=>api('DELETE',`/gastos/${id}`)));
    const iids=ingresos.map(i=>i.id);
    await Promise.all(iids.map(id=>api('DELETE',`/ingresos/${id}`)));
    gastos=[]; ingresos=[];
    renderIngresos(); renderGastos(); recalcular();
    showToast('Mes borrado');
  } catch(e){ showToast(e.message,'err'); }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// COLOR PICKER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderColorGrid(id,colors,getSel){
  document.getElementById(id).innerHTML=colors.map(c=>
    `<div class="color-swatch ${getSel()===c?'picked':''}" style="background:${c}" onclick="pickColor('${id}','${c}')"></div>`
  ).join('');
}
function pickColor(gridId,color){
  if(gridId==='mi-colorGrid'){ miColorVal=color; syncColorUI('mi',color); renderColorGrid(gridId,INGRESO_COLORS,()=>miColorVal); }
  if(gridId==='nc-colorGrid'){ ncColor=color; syncColorUI('nc',color); updateCatPreview(); renderColorGrid(gridId,DEFAULT_COLORS,()=>ncColor); }
}
function syncColorUI(prefix,color){
  const dot=document.getElementById(prefix+'-previewDot');
  const hex=document.getElementById(prefix+'-hexInput');
  const native=document.getElementById(prefix+'-nativePicker');
  if(dot) dot.style.background=color;
  if(hex) hex.value=color;
  if(native) native.value=color;
}
function onHexInput(prefix,val){
  const clean=val.trim();
  if(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(clean)){
    const full=clean.startsWith('#')?clean:'#'+clean;
    if(prefix==='mi'){ miColorVal=full; } else { ncColor=full; updateCatPreview(); }
    syncColorUI(prefix,full);
    renderColorGrid(prefix+'-colorGrid',prefix==='mi'?INGRESO_COLORS:DEFAULT_COLORS,prefix==='mi'?()=>miColorVal:()=>ncColor);
  }
}
function onNativePick(prefix,val){
  if(prefix==='mi'){ miColorVal=val; } else { ncColor=val; updateCatPreview(); }
  syncColorUI(prefix,val);
  renderColorGrid(prefix+'-colorGrid',prefix==='mi'?INGRESO_COLORS:DEFAULT_COLORS,prefix==='mi'?()=>miColorVal:()=>ncColor);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EMOJI PICKER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let emojiActiveCat=Object.keys(EMOJI_DB)[0];
function renderEmojiTabs(){
  document.getElementById('emojiTabs').innerHTML=Object.keys(EMOJI_DB).map(cat=>
    `<button class="emoji-tab ${emojiActiveCat===cat?'active':''}" onclick="setEmojiCat('${cat}')">${cat.split(' ')[0]}</button>`
  ).join('');
}
function setEmojiCat(cat){ emojiActiveCat=cat; document.getElementById('emojiSearch').value=''; renderEmojiTabs(); renderEmojiGrid(); }
function filterEmojis(){ renderEmojiGrid(); }
function renderEmojiGrid(){
  const q=(document.getElementById('emojiSearch')?.value||'').toLowerCase();
  let emojis=q?[...new Set(Object.values(EMOJI_DB).flat().filter(e=>e.includes(q)))].slice(0,80):EMOJI_DB[emojiActiveCat]||[];
  document.getElementById('emojiGrid').innerHTML=emojis.map(e=>
    `<div class="emoji-opt ${ncEmoji===e?'picked':''}" onclick="pickEmoji('${e}')">${e}</div>`
  ).join('');
}
function pickEmoji(e){ ncEmoji=e; renderEmojiGrid(); updateCatPreview(); }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MODAL HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(el=>{
  el.addEventListener('click',e=>{ if(e.target===el) el.classList.remove('open'); });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
(async()=>{
  showLoading(true);
  try {
    const res=await api('GET','/me');
    currentUser=res.usuario;
    abrirApp();
  } catch {
    showLoading(false);
    const ps=document.getElementById('profileScreen');
    ps.style.display='flex';
    await cargarPerfiles();
  }
})();
