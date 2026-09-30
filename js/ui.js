import { imgUrl, upload } from './supa.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => [...root.querySelectorAll(sel)];

export const ICON = {
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
  up: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 20h16"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>',
  upArrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>',
  downArrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></svg>',
};
export const iconBtn = (act, label, icon, extra = '', data = '') =>
  `<button type="button" class="icon-btn ${extra}" data-act="${act}" ${data} aria-label="${esc(label)}">${ICON[icon]}</button>`;

// ── 토스트 ──
let tt;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('show'), 2600);
}
export async function guard(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (e) { console.error(e); toast('오류: ' + e.message); return undefined; }
}

// ── 모달 ──
export function openModal(html, { wide = false } = {}) {
  const root = document.getElementById('modal-root');
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" style="${wide ? 'width:min(860px,100%)' : ''}">${html}</div>`;
  root.appendChild(bg);
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  const first = bg.querySelector('input,textarea,select,button');
  if (first) setTimeout(() => first.focus(), 30);
  return { el: bg.querySelector('.modal'), close };
}
export function confirmBox(title, msg, okLabel = '삭제') {
  return new Promise((resolve) => {
    const m = openModal(`<h2>${esc(title)}</h2><p style="margin:0">${esc(msg)}</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-x>취소</button><button class="btn primary" data-ok>${esc(okLabel)}</button></div>`);
    m.el.querySelector('[data-x]').onclick = () => { m.close(); resolve(false); };
    m.el.querySelector('[data-ok]').onclick = () => { m.close(); resolve(true); };
  });
}

// ── 폼 필드 ──
let fid = 0;
export function field(label, name, value = '', { area = false, ph = '', type = 'text', rows = 3 } = {}) {
  const id = 'f' + ++fid;
  const ctl = area
    ? `<textarea id="${id}" name="${name}" rows="${rows}" placeholder="${esc(ph)}">${esc(value)}</textarea>`
    : `<input id="${id}" type="${type}" name="${name}" value="${esc(value)}" placeholder="${esc(ph)}">`;
  return `<div class="field"><label for="${id}">${esc(label)}</label>${ctl}</div>`;
}
// name="a.b.c" 형태를 중첩 객체로
export function readForm(root) {
  const out = {};
  root.querySelectorAll('[name]').forEach((el) => {
    const keys = el.name.split('.');
    let o = out;
    keys.slice(0, -1).forEach((k) => { o = o[k] ??= {}; });
    o[keys.at(-1)] = el.type === 'range' ? Number(el.value) : el.value.trim();
  });
  return out;
}

// ── 이미지 ──
export async function hydrate(root) {
  await Promise.all($$(root, 'img[data-img]').map(async (img) => {
    try { img.src = await imgUrl(img.dataset.img); } catch { img.alt = '이미지를 불러오지 못했어요'; }
  }));
}
export const imgTag = (path, alt = '') => (path ? `<img data-img="${esc(path)}" alt="${esc(alt)}">` : '');

export function pickFiles({ multiple = false } = {}) {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = multiple;
    inp.onchange = () => resolve([...inp.files]);
    inp.click();
  });
}
export async function uploadMany(files) {
  const paths = [];
  for (const f of files) paths.push(await upload(f));
  return paths;
}
export function makeDropzone(el, onFiles) {
  el.addEventListener('click', async () => { const f = await pickFiles({ multiple: true }); if (f.length) onFiles(f); });
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault(); el.classList.remove('over');
    const f = [...e.dataTransfer.files].filter((x) => x.type.startsWith('image/'));
    if (f.length) onFiles(f);
  });
}

// ── 색 / 날짜 / 마크다운 ──
export function ink(hex) {
  const h = String(hex || '#ffffff').replace('#', '').padEnd(6, 'f');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#2a211d' : '#ffffff';
}
export const validHex = (h) => /^#[0-9a-fA-F]{6}$/.test(h || '');
export function dday(date) {
  if (!date) return null;
  const start = new Date(date + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((today - start) / 86400000) + 1;
}
export const today = () => new Date().toISOString().slice(0, 10);
export const fmtDate = (d) => (d ? String(d).slice(0, 10) : '');

export function md(text) {
  const lines = esc(text).split('\n');
  const inline = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>');
  let html = '', quote = [];
  const flush = () => { if (quote.length) { html += `<blockquote>${quote.join('<br>')}</blockquote>`; quote = []; } };
  for (const l of lines) {
    if (l.startsWith('&gt; ') || l === '&gt;') { quote.push(inline(l.replace(/^&gt; ?/, ''))); continue; }
    flush();
    if (/^-{3,}$/.test(l.trim())) html += '<hr>';
    else html += inline(l) + '<br>';
  }
  flush();
  return html;
}
export const has = (...v) => v.some((x) => x && String(x).trim());
