:root {
    --bg-primary: #f4f6fa;
    --bg-card: #ffffff;
    --bg-input: #f1f3f7;
    --border: #e7eaf0;
    --border-focus: #cfd5e0;
    --text-primary: #1a1d26;
    --text-secondary: #5a5f6b;
    --text-tertiary: #8b909c;
    --text-accent: #0b0c10;
    --accent-necesidades: #3b6cf4;
    --accent-necesidades-light: #eef2fd;
    --accent-deseos: #8b4df0;
    --accent-deseos-light: #f4edfd;
    --accent-ahorro: #10a56b;
    --accent-ahorro-light: #e9f7f1;
    --danger: #e04050;
    --danger-light: #fdecee;
    --warning: #d4852b;
    --warning-light: #fdf3e8;
    --radius-sm: 10px;
    --radius: 16px;
    --radius-lg: 20px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.03);
    --shadow: 0 4px 14px rgba(0,0,0,0.04);
    --shadow-lg: 0 8px 28px rgba(0,0,0,0.06);
    --transition: 0.2s cubic-bezier(0.4,0,0.2,1);
}

* { margin:0; padding:0; box-sizing:border-box; }

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
}

.app-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 20px 48px;
}

/* Header */
.app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 12px;
}
.app-logo { display:flex; align-items:center; gap:12px; }
.logo-icon {
    width:46px; height:46px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, #3b6cf4, #8b4df0);
    display:flex; align-items:center; justify-content:center;
    font-size:22px; color:white;
    box-shadow: 0 6px 16px rgba(59,108,244,0.25);
}
.logo-text h1 { font-size:1.4rem; font-weight:700; letter-spacing:-0.02em; color:var(--text-accent); }
.logo-text span { font-size:0.78rem; font-weight:500; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.03em; }
.quincena-badge {
    background:var(--bg-card); border:1px solid var(--border);
    border-radius:50px; padding:8px 18px;
    font-size:0.8rem; font-weight:600; color:var(--text-secondary);
    display:flex; align-items:center; gap:8px; box-shadow:var(--shadow-sm);
}
.quincena-badge .dot {
    width:8px; height:8px; border-radius:50%; background:var(--accent-ahorro);
    box-shadow: 0 0 8px rgba(16,165,107,0.4);
    animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot { 0%,100%{box-shadow:0 0 4px rgba(16,165,107,0.4)} 50%{box-shadow:0 0 12px rgba(16,165,107,0.7)} }

/* Pestañas */
.tab-nav {
    display:flex; gap:6px; margin-bottom:28px;
    background:var(--bg-card); border-radius:60px; padding:6px;
    box-shadow:var(--shadow-sm); border:1px solid var(--border);
}
.tab-btn {
    flex:1; padding:12px 20px; border:none; background:transparent;
    border-radius:60px; font-family:'Inter',sans-serif; font-weight:600;
    font-size:0.85rem; letter-spacing:-0.01em; color:var(--text-tertiary);
    cursor:pointer; transition:all var(--transition); white-space:nowrap;
}
.tab-btn.active { background:var(--bg-primary); color:var(--text-accent); box-shadow:var(--shadow-sm); font-weight:700; }
.tab-btn:hover:not(.active) { color:var(--text-secondary); background:rgba(0,0,0,0.02); }

/* Contenido de pestañas */
.tab-content { display:none; animation: fadeSlide 0.3s ease; }
.tab-content.active { display:block; }
@keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

/* Panel resumen */
.summary-panel { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:28px; }
.summary-card {
    background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg);
    padding:24px; position:relative; overflow:hidden; box-shadow:var(--shadow);
    transition: all var(--transition);
}
.summary-card:hover { box-shadow:var(--shadow-lg); transform:translateY(-2px); }
.summary-card.total-card { border-left:4px solid var(--accent-necesidades); }
.summary-card.daily-card { border-left:4px solid var(--accent-ahorro); }
.summary-label { font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-tertiary); margin-bottom:8px; }
.summary-amount { font-size:2.4rem; font-weight:800; letter-spacing:-0.03em; color:var(--text-accent); }
.summary-amount.daily { color:var(--accent-ahorro); }
.summary-subtitle { font-size:0.8rem; color:var(--text-tertiary); margin-top:4px; }
.summary-icon-bg { position:absolute; right:20px; top:50%; transform:translateY(-50%); font-size:3rem; opacity:0.05; }

