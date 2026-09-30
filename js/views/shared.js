import { esc } from '../ui.js';

export const TABS = [
  ['', '개요'], ['profile/a', '프로필'], ['story', '서사'], ['au', 'AU'],
  ['qna', '문답'], ['ssul', '썰'], ['commission', '커미션'],
];

export function tabs(pid, active) {
  return `<nav class="tabs" aria-label="페어 메뉴">${TABS.map(([k, label]) => {
    const on = active === k || (k.startsWith('profile') && active.startsWith('profile'));
    return `<a href="#/pair/${pid}${k ? '/' + k : ''}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}>${label}</a>`;
  }).join('')}</nav>`;
}

export const pairName = (a, b) => `${esc(a.name || 'A')} × ${esc(b.name || 'B')}`;

export function subHeader({ pid, a, b, title, action = '' }) {
  return `
    <div class="topbar">
      <a class="back" href="#/pair/${pid}">← ${pairName(a, b)}</a>
      <h1 class="title center">${esc(title)}</h1>
      <div style="min-width:120px;display:flex;justify-content:flex-end">${action}</div>
    </div>`;
}

// AI 에 넘길 페어 요약
export function aiContext({ pair, a, b }, extra = {}) {
  const pick = (c) => ({
    name: c.name, intro: c.profile?.intro, alias: c.profile?.alias,
    personality: c.profile?.depth, sliders: c.profile?.sliders, likes: c.profile?.like,
  });
  return { kind: pair.kind, genre: pair.genre, summary: pair.summary, keywords: pair.detail?.keywords, a: pick(a), b: pick(b), ...extra };
}
