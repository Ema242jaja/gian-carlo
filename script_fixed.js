// script.js - versión actualizada para langSwitch + animación de menú + seguridad
// helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- Config / util ---------- */
const DEBUG = false;
function log(...args) { if (DEBUG) console.log('[eo]', ...args); }
function showToast(msg, time = 3000) {
  try {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.background = 'rgba(12,12,18,0.95)';
    t.style.color = '#fff';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '10px';
    t.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)';
    t.style.marginTop = '8px';
    document.getElementById('toast').appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .4s, transform .4s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(10px)';
      setTimeout(() => t.remove(), 450);
    }, time);
  } catch (err) {
    console.log('Toast fallback:', msg);
  }
}

/* ---------- Particles ---------- */
try {
  function createParticles(n = 42) {
    const c = document.getElementById('particles');
    if (!c) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.round(Math.random() * 10) + 6;
      p.style.width = p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = -Math.random() * 60 + 'vh';
      p.style.opacity = (Math.random() * 0.5 + 0.08).toFixed(2);
      p.style.animationDuration = (Math.random() * 22 + 12) + 's';
      p.style.animationDelay = (-Math.random() * 30) + 's';
      c.appendChild(p);
    }
  }
  createParticles();
} catch (err) { console.error('Particles error', err); }

/* ---------- Scrollspy ---------- */
try {
  const navLinks = $$('#navList a');
  function handleScroll() {
    const fromTop = window.scrollY + 140;
    let current = null;
    ['home','about','skills','projects','tools','experience','contact'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= fromTop) current = id;
    });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === ('#' + current)));
  }
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
} catch (err) { console.error('Scrollspy error', err); }

/* ---------- Mobile menu (robust + animado) ---------- */
try {
  const menuBtn = $('#menuToggle');
  const navList = $('#navList');
  if (menuBtn && navList) {
    function setMenuOpen(open) {
      navList.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

      // fallback inline styles if CSS missing
      if (open) {
        navList.style.display = 'flex';
        navList.style.flexDirection = 'column';
        navList.style.gap = '8px';
      } else {
        navList.style.display = '';
        navList.style.flexDirection = '';
        navList.style.gap = '';
      }
    }

    menuBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const willOpen = !navList.classList.contains('open');
      setMenuOpen(willOpen);
    });

    // cerrar al tocar un link
    $$('#navList a').forEach(a => a.addEventListener('click', () => setMenuOpen(false)));

    // cerrar al tocar afuera
    document.addEventListener('click', (e) => {
      if (!navList.contains(e.target) && !menuBtn.contains(e.target)) setMenuOpen(false);
    });

    // cerrar con ESC
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenuOpen(false); });
  }
} catch (err) { console.error('Menu error', err); }

/* ---------- SHORTCUTS ---------- */
try {
  const ps = $('#projectSearch');
  if (ps) ps.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); ps.focus(); }
  });
} catch (err) { console.error('Shortcuts error', err); }

