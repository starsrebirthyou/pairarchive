import { sb, list, listIn, remove, removeFile } from '../supa.js';
import { esc, $, $$, iconBtn, hydrate, imgTag, confirmBox, guard } from '../ui.js';
import { SITE_NAME } from '../config.js';

let filter = '전체';

export default async function home(el) {
  const pairs = await list('pairs');
  const ids = pairs.flatMap((p) => [p.char_a, p.char_b]).filter(Boolean);
  const chars = Object.fromEntries((await listIn('characters', 'id', ids)).map((c) => [c.id, c]));

  const draw = () => {
    const shown = pairs.filter((p) => filter === '전체' || p.kind === filter);
    el.innerHTML = `
      <div class="topbar">
        <h1 class="title grow">${esc(SITE_NAME)}</h1>
        <button class="btn" data-act="logout">로그아웃</button>
      </div>
      <div class="row">
        ${['전체', '드림', '자컾', '자관'].map((k) => `<button class="chip ${filter === k ? 'on' : ''}" data-filter="${k}" aria-pressed="${filter === k}">${k}</button>`).join('')}
        <div class="grow"></div>
        <a class="btn primary" href="#/pair/new">+ 페어 추가</a>
      </div>
      ${shown.length ? `<div class="pair-grid">${shown.map((p) => card(p, chars[p.char_a] || {}, chars[p.char_b] || {})).join('')}</div>`
        : `<div class="empty"><span class="hand">아직 페어가 없어요</span>오른쪽 위 “페어 추가”로 첫 페어를 만들어보세요.</div>`}`;
    hydrate(el);

    $$(el, '[data-filter]').forEach((b) => (b.onclick = () => { filter = b.dataset.filter; draw(); }));
    $(el, '[data-act=logout]').onclick = () => sb.auth.signOut();
    $$(el, '[data-act=edit]').forEach((b) => (b.onclick = () => (location.hash = `#/pair/${b.dataset.id}/edit`)));
    $$(el, '[data-act=del]').forEach((b) => (b.onclick = async () => {
      const p = pairs.find((x) => x.id === b.dataset.id);
      const a = chars[p.char_a] || {}, c = chars[p.char_b] || {};
      if (!(await confirmBox('페어 삭제', `${a.name || 'A'} × ${c.name || 'B'} 페어와 두 캐릭터 프로필, 문답·썰·커미션이 모두 지워져요.`))) return;
      await guard(async () => {
        await remove('pairs', p.id);
        for (const ch of [a, c]) if (ch.id) { await removeFile(ch.image_path); await remove('characters', ch.id); }
        pairs.splice(pairs.indexOf(p), 1);
        draw();
      }, '페어를 삭제했어요');
    }));
  };
  draw();
}

function card(p, a, b) {
  const ph = (c, bg, tilt) => `<div class="polaroid ${tilt}"><div class="ph" style="background:${bg}">${imgTag(c.image_path, c.name)}</div></div>`;
  return `
    <article class="card pair-card">
      <a href="#/pair/${p.id}" class="mini" aria-label="${esc(a.name)} × ${esc(b.name)} 열기">${ph(a, '#efe3d3', 'tilt-l')}${ph(b, '#dde8ef', 'tilt-r')}</a>
      <a class="names" href="#/pair/${p.id}">${esc(a.name || 'A')} × ${esc(b.name || 'B')}</a>
      <div class="row" style="justify-content:center;gap:8px">
        <span class="badge" style="background:var(--pink);color:#4a2330">${esc(p.kind)}</span>
        ${p.kind === '드림' && p.genre ? `<span class="badge">${esc(p.genre)}</span>` : ''}
      </div>
      <div class="foot">
        <div class="muted grow">${esc(p.summary || '')}</div>
        ${iconBtn('edit', '페어 수정', 'edit', '', `data-id="${p.id}"`)}
        ${iconBtn('del', '페어 삭제', 'del', 'del', `data-id="${p.id}"`)}
      </div>
    </article>`;
}
