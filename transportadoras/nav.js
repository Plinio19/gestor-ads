/* Sidebar de navegação — transportadoras */
(function () {
  const path = window.location.pathname;
  const isCotacao    = path.includes('/cotacao/');
  const isDocumentos = path.includes('/documentos/');
  const base = (isCotacao || isDocumentos) ? '../' : './';

  const items = [
    { href: base,                 icon: '🚚', label: 'Transportadoras'  },
    { href: base + 'cotacao/',    icon: '📋', label: 'Cotação de Frete' },
    { href: base + 'documentos/', icon: '📁', label: 'Documentos'       },
  ];

  /* ── estilos ── */
  const W = 220;
  const css = `
    #_nav{position:fixed;top:0;left:0;width:${W}px;height:100vh;background:#1e429f;display:flex;flex-direction:column;z-index:200;box-shadow:2px 0 12px rgba(0,0,0,.18);transition:transform .25s}
    #_nav-logo{padding:20px 18px 14px;border-bottom:1px solid rgba(255,255,255,.12)}
    #_nav-logo span{display:block;font-size:.72rem;font-weight:700;letter-spacing:.08em;color:rgba(255,255,255,.55);text-transform:uppercase;margin-bottom:4px}
    #_nav-logo strong{font-size:1rem;color:#fff;line-height:1.2}
    #_nav-menu{flex:1;padding:10px 10px;overflow-y:auto;display:flex;flex-direction:column;gap:2px}
    ._nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:rgba(255,255,255,.75);font-size:.87rem;font-weight:500;text-decoration:none;transition:all .15s;cursor:pointer}
    ._nav-item:hover{background:rgba(255,255,255,.12);color:#fff}
    ._nav-item.ativo{background:rgba(255,255,255,.18);color:#fff;font-weight:700}
    ._nav-item .ico{font-size:1.1rem;flex-shrink:0;width:22px;text-align:center}
    #_nav-footer{padding:14px 14px;border-top:1px solid rgba(255,255,255,.12);font-size:.72rem;color:rgba(255,255,255,.4)}
    /* toggle mobile */
    #_nav-toggle{display:none;position:fixed;top:12px;left:12px;z-index:300;background:#1e429f;border:none;color:#fff;width:38px;height:38px;border-radius:9px;cursor:pointer;font-size:1.1rem;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2)}
    #_nav-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:199}
    body{padding-left:${W}px!important;transition:padding-left .25s}
    @media(max-width:860px){
      body{padding-left:0!important}
      #_nav{transform:translateX(-100%)}
      #_nav.aberto{transform:translateX(0)}
      #_nav-toggle{display:flex}
      #_nav-overlay.aberto{display:block}
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── HTML ── */
  const activeHref = isCotacao ? base+'cotacao/' : isDocumentos ? base+'documentos/' : base;

  const nav = document.createElement('nav');
  nav.id = '_nav';
  nav.innerHTML = `
    <div id="_nav-logo">
      <span>Sistema</span>
      <strong>Transportadoras</strong>
    </div>
    <div id="_nav-menu">
      ${items.map(it => `
        <a href="${it.href}" class="_nav-item${it.href===activeHref?' ativo':''}">
          <span class="ico">${it.icon}</span>
          ${it.label}
        </a>`).join('')}
    </div>
    <div id="_nav-footer">gestor-ads · Plinio19</div>
  `;

  const toggle = document.createElement('button');
  toggle.id = '_nav-toggle';
  toggle.innerHTML = '☰';
  toggle.setAttribute('aria-label', 'Menu');

  const overlay = document.createElement('div');
  overlay.id = '_nav-overlay';

  function abrirNav() { nav.classList.add('aberto'); overlay.classList.add('aberto'); }
  function fecharNav(){ nav.classList.remove('aberto'); overlay.classList.remove('aberto'); }
  toggle.addEventListener('click', abrirNav);
  overlay.addEventListener('click', fecharNav);

  document.body.prepend(overlay);
  document.body.prepend(toggle);
  document.body.prepend(nav);
})();