/* ---------- Translator (individual text area) ---------- */
try {
  const translateInput = $('#translateInput');
  const translateResult = $('#translateResult');
  const apiField = $('#translatorApi');

  if (apiField && !apiField.value) apiField.value = 'https://libretranslate.com/translate';

  async function translateText() {
    if (!translateInput) return showToast('No existe el campo de traducción');
    const text = translateInput.value.trim();
    if (!text) return showToast('Escribe texto para traducir');

    const source = $('#translateSource') ? $('#translateSource').value : 'auto';
    const target = $('#translateTarget') ? $('#translateTarget').value : 'es';
    translateResult.textContent = 'Traduciendo...';

    const api = (apiField && apiField.value.trim()) || 'https://libretranslate.com/translate';

    try {
      const resp = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: source === 'auto' ? 'auto' : source, target, format: 'text' })
      });
      if (!resp.ok) throw new Error('API no respondió OK');
      const data = await resp.json();
      const translated = data && (data.translatedText || data.result || (data.data && data.data.translations && data.data.translations[0] && data.data.translations[0].translatedText));
      if (!translated) throw new Error('Respuesta sin traducción');
      translateResult.textContent = translated;
    } catch (err) {
      console.warn('Translate API failed', err);
      translateResult.textContent = '';
      showToast('API falló — abriendo Google Translate...');
      try {
        const params = new URLSearchParams({ sl: source, tl: target, text });
        window.open('https://translate.google.com/?' + params.toString(), '_blank');
      } catch (e) { console.error('Google fallback failed', e); }
    }
  }

  $('#doTranslate') && $('#doTranslate').addEventListener('click', translateText);
  $('#ttsBtn') && $('#ttsBtn').addEventListener('click', () => {
    const text = (translateResult && translateResult.textContent.trim()) || (translateInput && translateInput.value.trim());
    if (!text) return showToast('Nada para leer');
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = ($('#translateTarget') && $('#translateTarget').value) === 'en' ? 'en-US' : 'es-AR';
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  });
  $('#copyResult') && $('#copyResult').addEventListener('click', async () => {
    const txt = (translateResult && translateResult.textContent.trim()) || '';
    if (!txt) return showToast('Nada para copiar');
    try { await navigator.clipboard.writeText(txt); showToast('Copiado al portapapeles'); } catch { showToast('No se pudo copiar'); }
  });
  $('#openGoogle') && $('#openGoogle').addEventListener('click', () => {
    const text = (translateInput && translateInput.value.trim()) || '';
    if (!text) return showToast('Nada para abrir');
    const params = new URLSearchParams({ sl: ($('#translateSource') && $('#translateSource').value) || 'auto', tl: ($('#translateTarget') && $('#translateTarget').value) || 'es', text });
    window.open('https://translate.google.com/?' + params.toString(), '_blank');
  });

} catch (err) { console.error('Translator area error', err); }

/* ---------- PAGE TRANSLATION USING data-en / data-es (fast, offline) ---------- */
try {
  // Button the user actually has on page
  const langSwitch = $('#langSwitch');
  // state: 'es' means page currently Spanish, clicking will switch to English
  // we attempt to detect initial language by checking lang attribute or by reading button
  let pageLang = document.documentElement.lang && document.documentElement.lang.startsWith('en') ? 'en' : 'es';

  // helper to translate nodes that have data-en & data-es
  function translateNodesByDataAttrs(targetLang) {
    // choose all elements that declare both data-en and data-es
    const nodes = $$('[data-en][data-es]');
    nodes.forEach(node => {
      const en = node.getAttribute('data-en');
      const es = node.getAttribute('data-es');

      // inputs / textareas: placeholders and values
      const tag = node.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        const type = node.getAttribute('type');
        // placeholder
        if (targetLang === 'en') {
          if (node.hasAttribute('data-placeholder-en')) node.placeholder = node.getAttribute('data-placeholder-en');
          else node.placeholder = en;
          if (node.hasAttribute('data-value-en')) node.value = node.getAttribute('data-value-en');
        } else {
          if (node.hasAttribute('data-placeholder-es')) node.placeholder = node.getAttribute('data-placeholder-es');
          else node.placeholder = es;
          if (node.hasAttribute('data-value-es')) node.value = node.getAttribute('data-value-es');
        }
      } else {
        // for other elements: set textContent (safe for your current HTML)
        if (targetLang === 'en') node.textContent = en;
        else node.textContent = es;
      }

      // also try to update title attribute if present
      if (node.hasAttribute('data-title-en') || node.hasAttribute('data-title-es')) {
        if (targetLang === 'en' && node.hasAttribute('data-title-en')) node.title = node.getAttribute('data-title-en');
        if (targetLang === 'es' && node.hasAttribute('data-title-es')) node.title = node.getAttribute('data-title-es');
      }
    });
  }

  // If an element doesn't have data-* attributes, we skip it for safety.
  // This avoids noisy API calls and DOM scraping issues. You can extend later.

  function setLangUI(targetLang) {
    // change html lang attribute
    document.documentElement.lang = targetLang === 'en' ? 'en' : 'es';
    // update langSwitch label (show opposite as action or show current)
    if (langSwitch) {
      // show button label as current language short-code
      langSwitch.textContent = targetLang === 'en' ? 'ES' : 'EN';
      langSwitch.setAttribute('aria-pressed', targetLang === 'en' ? 'true' : 'false');
    }
  }

  async function togglePageLanguage() {
    try {
      const target = pageLang === 'es' ? 'en' : 'es';

      // Primary behavior: use data-en / data-es attributes if present
      translateNodesByDataAttrs(target);

      // Update some attributes that are commonly used (placeholders) that might be set without data attributes:
      // For safety we only change placeholders that also have data- attributes names
      // (This avoids altering unrelated inputs).

      pageLang = target;
      setLangUI(target);
      showToast(target === 'en' ? 'Página traducida a inglés' : 'Página traducida a español');
    } catch (err) {
      console.error('togglePageLanguage error', err);
      showToast('Error traduciendo la página');
    }
  }

  if (langSwitch) {
    // initialize UI
    setLangUI(pageLang);
    langSwitch.addEventListener('click', () => togglePageLanguage());
  } else {
    log('langSwitch button no encontrado');
  }

} catch (err) { console.error('Page translate error', err); }

