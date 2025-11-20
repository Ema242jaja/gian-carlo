// helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Particles
function createParticles(n = 42) {
  const c = document.getElementById('particles');
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

// scrollspy
const navLinks = $$('#navList a');

function handleScroll() {
  const fromTop = window.scrollY + 140;
  let current = null;
  ['home', 'about', 'skills', 'projects', 'tools', 'experience', 'contact'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= fromTop) current = id;
  });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === ('#' + current)));
}
handleScroll();
window.addEventListener('scroll', handleScroll, {
  passive: true
});

// mobile menu
const menuToggle = $('#menuToggle');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const list = $('#navList');
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    if (list.style.display === 'flex') {
      list.style.display = '';
    } else {
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.gap = '8px';
    }
  });
}

// search shortcuts
$('#projectSearch').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#projectSearch').focus();
  }
});

// Toast
function showToast(msg, time = 3200) {
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
}

// TRANSLATOR
const translateInput = $('#translateInput'),
  translateResult = $('#translateResult');
const apiField = $('#translatorApi');
if (apiField) apiField.value = 'https://libretranslate.com/translate';
async function translateText() {
  const text = translateInput.value.trim();
  if (!text) return showToast('Escribe texto para traducir');
  const source = $('#translateSource').value,
    target = $('#translateTarget').value;
  translateResult.textContent = 'Traduciendo...';
  const api = apiField.value.trim();
  try {
    const resp = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: source === 'auto' ? 'auto' : source,
        target,
        format: 'text'
      })
    });
    if (!resp.ok) throw new Error('API');
    const data = await resp.json();
    const translated = data.translatedText || data.result || (data.data && data.data.translations && data.data.translations[0] && data.data.translations[0].translatedText) || '';
    translateResult.textContent = translated || 'No se recibió traducción';
  } catch (err) {
    translateResult.textContent = '';
    const params = new URLSearchParams({
      sl: source === 'auto' ? 'auto' : source,
      tl: target,
      text
    });
    showToast('Fallo en API. Abriendo Google Translate...');
    window.open('https://translate.google.com/?' + params.toString(), '_blank');
  }
}
$('#doTranslate').addEventListener('click', translateText);
$('#ttsBtn').addEventListener('click', () => {
  const text = translateResult.textContent.trim() || translateInput.value.trim();
  if (!text) return showToast('Nada para leer');
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = $('#translateTarget').value === 'en' ? 'en-US' : 'es-AR';
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
});
$('#copyResult').addEventListener('click', async () => {
  const txt = translateResult.textContent.trim();
  if (!txt) return showToast('Nada para copiar');
  await navigator.clipboard.writeText(txt);
  showToast('Copiado al portapapeles');
});
$('#openGoogle').addEventListener('click', () => {
  const text = translateInput.value.trim();
  if (!text) return showToast('Nada para abrir');
  const params = new URLSearchParams({
    sl: $('#translateSource').value,
    tl: $('#translateTarget').value,
    text
  });
  window.open('https://translate.google.com/?' + params.toString(), '_blank');
});

// CV upload / download / print
let uploadedCVBlobUrl = null;
$('#cvUpload').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  uploadedCVBlobUrl && URL.revokeObjectURL(uploadedCVBlobUrl);
  uploadedCVBlobUrl = URL.createObjectURL(f);
  $('#cvDownload').href = uploadedCVBlobUrl;
  showToast('CV subido — listo para descargar');
});
$('#exportPDF').addEventListener('click', () => {
  window.print();
});
$('#printCV').addEventListener('click', () => { // generate printable CV from page content
  const cvHtml = `<!doctype html><html><head><title>CV - ${document.querySelector('.brand-title').textContent}</title><meta charset="utf-8"><style>body{font-family:Arial;line-height:1.4;padding:20px;color:#111}h1{font-size:28px}</style></head><body><h1>${document.querySelector('.brand-title').textContent}</h1><p>${document.querySelector('.lead').textContent}</p><h3>Experiencia</h3><ul>${Array.from(document.querySelectorAll('.experience-item li')).map(li=>'<li>'+li.textContent+'</li>').join('') || '<li>Bacope S.A. — Pasante</li>'}</ul></body></html>`;
  const w = window.open('', '_blank');
  w.document.write(cvHtml);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
});

// CONTACT FORM (simulado)
$('#contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = $('#formStatus');
  status.style.display = 'block';
  status.textContent = 'Enviando...';
  try {
    await new Promise(r => setTimeout(r, 900));
    status.textContent = '✓ Mensaje enviado — me contactaré pronto.';
    showToast('Mensaje enviado');
    e.target.reset();
    setTimeout(() => status.style.display = 'none', 3500);
  } catch (err) {
    status.textContent = 'Error al enviar. Intentá de nuevo.';
  }
});

