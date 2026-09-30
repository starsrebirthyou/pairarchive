import { loadPair } from '../supa.js';
import { esc, $, $$, hydrate, imgTag, ink } from '../ui.js';
import { tabs, pairName } from './_shared.js';

export const PTABS = [['basic', '기본'], ['look', '외관 · 성격'], ['voice', '말투 · 습관'], ['taste', '취향'], ['past', '과거 · 관계'], ['outfit', '의상']];
export const LOOK = [['first', '첫인상'], ['hair', '머리카락'], ['eyes', '눈'], ['body', '체형'], ['wear', '복장 · 소지품']];
export const DEPTH = [['surface', '표면'], ['inner', '내면'], ['abyss', '심연']];
export const LINES = [['first', '첫만남'], ['daily', '평상시'], ['close', '친해졌을 때'], ['angry', '화났을 때'], ['bad', '사이 안 좋을 때']];
export const HABITS = [['speech', '말버릇'], ['unconscious', '무의식적인 행동'], ['routine', '생활 습관']];
export const WEAK = [['weak', '약점'], ['trigger', '트리거'], ['trauma', '트라우마']];
export const TASTE = [['food', '음식'], ['scent', '향'], ['etc', '그 외']];
export const DEFAULT_SLIDERS = [{ l: '내향', r: '외향', v: 50 }, { l: '이성', r: '감성', v: 50 }, { l: '신중', r: '충동', v: 50 }];

const tabState = {};
const dash = (v) => (v && String(v).trim() ? esc(v) : '<span class="muted">—</span>');
const kvList = (pairs, obj = {}, col = 'var(--wine)') =>
  pairs.map(([k, l]) => `<div class="kv pre"><b style="color:${col}">${l}</b> · ${dash(obj[k])}</div>`).join('');

