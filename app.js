(function() {
    const STORAGE_KEY = 'financeFlowDataV2';

    let state = {
        categorias: {
            necesidades: { asignado: 0, gastado: 0 },
            deseos: { asignado: 0, gastado: 0 },
            ahorro: { asignado: 0, gastado: 0 }
        },
        historialGastos: [],
        suscripciones: []
    };

    // Referencias DOM
    const $saldoTotal = document.getElementById('saldoTotal');
    const $gastoDiario = document.getElementById('gastoDiario');
    const $necAsignado = document.getElementById('necAsignado');
    const $necGastado = document.getElementById('necGastado');
    const $necDisponible = document.getElementById('necDisponible');
    const $necProgress = document.getElementById('necProgress');
    const $desAsignado = document.getElementById('desAsignado');
    const $desGastado = document.getElementById('desGastado');
    const $desDisponible = document.getElementById('desDisponible');
    const $desProgress = document.getElementById('desProgress');
    const $ahoAsignado = document.getElementById('ahoAsignado');
    const $ahoGastado = document.getElementById('ahoGastado');
    const $ahoDisponible = document.getElementById('ahoDisponible');
    const $ahoProgress = document.getElementById('ahoProgress');
    const $historyList = document.getElementById('historyList');
    const $subscriptionList = document.getElementById('subscriptionList');
    const $toastContainer = document.getElementById('toastContainer');

    // Pestañas
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        tabContents.forEach(tc => tc.classList.remove('active'));
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Persistencia
    function guardarDatos() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.warn(e); }
    }

    function cargarDatos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.categorias && parsed.historialGastos && parsed.suscripciones) {
                    state = parsed;
                    Object.values(state.categorias).forEach(cat => {
                        cat.asignado = Number(cat.asignado) || 0;
                        cat.gastado = Number(cat.gastado) || 0;
                    });
                    state.historialGastos.forEach(g => g.monto = Number(g.monto) || 0);
                    state.suscripciones.forEach(s => {
                        s.montoMensual = Number(s.montoMensual) || 0;
                        s.montoQuincenal = Number(s.montoQuincenal) || 0;
                    });
                    return true;
                }
            }
        } catch (e) { console.warn(e); }
        return false;
    }

    // Utilidades matemáticas
    const disponibleDe = cat => Math.max(0, cat.asignado - cat.gastado);
    const saldoTotal = () => disponibleDe(state.categorias.necesidades) + disponibleDe(state.categorias.deseos) + disponibleDe(state.categorias.ahorro);
    const gastoDiario = () => {
        const d = disponibleDe(state.categorias.necesidades) + disponibleDe(state.categorias.deseos);
        return d > 0 ? d / 15 : 0;
    };
    const porcentajeGastado = cat => cat.asignado > 0 ? Math.min(100, (cat.gastado / cat.asignado) * 100) : 0;
    const fm = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format;

    function actualizarUI() {
        const nec = state.categorias.necesidades;
        const des = state.categorias.deseos;
        const aho = state.categorias.ahorro;

        $necAsignado.textContent = fm(nec.asignado);
        $necGastado.textContent = fm(nec.gastado);
        const necDisp = disponibleDe(nec);
        $necDisponible.textContent = fm(necDisp);
        $necDisponible.className = 'detail-value ' + (necDisp > 0 ? 'positive' : 'negative');
        $necProgress.style.width = porcentajeGastado(nec).toFixed(1) + '%';

        $desAsignado.textContent = fm(des.asignado);
        $desGastado.textContent = fm(des.gastado);
        const desDisp = disponibleDe(des);
        $desDisponible.textContent = fm(desDisp);
        $desDisponible.className = 'detail-value ' + (desDisp > 0 ? 'positive' : 'negative');
        $desProgress.style.width = porcentajeGastado(des).toFixed(1) + '%';

        $ahoAsignado.textContent = fm(aho.asignado);
        $ahoGastado.textContent = fm(aho.gastado);
        const ahoDisp = disponibleDe(aho);
        $ahoDisponible.textContent = fm(ahoDisp);
        $ahoDisponible.className = 'detail-value ' + (ahoDisp > 0 ? 'positive' : 'negative');
        $ahoProgress.style.width = porcentajeGastado(aho).toFixed(1) + '%';

        const total = saldoTotal();
        $saldoTotal.textContent = fm(total);
        $saldoTotal.style.color = total <= 0 && (nec.asignado > 0 || des.asignado > 0) ? 'var(--danger)' : 'var(--text-accent)';
        $gastoDiario.textContent = fm(gastoDiario());

        renderizarHistorial();
        renderizarSuscripciones();
    }

    function escaparHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderizarHistorial() {
        if (state.historialGastos.length === 0) {
            $historyList.innerHTML = '<li class="empty-history">No hay movimientos registrados aún.</li>';
            return;
        }
        const recientes = state.historialGastos.slice(-20).reverse();
        $historyList.innerHTML = recientes.map(g => `
            <li class="history-item">
                <span class="desc" title="${escaparHTML(g.descripcion)}">${escaparHTML(g.descripcion)}</span>
                <span class="amount">−${fm(g.monto)}</span>
                <span class="cat-tag ${g.categoria}">${g.categoria === 'necesidades' ? 'Nec.' : 'Des.'}</span>
            </li>`).join('');
    }

    function renderizarSuscripciones() {
        if (state.suscripciones.length === 0) {
            $subscriptionList.innerHTML = '<li class="empty-subs">No hay suscripciones registradas.</li>';
            return;
        }
        $subscriptionList.innerHTML = state.suscripciones.map((s, idx) => `
            <li class="subscription-item ${s.categoria}">
                <div class="subscription-info">
                    <div class="sub-name">${escaparHTML(s.nombre)}</div>
                    <div class="sub-details">Mensual: ${fm(s.montoMensual)} · Quincenal: ${fm(s.montoQuincenal)} · ${s.categoria === 'necesidades' ? 'Necesidades' : 'Deseos'}</div>
                </div>
                <button class="btn-delete-sub" data-index="${idx}">✕</button>
            </li>`).join('');

        document.querySelectorAll('.btn-delete-sub').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index, 10);
                eliminarSuscripcion(index);
            });
        });
    }

    function mostrarToast(mensaje, tipo = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `<span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : '⚠️'}</span> ${mensaje}`;
        $toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 2900);
    }

    function procesarIngreso(monto) {
        if (isNaN(monto) || monto <= 0) { mostrarToast('Monto inválido', 'error'); return false; }
        const m = Math.round(monto * 100) / 100;
        const nec = Math.round(m * 0.5 * 100) / 100;
        const des = Math.round(m * 0.3 * 100) / 100;
        const aho = m - nec - des;
        state.categorias.necesidades.asignado += nec;
        state.categorias.deseos.asignado += des;
        state.categorias.ahorro.asignado += aho;
        guardarDatos();
        actualizarUI();
        mostrarToast(`Ingreso de ${fm(m)} distribuido 50/30/20`, 'success');
        return true;
    }

    function registrarGasto(monto, desc, cat) {
        if (isNaN(monto) || monto <= 0) { mostrarToast('Monto inválido', 'error'); return false; }
        const m = Math.round(monto * 100) / 100;
        const categoria = state.categorias[cat];
        if (m > disponibleDe(categoria) + 0.001) {
            mostrarToast(`Fondos insuficientes en ${cat === 'necesidades' ? 'Necesidades' : 'Deseos'}`, 'error');
            return false;
        }
        categoria.gastado += m;
        state.historialGastos.push({ monto: m, descripcion: desc.trim(), categoria: cat, fecha: new Date().toISOString() });
        guardarDatos();
        actualizarUI();
        mostrarToast(`Gasto de ${fm(m)} registrado`, 'success');
        return true;
    }

    function agregarSuscripcion(nombre, montoMensual, cat) {
        if (!nombre || nombre.trim() === '') { mostrarToast('Nombre requerido', 'warning'); return false; }
        if (isNaN(montoMensual) || montoMensual <= 0) { mostrarToast('Monto inválido', 'error'); return false; }
        const mMensual = Math.round(montoMensual * 100) / 100;
        const mQuincenal = Math.round(mMensual / 2 * 100) / 100;
        const categoria = state.categorias[cat];
        if (mQuincenal > disponibleDe(categoria) + 0.001) {
            mostrarToast(`Sin fondos suficientes en ${cat === 'necesidades' ? 'Necesidades' : 'Deseos'}`, 'error');
            return false;
        }
        categoria.gastado += mQuincenal;
        state.suscripciones.push({ id: Date.now(), nombre: nombre.trim(), montoMensual: mMensual, montoQuincenal: mQuincenal, categoria: cat });
        guardarDatos();
        actualizarUI();
        mostrarToast(`Suscripción "${nombre.trim()}" añadida`, 'success');
        return true;
    }

    function eliminarSuscripcion(index) {
        if (index < 0 || index >= state.suscripciones.length) return;
        const s = state.suscripciones[index];
        state.categorias[s.categoria].gastado = Math.max(0, state.categorias[s.categoria].gastado - s.montoQuincenal);
        state.suscripciones.splice(index, 1);
        guardarDatos();
        actualizarUI();
        mostrarToast(`Suscripción "${s.nombre}" eliminada`, 'warning');
    }

    // Eventos
    document.getElementById('formIngresoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const val = parseFloat(document.getElementById('montoIngreso').value);
        if (procesarIngreso(val)) { this.reset(); document.getElementById('montoIngreso').focus(); }
    });

    document.getElementById('formGastoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const monto = parseFloat(document.getElementById('montoGasto').value);
        const desc = document.getElementById('descripcionGasto').value.trim();
        const cat = document.getElementById('categoriaGasto').value;
        if (!desc) return mostrarToast('Ingresa una descripción', 'warning');
        if (registrarGasto(monto, desc, cat)) { this.reset(); document.getElementById('categoriaGasto').value = 'necesidades'; document.getElementById('montoGasto').focus(); }
    });

    document.getElementById('formSuscripcionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = document.getElementById('nombreSub').value.trim();
        const monto = parseFloat(document.getElementById('montoSub').value);
        const cat = document.getElementById('categoriaSub').value;
        if (agregarSuscripcion(nombre, monto, cat)) { this.reset(); document.getElementById('categoriaSub').value = 'necesidades'; document.getElementById('nombreSub').focus(); }
    });

    // Inicio
    if (!cargarDatos()) console.log('Iniciando con datos limpios');
    else console.log('Datos cargados desde localStorage');
    actualizarUI();
    document.getElementById('montoIngreso').focus();
})();