// PROJECTS data
const projects = [{
    id: 1,
    title: 'Sistema de Gestión Empresarial',
    slug: 'sistema-gestion',
    desc: 'Plataforma integral para gestión administrativa. Módulos: usuarios, permisos, facturación, inventario, reportes y dashboards. Implementé control de accesos por roles y optimizaciones en consultas.',
    tech: ['react', 'node', 'postgres'],
    impact: 'Reducción de tiempos administrativos un 30%.'
  },
  {
    id: 2,
    title: 'Sistema de Trazabilidad',
    slug: 'sistema-trazabilidad',
    desc: 'Arquitectura para unificación de 5 sistemas independientes. Implementación de sincronización bidireccional, colas y dashboard centralizado para operaciones.',
    tech: ['vue', 'python', 'mysql'],
    impact: 'Visibilidad operativa y trazabilidad completa.'
  },
  {
    id: 3,
    title: 'Sistema Línea de Montaje',
    slug: 'linea-montaje',
    desc: 'Solución de control y monitorización de líneas productivas: métricas, alertas tempranas y reportes automáticos que mejoran eficiencia operativa.',
    tech: ['typescript', 'node', 'mongodb'],
    impact: 'Disminución de downtime y mejora de rendimiento por operario.'
  }
];

const favorites = new Set(JSON.parse(localStorage.getItem('eo:favs') || '[]'));

function renderProjects(filter = '', techFilter = '') {
  const grid = $('#projectsGrid');
  grid.innerHTML = '';
  const q = filter.trim().toLowerCase();
  projects.filter(p => {
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.tech.join(' ').toLowerCase().includes(q);
    const matchTech = !techFilter || p.tech.includes(techFilter);
    return matchQ && matchTech;
  }).forEach(p => {
    const el = document.createElement('article');
    el.className = 'project-card card';
    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:900;font-size:20px">${p.title}</div>
            <div class="muted" style="color:var(--muted);margin-top:6px">${p.desc}</div>
          </div>
          <div style="text-align:right">
            <div class="project-number">#${p.id.toString().padStart(2,'0')}</div>
            <div style="color:var(--muted);margin-top:8px">Impacto: ${p.impact}</div>
          </div>
        </div>
        <div class="project-meta">
          <div>${p.tech.map(t=>`<span class=\"tag\">${t.toUpperCase()}</span>`).join('')}</div>
          <div style="display:flex;gap:8px">
            <button class=\"btn btn-primary\" data-action=\"more\" data-id=\"${p.id}\">Ver</button>
            <button class=\"btn btn-ghost\" data-action=\"fav\" data-id=\"${p.id}\">${favorites.has(p.id)?'★':'☆'}</button>
            <button class=\"btn btn-ghost\" data-action=\"copy\" data-id=\"${p.id}\">Copiar</button>
          </div>
        </div>`;
    grid.appendChild(el);
  });
}
renderProjects();

$('#projectSearch').addEventListener('input', e => renderProjects(e.target.value, $('#projectFilter').value));
$('#projectFilter').addEventListener('change', e => renderProjects($('#projectSearch').value, e.target.value));

$('#exportJson').addEventListener('click', () => {
  const data = JSON.stringify(projects, null, 2);
  const blob = new Blob([data], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exportado projects.json');
});

// project actions
document.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  if (action === 'fav') {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    localStorage.setItem('eo:favs', JSON.stringify([...favorites]));
    renderProjects($('#projectSearch').value, $('#projectFilter').value);
  } else if (action === 'copy') {
    const p = projects.find(x => x.id === id);
    navigator.clipboard.writeText(p.title + ' - ' + p.desc);
    showToast('Copiado info del proyecto');
  } else if (action === 'more') {
    const p = projects.find(x => x.id === id);
    const m = $('#modal');
    const c = $('#modalContent');
    c.innerHTML = `<h2>${p.title}</h2><p class="muted">${p.desc}</p><hr/><p><strong>Tecnologías:</strong> ${p.tech.join(', ')}</p><p><strong>Impacto:</strong> ${p.impact}</p>`;
    m.classList.add('open');
  }
});

$('#modalClose').addEventListener('click', () => $('#modal').classList.remove('open'));
$('#modal').addEventListener('click', e => {
  if (e.target === $('#modal')) $('#modal').classList.remove('open');
});

// Theme toggle
$('#themeToggle').addEventListener('click', () => {
  const body = document.body;
  const isDark = getComputedStyle(body).getPropertyValue('--bg').trim() === '#0B0C1A';
  if (isDark) {
    body.style.setProperty('--bg', '#F8FAFC');
    body.style.setProperty('--text', '#0F172A');
    body.style.setProperty('--card', 'rgba(255,255,255,0.9)');
    body.style.setProperty('--border', 'rgba(0,0,0,0.1)');
  } else {
    body.style.removeProperty('--bg');
    body.style.removeProperty('--text');
    body.style.removeProperty('--card');
    body.style.removeProperty('--border');
  }
});

// Skill bars animation on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bar = entry.target.querySelector('.skill-fill');
      if (bar) bar.style.width = bar.dataset.fill + '%';
    }
  });
}, {
  threshold: 0.2
});
$$('.skill-bar').forEach(el => observer.observe(el.parentElement));