export default async function profile(el, pid, which, cached) {
  const ctx = cached || await loadPair(pid);
  if (!ctx) { location.hash = '#/'; return; }
  const c = ctx[which];
  const p = c.profile || {};
  const col = c.color || '#f2c6c2';
  const key = c.id || which;
  const tab = tabState[key] || 'basic';
  const other = which === 'a' ? 'b' : 'a';

  const body = {
    basic: `
      <div class="grid2">
        <div class="card"><h3>짧은 설명</h3><div class="pre">${dash(p.intro)}</div></div>
        <div class="card"><h3>대표 대사</h3><div class="hand pre" style="font-size:24px;color:#6b3a45">${p.line ? '“' + esc(p.line) + '”' : '<span class="muted">—</span>'}</div></div>
      </div>`,
    look: `
      <div class="grid2">
        <div class="card"><h3>외관</h3>${kvList(LOOK, p.look)}</div>
        <div class="card depth"><h3>성격 — 깊이 순</h3>
          <div style="background:#fbeeed" class="pre"><b style="color:var(--wine);font-weight:400">표면</b> · ${dash(p.depth?.surface)}</div>
          <div style="background:#f6dcdb;margin-left:18px" class="pre"><b style="color:var(--wine);font-weight:400">내면</b> · ${dash(p.depth?.inner)}</div>
          <div style="background:${col};color:${ink(col)};margin-left:36px" class="pre"><b>심연</b> · ${p.depth?.abyss ? esc(p.depth.abyss) : '—'}</div>
        </div>
      </div>
      <div class="card"><h3>성격 슬라이더</h3>
        ${(p.sliders?.length ? p.sliders : DEFAULT_SLIDERS).map((s) => `
          <div class="slider-row"><div class="l">${esc(s.l)}</div>
            <div class="track" role="img" aria-label="${esc(s.l)} ${100 - s.v} : ${esc(s.r)} ${s.v}"><div class="knob" style="left:${s.v}%;background:${col}"></div></div>
            <div>${esc(s.r)}</div></div>`).join('')}
      </div>`,
    voice: `
      <div class="card"><h3>상황별 대사</h3>
        ${LINES.map(([k, l]) => `<div class="line-row"><div class="muted">${l}</div><div class="say pre">${p.lines?.[k] ? '“' + esc(p.lines[k]) + '”' : '<span class="muted" style="font-family:var(--body)">—</span>'}</div></div>`).join('')}
      </div>
      <div class="grid2">
        <div class="card"><h3>버릇 · 습관</h3>${kvList(HABITS, p.habits, 'var(--mute)')}</div>
        <div class="card"><h3>약점 · 트라우마</h3>${kvList(WEAK, p.weak, 'var(--mute)')}</div>
      </div>`,
    taste: `
      <div class="grid2">
        <div class="card note yellow"><h3>좋아하는 것</h3>${kvList(TASTE, p.like, 'var(--mute)')}</div>
        <div class="card note blue"><h3>싫어하는 것</h3>${kvList(TASTE, p.dislike, '#4f5f6b')}</div>
      </div>`,
    past: `
      <div class="card"><h3>과거사</h3>
        ${p.history?.length ? `<div class="timeline">${p.history.map((h) => `<div><b style="color:var(--wine)">${esc(h.when)}</b><div class="pre">${esc(h.what)}</div></div>`).join('')}</div>` : '<div class="muted">아직 비어 있어요</div>'}
      </div>
      <div class="card"><h3>관계</h3>
        ${p.relations?.length ? `<div class="grid3">${p.relations.map((r) => `
          <div class="rel-card">
            <div class="row" style="flex-wrap:nowrap"><div class="avatar">${imgTag(r.image_path, r.name)}</div>
              <div><div class="hand" style="font-size:20px">${esc(r.name)}</div><div class="muted">${esc(r.label)}</div></div></div>
            <div class="pre" style="font-size:13px;line-height:1.7">${esc(r.note)}</div>
          </div>`).join('')}</div>` : '<div class="muted">아직 비어 있어요</div>'}
      </div>`,
    outfit: `
      <div class="card"><h3>의상 · 레퍼런스</h3>
        ${p.outfits?.length ? `<div class="outfits">${p.outfits.map((o, i) => `
          <figure style="margin:0;display:flex;flex-direction:column;gap:6px"><div class="ph"><button type="button" data-zoom="${i}" style="border:none;padding:0;width:100%;height:100%;background:none" aria-label="${esc(o.name)} 크게 보기">${imgTag(o.image_path, o.name)}</button></div>
          <figcaption style="font-size:14px">${esc(o.name)}</figcaption></figure>`).join('')}</div>` : '<div class="muted">프로필 수정 → 의상에서 올릴 수 있어요</div>'}
      </div>`,
  };

  el.innerHTML = `
    <div class="topbar">
      <a class="back" href="#/pair/${pid}">← ${pairName(ctx.a, ctx.b)}</a>
      <div class="grow"></div>
      <a class="btn" href="#/pair/${pid}/profile/${which}" style="background:${col};color:${ink(col)};border-color:${col};font-family:var(--hand);font-size:19px;font-weight:700" aria-current="page">${esc(c.name)}</a>
      <a class="btn" href="#/pair/${pid}/profile/${other}" style="font-family:var(--hand);font-size:19px">${esc(ctx[other].name)}</a>
      <a class="btn" href="#/pair/${pid}/profile/${which}/edit">프로필 수정</a>
    </div>
    ${tabs(pid, 'profile')}
    <div class="profile-head">
      <div class="tilt-l"><div class="polaroid"><div class="ph">${imgTag(c.image_path, c.name) || '사진 없음'}</div></div></div>
      <div style="display:flex;flex-direction:column;gap:12px;flex:1;min-width:260px">
        <div class="row" style="gap:10px">${p.kind ? `<span class="badge">${esc(p.kind)}</span>` : ''}${p.alias ? `<span style="color:var(--wine)">「${esc(p.alias)}」</span>` : ''}</div>
        <h1>${esc(c.name)}</h1>
        ${p.intro ? `<div style="max-width:640px;color:var(--ink2)" class="pre">${esc(p.intro)}</div>` : ''}
        ${p.line ? `<div class="hand" style="font-size:22px;color:#6b3a45">“${esc(p.line)}”</div>` : ''}
        <div class="info-chips">
          ${[['나이', p.age], ['생일', p.birthday], ['키', p.height], ['MBTI', p.mbti], ['테마곡', p.song], ['상징물', p.symbol]].filter(([, v]) => v).map(([l, v]) => `<span>${l} · ${esc(v)}</span>`).join('')}
          <span><i class="dot" style="background:${col}"></i>${esc(col)}</span>
        </div>
      </div>
    </div>
    <div class="row" role="tablist" aria-label="프로필 항목" style="gap:8px">
      ${PTABS.map(([k, l]) => `<button class="chip ${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}" data-ptab="${k}">${l}</button>`).join('')}
    </div>
    <div style="display:flex;flex-direction:column;gap:22px">${body[tab]}</div>`;
  hydrate(el);

  $$(el, '[data-ptab]').forEach((b) => (b.onclick = () => { tabState[key] = b.dataset.ptab; profile(el, pid, which, ctx); }));
  $$(el, '[data-zoom]').forEach((b) => (b.onclick = () => {
    const src = b.querySelector('img')?.src; if (!src) return;
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `<img src="${src}" alt=""><div class="bar"><button class="btn">닫기</button></div>`;
    box.onclick = () => box.remove();
    document.body.appendChild(box);
  }));
}