/* Tarjetas de categorías */
.categories-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
.category-card {
    background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg);
    padding:22px 20px; box-shadow:var(--shadow); transition:all var(--transition);
}
.category-card:hover { box-shadow:var(--shadow-lg); transform:translateY(-3px); }
.category-card.necesidades { border-top:4px solid var(--accent-necesidades); }
.category-card.deseos { border-top:4px solid var(--accent-deseos); }
.category-card.ahorro { border-top:4px solid var(--accent-ahorro); }
.category-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.category-name { font-weight:700; font-size:0.9rem; display:flex; align-items:center; gap:6px; }
.cat-icon { font-size:1.1rem; }
.category-percent { font-weight:700; font-size:0.8rem; padding:4px 10px; border-radius:50px; }
.necesidades .category-percent { background:var(--accent-necesidades-light); color:var(--accent-necesidades); }
.deseos .category-percent { background:var(--accent-deseos-light); color:var(--accent-deseos); }
.ahorro .category-percent { background:var(--accent-ahorro-light); color:var(--accent-ahorro); }
.category-detail { display:flex; flex-direction:column; gap:8px; }
.detail-row { display:flex; justify-content:space-between; font-size:0.82rem; }
.detail-label { color:var(--text-tertiary); font-weight:500; }
.detail-value { font-weight:600; }
.detail-value.positive { color:var(--accent-ahorro); }
.detail-value.negative { color:var(--danger); }
.progress-bar-container { margin-top:12px; height:5px; background:#eef0f4; border-radius:10px; overflow:hidden; }
.progress-bar-fill { height:100%; border-radius:10px; transition:width 0.5s ease; }
.necesidades .progress-bar-fill { background:var(--accent-necesidades); }
.deseos .progress-bar-fill { background:var(--accent-deseos); }
.ahorro .progress-bar-fill { background:var(--accent-ahorro); }

/* Formularios */
.forms-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.form-card {
    background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg);
    padding:24px; box-shadow:var(--shadow);
}
.form-card h3 { font-size:0.95rem; font-weight:700; margin-bottom:18px; display:flex; align-items:center; gap:8px; }
.icon-circle {
    width:30px; height:30px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
    font-size:0.85rem; flex-shrink:0;
}
.icon-income { background:var(--accent-ahorro-light); color:var(--accent-ahorro); }
.icon-expense { background:var(--danger-light); color:var(--danger); }
.icon-sub { background:var(--warning-light); color:var(--warning); }
.form-group { margin-bottom:14px; }
.form-group label { display:block; font-size:0.72rem; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-tertiary); margin-bottom:6px; }
.form-group input, .form-group select {
    width:100%; padding:12px 14px; background:var(--bg-input); border:1px solid var(--border);
    border-radius:var(--radius-sm); color:var(--text-primary); font-family:'Inter',sans-serif;
    font-size:0.9rem; font-weight:500; transition:all var(--transition); outline:none;
    -webkit-appearance:none; appearance:none;
}
.form-group select {
    background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%235a5f6b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
    background-repeat:no-repeat; background-position:right 12px center; background-size:16px; padding-right:40px;
}
.form-group input:focus, .form-group select:focus { border-color:var(--accent-necesidades); box-shadow:0 0 0 3px rgba(59,108,244,0.08); background:white; }
.btn {
    width:100%; padding:13px 16px; border:none; border-radius:var(--radius-sm);
    font-family:'Inter',sans-serif; font-weight:700; font-size:0.85rem;
    letter-spacing:0.02em; cursor:pointer; transition:all var(--transition); text-transform:uppercase;
}
.btn-income { background:var(--accent-ahorro); color:white; box-shadow:0 4px 12px rgba(16,165,107,0.25); }
.btn-income:hover { background:#0d8b5e; transform:translateY(-1px); box-shadow:0 6px 18px rgba(16,165,107,0.35); }
.btn-expense { background:white; border:1.5px solid var(--danger); color:var(--danger); }
.btn-expense:hover { background:var(--danger-light); transform:translateY(-1px); }
.btn-subscription { background:white; border:1.5px solid var(--warning); color:var(--warning); }
.btn-subscription:hover { background:var(--warning-light); transform:translateY(-1px); }

/* Suscripciones */
.subscriptions-layout { display:grid; grid-template-columns:1fr 1.2fr; gap:16px; }
.subscription-list-card {
    background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg);
    padding:22px 24px; box-shadow:var(--shadow);
}
.subscription-list-card h3 { font-size:0.9rem; font-weight:700; margin-bottom:16px; }
.subscription-items { list-style:none; display:flex; flex-direction:column; gap:10px; max-height:320px; overflow-y:auto; }
.subscription-item {
    display:flex; justify-content:space-between; align-items:center;
    padding:14px 16px; border-radius:var(--radius-sm); background:#f8fafd;
    border-left:4px solid transparent; transition:all var(--transition); font-size:0.82rem;
}
.subscription-item.necesidades { border-left-color:var(--accent-necesidades); }
.subscription-item.deseos { border-left-color:var(--accent-deseos); }
.subscription-info .sub-name { font-weight:600; color:var(--text-primary); }
.subscription-info .sub-details { font-size:0.7rem; color:var(--text-tertiary); margin-top:3px; }
.btn-delete-sub {
    background:transparent; border:1px solid var(--danger); color:var(--danger);
    padding:5px 12px; border-radius:20px; font-size:0.7rem; font-weight:600; cursor:pointer;
    transition:all var(--transition);
}
.btn-delete-sub:hover { background:var(--danger-light); }
.empty-subs { text-align:center; color:var(--text-tertiary); padding:24px 0; }

