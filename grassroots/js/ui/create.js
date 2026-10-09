// Title screen and character creation.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiCreate = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const STEPS = [['state', 'Starting Location'], ['home', 'Hometown'], ['char', 'Character'], ['bg', 'Background'], ['skills', 'Skills'], ['policy', 'Policy Positions'], ['review', 'Review']];
  const POOL = 30;

  function platform(party, spread = 0.35) {
    const pos = {};
    const base = GR.PARTIES[party].base;
    GR.POLICIES.forEach((p) => {
      const r = U.gauss() * spread;
      const v = p.ideo === 0 ? r * 2 : base * p.ideo + r;
      pos[p.k] = GR.scoreToIdx(p, U.clamp(v, -2, 2), 'n');
    });
    return pos;
  }

  function fresh() {
    const g = U.chance(0.5) ? 'm' : 'f';
    const party = U.chance(0.5) ? 'D' : 'R';
    const st = U.pick(GR.STATES.filter((x) => x.ab !== 'DC'));
    return {
      step: 'state', fn: U.pick(GR.NAMES[g]), ln: U.pick(GR.NAMES.l), g, age: 25, party, state: st.ab, zip: '', city: null, cityName: '',
      upbringing: 'middle', edu: 'ba', job: 'teacher', traits: [], skills: { charisma: 6, debate: 6, policy: 6, fund: 6, grass: 6 },
      pos: platform(party), prefers: g === 'm' ? 'f' : 'm', married: false,
      look: { seed: U.uid('lk'), skin: U.randInt(0, 5), hair: U.randInt(0, 5), style: U.randInt(0, 3), glasses: false },
      cat: GR.POLICY_CATS[0],
    };
  }

  // ---------- Title ----------
  function title() {
    const has = GR.state.hasSave();
    return `<div class="app"><div class="title-wrap"><div class="title-card stack">
      <div class="panel"><div class="sheet stack" style="min-height:0;align-items:center;padding:28px 18px">
        <div class="logo">Grassroots<small>From school board to the White House</small></div>
        <div style="width:150px">${ui.face('title', { g: 'f', party: 'D', age: 44, style: 1 })}</div>
        <p class="muted" style="max-width:52ch;text-align:center">Pick any state, city and ZIP code. Build a candidate, run real primaries and general elections against hundreds of AI politicians, pass laws, balance budgets, climb to Speaker, and raise a political dynasty.</p>
        <div class="row" style="justify-content:center">
          ${ui.btn('New Career', 'newgame', '', 'bb pill')}
          ${has ? ui.btn('Continue', 'continue', '', 'bo') : ''}
          ${ui.btn('Import Save', 'importOpen', '', 'bgr')}
        </div>
        ${ui.form.importing ? `<div class="stack" style="width:100%"><textarea id="imp" class="input" rows="4" placeholder="Paste a save code"></textarea>${ui.btn('Load save code', 'importDo', '', 'bb')}</div>` : ''}
        <p class="tiny muted" style="text-align:center">ZIP, city and county data from SimpleMaps (CC BY 4.0) and the U.S. Census Bureau.</p>
      </div></div></div></div></div>`;
  }

  // ---------- Steps ----------
  function render() {
    const f = ui.form;
    const idx = STEPS.findIndex((x) => x[0] === f.step);
    let body = '';
    if (f.step === 'state') body = stepState(f);
    else if (f.step === 'home') body = stepHome(f);
    else if (f.step === 'char') body = stepChar(f);
    else if (f.step === 'bg') body = stepBg(f);
    else if (f.step === 'skills') body = stepSkills(f);
    else if (f.step === 'policy') body = stepPolicy(f);
    else body = stepReview(f);
    return `<div class="app"><div class="create">
      <div class="redbar">${STEPS[idx][1]}</div>
      <div class="steps">${STEPS.map(([k, l], i) => `<span class="${i === idx ? 'on' : ''}">${i + 1}. ${l}</span>`).join('')}</div>
      ${body}
      <div class="row between" style="margin-top:10px">
        ${idx > 0 ? ui.btn('Back', 'cstep', STEPS[idx - 1][0], 'bgr') : ui.btn('Cancel', 'ctitle', '', 'bgr')}
        ${idx < STEPS.length - 1 ? ui.btn('Continue', 'cstep', STEPS[idx + 1][0], 'bb pill', !canGo(f, STEPS[idx + 1][0]), stopReason(f)) : ui.btn('Begin your career', 'cbegin', '', 'bb pill')}
      </div>
    </div></div>`;
  }

  function stopReason(f) {
    if (f.step === 'home' && f.city == null) return 'Enter a ZIP code or choose a city.';
    if (f.step === 'char' && (!f.fn.trim() || !f.ln.trim())) return 'Enter a name.';
    if (f.step === 'bg' && f.traits.length !== 2) return 'Choose two traits.';
    if (f.step === 'skills' && spent(f) > POOL) return 'Too many skill points.';
    return '';
  }
  const canGo = (f) => !stopReason(f);
  const spent = (f) => U.sum(Object.values(f.skills));
  const leanLabel = (l) => (Math.abs(l) < 1 ? 'Even' : l > 0 ? 'R+' + Math.round(l) : 'D+' + Math.round(-l));

  function stepState(f) {
    const st = GR.STATE[f.state];
    const pr = GR.geo.mkProfile({ ab: st.ab }, st.pop * 1e6, st.lean, 2.3, 0, 0, 'st' + st.ab);
    const fill = (ab) => (ab === f.state ? '#0a10d8' : 'var(--paper)');
    return `<div class="cols" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))">
      <div class="mapbox" style="background:linear-gradient(#2f6fd6,#7fb3f0)">${ui.usMap(fill, { act: 'cstate', sel: f.state })}</div>
      <div class="stepbox stack" style="background:var(--panel)">
        <div class="box boxpad stack" style="align-items:center">
          <h2>${esc(st.name)}</h2>
          ${ui.pie([{ v: pr.D, c: 'var(--dem)' }, { v: pr.R, c: 'var(--rep)' }, { v: pr.I, c: 'var(--ind)' }])}
          <div style="text-align:center">Population: ${U.num(st.pop * 1e6)}<br>Poverty: ${pr.poverty}%<br>Democrats: ${Math.round(pr.D * 100)}%<br>Republicans: ${Math.round(pr.R * 100)}%<br>Independents: ${Math.round(pr.I * 100)}%</div>
          <div class="small muted" style="text-align:center">Partisan lean ${leanLabel(st.lean)} · ${st.cd ? st.cd + ' congressional district' + (st.cd > 1 ? 's' : '') : 'non-voting delegate'} · ${st.lo ? st.lo + '-seat House, ' : 'unicameral, '}${st.up}-seat Senate · Capital: ${esc(st.cap)}</div>
        </div>
        <label class="f"><span>Or choose from the list</span><select class="input" id="cst" data-ch="cstateSel">${GR.STATES.map((x) => `<option value="${x.ab}" ${x.ab === f.state ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
        <div class="row" style="justify-content:center">${ui.btn('Random State', 'crandstate', '', 'bgr')}</div>
      </div></div>`;
  }

  function stepHome(f) {
    const g = GR.GEO[f.state];
    if (!g) { GR.geo.load(f.state, () => ui.render()); return `<div class="stepbox">Loading ${esc(GR.STATE[f.state].name)} ZIP codes and counties…</div>`; }
    const S = GR.geo.state(f.state);
    const cities = GR.geo.cityList(S, 2500).slice(0, 400);
    let info = '<p class="muted">Enter a ZIP code or pick a city to see your districts.</p>';
    let dots = null, hiCounty = null;
    if (f.city != null && f.zip && S.zipIdx[f.zip] != null) {
      const zi = S.zipIdx[f.zip];
      const z = S.Z[zi];
      const co = GR.geo.countyOfCity(S, f.city);
      hiCounty = co ? S.g.counties.indexOf(co) : null;
      dots = [{ x: z.x, y: z.y, r: 5, fill: '#ffd400', tip: f.zip }];
      const st = GR.STATE[f.state];
      const prof = (kind, n) => { const ds = GR.geo.districts(S, kind, n, kind === 'ward' || kind === 'school' ? f.city : null); const k = GR.geo.districtOf(ds, zi); return { n: k + 1, pr: GR.geo.profile(S, ds[k], kind + k) }; };
      const cp = GR.geo.cityPop(S, f.city);
      const nC = cp >= 1e6 ? 15 : cp >= 3e5 ? 11 : cp >= 1e5 ? 9 : cp >= 25e3 ? 7 : 5;
      const ward = prof('ward', nC);
      const rows = [
        ['City', `${esc(f.cityName)} (pop. ${U.num(cp)})`],
        ['County', co ? esc(co[1]) : '—'],
        ['ZIP code', `${f.zip} (pop. ${U.num(z.pop)})`],
        ['City council', `Ward ${ward.n} of ${nC} · ${leanLabel(ward.pr.lean)}`],
        st.lo ? ['State House', `District ${prof('house', st.lo).n} · ${leanLabel(prof('house', st.lo).pr.lean)}`] : null,
        st.up ? ['State Senate', `District ${prof('senate', st.up).n} · ${leanLabel(prof('senate', st.up).pr.lean)}`] : null,
        ['U.S. House', `${f.state}-${String(prof('cd', Math.max(1, st.cd)).n).padStart(2, '0')} · ${leanLabel(prof('cd', Math.max(1, st.cd)).pr.lean)}`],
        ['Statewide', leanLabel(st.lean)],
      ];
      info = ui.kv(rows);
    }
    return `<div class="cols">
      <div class="stepbox stack">
        <label class="f"><span>ZIP code</span><input class="input" id="czip" inputmode="numeric" maxlength="5" value="${esc(f.zip)}" data-in="czip" placeholder="e.g. ${esc(S.Z[S.order[Math.floor(S.order.length / 3)].i].zip)}"></label>
        ${f.zipErr ? `<p class="bad small">${esc(f.zipErr)}</p>` : ''}
        <label class="f"><span>Or choose a city</span><select class="input" id="ccity" data-ch="ccity"><option value="">Select…</option>${cities.map((c) => `<option value="${c.i}" ${c.i === f.city ? 'selected' : ''}>${esc(c.name)} (${esc(c.county)} County) · ${U.num(c.pop)}</option>`).join('')}</select></label>
        ${ui.btn('Random hometown', 'crandhome', '', 'bgr')}
        ${info}
      </div>
      <div class="mapbox">${ui.stateMap(null, f.state, (k) => (k === hiCounty ? '#9fc4f2' : 'var(--paper)'), { dots, act: 'noop' })}</div>
    </div>`;
  }

  function stepChar(f) {
    const sw = (key, list, cur) => `<div class="row">${list.map((c, i) => `<button class="bw sm" style="background:${c};width:30px;height:24px;${i === cur ? 'outline:3px solid var(--blue)' : ''}" data-act="clook" data-a="${key}|${i}" aria-label="${key} ${i + 1}"></button>`).join('')}</div>`;
    return `<div class="cols">
      <div class="stepbox stack">
        <div class="row"><label class="f grow"><span>First name</span><input class="input" id="cfn" value="${esc(f.fn)}" data-in="cfield" data-a="fn"></label><label class="f grow"><span>Last name</span><input class="input" id="cln" value="${esc(f.ln)}" data-in="cfield" data-a="ln"></label></div>
        <div class="row"><b>Gender</b><div class="seg">${[['m', 'Male'], ['f', 'Female']].map(([k, l]) => `<button aria-pressed="${f.g === k}" data-act="cset" data-a="g|${k}">${l}</button>`).join('')}</div></div>
        <label class="f"><span>Age: ${f.age}</span><input type="range" id="cage" min="18" max="70" value="${f.age}" data-in="cage"></label>
        <div class="row"><b>Party</b><div class="seg">${[['D', 'Democrat'], ['R', 'Republican']].map(([k, l]) => `<button aria-pressed="${f.party === k}" data-act="cparty" data-a="${k}">${l}</button>`).join('')}</div></div>
        <div class="row"><b>Interested in</b><div class="seg">${[['f', 'Women'], ['m', 'Men'], ['any', 'Anyone']].map(([k, l]) => `<button aria-pressed="${f.prefers === k}" data-act="cset" data-a="prefers|${k}">${l}</button>`).join('')}</div></div>
        <div class="row"><b>Start</b><div class="seg">${[[false, 'Single'], [true, 'Married']].map(([k, l]) => `<button aria-pressed="${f.married === k}" data-act="cset" data-a="married|${k}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="stepbox stack">
        <div style="max-width:220px;margin:0 auto;width:100%">${ui.face(f.look.seed, { g: f.g, party: f.party, age: f.age, skin: f.look.skin, hair: f.look.hair, style: f.look.style, glasses: f.look.glasses })}</div>
        <b>Skin</b>${sw('skin', ['#fadcc6', '#f1c3a0', '#dca277', '#bd7f52', '#8f5634', '#5f3822'], f.look.skin)}
        <b>Hair</b>${sw('hair', ['#1f1b19', '#3d2718', '#6a4224', '#a77339', '#dbb763', '#a8492a'], f.look.hair)}
        <div class="row"><b>Hairstyle</b><div class="seg">${[0, 1, 2, 3].map((i) => `<button aria-pressed="${f.look.style === i}" data-act="clook" data-a="style|${i}">${i + 1}</button>`).join('')}</div>
        <div class="seg"><button aria-pressed="${f.look.glasses}" data-act="clook" data-a="glasses|1">Glasses</button></div>${ui.btn('Randomize', 'clookrand', '', 'bgr sm')}</div>
      </div></div>`;
  }

  function stepBg(f) {
    const jobs = GR.JOBS.filter((j) => !j.edu.length || j.edu.includes(f.edu));
    return `<div class="cols">
      <div class="stepbox stack">
        <div class="subhead">Upbringing</div>
        ${GR.UPBRINGING.map((u) => `<label class="row" style="align-items:flex-start;gap:6px"><input type="radio" name="up" ${f.upbringing === u.k ? 'checked' : ''} data-ch="cset2" data-a="upbringing|${u.k}"><span><b>${esc(u.name)}</b> <span class="small muted">· starts with ${U.money(u.money)}</span><br><span class="small">${esc(u.desc)}</span></span></label>`).join('')}
      </div>
      <div class="stepbox stack">
        <label class="f"><span>Education</span><select class="input" id="cedu" data-ch="cedu">${GR.EDUCATION.map((e) => `<option value="${e.k}" ${e.k === f.edu ? 'selected' : ''}>${esc(e.name)}${e.debt ? ' · ' + U.money(e.debt) + ' student debt' : ''}</option>`).join('')}</select></label>
        <label class="f"><span>Occupation</span><select class="input" id="cjob" data-ch="cset2" data-a="job">${jobs.map((j) => `<option value="${j.k}" ${j.k === f.job ? 'selected' : ''}>${esc(j.name)}${j.salary ? ' · ' + U.money(j.salary * 1000) + '/yr' : ''}</option>`).join('')}</select></label>
        <p class="small muted">Your job pays the bills and costs you about 18 hours of campaign time a week. Some jobs boost skills, name recognition or party connections.</p>
        <div class="subhead">Traits (choose 2) · ${f.traits.length}/2</div>
        ${GR.world.TRAITS.map((t) => `<label class="row" style="gap:6px"><input type="checkbox" ${f.traits.includes(t.k) ? 'checked' : ''} ${!f.traits.includes(t.k) && f.traits.length >= 2 ? 'disabled' : ''} data-ch="ctrait" data-a="${t.k}"><span><b>${t.name}</b> <span class="small">${esc(t.desc)}</span></span></label>`).join('')}
      </div></div>`;
  }

  function stepSkills(f) {
    const up = GR.UPBRINGING.find((u) => u.k === f.upbringing);
    const edu = GR.EDU[f.edu], job = GR.JOB[f.job];
    const left = POOL - spent(f);
    return `<div class="stepbox stack" style="max-width:720px;margin:0 auto">
      <p>Spend ${POOL} points. Points left: <b class="${left < 0 ? 'bad' : ''}">${left}</b></p>
      ${GR.SKILLS.map((x) => {
        const total = U.clamp(22 + f.skills[x.k] + (up.skill[x.k] || 0) + (edu.skill[x.k] || 0) + (job.skill[x.k] || 0), 5, 90);
        return `<div class="stack-s"><div class="row between"><b>${x.name}</b><span class="small muted">${esc(x.desc)}</span></div>
          <div class="row"><input type="range" class="grow" id="csk${x.k}" min="0" max="20" value="${f.skills[x.k]}" data-in="cskill" data-a="${x.k}"><span class="num" style="width:90px">+${f.skills[x.k]} → <b>${total}</b></span></div></div>`;
      }).join('')}
    </div>`;
  }

  function stepPolicy(f) {
    const tmp = { pos: f.pos, party: f.party };
    const ax = GR.world.axes(tmp);
    const cau = GR.world.caucusOf(tmp);
    const pols = GR.POLICIES.filter((p) => p.cat === f.cat);
    return `<div class="stack">
      <div class="row between"><div class="row">${ui.btn('Load party platform', 'cplatform', 'party', 'bb sm')}${ui.btn('Moderate', 'cplatform', 'mod', 'bgr sm')}${ui.btn('Hard-line', 'cplatform', 'hard', 'bgr sm')}</div>
      <div class="small">Fiscal: <b>${GR.world.ideoLabel(ax.fis)}</b> · Social: <b>${GR.world.ideoLabel(ax.soc)}</b> · Caucus: <b>${esc(cau.name)}</b></div></div>
      <div class="tabs-s" style="display:flex;flex-wrap:wrap;gap:2px">${GR.POLICY_CATS.map((c) => `<button class="tab ${c === f.cat ? 'on' : ''}" data-act="ccat" data-a="${c}">${c}</button>`).join('')}</div>
      <div class="panel"><div class="sheet" style="min-height:0"><div class="polgrid">${pols.map((p) => `<div class="pol"><b>${esc(p.name)}</b><select id="cp${p.k}" data-ch="cpos" data-a="${p.k}">${GR.policyOpts(p, 'n').map((o, i) => `<option value="${i}" ${f.pos[p.k] === i ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`).join('')}</div>
      <p class="small muted" style="margin-top:6px">${GR.POLICIES.length} positions across ${GR.POLICY_CATS.length} categories. Voters, primary electorates, interest groups and colleagues all react to them. Changing positions later costs credibility.</p></div></div>
    </div>`;
  }

  function stepReview(f) {
    const tmp = { pos: f.pos, party: f.party };
    const ax = GR.world.axes(tmp);
    return `<div class="cols">
      <div class="stepbox" style="max-width:240px;justify-self:center;width:100%">${ui.face(f.look.seed, { g: f.g, party: f.party, age: f.age, skin: f.look.skin, hair: f.look.hair, style: f.look.style, glasses: f.look.glasses })}</div>
      <div class="stack">${ui.kv([
        ['Name', esc(f.fn + ' ' + f.ln)], ['Age', f.age], ['Party', GR.PARTIES[f.party].name], ['Hometown', `${esc(f.cityName)}, ${f.state} ${f.zip}`],
        ['Upbringing', GR.UPBRINGING.find((u) => u.k === f.upbringing).name], ['Education', GR.EDU[f.edu].name], ['Occupation', GR.JOB[f.job].name],
        ['Traits', f.traits.map((t) => GR.world.TRAITS.find((x) => x.k === t).name).join(', ')], ['Fiscal ideology', GR.world.ideoLabel(ax.fis)], ['Social ideology', GR.world.ideoLabel(ax.soc)],
        ['Family', f.married ? 'Married' : 'Single'],
      ])}<p class="small muted">The game begins the first week of January 2027.</p></div></div>`;
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  A('newgame', () => { ui.form = fresh(); ui.screen = 'create'; });
  A('ctitle', () => { ui.screen = 'title'; });
  A('continue', () => {
    const s = GR.state.load();
    if (!s) { ui.toast('No saved game found.'); return; }
    GR.geo.load(s.home.state, () => { ui.s = s; ui.screen = 'game'; ui.render(); });
    return false;
  });
  A('importOpen', () => { ui.form.importing = true; });
  A('importDo', () => {
    try {
      const s = GR.state.importText(document.getElementById('imp').value);
      GR.geo.load(s.home.state, () => { ui.s = s; ui.screen = 'game'; ui.form = {}; ui.save(); ui.render(); });
      return false;
    } catch (e) { ui.toast('That save code could not be read. Copy the whole code and try again.'); }
  });
  A('cstep', (el, a) => {
    const f = ui.form;
    const order = STEPS.map((x) => x[0]);
    if (order.indexOf(a) > order.indexOf(f.step) && !canGo(f)) { ui.toast(stopReason(f)); return; }
    if (a === 'home') GR.geo.load(f.state, () => ui.render());
    f.step = a;
    window.scrollTo(0, 0);
  });
  A('cstate', (el, a) => { if (ui.form.state !== a) { ui.form.state = a; ui.form.zip = ''; ui.form.city = null; } });
  A('cstateSel', (el) => { ui.form.state = el.value; ui.form.zip = ''; ui.form.city = null; });
  A('crandstate', () => { ui.form.state = U.pick(GR.STATES.filter((x) => x.ab !== 'DC')).ab; ui.form.zip = ''; ui.form.city = null; });
  A('czip', (el) => {
    const f = ui.form;
    const v = el.value.replace(/\D/g, '').slice(0, 5);
    f.zip = v;
    f.zipErr = '';
    if (v.length === 5) {
      const ab = GR.stateForZip(v);
      if (ab && ab !== f.state) { f.zipErr = `${v} is in ${GR.STATE[ab].name}. Switching states.`; f.state = ab; GR.geo.load(ab, () => { setZip(f, v); ui.render(); }); return; }
      setZip(f, v);
      ui.render();
    }
  });
  function setZip(f, v) {
    const S = GR.geo.state(f.state);
    const zi = S && S.zipIdx[v];
    if (zi == null) { f.zipErr = 'That ZIP code is not a residential ZIP in this state.'; f.city = null; return; }
    f.city = S.Z[zi].city;
    f.cityName = GR.geo.cityName(S, f.city);
  }
  A('ccity', (el) => {
    const f = ui.form;
    if (el.value === '') return;
    const S = GR.geo.state(f.state);
    f.city = +el.value;
    f.cityName = GR.geo.cityName(S, f.city);
    const zs = (S.cityZips[f.city] || []).map((i) => S.Z[i]).sort((a, b) => b.pop - a.pop);
    f.zip = zs[0] ? zs[0].zip : '';
    f.zipErr = '';
  });
  A('crandhome', () => {
    const f = ui.form;
    const S = GR.geo.state(f.state);
    const z = U.weighted(S.Z, (x) => x.pop);
    f.zip = z.zip; f.city = z.city; f.cityName = GR.geo.cityName(S, z.city); f.zipErr = '';
  });
  A('cfield', (el, a) => { ui.form[a] = el.value; return false; });
  A('cage', (el) => { ui.form.age = +el.value; ui.render(); });
  A('cset', (el, a) => { const [k, v] = a.split('|'); ui.form[k] = v === 'true' ? true : v === 'false' ? false : v; });
  A('cset2', (el, a) => { const [k, v] = a.split('|'); ui.form[k] = v != null ? v : el.value; });
  A('cparty', (el, a) => { if (ui.form.party !== a) { ui.form.party = a; ui.form.pos = platform(a); } });
  A('clook', (el, a) => { const [k, v] = a.split('|'); if (k === 'glasses') ui.form.look.glasses = !ui.form.look.glasses; else ui.form.look[k] = +v; });
  A('clookrand', () => { const L = ui.form.look; L.skin = U.randInt(0, 5); L.hair = U.randInt(0, 5); L.style = U.randInt(0, 3); L.glasses = U.chance(0.2); L.seed = U.uid('lk'); });
  A('cedu', (el) => { const f = ui.form; f.edu = el.value; const j = GR.JOB[f.job]; if (j.edu.length && !j.edu.includes(f.edu)) f.job = 'teacher'; if (GR.JOB.teacher.edu.length && !GR.JOB.teacher.edu.includes(f.edu) && f.job === 'teacher') f.job = 'retail'; });
  A('ctrait', (el, a) => { const t = ui.form.traits; const i = t.indexOf(a); if (i >= 0) t.splice(i, 1); else if (t.length < 2) t.push(a); });
  A('cskill', (el, a) => { ui.form.skills[a] = +el.value; ui.render(); });
  A('ccat', (el, a) => { ui.form.cat = a; });
  A('cpos', (el, a) => { ui.form.pos[a] = +el.value; });
  A('cplatform', (el, a) => { const f = ui.form; f.pos = a === 'mod' ? platform(f.party, 0.25) : platform(f.party, 0.3); if (a === 'mod') GR.POLICIES.forEach((p) => { f.pos[p.k] = GR.scoreToIdx(p, GR.optScore(p, f.pos[p.k], 'n') * 0.45, 'n'); }); if (a === 'hard') GR.POLICIES.forEach((p) => { f.pos[p.k] = GR.scoreToIdx(p, U.clamp(GR.optScore(p, f.pos[p.k], 'n') * 1.6, -2, 2), 'n'); }); });
  A('noop', () => false);
  A('cbegin', () => {
    const f = ui.form;
    GR.geo.load(f.state, () => {
      const s = GR.state.newGame({ fn: f.fn.trim(), ln: f.ln.trim(), g: f.g, age: f.age, party: f.party, state: f.state, zip: f.zip, city: f.city, cityName: f.cityName, upbringing: f.upbringing, edu: f.edu, job: f.job, traits: f.traits, skills: f.skills, pos: f.pos, prefers: f.prefers, married: f.married, look: f.look });
      ui.s = s;
      ui.screen = 'game';
      ui.tab = 'news';
      ui.sub = {};
      ui.form = {};
      ui.save();
      ui.render();
      window.scrollTo(0, 0);
    });
    return false;
  });

  return { title, render, platform };
})();
