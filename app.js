const STORAGE_KEY = 'dollarbank_pwa_v1';
let selectedDay = null;
let selectedQuincena = new Date().getDate() <= 15 ? 1 : 2;
let storageAvailable = true;
let deferredInstallPrompt = null;
let activeModalId = null;

const categoryLabels = {
  nec: 'Necesidad',
  gus: 'Gusto',
  aho: 'Ahorro'
};

const defaultDb = {
  balance: 1539.67,
  savingsBalance: 0,
  historial: [],
  servicios: [
    { id: 1, n: "Pago Carro", d: 1, m: 495, cat: "nec" },
    { id: 2, n: "Netflix", d: 1, m: 21.51, cat: "gus" },
    { id: 4, n: "PS Plus", d: 4, m: 9.99, cat: "gus" },
    { id: 5, n: "Pago Terreno", d: 5, m: 150, cat: "nec" },
    { id: 6, n: "Game Pass", d: 6, m: 16.49, cat: "gus" },
    { id: 7, n: "Tidal", d: 11, m: 16.99, cat: "gus" },
    { id: 8, n: "Prime Video", d: 13, m: 14.99, cat: "gus" },
    { id: 9, n: "Wifi", d: 14, m: 70, cat: "nec" },
    { id: 10, n: "Seguro Carro", d: 16, m: 170, cat: "nec" },
    { id: 11, n: "ChatGPT", d: 16, m: 19.99, cat: "gus" },
    { id: 12, n: "Línea Teléfono", d: 20, m: 90, cat: "nec" }
  ]
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function checkStorage() {
  try {
    const testKey = '__db_test__';
    localStorage.setItem(testKey, 'ok');
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch (e) {
    storageAvailable = false;
  }
}

function showStorageWarning(message) {
  const box = document.getElementById('storage-warning');
  box.classList.remove('hidden');
  box.innerHTML = message;
}

function hideStorageWarning() {
  const box = document.getElementById('storage-warning');
  box.classList.add('hidden');
  box.innerHTML = '';
}

function loadDb() {
  checkStorage();

  if (!storageAvailable) {
    showStorageWarning('Tu navegador no está permitiendo guardar datos localmente. La app funciona, pero al cerrar la pestaña se perderán los cambios.');
    return deepClone(defaultDb);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      hideStorageWarning();
      return deepClone(defaultDb);
    }

    const parsed = JSON.parse(saved);

    hideStorageWarning();

    return {
      balance: typeof parsed.balance === 'number' ? parsed.balance : defaultDb.balance,
      savingsBalance: typeof parsed.savingsBalance === 'number' ? parsed.savingsBalance : 0,
      historial: Array.isArray(parsed.historial) ? parsed.historial : [],
      servicios: Array.isArray(parsed.servicios) ? parsed.servicios : deepClone(defaultDb.servicios)
    };
  } catch (e) {
    showStorageWarning('Los datos guardados se dañaron o no se pudieron leer. Puedes reiniciar o importar un respaldo.');
    return deepClone(defaultDb);
  }
}

let db = loadDb();

function saveDb() {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    showStorageWarning('No se pudieron guardar los cambios en este navegador. Exporta un respaldo para no perder tu información.');
  }
}

