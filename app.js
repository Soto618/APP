/* ══════════════════════════════════════════════
   DollarBank PWA — app.js
   Mejoras incluidas:
   • Toast personalizado (sin alert/confirm nativos)
   • Confirm dialog personalizado
   • Datos por defecto sin balance hardcodeado personal
   • Ajuste de balance registra en historial
   • Historial con paginación "Ver más"
   • Calendario con navegación entre meses
   • Pestaña de Gráficas con Chart.js
   • Total sobrante en sección PLAN
   • Enter en inputs para guardar rápido
   • Service Worker con versionado dinámico
   • Nav con 5 pestañas
   ══════════════════════════════════════════════ */

const STORAGE_KEY = 'dollarbank_pwa_v2';
let selectedDay     = null;
let calYear         = new Date().getFullYear();
let calMonth        = new Date().getMonth();
let selectedQuincena = new Date().getDate() <= 15 ? 1 : 2;
let storageAvailable = true;
let deferredInstallPrompt = null;
let activeModalId   = null;
let historyPage     = 1;
const HISTORY_PAGE_SIZE = 12;

let chartDonut = null;
let chartBars  = null;
let chartLine  = null;

const categoryLabels = { nec: 'Necesidad', gus: 'Gusto', aho: 'Ahorro' };

/* Datos por defecto — el balance arranca en 0, las suscripciones vienen precargadas */
const defaultDb = {
  balance: 0,
  savingsBalance: 0,
  historial: [],
  servicios: [
    { id: 1,  n: "Pago Carro",     d: 1,  m: 495,   cat: "nec" },
    { id: 2,  n: "Netflix",        d: 1,  m: 21.51, cat: "gus" },
    { id: 4,  n: "PS Plus",        d: 4,  m: 9.99,  cat: "gus" },
    { id: 5,  n: "Pago Terreno",   d: 5,  m: 150,   cat: "nec" },
    { id: 6,  n: "Game Pass",      d: 6,  m: 16.49, cat: "gus" },
    { id: 7,  n: "Tidal",          d: 11, m: 16.99, cat: "gus" },
    { id: 8,  n: "Prime Video",    d: 13, m: 14.99, cat: "gus" },
    { id: 9,  n: "Wifi",           d: 14, m: 70,    cat: "nec" },
    { id: 10, n: "Seguro Carro",   d: 16, m: 170,   cat: "nec" },
    { id: 11, n: "ChatGPT",        d: 16, m: 19.99, cat: "gus" },
    { id: 12, n: "Línea Teléfono", d: 20, m: 90,    cat: "nec" }
  ]
};

/* ─── UTILIDADES ─── */
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function money(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function shortMoney(value) { return `$${Number(value || 0).toFixed(0)}`; }

function validPositiveNumber(v) { return !isNaN(v) && Number(v) > 0; }
function validDay(d)            { return Number.isInteger(d) && d >= 1 && d <= 31; }
function validCategory(c)       { return ['nec', 'gus', 'aho'].includes(c); }

function getCurrentMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}
function getCurrentDateString() { return new Date().toLocaleDateString('es-MX'); }
function getTodayQuincena()     { return new Date().getDate() <= 15 ? 1 : 2; }

function trimHistory() {
  if (db.historial.length > 500) db.historial = db.historial.slice(0, 500);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ─── STORAGE ─── */
function checkStorage() {
  try {
    const k = '__db_test__';
    localStorage.setItem(k, 'ok');
    localStorage.removeItem(k);
    storageAvailable = true;
  } catch (e) { storageAvailable = false; }
}

function showStorageWarning(msg) {
  const box = document.getElementById('storage-warning');
  box.classList.remove('hidden');
  box.innerHTML = msg;
}
function hideStorageWarning() {
  const box = document.getElementById('storage-warning');
  box.classList.add('hidden');
  box.innerHTML = '';
}

function loadDb() {
  checkStorage();
  if (!storageAvailable) {
    showStorageWarning('Tu navegador no permite guardar datos localmente. Los cambios se perderán al cerrar.');
    return deepClone(defaultDb);
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) { hideStorageWarning(); return deepClone(defaultDb); }
    const p = JSON.parse(saved);
    hideStorageWarning();
    return {
      balance:        typeof p.balance === 'number'        ? p.balance        : 0,
      savingsBalance: typeof p.savingsBalance === 'number' ? p.savingsBalance : 0,
      historial:      Array.isArray(p.historial)           ? p.historial      : [],
      servicios:      Array.isArray(p.servicios)           ? p.servicios      : []
    };
  } catch (e) {
    showStorageWarning('Los datos guardados están dañados. Reinicia o importa un respaldo.');
    return deepClone(defaultDb);
  }
}