/* Historial */
.history-card {
    background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg);
    padding:24px; box-shadow:var(--shadow);
}
.history-list { list-style:none; display:flex; flex-direction:column; gap:10px; max-height:450px; overflow-y:auto; }
.history-item {
    display:flex; justify-content:space-between; align-items:center;
    padding:14px 16px; border-radius:var(--radius-sm); background:#f8fafd;
    font-size:0.82rem; transition:background var(--transition);
}
.history-item:hover { background:#f0f3f8; }
.history-item .desc { font-weight:500; flex:1; margin-right:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.history-item .amount { font-weight:700; color:var(--danger); }
.cat-tag {
    font-size:0.65rem; font-weight:600; text-transform:uppercase; padding:3px 10px;
    border-radius:50px; margin-left:8px;
}
.cat-tag.necesidades { background:var(--accent-necesidades-light); color:var(--accent-necesidades); }
.cat-tag.deseos { background:var(--accent-deseos-light); color:var(--accent-deseos); }
.empty-history { text-align:center; color:var(--text-tertiary); padding:24px 0; }

/* Toast */
.toast-container { position:fixed; top:20px; right:20px; z-index:1000; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
.toast {
    background:white; border:1px solid var(--border); border-radius:var(--radius-sm);
    padding:14px 20px; font-size:0.82rem; font-weight:600; color:var(--text-primary);
    box-shadow:var(--shadow-lg); pointer-events:auto;
    animation: slideInRight 0.35s ease, fadeOut 0.3s 2.5s ease forwards;
    max-width:380px; display:flex; align-items:center; gap:10px;
}
.toast.success { border-left:3px solid var(--accent-ahorro); }
.toast.error { border-left:3px solid var(--danger); }
.toast.warning { border-left:3px solid var(--warning); }
@keyframes slideInRight { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
@keyframes fadeOut { from{opacity:1} to{opacity:0;transform:translateX(20px)} }

/* Responsive */
@media (max-width: 768px) {
    .categories-grid { grid-template-columns:1fr; }
    .summary-panel { grid-template-columns:1fr; }
    .forms-grid { grid-template-columns:1fr; }
    .subscriptions-layout { grid-template-columns:1fr; }
    .summary-amount { font-size:1.8rem; }
    .tab-btn { font-size:0.78rem; padding:10px 14px; }
}