function money(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortMoney(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function validPositiveNumber(value) {
  return !isNaN(value) && Number(value) > 0;
}

function validDay(day) {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

function validCategory(cat) {
  return ['nec', 'gus', 'aho'].includes(cat);
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentDateString() {
  return new Date().toLocaleDateString('es-MX');
}

function getTodayQuincena() {
  return new Date().getDate() <= 15 ? 1 : 2;
}

function trimHistory() {
  if (db.historial.length > 200) db.historial = db.historial.slice(0, 200);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function openModal(modalId) {
  activeModalId = modalId;
  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal() {
  if (activeModalId) {
    document.getElementById(activeModalId).classList.add('hidden');
  }
  document.getElementById('modal-backdrop').classList.add('hidden');
  activeModalId = null;
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(el => el.classList.add('hidden'));
  document.getElementById('modal-backdrop').classList.add('hidden');
  activeModalId = null;
}

function resetForms() {
  document.querySelectorAll('form').forEach(f => {
    if (f.id !== 'edit-form') f.reset();
  });
}

function showToast(message) {
  alert(message);
}

function setQuincena(q) {
  selectedQuincena = q;
  document.getElementById('q1-btn').className = q === 1 ? 'q-btn q-active' : 'q-btn';
  document.getElementById('q2-btn').className = q === 2 ? 'q-btn q-active' : 'q-btn';
  runSmartCalc();
}

function recordIncome() {
  const input = document.getElementById('pay-input');
  const value = parseFloat(input.value);

  if (!validPositiveNumber(value)) {
    showToast('Escribe un ingreso válido mayor que 0.');
    return;
  }

  db.balance += value;
  db.historial.unshift({
    id: Date.now(),
    fecha: getCurrentDateString(),
    concepto: 'Ingreso',
    monto: value,
    cat: 'nec',
    tipo: 'income',
    monthKey: getCurrentMonthKey(),
    quincena: getTodayQuincena()
  });

  trimHistory();
  input.value = '';
  renderAll();
}

function addExpense({ concepto, monto, cat }) {
  if (!concepto.trim()) {
    showToast('El concepto es obligatorio.');
    return false;
  }

  if (!validPositiveNumber(monto)) {
    showToast('Monto inválido.');
    return false;
  }

  if (!validCategory(cat)) {
    showToast('Categoría inválida.');
    return false;
  }

  db.balance -= monto;
  db.historial.unshift({
    id: Date.now(),
    fecha: getCurrentDateString(),
    concepto: concepto.trim(),
    monto,
    cat,
    tipo: 'expense',
    monthKey: getCurrentMonthKey(),
    quincena: getTodayQuincena()
  });

  trimHistory();
  renderAll();
  return true;
}

function moveToSavings({ concepto, monto }) {
  if (!concepto.trim()) {
    showToast('El concepto es obligatorio.');
    return false;
  }

  if (!validPositiveNumber(monto)) {
    showToast('Monto inválido.');
    return false;
  }

  if (monto > db.balance) {
    showToast('No tienes suficiente balance principal.');
    return false;
  }

  db.balance -= monto;
  db.savingsBalance += monto;

  db.historial.unshift({
    id: Date.now(),
    fecha: getCurrentDateString(),
    concepto: concepto.trim(),
    monto,
    cat: 'aho',
    tipo: 'to_savings',
    monthKey: getCurrentMonthKey(),
    quincena: getTodayQuincena()
  });

  trimHistory();
  renderAll();
  return true;
}

function returnFromSavings({ concepto, monto }) {
  if (!concepto.trim()) {
    showToast('El concepto es obligatorio.');
    return false;
  }

  if (!validPositiveNumber(monto)) {
    showToast('Monto inválido.');
    return false;
  }

  if (monto > db.savingsBalance) {
    showToast('No tienes suficiente ahorro acumulado.');
    return false;
  }

  db.savingsBalance -= monto;
  db.balance += monto;

  db.historial.unshift({
    id: Date.now(),
    fecha: getCurrentDateString(),
    concepto: concepto.trim(),
    monto,
    cat: 'aho',
    tipo: 'from_savings',
    monthKey: getCurrentMonthKey(),
    quincena: getTodayQuincena()
  });

  trimHistory();
  renderAll();
  return true;
}

function adjustBalance(newBalance) {
  if (isNaN(newBalance) || newBalance < 0) {
    showToast('Balance inválido.');
    return false;
  }
  db.balance = newBalance;
  renderAll();
  return true;
}

function addSubscription({ nombre, dia, monto, cat }) {
  if (!nombre.trim()) {
    showToast('El nombre es obligatorio.');
    return false;
  }
  if (!validDay(dia)) {
    showToast('Día inválido.');
    return false;
  }
  if (!validPositiveNumber(monto)) {
    showToast('Monto inválido.');
    return false;
  }
  if (!validCategory(cat)) {
    showToast('Categoría inválida.');
    return false;
  }

  db.servicios.push({
    id: Date.now(),
    n: nombre.trim(),
    d: dia,
    m: monto,
    cat
  });

  renderAll();
  return true;
}

function deleteSubscription(id) {
  const sub = db.servicios.find(x => x.id === id);
  if (!sub) return;
  const ok = confirm(`¿Eliminar "${sub.n}"?`);
  if (!ok) return;
  db.servicios = db.servicios.filter(x => x.id !== id);
  renderAll();
}

function openEditMovement(id) {
  const item = db.historial.find(h => h.id === id);
  if (!item) return;
  if (item.tipo === 'income') {
    showToast('Los ingresos no se editan aquí. Usa Ajustar Balance si necesitas corregir.');
    return;
  }
  const form = document.getElementById('edit-form');
  form.id.value = item.id;
  form.concepto.value = item.concepto || '';
  form.monto.value = item.monto;
  form.cat.value = validCategory(item.cat) ? item.cat : 'nec';
  openModal('edit-modal');
}

function updateMovement(id, { concepto, monto, cat }) {
  const index = db.historial.findIndex(h => h.id === id);
  if (index === -1) return false;

  const item = db.historial[index];
  if (!concepto.trim()) {
    showToast('El concepto es obligatorio.');
    return false;
  }
  if (!validPositiveNumber(monto)) {
    showToast('Monto inválido.');
    return false;
  }
  if (!validCategory(cat)) {
    showToast('Categoría inválida.');
    return false;
  }

  if (item.tipo === 'expense') {
    db.balance += item.monto;
    db.balance -= monto;
  } else if (item.tipo === 'to_savings') {
    db.balance += item.monto;
    db.savingsBalance -= item.monto;
    if (monto > db.balance) {
      db.balance -= item.monto;
      db.savingsBalance += item.monto;
      showToast('No hay suficiente balance principal para ese nuevo monto.');
      return false;
    }
    db.balance -= monto;
    db.savingsBalance += monto;
  } else if (item.tipo === 'from_savings') {
    db.balance -= item.monto;
    db.savingsBalance += item.monto;
    if (monto > db.savingsBalance) {
      db.balance += item.monto;
      db.savingsBalance -= item.monto;
      showToast('No hay suficiente ahorro acumulado para ese nuevo monto.');
      return false;
    }
    db.balance += monto;
    db.savingsBalance -= monto;
  }

  db.historial[index].concepto = concepto.trim();
  db.historial[index].monto = monto;
  db.historial[index].cat = cat;

  renderAll();
  return true;
}

function deleteHistoryItem(id) {
  const index = db.historial.findIndex(h => h.id === id);
  if (index === -1) return;

  const item = db.historial[index];
  const ok = confirm(`¿Eliminar "${item.concepto}"?`);
  if (!ok) return;

  if (item.tipo === 'expense') db.balance += item.monto;
  else if (item.tipo === 'income') db.balance -= item.monto;
  else if (item.tipo === 'to_savings') {
    db.balance += item.monto;
    db.savingsBalance -= item.monto;
  } else if (item.tipo === 'from_savings') {
    db.balance -= item.monto;
    db.savingsBalance += item.monto;
  }

  db.historial.splice(index, 1);
  renderAll();
}

function exportData() {
  const data = JSON.stringify(db, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'dollarbank_respaldo.json';
  a.click();

  URL.revokeObjectURL(url);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Formato inválido');

      db = {
        balance: typeof parsed.balance === 'number' ? parsed.balance : 0,
        savingsBalance: typeof parsed.savingsBalance === 'number' ? parsed.savingsBalance : 0,
        historial: Array.isArray(parsed.historial) ? parsed.historial : [],
        servicios: Array.isArray(parsed.servicios) ? parsed.servicios : []
      };

      renderAll();
      showToast('Respaldo importado correctamente.');
    } catch (e) {
      showToast('No se pudo importar el archivo JSON.');
    }
  };
  reader.readAsText(file);
}

function resetApp() {
  const ok = confirm('Esto borrará los datos guardados en este navegador. ¿Deseas continuar?');
  if (!ok) return;

  db = deepClone(defaultDb);
  if (storageAvailable) {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }
  renderAll();
  showToast('La app fue reiniciada.');
}

function runSmartCalc() {
  const income = parseFloat(document.getElementById('calc-input').value) || 0;

  const necP = income * 0.5;
  const gusP = income * 0.3;
  const ahoP = income * 0.2;

  document.getElementById('nec-val').innerText = shortMoney(necP);
  document.getElementById('gus-val').innerText = shortMoney(gusP);
  document.getElementById('aho-val').innerText = shortMoney(ahoP);

  const qServ = db.servicios.filter(s => selectedQuincena === 1 ? s.d <= 15 : s.d > 15);

  let fixedNec = 0, fixedGus = 0, fixedAho = 0;
  qServ.forEach(s => {
    if (s.cat === 'nec') fixedNec += s.m;
    else if (s.cat === 'gus') fixedGus += s.m;
    else fixedAho += s.m;
  });

  const qHistory = db.historial.filter(h => h.quincena === selectedQuincena && h.monthKey === getCurrentMonthKey());

  let varNec = 0, varGus = 0, actualSaved = 0;
  qHistory.forEach(h => {
    if (h.tipo === 'expense') {
      if (h.cat === 'nec') varNec += h.monto;
      else if (h.cat === 'gus') varGus += h.monto;
      else actualSaved += h.monto;
    } else if (h.tipo === 'to_savings') {
      actualSaved += h.monto;
    }
  });

  const totalNecUsed = fixedNec + varNec;
  const totalGusUsed = fixedGus + varGus;
  const totalAhoUsed = fixedAho + actualSaved;

  document.getElementById('quincena-breakdown').innerHTML = `
    <div class="remainder-box">
      <div class="item-row"><span>Fijos necesidades</span><b>${money(fixedNec)}</b></div>
      <div class="item-row"><span>Variables necesidades</span><b>${money(varNec)}</b></div>
      <div class="item-row"><span>Libre necesidades</span><b class="${(necP - totalNecUsed) >= 0 ? 'good' : 'danger'}">${money(necP - totalNecUsed)}</b></div>

      <div class="item-row"><span>Fijos gustos</span><b>${money(fixedGus)}</b></div>
      <div class="item-row"><span>Variables gustos</span><b>${money(varGus)}</b></div>
      <div class="item-row"><span>Libre gustos</span><b class="${(gusP - totalGusUsed) >= 0 ? 'warning' : 'danger'}">${money(gusP - totalGusUsed)}</b></div>

      <div class="item-row"><span>Ahorro / meta</span><b>${money(totalAhoUsed)} / ${money(ahoP)}</b></div>
      <div class="item-row"><span>Diferencia ahorro</span><b class="${(ahoP - totalAhoUsed) >= 0 ? 'good' : 'danger'}">${money(ahoP - totalAhoUsed)}</b></div>
    </div>
  `;

  let fullHtml = "";
  [...db.servicios].sort((a, b) => a.d - b.d).forEach(s => {
    const isActive = (selectedQuincena === 1 && s.d <= 15) || (selectedQuincena === 2 && s.d > 15);
    fullHtml += `
      <div class="item-row" style="opacity:${isActive ? '1' : '0.42'}">
        <span>
          <span class="item-date">${s.d}</span>
          ${escapeHtml(s.n)}
          <span class="cat-tag tag-${s.cat}">${categoryLabels[s.cat]}</span>
        </span>
        <b>${money(s.m)}</b>
      </div>
    `;
  });

  document.getElementById('full-month-list').innerHTML = fullHtml || `<p class="muted">No hay pagos registrados.</p>`;
}

function drawCalendar() {
  const now = new Date();
  const today = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  document.getElementById('month-name').innerText = `${monthNames[month]} ${year}`;

  const firstDayNative = new Date(year, month, 1).getDay();
  const firstDay = (firstDayNative + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `
    <div class="cal-head">L</div>
    <div class="cal-head">M</div>
    <div class="cal-head">X</div>
    <div class="cal-head">J</div>
    <div class="cal-head">V</div>
    <div class="cal-head">S</div>
    <div class="cal-head">D</div>
  `;

  for (let i = 0; i < firstDay; i++) html += `<div></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const hasPayments = db.servicios.some(s => s.d === d);
    const isToday = d === today ? 'cal-today' : '';
    const isSel = d === selectedDay ? 'cal-selected' : '';

    html += `
      <button class="cal-day ${isToday} ${isSel}" data-day="${d}">
        <div>${d}</div>
        ${hasPayments ? '<div style="width:5px;height:5px;background:var(--accent);border-radius:50%;margin-top:2px;"></div>' : ''}
      </button>
    `;
  }

  const body = document.getElementById('calendar-body');
  body.innerHTML = html;
  body.querySelectorAll('[data-day]').forEach(btn => {
    btn.addEventListener('click', () => {
      selDate(Number(btn.dataset.day));
    });
  });
}

function selDate(d) {
  selectedDay = d;
  drawCalendar();
  showDay(d);
}

function showDay(d) {
  const pays = db.servicios.filter(s => s.d === d);
  let h = `<div class="card"><h4>Día ${d}</h4>`;

  if (pays.length === 0) {
    h += `<p class="muted">Día libre. No hay pagos fijos registrados.</p>`;
  } else {
    pays.sort((a, b) => a.m - b.m).forEach(p => {
      h += `
        <div class="item-row">
          <span>${escapeHtml(p.n)} <span class="cat-tag tag-${p.cat}">${categoryLabels[p.cat]}</span></span>
          <b>${money(p.m)}</b>
        </div>
      `;
    });
  }

  h += `</div>`;
  document.getElementById('day-details').innerHTML = h;
}

function renderBalance() {
  document.getElementById('main-balance').innerText = money(db.balance);
  document.getElementById('secondary-balance').innerText = `Ahorro acumulado: ${money(db.savingsBalance)}`;
  document.getElementById('home-balance').innerText = money(db.balance);
  document.getElementById('home-savings').innerText = money(db.savingsBalance);
  document.getElementById('home-total').innerText = money(db.balance + db.savingsBalance);
}

function historyAmountText(h) {
  if (h.tipo === 'income') return `<b class="good">+${money(h.monto)}</b>`;
  if (h.tipo === 'from_savings') return `<b class="good">+${money(h.monto)}</b>`;
  return `<b class="danger">-${money(h.monto)}</b>`;
}

function historyTypeLabel(h) {
  if (h.tipo === 'income') return 'Ingreso';
  if (h.tipo === 'expense') return categoryLabels[h.cat] || 'Gasto';
  if (h.tipo === 'to_savings') return 'Ahorro';
  if (h.tipo === 'from_savings') return 'Retorno';
  return categoryLabels[h.cat] || 'Movimiento';
}

function renderHistory() {
  const historyEl = document.getElementById('history-list');

  if (!db.historial.length) {
    historyEl.innerHTML = `No hay movimientos recientes.`;
    return;
  }

  historyEl.innerHTML = db.historial.slice(0, 12).map(h => `
    <div class="hist-item">
      <div class="hist-main">
        <div class="hist-concept">${escapeHtml(h.concepto || 'Sin concepto')}</div>
        <div>
          ${escapeHtml(h.fecha || '')}
          <span class="cat-tag tag-${validCategory(h.cat) ? h.cat : 'nec'}">${historyTypeLabel(h)}</span>
        </div>
      </div>
      <div class="hist-actions">
        ${historyAmountText(h)}
        <button class="btn-edit" data-edit-id="${h.id}">✏️</button>
        <button class="btn-del-small" data-del-id="${h.id}">🗑️</button>
      </div>
    </div>
  `).join('');

  historyEl.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', () => openEditMovement(Number(btn.dataset.editId)));
  });
  historyEl.querySelectorAll('[data-del-id]').forEach(btn => {
    btn.addEventListener('click', () => deleteHistoryItem(Number(btn.dataset.delId)));
  });
}

function renderSubscriptions() {
  const container = document.getElementById('subscription-list');

  if (!db.servicios.length) {
    container.innerHTML = `<div class="card"><p class="muted">No hay suscripciones registradas.</p></div>`;
    return;
  }

  container.innerHTML = [...db.servicios].sort((a, b) => a.d - b.d).map(s => `
    <div class="card" style="padding:12px 15px;">
      <div class="item-row" style="padding:4px 0 8px 0;">
        <span><b>${s.d}</b>. ${escapeHtml(s.n)} <span class="cat-tag tag-${s.cat}">${categoryLabels[s.cat]}</span></span>
        <b>${money(s.m)}</b>
      </div>
      <div style="display:flex; justify-content:flex-end;">
        <button class="btn-del-small" data-sub-del="${s.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-sub-del]').forEach(btn => {
    btn.addEventListener('click', () => deleteSubscription(Number(btn.dataset.subDel)));
  });
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
  document.querySelector(`.nav-item[data-page="${id}"]`).classList.add('active-nav');
}

function renderAll() {
  saveDb();
  renderBalance();
  renderHistory();
  renderSubscriptions();
  drawCalendar();
  setQuincena(selectedQuincena);
  if (selectedDay !== null) showDay(selectedDay);
}

function setupInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('install-btn').classList.remove('hidden');
  });

  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showToast('La instalación no está disponible todavía en este navegador.');
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    document.getElementById('install-btn').classList.add('hidden');
  });
}

