// Debates: invitations arrive in the inbox; each debate is three questions where you
// choose how to answer. Skills, prep and approach decide who wins the night.
var GR = globalThis.GR || (globalThis.GR = {});

GR.debate = (function () {
  const U = GR.util;
  const W = () => GR.world;

  const APPROACHES = [
    { k: 'facts', name: 'Cite facts and policy detail', skill: 'policy', risk: 0.05, g: { I: 1, D: 0.6, R: 0.6 } },
    { k: 'story', name: 'Tell a personal story', skill: 'charisma', risk: 0.06, g: { I: 1.1, D: 0.8, R: 0.8 } },
    { k: 'attack', name: "Go after your opponent's record", skill: 'debate', risk: 0.22, g: { I: 0.6, D: 1.2, R: 1.2 } },
    { k: 'common', name: 'Find common ground', skill: 'charisma', risk: 0.04, g: { I: 1.3, D: 0.5, R: 0.5 } },
  ];

  // Called weekly from the campaign: schedule debates in contested races.
  function schedule(s, r, wl) {
    const lvl = GR.OFFICES[r.off].level;
    const me = s.pols.me;
    const cp = s.campaign;
    cp.debates = cp.debates || {};
    let key = null;
    if (r.off === 'president') {
      if (r.phase === 'primary' && r.prim[me.party].cands.length > 1 && [1, 5, 9].includes(s.week - U.weekOfMD(r.year - 1, 8, 1)) ) key = 'p' + s.week;
      if (r.phase === 'general' && (wl === 6 || wl === 3)) key = 'g' + wl;
    } else if (r.phase === 'primary' || r.phase === 'filing') {
      if (wl === 3 && r.prim[me.party].cands.length > 1 && lvl >= 2) key = 'prim';
    } else if (r.phase === 'general') {
      if (wl === 4 || (wl === 2 && lvl >= 4)) key = 'gen' + wl;
    }
    if (!key || cp.debates[key]) return;
    const opp = r.phase === 'general' ? (r.active || []).filter((id) => id !== 'me') : r.prim[me.party].cands.filter((id) => id !== 'me');
    if (!opp.length) return;
    cp.debates[key] = true;
    const host = U.pick(['the League of Women Voters', 'a local TV station', 'the newspaper', 'a university', 'the Chamber of Commerce']);
    GR.sim.inbox(s, {
      title: 'Debate invitation', kind: 'debate',
      body: `${host[0].toUpperCase() + host.slice(1)} invites you to debate ${opp.map((id) => W().fullName(s.pols[id])).join(', ')} this week. You have done ${cp.prepped} debate prep session${cp.prepped === 1 ? '' : 's'}.`,
      choices: [{ label: 'Accept and debate', act: 'debate:start' }, { label: 'Decline', act: 'debate:decline' }],
      data: { opp, round: 0, log: [], score: 0, topics: pickTopics(s, r) },
    });
  }

  function pickTopics(s, r) {
    const lvl = GR.lvlOf(GR.OFFICES[r.off].jur);
    const pool = GR.POLICIES.filter((p) => p.lv.includes(lvl) && p.ideo > 0);
    return U.shuffle(pool).sort((a, b) => b.sal - a.sal).slice(0, 6).sort(() => U.rand() - 0.5).slice(0, 3).map((p) => p.k);
  }

  function start(s, item) {
    item.data.round = 1;
    item.body = question(s, item);
    item.choices = APPROACHES.map((a) => ({ label: a.name, act: 'debate:' + a.k }));
  }

  function question(s, item) {
    const k = item.data.topics[item.data.round - 1];
    const pol = GR.POLICY[k];
    const lvl = GR.lvlOf(GR.OFFICES[GR.camp.race(s).off].jur);
    const me = s.pols.me;
    const mine = GR.policyOpts(pol, lvl)[GR.scoreToIdx(pol, W().stance(me, k), lvl)];
    const log = item.data.log.map((l) => `• ${l}`).join('\n');
    return `${log ? log + '\n\n' : ''}Question ${item.data.round} of 3, on ${pol.name.toLowerCase()}. Your position: "${mine}". How do you answer?`;
  }

  function answer(s, item, k) {
    const a = APPROACHES.find((x) => x.k === k);
    const r = GR.camp.race(s);
    const me = s.pols.me;
    const c = r.cs.me;
    const d = item.data;
    const opp = s.pols[d.opp[0]];
    const prep = s.campaign.prepped * 4;
    const comp = me.traits.includes('competitive') ? 4 : 0;
    let mine = me.sk[a.skill] * 0.6 + me.sk.debate * 0.4 + prep + comp + U.gauss() * 14;
    const theirs = opp.q + U.gauss() * 14 + (r.inc === opp.id ? 4 : 0);
    let line;
    if (U.chance(a.risk * (1 - me.sk.debate / 150))) {
      mine -= 30;
      line = a.k === 'attack' ? 'Your attack came across as mean-spirited, and the audience groaned.' : 'You fumbled the answer and lost your train of thought.';
    } else {
      const diff = mine - theirs;
      line = diff > 12 ? 'A standout answer. The room applauded.' : diff > 0 ? 'A solid answer that landed well.' : diff > -12 ? 'Your opponent had the better exchange.' : `${opp.fn} ${opp.ln} got the better of you on that one.`;
    }
    const diff = mine - theirs;
    d.score += diff;
    ['D', 'R', 'I'].forEach((g) => { c.enth[g] = U.clamp(c.enth[g] + (diff / 25) * a.g[g] * (g === me.party || g === 'I' ? 1 : 0.4), 1, 99); });
    d.log.push(`Q${d.round} (${GR.POLICY[d.topics[d.round - 1]].name}): ${line}`);
    d.round++;
    if (d.round > 3) {
      const won = d.score > 0;
      c.debate = U.clamp(c.debate + U.clamp(d.score / 35, -2, 2), -3, 3);
      c.rec = U.clamp(c.rec + 3, 0, 100);
      if (won) c.momentum += 0.4;
      me.sk.debate = U.clamp(me.sk.debate + 1, 0, 99);
      s.campaign.prepped = Math.max(0, s.campaign.prepped - 2);
      item.body = `${d.log.map((l) => '• ' + l).join('\n')}\n\n${won ? 'Post-debate polls say you won the debate.' : 'Pundits score the debate for your opponent.'}`;
      item.choices = [{ label: 'Done', act: 'close' }];
      GR.sim.news(s, `Debate: ${won ? me.fn + ' ' + me.ln : W().fullName(opp)} wins the night in the ${W().seatTitle(s, s.seats[r.seat])} race.`, 'campaign');
      return;
    }
    item.body = question(s, item);
  }

  function decline(s, item) {
    const r = GR.camp.race(s);
    if (r && r.cs.me) { r.cs.me.debate -= 0.6; r.cs.me.enth.I -= 1.5; }
    item.body = 'You skipped the debate. Your opponents used the empty podium against you.';
    item.choices = [{ label: 'OK', act: 'close' }];
  }

  return { APPROACHES, schedule, start, answer, decline };
})();