let db = loadDb();

function saveDb() {
  if (!storageAvailable) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
  catch (e) { showStorageWarning('No se pudieron guardar los cambios. Exporta un respaldo.'); }
}

/* ─── TOAST ─── */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fadeOut');
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

/* ─── CONFIRM DIALOG personalizado ─── */
function showConfirm(title, text) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(text)}</p>
        <div class="confirm-btns">
          <button class="confirm-cancel">Cancelar</button>
          <button class="confirm-ok">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.confirm-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.querySelector('.confirm-ok').addEventListener('click',     () => { overlay.remove(); resolve(true);  });
  });
}

/* ─── MODALS ─── */
function openModal(modalId) {
  activeModalId = modalId;
  document.getElementById('modal-backdrop').classList.remove('hidden');
  const el = document.getElementById(modalId);
  el.classList.remove('hidden');
}
function closeModal() {
  if (activeModalId) document.getElementById(activeModalId).classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
  activeModalId = null;
}
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(el => el.classList.add('hidden'));
  document.getElementById('modal-backdrop').classList.add('hidden');
  activeModalId = null;
}
function clearModalInputs(modalId) {
  document.querySelectorAll(`#${modalId} input:not([type=hidden]), #${modalId} select`).forEach(el => {
    if (el.dataset.default) el.value = el.dataset.default;
    else if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
}

/* ─── QUINCENA ─── */
function setQuincena(q) {
  selectedQuincena = q;
  document.getElementById('q1-btn').className = q === 1 ? 'q-btn q-active' : 'q-btn';
  document.getElementById('q2-btn').className = q === 2 ? 'q-btn q-active' : 'q-btn';
  runSmartCalc();
}

/* ─── LÓGICA DE NEGOCIO ─── */
function recordIncome() {
  const input = document.getElementById('pay-input');
  const value = parseFloat(input.value);
  if (!validPositiveNumber(value)) { showToast('Escribe un ingreso válido mayor que 0.', 'error'); return; }
  db.balance += value;
  db.historial.unshift({
    id: Date.now(), fecha: getCurrentDateString(),
    concepto: 'Ingreso', monto: value, cat: 'nec',
    tipo: 'income', monthKey: getCurrentMonthKey(), quincena: getTodayQuincena()
  });
  trimHistory(); input.value = '';
  renderAll();
  showToast(`Ingreso de ${money(value)} registrado.`, 'success');
}

function addExpense({ concepto, monto, cat }) {
  if (!concepto.trim())        { showToast('El concepto es obligatorio.', 'error'); return false; }
  if (!validPositiveNumber(monto)) { showToast('Monto inválido.', 'error'); return false; }
  if (!validCategory(cat))     { showToast('Categoría inválida.', 'error'); return false; }
  db.balance -= monto;
  db.historial.unshift({
    id: Date.now(), fecha: getCurrentDateString(),
    concepto: concepto.trim(), monto, cat,
    tipo: 'expense', monthKey: getCurrentMonthKey(), quincena: getTodayQuincena()
  });
  trimHistory(); renderAll();
  showToast(`Gasto "${concepto.trim()}" registrado.`, 'success');
  return true;
}

function moveToSavings({ concepto, monto }) {
  if (!concepto.trim())        { showToast('El concepto es obligatorio.', 'error'); return false; }
  if (!validPositiveNumber(monto)) { showToast('Monto inválido.', 'error'); return false; }
  if (monto > db.balance)      { showToast('No tienes suficiente balance principal.', 'error'); return false; }
  db.balance -= monto; db.savingsBalance += monto;
  db.historial.unshift({
    id: Date.now(), fecha: getCurrentDateString(),
    concepto: concepto.trim(), monto, cat: 'aho',
    tipo: 'to_savings', monthKey: getCurrentMonthKey(), quincena: getTodayQuincena()
  });
  trimHistory(); renderAll();
  showToast(`${money(monto)} enviado a ahorro.`, 'success');
  return true;
}

function returnFromSavings({ concepto, monto }) {
  if (!concepto.trim())        { showToast('El concepto es obligatorio.', 'error'); return false; }
  if (!validPositiveNumber(monto)) { showToast('Monto inválido.', 'error'); return false; }
  if (monto > db.savingsBalance) { showToast('No tienes suficiente ahorro acumulado.', 'error'); return false; }
  db.savingsBalance -= monto; db.balance += monto;
  db.historial.unshift({
    id: Date.now(), fecha: getCurrentDateString(),
    concepto: concepto.trim(), monto, cat: 'aho',
    tipo: 'from_savings', monthKey: getCurrentMonthKey(), quincena: getTodayQuincena()
  });
  trimHistory(); renderAll();
  showToast(`${money(monto)} regresado al balance.`, 'success');
  return true;
}

/* Ajuste de balance AHORA registra en historial */
function adjustBalance(newBalance, nota) {
  if (isNaN(newBalance) || newBalance < 0) { showToast('Balance inválido.', 'error'); return false; }
  const diff = newBalance - db.balance;
  db.balance = newBalance;
  const concepto = nota && nota.trim() ? nota.trim() : 'Ajuste de balance';
  db.historial.unshift({
    id: Date.now(), fecha: getCurrentDateString(),
    concepto, monto: Math.abs(diff), cat: 'nec',
    tipo: diff >= 0 ? 'income' : 'expense',
    esAjuste: true,
    monthKey: getCurrentMonthKey(), quincena: getTodayQuincena()
  });
  trimHistory(); renderAll();
  showToast(`Balance ajustado a ${money(newBalance)}.`, 'success');
  return true;
}

function addSubscription({ nombre, dia, monto, cat }) {
  if (!nombre.trim())          { showToast('El nombre es obligatorio.', 'error'); return false; }
  if (!validDay(dia))          { showToast('Día inválido.', 'error'); return false; }
  if (!validPositiveNumber(monto)) { showToast('Monto inválido.', 'error'); return false; }
  if (!validCategory(cat))     { showToast('Categoría inválida.', 'error'); return false; }
  db.servicios.push({ id: Date.now(), n: nombre.trim(), d: dia, m: monto, cat });
  renderAll();
  showToast(`Suscripción "${nombre.trim()}" agregada.`, 'success');
  return true;
}

async function deleteSubscription(id) {
  const sub = db.servicios.find(x => x.id === id);
  if (!sub) return;
  const ok = await showConfirm('Eliminar suscripción', `¿Eliminar "${sub.n}"?`);
  if (!ok) return;
  db.servicios = db.servicios.filter(x => x.id !== id);
  renderAll();
  showToast('Suscripción eliminada.', 'info');
}

function openEditMovement(id) {
  const item = db.historial.find(h => h.id === id);
  if (!item) return;
  if (item.tipo === 'income') {
    showToast('Los ingresos no se editan aquí. Usa Ajustar Balance para corregir.', 'info');
    return;
  }
  document.getElementById('edit-id').value      = item.id;
  document.getElementById('edit-concepto').value = item.concepto || '';
  document.getElementById('edit-monto').value    = item.monto;
  document.getElementById('edit-cat').value      = validCategory(item.cat) ? item.cat : 'nec';
  openModal('edit-modal');
}

function updateMovement(id, { concepto, monto, cat }) {
  const index = db.historial.findIndex(h => h.id === id);
  if (index === -1) return false;
  const item = db.historial[index];
  if (!concepto.trim())        { showToast('El concepto es obligatorio.', 'error'); return false; }
  if (!validPositiveNumber(monto)) { showToast('Monto inválido.', 'error'); return false; }
  if (!validCategory(cat))     { showToast('Categoría inválida.', 'error'); return false; }

  if (item.tipo === 'expense') {
    db.balance += item.monto;
    db.balance -= monto;
  } else if (item.tipo === 'to_savings') {
    db.balance += item.monto; db.savingsBalance -= item.monto;
    if (monto > db.balance) {
      db.balance -= item.monto; db.savingsBalance += item.monto;
      showToast('No hay suficiente balance para ese monto.', 'error'); return false;
    }
    db.balance -= monto; db.savingsBalance += monto;
  } else if (item.tipo === 'from_savings') {
    db.balance -= item.monto; db.savingsBalance += item.monto;
    if (monto > db.savingsBalance) {
      db.balance += item.monto; db.savingsBalance -= item.monto;
      showToast('No hay suficiente ahorro para ese monto.', 'error'); return false;
    }
    db.balance += monto; db.savingsBalance -= monto;
  }

  db.historial[index] = { ...db.historial[index], concepto: concepto.trim(), monto, cat };
  renderAll();
  showToast('Movimiento actualizado.', 'success');
  return true;
}

async function deleteHistoryItem(id) {
  const index = db.historial.findIndex(h => h.id === id);
  if (index === -1) return;
  const item = db.historial[index];
  const ok = await showConfirm('Eliminar movimiento', `¿Eliminar "${item.concepto}"?`);
  if (!ok) return;

  if (item.tipo === 'expense')       db.balance += item.monto;
  else if (item.tipo === 'income')   db.balance -= item.monto;
  else if (item.tipo === 'to_savings')   { db.balance += item.monto; db.savingsBalance -= item.monto; }
  else if (item.tipo === 'from_savings') { db.balance -= item.monto; db.savingsBalance += item.monto; }

  db.historial.splice(index, 1);
  renderAll();
  showToast('Movimiento eliminado.', 'info');
}

function exportData() {
  const data = JSON.stringify(db, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `dollarbank_respaldo_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Respaldo exportado correctamente.', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const p = JSON.parse(reader.result);
      if (typeof p !== 'object' || p === null) throw new Error('Formato inválido');
      db = {
        balance:        typeof p.balance === 'number'        ? p.balance        : 0,
        savingsBalance: typeof p.savingsBalance === 'number' ? p.savingsBalance : 0,
        historial:      Array.isArray(p.historial)           ? p.historial      : [],
        servicios:      Array.isArray(p.servicios)           ? p.servicios      : []
      };
      renderAll();
      showToast('Respaldo importado correctamente.', 'success');
    } catch (e) { showToast('No se pudo importar el archivo JSON.', 'error'); }
  };
  reader.readAsText(file);
}

async function resetApp() {
  const ok = await showConfirm('Reiniciar App', 'Esto borrará todos los datos guardados en este dispositivo. ¿Deseas continuar?');
  if (!ok) return;
  db = deepClone(defaultDb);
  if (storageAvailable) { try { localStorage.removeItem(STORAGE_KEY); } catch(e){} }
  historyPage = 1;
  renderAll();
  showToast('La app fue reiniciada.', 'info');
}

/* ─── RENDER BALANCE ─── */
function renderBalance() {
  document.getElementById('main-balance').innerText     = money(db.balance);
  document.getElementById('secondary-balance').innerText = `Ahorro acumulado: ${money(db.savingsBalance)}`;
  document.getElementById('home-balance').innerText     = money(db.balance);
  document.getElementById('home-savings').innerText     = money(db.savingsBalance);
  document.getElementById('home-total').innerText       = money(db.balance + db.savingsBalance);
}

/* ─── RENDER HISTORIAL con paginación ─── */
function historyAmountText(h) {
  if (h.tipo === 'income' || h.tipo === 'from_savings') return `<b class="good">+${money(h.monto)}</b>`;
  return `<b class="danger">-${money(h.monto)}</b>`;
}
function historyTypeLabel(h) {
  if (h.tipo === 'income')       return h.esAjuste ? 'Ajuste ↑' : 'Ingreso';
  if (h.tipo === 'expense')      return h.esAjuste ? 'Ajuste ↓' : (categoryLabels[h.cat] || 'Gasto');
  if (h.tipo === 'to_savings')   return 'Ahorro';
  if (h.tipo === 'from_savings') return 'Retorno';
  return categoryLabels[h.cat] || 'Movimiento';
}
function historyTagClass(h) {
  if (h.esAjuste) return 'tag-adj';
  return `tag-${validCategory(h.cat) ? h.cat : 'nec'}`;
}

function renderHistory() {
  const historyEl = document.getElementById('history-list');
  const moreBtn   = document.getElementById('history-more-btn');

  if (!db.historial.length) {
    historyEl.innerHTML = `<p class="muted" style="text-align:center;padding:12px 0;">No hay movimientos aún.</p>`;
    moreBtn.classList.add('hidden');
    return;
  }

  const total   = db.historial.length;
  const visible = Math.min(historyPage * HISTORY_PAGE_SIZE, total);
  const slice   = db.historial.slice(0, visible);

  historyEl.innerHTML = slice.map(h => `
    <div class="hist-item">
      <div class="hist-main">
        <div class="hist-concept">${escapeHtml(h.concepto || 'Sin concepto')}</div>
        <div style="font-size:0.78rem;">
          ${escapeHtml(h.fecha || '')}
          <span class="cat-tag ${historyTagClass(h)}">${historyTypeLabel(h)}</span>
        </div>
      </div>
      <div class="hist-actions">
        ${historyAmountText(h)}
        <button class="btn-edit"      data-edit-id="${h.id}">✏️</button>
        <button class="btn-del-small" data-del-id="${h.id}">🗑️</button>
      </div>
    </div>
  `).join('');

  historyEl.querySelectorAll('[data-edit-id]').forEach(btn =>
    btn.addEventListener('click', () => openEditMovement(Number(btn.dataset.editId))));
  historyEl.querySelectorAll('[data-del-id]').forEach(btn =>
    btn.addEventListener('click', () => deleteHistoryItem(Number(btn.dataset.delId))));

  if (visible < total) {
    moreBtn.classList.remove('hidden');
    moreBtn.textContent = `Ver más (${total - visible} restantes)`;
  } else {
    moreBtn.classList.add('hidden');
  }
}

/* ─── RENDER SUSCRIPCIONES ─── */
function renderSubscriptions() {
  const container = document.getElementById('subscription-list');
  if (!db.servicios.length) {
    container.innerHTML = `<div class="card"><p class="muted">No hay suscripciones registradas.</p></div>`;
    return;
  }
  container.innerHTML = [...db.servicios].sort((a, b) => a.d - b.d).map(s => `
    <div class="card" style="padding:12px 16px;">
      <div class="item-row" style="padding:4px 0 8px 0;">
        <span><b>${s.d}</b>. ${escapeHtml(s.n)} <span class="cat-tag tag-${s.cat}">${categoryLabels[s.cat]}</span></span>
        <b>${money(s.m)}</b>
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <button class="btn-del-small" data-sub-del="${s.id}">Eliminar</button>
      </div>
    </div>
  `).join('');
  container.querySelectorAll('[data-sub-del]').forEach(btn =>
    btn.addEventListener('click', () => deleteSubscription(Number(btn.dataset.subDel))));
}

/* ─── SMART CALC (Plan 50/30/20) con total sobrante ─── */
function runSmartCalc() {
  const income = parseFloat(document.getElementById('calc-input').value) || 0;

  const necP = income * 0.5;
  const gusP = income * 0.3;
  const ahoP = income * 0.2;

  document.getElementById('nec-val').innerText = shortMoney(necP);
  document.getElementById('gus-val').innerText = shortMoney(gusP);
  document.getElementById('aho-val').innerText = shortMoney(ahoP);

  const qServ = db.servicios.filter(s =>
    selectedQuincena === 1 ? s.d <= 15 : s.d > 15);

  let fixedNec = 0, fixedGus = 0, fixedAho = 0;
  qServ.forEach(s => {
    if (s.cat === 'nec') fixedNec += s.m;
    else if (s.cat === 'gus') fixedGus += s.m;
    else fixedAho += s.m;
  });

  const qHistory = db.historial.filter(h =>
    h.quincena === selectedQuincena && h.monthKey === getCurrentMonthKey());

  let varNec = 0, varGus = 0, actualSaved = 0;
  qHistory.forEach(h => {
    if (h.tipo === 'expense') {
      if (h.cat === 'nec')      varNec += h.monto;
      else if (h.cat === 'gus') varGus += h.monto;
      else actualSaved += h.monto;
    } else if (h.tipo === 'to_savings') {
      actualSaved += h.monto;
    }
  });

  const totalNecUsed = fixedNec + varNec;
  const totalGusUsed = fixedGus + varGus;
  const totalAhoUsed = fixedAho + actualSaved;

  const libreNec = necP - totalNecUsed;
  const libreGus = gusP - totalGusUsed;
  const libreAho = ahoP - totalAhoUsed;

  document.getElementById('quincena-breakdown').innerHTML = `
    <div class="remainder-box">
      <div class="item-row"><span>Fijos necesidades</span><b>${money(fixedNec)}</b></div>
      <div class="item-row"><span>Variables necesidades</span><b>${money(varNec)}</b></div>
      <div class="item-row"><span>Libre necesidades</span><b class="${libreNec >= 0 ? 'good' : 'danger'}">${money(libreNec)}</b></div>

      <div class="item-row"><span>Fijos gustos</span><b>${money(fixedGus)}</b></div>
      <div class="item-row"><span>Variables gustos</span><b>${money(varGus)}</b></div>
      <div class="item-row"><span>Libre gustos</span><b class="${libreGus >= 0 ? 'warning' : 'danger'}">${money(libreGus)}</b></div>

      <div class="item-row"><span>Ahorro ejecutado / meta</span><b>${money(totalAhoUsed)} / ${money(ahoP)}</b></div>
      <div class="item-row"><span>Diferencia ahorro</span><b class="${libreAho >= 0 ? 'good' : 'danger'}">${money(libreAho)}</b></div>
    </div>
  `;

  /* ── TOTAL SOBRANTE FINAL ── */
  const totalSobrante = libreNec + libreGus + libreAho;
  const remainderBox  = document.getElementById('total-remainder-box');

  if (income > 0) {
    remainderBox.classList.remove('hidden');
    const cls = totalSobrante >= 0 ? 'good' : 'danger';
    const icon = totalSobrante >= 0 ? '✅' : '⚠️';
    const pct  = income > 0 ? Math.abs(totalSobrante / income * 100).toFixed(1) : '0.0';
    remainderBox.innerHTML = `
      <div class="tr-label">TOTAL LIBRE DESPUÉS DE GASTOS Y COMPROMISOS</div>
      <div class="tr-value ${cls}">${icon} ${money(totalSobrante)}</div>
      <div class="tr-detail">
        ${totalSobrante >= 0
          ? `Te sobra el <b>${pct}%</b> del ingreso ingresado (${money(income)})`
          : `Estás <b>${pct}%</b> por encima de tu presupuesto — revisa tus gastos`}
      </div>
    `;
  } else {
    remainderBox.classList.add('hidden');
  }

  /* ── LISTA COMPLETA DEL MES ── */
  let fullHtml = '';
  [...db.servicios].sort((a, b) => a.d - b.d).forEach(s => {
    const isActive = (selectedQuincena === 1 && s.d <= 15) || (selectedQuincena === 2 && s.d > 15);
    fullHtml += `
      <div class="item-row" style="opacity:${isActive ? '1' : '0.38'}">
        <span>
          <span class="item-date">${s.d}</span>
          ${escapeHtml(s.n)}
          <span class="cat-tag tag-${s.cat}">${categoryLabels[s.cat]}</span>
        </span>
        <b>${money(s.m)}</b>
      </div>`;
  });
  document.getElementById('full-month-list').innerHTML =
    fullHtml || `<p class="muted">No hay pagos registrados.</p>`;
}

/* ─── CALENDARIO con navegación ─── */
function drawCalendar() {
  const today     = new Date();
  const todayDay  = today.getDate();
  const todayM    = today.getMonth();
  const todayY    = today.getFullYear();

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  document.getElementById('month-name').innerText = `${monthNames[calMonth]} ${calYear}`;

  const firstDayNative = new Date(calYear, calMonth, 1).getDay();
  const firstDay = (firstDayNative + 6) % 7; // lunes = 0
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let html = `
    <div class="cal-head">L</div><div class="cal-head">M</div>
    <div class="cal-head">X</div><div class="cal-head">J</div>
    <div class="cal-head">V</div><div class="cal-head">S</div>
    <div class="cal-head">D</div>
  `;
  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const hasPayments = db.servicios.some(s => s.d === d);
    const isToday     = (d === todayDay && calMonth === todayM && calYear === todayY);
    const isSel       = (d === selectedDay);
    html += `
      <button class="cal-day ${isToday ? 'cal-today' : ''} ${isSel ? 'cal-selected' : ''}" data-day="${d}">
        <div>${d}</div>
        ${hasPayments ? '<div style="width:5px;height:5px;background:var(--accent);border-radius:50%;margin-top:2px;"></div>' : ''}
      </button>`;
  }

  const body = document.getElementById('calendar-body');
  body.innerHTML = html;
  body.querySelectorAll('[data-day]').forEach(btn => {
    btn.addEventListener('click', () => { selectedDay = Number(btn.dataset.day); drawCalendar(); showDay(selectedDay); });
  });
}

function showDay(d) {
  const pays = db.servicios.filter(s => s.d === d);
  let h = `<div class="card"><h4 style="margin-bottom:8px;">Día ${d}</h4>`;
  if (!pays.length) {
    h += `<p class="muted">Día libre. No hay pagos fijos registrados.</p>`;
  } else {
    pays.sort((a, b) => a.m - b.m).forEach(p => {
      h += `<div class="item-row">
        <span>${escapeHtml(p.n)} <span class="cat-tag tag-${p.cat}">${categoryLabels[p.cat]}</span></span>
        <b>${money(p.m)}</b>
      </div>`;
    });
  }
  h += `</div>`;
  document.getElementById('day-details').innerHTML = h;
}

/* ─── GRÁFICAS ─── */
function renderCharts() {
  const monthKey = getCurrentMonthKey();
  const monthHistory = db.historial.filter(h => h.monthKey === monthKey);

  /* Totales por categoría del mes */
  let necTotal = 0, gusTotal = 0, ahoTotal = 0, incTotal = 0;
  monthHistory.forEach(h => {
    if (h.tipo === 'income')        incTotal += h.monto;
    else if (h.tipo === 'expense') {
      if (h.cat === 'nec')      necTotal += h.monto;
      else if (h.cat === 'gus') gusTotal += h.monto;
      else ahoTotal += h.monto;
    }
    else if (h.tipo === 'to_savings') ahoTotal += h.monto;
  });

  const CHART_DEFAULTS = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: ctx => ` $${ctx.parsed.toFixed ? ctx.parsed.toFixed(2) : ctx.parsed.y.toFixed(2)}`
    }}}
  };

  /* 1. DONUT */
  const donutCtx = document.getElementById('chart-donut').getContext('2d');
  if (chartDonut) chartDonut.destroy();
  const donutTotal = necTotal + gusTotal + ahoTotal;
  chartDonut = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Necesidades', 'Gustos', 'Ahorro'],
      datasets: [{
        data: [necTotal, gusTotal, ahoTotal],
        backgroundColor: ['#22c55e', '#eab308', '#3b82f6'],
        borderColor: '#1e293b',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '65%',
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: { callbacks: {
          label: ctx => {
            const pct = donutTotal > 0 ? (ctx.raw / donutTotal * 100).toFixed(1) : 0;
            return ` $${ctx.raw.toFixed(2)} (${pct}%)`;
          }
        }}
      }
    }
  });

  /* Leyenda manual */
  document.getElementById('chart-legend').innerHTML = [
    { label: 'Necesidades', color: '#22c55e', value: necTotal },
    { label: 'Gustos',      color: '#eab308', value: gusTotal },
    { label: 'Ahorro',      color: '#3b82f6', value: ahoTotal },
  ].map(item => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${item.color}"></div>
      <span>${item.label}: <b>$${item.value.toFixed(2)}</b></span>
    </div>
  `).join('');

  /* 2. BARRAS por categoría */
  const barsCtx = document.getElementById('chart-bars').getContext('2d');
  if (chartBars) chartBars.destroy();
  chartBars = new Chart(barsCtx, {
    type: 'bar',
    data: {
      labels: ['Necesidades', 'Gustos', 'Ahorro', 'Ingresos'],
      datasets: [{
        data: [necTotal, gusTotal, ahoTotal, incTotal],
        backgroundColor: ['#22c55e99','#eab30899','#3b82f699','#fbbf2499'],
        borderColor:     ['#22c55e', '#eab308', '#3b82f6', '#fbbf24'],
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
        y: { ticks: { color: '#94a3b8', font: { size: 10 },
              callback: v => `$${v}` },
             grid: { color: '#33415540' } }
      }
    }
  });

  /* 3. LÍNEA de balance histórico */
  const lineCtx = document.getElementById('chart-line').getContext('2d');
  if (chartLine) chartLine.destroy();

  /* Reconstruir balance de los últimos 30 movimientos hacia atrás */
  const lastN = db.historial.slice(0, 30).reverse(); // más antiguo primero
  let runBal = db.balance;
  /* Sumar hacia adelante desde balance actual (invertir operaciones) */
  const balPoints = [];
  const lineLabels = [];

  /* Primero acumular forward desde hoy */
  let temp = db.balance;
  const revHistory = db.historial.slice(0, 30); // más reciente primero
  const tempPoints = [temp];
  revHistory.forEach(h => {
    if (h.tipo === 'income')         temp -= h.monto;
    else if (h.tipo === 'expense')   temp += h.monto;
    else if (h.tipo === 'to_savings')   temp += h.monto;
    else if (h.tipo === 'from_savings') temp -= h.monto;
    tempPoints.push(temp);
  });
  tempPoints.reverse();

  const labels = [...revHistory].reverse().map(h => h.fecha || '');
  labels.push('Hoy');

  chartLine = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: tempPoints,
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251,191,36,0.08)',
        pointBackgroundColor: '#fbbf24',
        pointRadius: 3,
        fill: true,
        tension: 0.35,
        borderWidth: 2
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45, maxTicksLimit: 8 },
             grid: { display: false } },
        y: { ticks: { color: '#94a3b8', font: { size: 10 },
              callback: v => `$${v.toFixed(0)}` },
             grid: { color: '#33415540' } }
      }
    }
  });

  /* 4. RESUMEN suscripciones */
  const sortedSubs = [...db.servicios].sort((a, b) => b.m - a.m);
  const totalSubs  = sortedSubs.reduce((s, x) => s + x.m, 0);
  document.getElementById('chart-subs-summary').innerHTML = sortedSubs.length
    ? sortedSubs.map(s => `
        <div class="chart-subs-row">
          <span>${escapeHtml(s.n)} <span class="cat-tag tag-${s.cat}">${categoryLabels[s.cat]}</span></span>
          <b>${money(s.m)}</b>
        </div>`).join('') +
      `<div class="chart-subs-row" style="margin-top:6px;border-top:2px solid var(--accent);padding-top:10px;">
        <span><b>Total mensual</b></span><b class="danger">${money(totalSubs)}</b>
      </div>`
    : `<p class="muted">No hay suscripciones registradas.</p>`;
}

