import { insert, update, loadPair, upload, removeFile } from '../supa.js';
import { esc, $, $$, field, readForm, hydrate, imgTag, pickFiles, guard, validHex, ICON } from '../ui.js';

export const NICK = [['daily', '평소'], ['sweet', '다정할 때'], ['angry', '화났을 때'], ['public', '남들 앞에서'], ['tease', '장난칠 때'], ['inner', '속으로']];

export default async function pairForm(el, id) {
  const ctx = id ? await loadPair(id) : null;
  const pair = ctx?.pair || { kind: '드림', detail: {} };
  const a = ctx?.a || { name: '', color: '#f2c6c2', profile: {} };
  const b = ctx?.b || { name: '', color: '#34436b', profile: {} };
  const d = pair.detail || {};
  const img = { a: a.image_path || null, b: b.image_path || null };
  const newImg = { a: null, b: null };
  let kind = pair.kind;
  let annis = [...(d.anniversaries || [])];

  const charBox = (k, c, bg) => `
    <div class="card" style="background:${bg};box-shadow:none">
      <h3>캐릭터 ${k.toUpperCase()}</h3>
      ${field('이름', `c${k}.name`, c.name)}
      <div class="field"><span class="muted">프로필 사진</span>
        <button type="button" class="upload-box" data-up="${k}" style="height:170px;width:140px">${img[k] ? imgTag(img[k], c.name) : ICON.up + '<span>사진 올리기</span>'}</button>
      </div>
      <div class="row" style="align-items:flex-end">
        <div class="field"><label for="col${k}">상징색 (hex)</label><input id="col${k}" type="text" name="c${k}.color" value="${esc(c.color)}" style="width:130px"></div>
        <span class="dot" data-swatch="${k}" style="width:40px;height:40px;border-radius:20px;background:${esc(c.color)}"></span>
      </div>
    </div>`;

  const view = (who, v = {}) => `
    <div class="card" style="box-shadow:none;background:var(--paper)">
      <h3>${who}</h3>
      ${field('첫인상', `${who === 'A가 본 B' ? 'va' : 'vb'}.first`, v.first, { area: true, rows: 2 })}
      ${field('현인상', `${who === 'A가 본 B' ? 'va' : 'vb'}.now`, v.now, { area: true, rows: 2 })}
      ${field('속마음', `${who === 'A가 본 B' ? 'va' : 'vb'}.thought`, v.thought, { area: true, rows: 3 })}
    </div>`;

  const nick = (key, title, v = {}) => `
    <div class="card" style="box-shadow:none;background:var(--paper)">
      <h3>${title}</h3>
      <div class="grid2" style="gap:12px">${NICK.map(([k, l]) => field(l, `nick.${key}.${k}`, v[k])).join('')}</div>
    </div>`;

  const annRows = () => annis.map((x, i) => `
    <div class="row" style="align-items:flex-end">
      <div class="field"><label for="ad${i}">날짜</label><input id="ad${i}" type="date" data-ann="${i}" data-k="date" value="${esc(x.date)}"></div>
      <div class="field grow"><label for="al${i}">무슨 날</label><input id="al${i}" type="text" data-ann="${i}" data-k="label" value="${esc(x.label)}"></div>
      <button type="button" class="icon-btn del" data-annx="${i}" aria-label="기념일 삭제">${ICON.x}</button>
    </div>`).join('');

  el.innerHTML = `
    <div class="topbar">
      <a class="back" href="${id ? '#/pair/' + id : '#/'}">← ${id ? '페어로' : '페어 목록'}</a>
      <h1 class="title center">${id ? '페어 수정' : '새 페어 만들기'}</h1>
      <div style="min-width:120px"></div>
    </div>
    <form class="card" id="pf" style="gap:22px;padding:28px">
      <div class="field"><span class="muted">종류</span>
        <div class="row">${['드림', '자컾', '자관'].map((k) => `<button type="button" class="chip ${kind === k ? 'on' : ''}" data-kind="${k}" aria-pressed="${kind === k}">${k}</button>`).join('')}</div>
      </div>
      <div class="grid3">
        <div data-genre ${kind === '드림' ? '' : 'hidden'}>${field('장르 (원작)', 'genre', pair.genre, { ph: '원작 이름' })}</div>
        ${field('관계 한 줄 요약', 'summary', pair.summary)}
        ${field('페어 시작일 (D+ 기준)', 'start_date', pair.start_date || '', { type: 'date' })}
      </div>
      <div class="grid2">${charBox('a', a, '#fbeeed')}${charBox('b', b, '#e8f1f7')}</div>

      <h2 class="section-title">서로를 어떻게 보는지</h2>
      <div class="grid2">${view('A가 본 B', d.a)}${view('B가 본 A', d.b)}</div>

      <h2 class="section-title">서로 부르는 호칭</h2>
      <div class="grid2">${nick('ab', 'A → B', d.nick?.ab)}${nick('ba', 'B → A', d.nick?.ba)}</div>

      <h2 class="section-title">키워드 · 테마곡 · 기념일</h2>
      <div class="grid2">
        ${field('관계 키워드 (쉼표로 구분)', 'keywords', d.keywords, { ph: '구원, 쌍방 집착, 앙숙' })}
        ${field('페어 테마곡', 'song', d.song, { ph: '곡명 — 아티스트' })}
      </div>
      <div class="field"><span class="muted">기념일</span><div id="anns" style="display:flex;flex-direction:column;gap:10px">${annRows()}</div>
        <button type="button" class="btn dashed" data-act="ann" style="align-self:flex-start">+ 기념일 추가</button></div>

      <div class="row" style="justify-content:flex-end">
        <a class="btn" href="${id ? '#/pair/' + id : '#/'}">취소</a>
        <button type="submit" class="btn primary">${id ? '저장' : '만들기'}</button>
      </div>
    </form>`;
  hydrate(el);

  $$(el, '[data-kind]').forEach((btn) => (btn.onclick = () => {
    kind = btn.dataset.kind;
    $$(el, '[data-kind]').forEach((x) => { x.classList.toggle('on', x === btn); x.setAttribute('aria-pressed', x === btn); });
    $(el, '[data-genre]').hidden = kind !== '드림';
  }));
  $$(el, '[data-up]').forEach((btn) => (btn.onclick = async () => {
    const [f] = await pickFiles(); if (!f) return;
    const k = btn.dataset.up;
    newImg[k] = f;
    btn.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`;
  }));
  ['a', 'b'].forEach((k) => $(el, `#col${k}`).addEventListener('input', (e) => {
    if (validHex(e.target.value)) $(el, `[data-swatch=${k}]`).style.background = e.target.value;
  }));
  const syncAnn = () => $$(el, '[data-ann]').forEach((i) => (annis[i.dataset.ann][i.dataset.k] = i.value));
  const bindAnn = () => $$(el, '[data-annx]').forEach((x) => (x.onclick = () => { syncAnn(); annis.splice(+x.dataset.annx, 1); $(el, '#anns').innerHTML = annRows(); bindAnn(); }));
  bindAnn();
  $(el, '[data-act=ann]').onclick = () => { syncAnn(); annis.push({ date: '', label: '' }); $(el, '#anns').innerHTML = annRows(); bindAnn(); };

  $(el, '#pf').onsubmit = async (e) => {
    e.preventDefault();
    syncAnn();
    const f = readForm($(el, '#pf'));
    for (const k of ['a', 'b']) if (!validHex(f['c' + k].color)) f['c' + k].color = k === 'a' ? '#f2c6c2' : '#cfe0ec';
    const btn = $(el, '[type=submit]'); btn.disabled = true;
    const done = await guard(async () => {
      for (const k of ['a', 'b']) if (newImg[k]) { if (img[k]) await removeFile(img[k]); img[k] = await upload(newImg[k]); }
      const charRow = (k, c) => ({ name: f['c' + k].name || k.toUpperCase(), color: f['c' + k].color, image_path: img[k], profile: c.profile || {} });
      const detail = { ...d, a: f.va, b: f.vb, nick: f.nick, keywords: f.keywords, song: f.song, anniversaries: annis.filter((x) => x.date || x.label) };
      const row = { kind, genre: kind === '드림' ? f.genre : '', summary: f.summary, start_date: f.start_date || null, detail };
      if (id) {
        await update('characters', a.id, charRow('a', a));
        await update('characters', b.id, charRow('b', b));
        await update('pairs', id, row);
        return id;
      }
      const ca = await insert('characters', charRow('a', a));
      const cb = await insert('characters', charRow('b', b));
      const p = await insert('pairs', { ...row, char_a: ca.id, char_b: cb.id });
      return p.id;
    }, id ? '저장했어요' : '페어를 만들었어요');
    btn.disabled = false;
    if (done) location.hash = `#/pair/${done}`;
  };
}
