import { loadPair, latest, remove, removeFile } from '../supa.js';
import { esc, $, hydrate, imgTag, dday, confirmBox, guard, has } from '../ui.js';
import { tabs } from './_shared.js';
import { NICK } from './pairform.js';

export default async function pairView(el, pid) {
  const ctx = await loadPair(pid);
  if (!ctx) { location.hash = '#/'; return; }
  const { pair, a, b } = ctx;
  const d = pair.detail || {};
  const [q, s, c] = await Promise.all([latest('qnas', pid), latest('ssuls', pid), latest('commissions', pid)]);
  const days = dday(pair.start_date);
  const kw = (d.keywords || '').split(',').map((x) => x.trim()).filter(Boolean);

  const polaroid = (ch, bg, tilt) => `
    <div class="who ${tilt}"><div class="polaroid"><div class="ph" style="background:${bg}">${imgTag(ch.image_path, ch.name) || '사진 없음'}</div></div>
    <div class="name">${esc(ch.name)}</div></div>`;

  const seen = (title, v = {}, col, tint) => `
    <div class="card">
      <h3>${title}</h3>
      <div class="row" style="align-items:stretch;flex-wrap:nowrap">
        <div class="grow" style="background:var(--cream);border-radius:6px;padding:10px 12px;font-size:14px"><b>첫인상</b><br><span class="pre">${esc(v.first || '—')}</span></div>
        <div style="align-self:center;color:${col};font-size:20px" aria-hidden="true">→</div>
        <div class="grow" style="background:${tint};border-radius:6px;padding:10px 12px;font-size:14px"><b>현인상</b><br><span class="pre">${esc(v.now || '—')}</span></div>
      </div>
      <div class="muted">속마음</div>
      <div class="pre" style="font-size:15px;line-height:1.8">${v.thought ? '“' + esc(v.thought) + '”' : '—'}</div>
    </div>`;

  const nickSide = (title, v = {}, col, bg) => `
    <div style="background:${bg};border-radius:8px;padding:16px 20px">
      <div style="font-weight:700;padding-bottom:8px">${title}</div>
      ${NICK.map(([k, l]) => `<div style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:12px;align-items:center;padding:8px 0;border-top:1.5px dashed var(--line)">
        <div class="muted">${l}</div><div class="hand" style="font-size:22px;color:${col}">${v[k] ? '“' + esc(v[k]) + '”' : '<span class="muted" style="font-family:var(--body);font-weight:400">—</span>'}</div></div>`).join('')}
    </div>`;

  el.innerHTML = `
    <div class="topbar">
      <a class="back" href="#/">← 페어 목록</a>
      <div class="grow"></div>
      <a class="btn" href="#/pair/${pid}/edit">페어 수정</a>
      <button class="btn danger" data-act="del">삭제</button>
    </div>
    <div class="duo">
      ${polaroid(a, '#efe3d3', 'tilt-l')}
      <div class="mid">
        <div class="row" style="justify-content:center;gap:8px"><span class="badge" style="background:var(--pink);color:#4a2330">${esc(pair.kind)}</span>${pair.genre ? `<span class="badge">${esc(pair.genre)}</span>` : ''}</div>
        <div class="summary">${esc(pair.summary || '')}</div>
        <div style="width:160px;height:2px;background:var(--dash)"></div>
        ${days ? `<div class="muted">함께한 지 ${days}일</div>` : ''}
      </div>
      ${polaroid(b, '#dde8ef', 'tilt-r')}
    </div>
    ${tabs(pid, '')}
    <div class="grid2">
      ${seen(`${esc(a.name)}가 본 ${esc(b.name)}`, d.a, '#8a2f42', a.color + '55')}
      ${seen(`${esc(b.name)}가 본 ${esc(a.name)}`, d.b, '#3f6283', b.color + '55')}
    </div>
    <div class="card">
      <h3>서로 부르는 호칭</h3>
      <div class="grid2">${nickSide(`${esc(a.name)} → ${esc(b.name)}`, d.nick?.ab, '#8a2f42', '#fdf6f5')}${nickSide(`${esc(b.name)} → ${esc(a.name)}`, d.nick?.ba, '#2f4a63', '#f3f8fb')}</div>
    </div>
    <div class="grid2">
      <div class="card">
        <h3>관계 키워드</h3>
        <div class="row" style="gap:6px">${kw.length ? kw.map((k) => `<span class="badge" style="background:var(--pink);color:#4a2330">#${esc(k)}</span>`).join('') : '<span class="muted">페어 수정에서 추가할 수 있어요</span>'}</div>
        <div class="muted" style="padding-top:6px">페어 테마곡</div>
        <div>${esc(d.song || '—')}</div>
      </div>
      <div class="card">
        <h3>기념일</h3>
        ${days ? `<div class="row" style="align-items:baseline;gap:8px"><div class="hand" style="font-size:42px;color:var(--wine)">D+${days}</div><div class="muted">${esc(pair.start_date)}부터</div></div>` : '<div class="muted">페어 시작일을 넣으면 D+가 자동으로 세어져요</div>'}
        ${(d.anniversaries || []).map((x) => `<div class="kv"><b>${esc(x.date)}</b> · ${esc(x.label)}</div>`).join('')}
      </div>
    </div>
    <div class="card" style="flex-direction:row;align-items:center;gap:20px;flex-wrap:wrap">
      <div><h3>최근 기록</h3><div class="muted">자동으로 모아져요</div></div>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:14px" class="grow">
        <a href="#/pair/${pid}/qna"><span style="color:var(--wine)">문답</span> · <span style="color:var(--ink)">${esc(q?.question || '아직 없음')}</span></a>
        <a href="#/pair/${pid}/ssul"><span style="color:#3f6283">썰</span> · <span style="color:var(--ink)">${esc(s?.title || '아직 없음')}</span></a>
        <a href="#/pair/${pid}/commission"><span style="color:#5a4a42">커미션</span> · <span style="color:var(--ink)">${esc(c ? (c.artist || '작가 미상') + ' · ' + (c.made_on || '') : '아직 없음')}</span></a>
      </div>
    </div>`;
  hydrate(el);

  $(el, '[data-act=del]').onclick = async () => {
    if (!(await confirmBox('페어 삭제', `${a.name} × ${b.name} 페어와 두 캐릭터 프로필, 문답·썰·커미션이 모두 지워져요.`))) return;
    const ok = await guard(async () => {
      await remove('pairs', pid);
      for (const ch of [a, b]) if (ch.id) { await removeFile(ch.image_path); await remove('characters', ch.id); }
      return true;
    }, '페어를 삭제했어요');
    if (ok) location.hash = '#/';
  };
}