/* ─── NAVEGACIÓN DE PÁGINAS ─── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
  const navBtn = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (navBtn) navBtn.classList.add('active-nav');
  if (id === 'charts-page') renderCharts();
}

/* ─── RENDER ALL ─── */
function renderAll() {
  saveDb();
  renderBalance();
  renderHistory();
  renderSubscriptions();
  drawCalendar();
  setQuincena(selectedQuincena);
  if (selectedDay !== null) showDay(selectedDay);
}

/* ─── INSTALL PWA ─── */
function setupInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('install-btn').classList.remove('hidden');
  });
  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) { showToast('Instalación no disponible en este navegador.', 'info'); return; }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    document.getElementById('install-btn').classList.add('hidden');
  });
}

/* ─── SERVICE WORKER ─── */
function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

/* ─── HELPERS DE INPUTS MODALES ─── */
function getVal(id)        { return document.getElementById(id).value; }
function clearVal(id, def) { document.getElementById(id).value = def !== undefined ? def : ''; }

/* ─── EVENTOS ─── */
function setupEvents() {

  /* Ingreso: botón y Enter */
  document.getElementById('add-income-btn').addEventListener('click', recordIncome);
  document.getElementById('pay-input').addEventListener('keydown', e => { if (e.key === 'Enter') recordIncome(); });

  /* Exportar / Importar / Reiniciar */
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('reset-btn').addEventListener('click', resetApp);
  document.getElementById('import-open-btn').addEventListener('click', () =>
    document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', (e) => {
    importData(e.target.files[0]);
    e.target.value = '';
  });

  /* Quincena */
  document.getElementById('q1-btn').addEventListener('click', () => setQuincena(1));
  document.getElementById('q2-btn').addEventListener('click', () => setQuincena(2));
  document.getElementById('calc-input').addEventListener('input', runSmartCalc);

  /* Historial "Ver más" */
  document.getElementById('history-more-btn').addEventListener('click', () => {
    historyPage++;
    renderHistory();
  });

  /* Nav */
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  /* Botones open-modal */
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });

  /* Botones close-modal */
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal());
  });

  /* Backdrop */
  document.getElementById('modal-backdrop').addEventListener('click', closeAllModals);

  /* Calendario: navegación entre meses */
  document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    selectedDay = null;
    document.getElementById('day-details').innerHTML = '';
    drawCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    selectedDay = null;
    document.getElementById('day-details').innerHTML = '';
    drawCalendar();
  });

  /* ── MODAL: Gasto ── */
  document.getElementById('exp-submit').addEventListener('click', () => {
    const ok = addExpense({
      concepto: getVal('exp-concepto'),
      monto:    parseFloat(getVal('exp-monto')),
      cat:      getVal('exp-cat')
    });
    if (ok) { closeModal(); clearVal('exp-concepto'); clearVal('exp-monto'); }
  });

  /* ── MODAL: Ahorro ── */
  document.getElementById('sav-submit').addEventListener('click', () => {
    const ok = moveToSavings({
      concepto: getVal('sav-concepto'),
      monto:    parseFloat(getVal('sav-monto'))
    });
    if (ok) { closeModal(); clearVal('sav-concepto', 'Ahorro'); clearVal('sav-monto'); }
  });

  /* ── MODAL: Retorno ahorro ── */
  document.getElementById('ret-submit').addEventListener('click', () => {
    const ok = returnFromSavings({
      concepto: getVal('ret-concepto'),
      monto:    parseFloat(getVal('ret-monto'))
    });
    if (ok) { closeModal(); clearVal('ret-concepto', 'Retiro de ahorro'); clearVal('ret-monto'); }
  });

  /* ── MODAL: Ajuste balance ── */
  document.getElementById('adj-submit').addEventListener('click', () => {
    const ok = adjustBalance(parseFloat(getVal('adj-balance')), getVal('adj-concepto'));
    if (ok) { closeModal(); clearVal('adj-concepto'); clearVal('adj-balance'); }
  });

  /* ── MODAL: Suscripción ── */
  document.getElementById('sub-submit').addEventListener('click', () => {
    const ok = addSubscription({
      nombre: getVal('sub-nombre'),
      dia:    parseInt(getVal('sub-dia'), 10),
      monto:  parseFloat(getVal('sub-monto')),
      cat:    getVal('sub-cat')
    });
    if (ok) {
      closeModal();
      clearVal('sub-nombre'); clearVal('sub-dia'); clearVal('sub-monto');
    }
  });

  /* ── MODAL: Editar movimiento ── */
  document.getElementById('edit-submit').addEventListener('click', () => {
    const ok = updateMovement(Number(getVal('edit-id')), {
      concepto: getVal('edit-concepto'),
      monto:    parseFloat(getVal('edit-monto')),
      cat:      getVal('edit-cat')
    });
    if (ok) closeModal();
  });
}

/* ─── INIT ─── */
setupInstall();
setupServiceWorker();
setupEvents();
renderAll();