function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

function setupEvents() {
  document.getElementById('add-income-btn').addEventListener('click', recordIncome);
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('reset-btn').addEventListener('click', resetApp);
  document.getElementById('import-open-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', (e) => {
    importData(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('q1-btn').addEventListener('click', () => setQuincena(1));
  document.getElementById('q2-btn').addEventListener('click', () => setQuincena(2));
  document.getElementById('calc-input').addEventListener('input', runSmartCalc);

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal();
      resetForms();
    });
  });

  document.getElementById('modal-backdrop').addEventListener('click', () => {
    closeAllModals();
    resetForms();
  });

  document.getElementById('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = addExpense({
      concepto: form.concepto.value,
      monto: parseFloat(form.monto.value),
      cat: form.cat.value
    });
    if (ok) {
      closeModal();
      form.reset();
    }
  });

  document.getElementById('save-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = moveToSavings({
      concepto: form.concepto.value,
      monto: parseFloat(form.monto.value)
    });
    if (ok) {
      closeModal();
      form.reset();
      form.concepto.value = 'Ahorro';
    }
  });

  document.getElementById('return-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = returnFromSavings({
      concepto: form.concepto.value,
      monto: parseFloat(form.monto.value)
    });
    if (ok) {
      closeModal();
      form.reset();
      form.concepto.value = 'Retiro de ahorro';
    }
  });

  document.getElementById('adjust-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = adjustBalance(parseFloat(form.balance.value));
    if (ok) {
      closeModal();
      form.reset();
    }
  });

  document.getElementById('subscription-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = addSubscription({
      nombre: form.nombre.value,
      dia: parseInt(form.dia.value, 10),
      monto: parseFloat(form.monto.value),
      cat: form.cat.value
    });
    if (ok) {
      closeModal();
      form.reset();
    }
  });

  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = updateMovement(Number(form.id.value), {
      concepto: form.concepto.value,
      monto: parseFloat(form.monto.value),
      cat: form.cat.value
    });
    if (ok) {
      closeModal();
    }
  });
}

setupInstall();
setupServiceWorker();
setupEvents();
renderAll();