/* ---------- CV / Contact / Projects / Theme / Skills (same as before, robust) ---------- */
/* For brevity I keep the previous robust handlers - they were working.
   Below follows a condensed but functionally equivalent set of handlers
   (upload CV, contact form, projects rendering, modal, theme toggle, skill bars).
*/

try {
  // CV upload / download
  let uploadedCVBlobUrl = null;
  $('#cvUpload') && $('#cvUpload').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    uploadedCVBlobUrl && URL.revokeObjectURL(uploadedCVBlobUrl);
    uploadedCVBlobUrl = URL.createObjectURL(f);
    $('#cvDownload') && ($('#cvDownload').href = uploadedCVBlobUrl);
    showToast('CV subido — listo para descargar');
  });
  $('#exportPDF') && $('#exportPDF').addEventListener('click', () => window.print());
  $('#printCV') && $('#printCV').addEventListener('click', () => {
    try {
      const brand = document.querySelector('.brand-title') && document.querySelector('.brand-title').textContent;
      const lead = document.querySelector('.lead') && document.querySelector('.lead').textContent;
      const items = Array.from(document.querySelectorAll('.experience-item li')).map(li => '<li>' + li.textContent + '</li>').join('') || '<li>Bacope S.A. — Pasante</li>';
      const cvHtml = `<!doctype html><html><head><title>CV - ${brand || ''}</title><meta charset="utf-8"><style>body{font-family:Arial;line-height:1.4;padding:20px;color:#111}h1{font-size:28px}</style></head><body><h1>${brand || ''}</h1><p>${lead || ''}</p><h3>Experiencia</h3><ul>${items}</ul></body></html>`;
      const w = window.open('', '_blank'); w.document.write(cvHtml); w.document.close(); w.focus(); setTimeout(()=>w.print(),500);
    } catch (err) { console.error('printCV error', err); showToast('No se pudo generar CV imprimible'); }
  });

  // Contact (simulado)
  $('#contactForm') && $('#contactForm').addEventListener('submit', async e => {
    e.preventDefault();
    const status = $('#formStatus'); if (status) { status.style.display = 'block'; status.textContent = 'Enviando...'; }
    try { await new Promise(r => setTimeout(r, 900)); if (status) status.textContent = '✓ Mensaje enviado — me contactaré pronto.'; showToast('Mensaje enviado'); e.target.reset(); setTimeout(()=>{ if (status) status.style.display='none'; },3500); } catch (err) { console.error(err); if (status) status.textContent = 'Error al enviar.'; showToast('Error al enviar'); }
  });

  // Projects render & actions (same data as original)
  const projects = [
    { id: 1, title: 'Sistema de Gestión Empresarial', slug: 'sistema-gestion', desc: 'Plataforma integral para gestión administrativa. Módulos: usuarios, permisos, facturación, inventario, reportes y dashboards.', tech: ['react','node','postgres'], impact: 'Reducción de tiempos administrativos un 30%.' },
    { id: 2, title: 'Sistema de Trazabilidad', slug: 'sistema-trazabilidad', desc: 'Arquitectura para unificación de 5 sistemas independientes. Implementación de sincronización bidireccional y dashboard central.', tech: ['vue','python','mysql'], impact: 'Visibilidad operativa y trazabilidad completa.' },
    { id: 3, title: 'Sistema Línea de Montaje', slug: 'linea-montaje', desc: 'Solución de control y monitorización de líneas productivas.', tech: ['typescript','node','mongodb'], impact: 'Disminución de downtime y mejora de rendimiento por operario.' }
  ];

  const favorites = new Set(JSON.parse(localStorage.getItem('eo:favs') || '[]'));

  function renderProjects(filter = '', techFilter = '') {
    const grid = $('#projectsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const q = (filter||'').trim().toLowerCase();
    projects.filter(p => {
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.tech.join(' ').toLowerCase().includes(q);
      const matchTech = !techFilter || p.tech.includes(techFilter);
      return matchQ && matchTech;
    }).forEach(p => {
      const el = document.createElement('article'); el.className = 'project-card card';
      el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:900;font-size:20px">${p.title}</div><div class="muted" style="color:var(--muted);margin-top:6px">${p.desc}</div></div><div style="text-align:right"><div class="project-number">#${String(p.id).padStart(2,'0')}</div><div style="color:var(--muted);margin-top:8px">Impacto: ${p.impact}</div></div></div><div class="project-meta"><div>${p.tech.map(t=>`<span class="tag">${t.toUpperCase()}</span>`).join('')}</div><div style="display:flex;gap:8px"><button class="btn btn-primary" data-action="more" data-id="${p.id}">Ver</button><button class="btn btn-ghost" data-action="fav" data-id="${p.id}">${favorites.has(p.id)?'★':'☆'}</button><button class="btn btn-ghost" data-action="copy" data-id="${p.id}">Copiar</button></div></div>`;
      grid.appendChild(el);
    });
  }
  renderProjects();
  $('#projectSearch') && $('#projectSearch').addEventListener('input', e => renderProjects(e.target.value, $('#projectFilter') ? $('#projectFilter').value : ''));
  $('#projectFilter') && $('#projectFilter').addEventListener('change', e => renderProjects($('#projectSearch') ? $('#projectSearch').value : '', e.target.value));
  $('#exportJson') && $('#exportJson').addEventListener('click', () => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'projects.json'; a.click(); URL.revokeObjectURL(url); showToast('Exportado projects.json');
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const action = btn.dataset.action; const id = Number(btn.dataset.id);
    if (action === 'fav') { if (favorites.has(id)) favorites.delete(id); else favorites.add(id); localStorage.setItem('eo:favs', JSON.stringify([...favorites])); renderProjects($('#projectSearch') ? $('#projectSearch').value : '', $('#projectFilter') ? $('#projectFilter').value : ''); return; }
    if (action === 'copy') { const p = projects.find(x => x.id === id); navigator.clipboard.writeText(`${p.title} - ${p.desc}`).catch(()=>{}); showToast('Copiado info del proyecto'); return; }
    if (action === 'more') { const p = projects.find(x => x.id === id); const m = $('#modal'); const c = $('#modalContent'); if (!m || !c) return; c.innerHTML = `<h2>${p.title}</h2><p class="muted">${p.desc}</p><hr/><p><strong>Tecnologías:</strong> ${p.tech.join(', ')}</p><p><strong>Impacto:</strong> ${p.impact}</p>`; m.classList.add('open'); }
  });

  $('#modalClose') && $('#modalClose').addEventListener('click', () => $('#modal').classList.remove('open'));
  $('#modal') && $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) $('#modal').classList.remove('open'); });

  // Theme toggle
  $('#themeToggle') && $('#themeToggle').addEventListener('click', () => {
    const body = document.body;
    const isDark = getComputedStyle(body).getPropertyValue('--bg').trim() === '#0B0C1A';
    if (isDark) { body.style.setProperty('--bg', '#F8FAFC'); body.style.setProperty('--text', '#0F172A'); body.style.setProperty('--card', 'rgba(255,255,255,0.9)'); body.style.setProperty('--border', 'rgba(0,0,0,0.1)'); }
    else { body.style.removeProperty('--bg'); body.style.removeProperty('--text'); body.style.removeProperty('--card'); body.style.removeProperty('--border'); }
  });

  // Skill bars
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target.querySelector('.skill-fill');
        if (bar) bar.style.width = bar.dataset.fill + '%';
      }
    });
  }, { threshold: 0.2 });
  $$('.skill-bar').forEach(el => {
    const parent = el.parentElement || el;
    try { observer.observe(parent); } catch {}
  });

} catch (err) { console.error('Main handlers error', err); }
