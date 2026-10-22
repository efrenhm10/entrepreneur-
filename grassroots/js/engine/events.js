// Random events that land in the inbox and ask for a decision.
var GR = globalThis.GR || (globalThis.GR = {});

GR.events = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const me = (s) => s.pols.me;
  const race = (s) => GR.camp.race(s);
  const office = (s) => me(s).seat && s.seats[me(s).seat];

  const EV = {
    pacOffer: {
      p: 0.025, when: (s) => race(s),
      make: (s) => { const amt = Math.round(race(s).scale * (0.08 + U.rand() * 0.1)); const g = U.pick(GR.GROUPS.filter((x) => x.money > 0.8)); return { title: 'A PAC comes calling', body: `A super PAC tied to the ${g.name} offers to put ${U.money(amt)} behind your campaign. In return they expect "a seat at the table".`, choices: ['Accept the money', 'Politely decline'], data: { amt, g: g.k } }; },
      res: (s, i, d) => {
        if (i === 0) { race(s).cs.me.funds += d.amt; race(s).cs.me.raised += d.amt; me(s).integrity -= 6; if (U.chance(0.15)) me(s).scandal = (me(s).scandal || 0) + 6; return `${U.money(d.amt)} added to your campaign.`; }
        me(s).integrity += 3; return 'Good-government groups praise your independence.';
      },
    },
    oldPosts: {
      p: 0.012, when: (s) => race(s),
      make: () => ({ title: 'Old posts resurface', body: 'A blogger dug up social media posts you wrote in your twenties. They are embarrassing, and the story is spreading.', choices: ['Apologize sincerely', 'Double down', 'Ignore it'] }),
      res: (s, i) => {
        const c = race(s).cs.me;
        if (i === 0) { c.enth.I -= 0.5; me(s).fav -= 1; return 'The story fades after your apology.'; }
        if (i === 1) { c.enth[me(s).party] += 2; c.enth.I -= 3; c.rec += 2; return 'Your base rallies, but moderates wince.'; }
        c.enth.I -= 1.5; c.momentum -= 0.3; return 'The story lingers for a week.';
      },
    },
    celeb: {
      p: 0.012, when: (s) => race(s),
      make: () => ({ title: 'A celebrity endorsement', body: `${U.pick(['A retired NFL star', 'A popular country singer', 'A beloved local news anchor', 'A famous chef', 'A viral TikTok creator'])} from your area wants to endorse you and appear at a rally.`, choices: ['Welcome them aboard', 'Keep it about the issues'] }),
      res: (s, i) => { if (i === 0) { const c = race(s).cs.me; c.rec += 4; c.enth.I += 1; c.endorse.push({ k: 'celeb' + s.week, name: 'Celebrity supporter', w: 0.3 }); return 'The rally drew a huge crowd and cameras.'; } return 'You stay focused on policy.'; },
    },
    reporter: {
      p: 0.02, when: (s) => race(s) || office(s),
      make: (s) => { const pol = U.pick(GR.POLICIES.filter((p) => p.ideo > 0 && p.sal >= 0.9)); return { title: 'Tough question from a reporter', body: `A reporter asks you point blank about ${pol.name.toLowerCase()}. Your answer will be clipped and shared.`, choices: ['Answer honestly with your position', 'Dodge the question', 'Give a moderate answer'], data: { k: pol.k } }; },
      res: (s, i, d) => {
        const r = race(s);
        if (i === 1) { me(s).fav -= 0.5; if (r) r.cs.me.enth.I -= 0.5; return 'Commentators called your answer evasive.'; }
        if (i === 2) { if (r) { r.cs.me.enth.I += 1; r.cs.me.enth[me(s).party] -= 1; } return 'Independents liked it; your base grumbled.'; }
        if (r) { const pr = r.pr; const sc = W().stance(me(s), d.k); ['D', 'R', 'I'].forEach((g) => { r.cs.me.enth[g] += (GR.elect.groupAgree(pr, g, GR.POLICY[d.k], sc) - 50) / 30; }); }
        me(s).integrity += 1;
        return 'You said exactly what you believe.';
      },
    },
    ethics: {
      p: 0, when: () => false,
      make: () => ({ title: 'Ethics complaint filed', body: 'A watchdog group filed an ethics complaint about your meetings with lobbyists. Reporters want comment.', choices: ['Apologize and return donations', 'Deny everything', 'Hire a lawyer and fight'] }),
      res: (s, i) => {
        const m = me(s);
        const thick = m.traits.includes('thickskin') ? 0.6 : 1;
        if (i === 0) { m.warChest = Math.round(m.warChest * 0.85); m.app -= 2 * thick; m.integrity += 4; return 'The complaint was dismissed after you returned the money.'; }
        if (i === 1) { if (U.chance(0.45)) { m.scandal = (m.scandal || 0) + 10 * thick; m.app -= 6 * thick; return 'Documents contradicted your denial. The scandal grows.'; } return 'The story died down.'; }
        m.money -= 25000; m.app -= 1 * thick; return 'Your lawyers got the complaint dismissed. It cost you $25,000.';
      },
    },
    disaster: {
      p: 0.01, when: (s) => office(s) && GR.OFFICES[office(s).off].exec,
      make: (s) => ({ title: 'Disaster strikes', body: `${U.pick(['Severe flooding', 'A tornado outbreak', 'A major wildfire', 'A destructive storm', 'A chemical spill'])} has hit ${office(s).off === 'mayor' ? s.home.cityName : GR.STATE[s.home.state].name}. People are looking to you.`, choices: ['Go to the scene and lead the response', 'Hold a press briefing from the office', 'Let emergency managers handle it'] }),
      res: (s, i) => {
        const m = me(s);
        if (i === 0) { s.hoursLeft = Math.max(0, s.hoursLeft - 10); m.app += 5; GR.gov.bumpRec(s, office(s), 3); return 'Your leadership on the ground earned wide praise.'; }
        if (i === 1) { m.app += 1; return 'A steady, competent response.'; }
        m.app -= 5; return 'Critics say you were missing in action.';
      },
    },
    recession: {
      p: 0.002, when: (s) => office(s) && ['governor', 'president', 'mayor'].includes(office(s).off),
      make: () => ({ title: 'The economy is sliding', body: 'Economists warn of a downturn. Your advisers propose two paths.', choices: ['Push a stimulus package', 'Cut spending and hold the line'] }),
      res: (s, i) => {
        const J = s.jur[GR.OFFICES[office(s).off].jur];
        J.F.mac.gap -= 1.2;
        if (i === 0) { J.F.ag.forEach((a) => { a.capex *= 1.06; a.opex *= 1.02; }); me(s).app += 1; return 'Stimulus softens the blow, but adds to the deficit.'; }
        J.F.ag.forEach((a) => { a.opex *= 0.97; }); me(s).app -= 1; return 'Fiscal hawks applaud; others warn of pain ahead.';
      },
    },
    court: {
      p: 0.006, when: (s) => office(s) && office(s).off === 'president',
      make: () => ({ title: 'Supreme Court vacancy', body: 'A justice has announced retirement. Who will you nominate?', choices: ['A consensus moderate', 'A committed member of your judicial philosophy'] }),
      res: (s, i) => {
        const m = me(s);
        if (i === 0) { m.app += 2; m.standing -= 6; return 'Your nominee is confirmed with bipartisan support.'; }
        m.standing += 10; m.app -= 1; const c = GR.world.composition(s, 'ussenate'); return c[m.party] >= 50 ? 'After a bruising fight, your nominee is confirmed.' : 'The Senate rejected your nominee.';
      },
    },
    protest: {
      p: 0.012, when: (s) => office(s),
      make: () => { const pol = U.pick(GR.POLICIES.filter((p) => p.ideo > 0)); return { title: 'Protesters outside your office', body: `A crowd is demanding action on ${pol.name.toLowerCase()}.`, choices: ['Meet with them', 'Issue a statement', 'Ignore them'], data: { k: pol.k } }; },
      res: (s, i) => { const m = me(s); if (i === 0) { s.hoursLeft = Math.max(0, s.hoursLeft - 2); m.app += 1; return 'They left feeling heard.'; } if (i === 1) return 'Your statement was noted.'; m.app -= 1; return 'The protest made the evening news.'; },
    },
    cosponsor: {
      p: 0.03, when: (s) => GR.gov.myBody(s),
      make: (s) => {
        const b = GR.gov.allBills(s).find((x) => x.body === GR.gov.myBody(s) && x.spon !== 'me' && x.stage === 'committee' && !x.cos.includes('me') && s.pols[x.spon]);
        if (!b) return null;
        const p = s.pols[b.spon];
        return { title: `${p.fn} ${p.ln} asks for your help`, body: `${W().fullName(p)} (${p.party}) asks you to co-sponsor the ${b.title} (${b.sub}).`, choices: ['Co-sponsor it', 'Decline'], data: { b: b.id, p: p.id } };
      },
      res: (s, i, d) => { if (i === 0) { GR.gov.cosponsor(s, d.b); return 'They are grateful.'; } GR.gov.addRel(s, d.p, -3); return 'They are disappointed.'; },
    },
    endorseMe: {
      p: 0.02, when: (s) => office(s) && U.yearOf(s.week) % 2 === 0 && U.monthOf(s.week) >= 2 && U.monthOf(s.week) <= 9,
      make: (s) => {
        const y = U.yearOf(s.week);
        const r = (s.races[y] || []).find((x) => x.phase !== 'done' && !x.cands.includes('me') && x.cands.some((id) => s.pols[id].party === me(s).party));
        if (!r) return null;
        const id = r.cands.find((x) => s.pols[x].party === me(s).party);
        const p = s.pols[id];
        return { title: 'Endorsement request', body: `${W().fullName(p)}, running for ${W().seatTitle(s, s.seats[r.seat])}, asks for your endorsement.`, choices: ['Endorse them', 'Stay neutral'], data: { p: id, r: r.id } };
      },
      res: (s, i, d) => {
        if (i === 0) { GR.gov.addRel(s, d.p, 12); me(s).standing += 1; const r = (s.races[U.yearOf(s.week)] || []).find((x) => x.id === d.r); if (r && r.cs[d.p]) r.cs[d.p].endorse.push({ k: 'p:me', name: me(s).fn + ' ' + me(s).ln, w: 0.5 }); return 'They thank you publicly.'; }
        GR.gov.addRel(s, d.p, -4); return 'They will remember.';
      },
    },
    kidSick: {
      p: 0.008, when: (s) => me(s).family.kids.some((k) => U.yearOf(s.week) - k.by < 14),
      make: (s) => { const k = U.pick(me(s).family.kids.filter((x) => U.yearOf(s.week) - x.by < 14)); return { title: `${k.fn} is sick`, body: `${k.fn} came down with a bad flu and wants you home.`, choices: ['Clear your schedule', 'Keep your commitments'], data: { fn: k.fn } }; },
      res: (s, i, d) => { const k = me(s).family.kids.find((x) => x.fn === d.fn); if (i === 0) { s.hoursLeft = Math.max(0, s.hoursLeft - 8); if (k) k.close += 10; return 'You spent the week at home. It meant a lot.'; } if (k) k.close -= 8; return 'Your spouse handled it, but noticed.'; },
    },
    spouseHelp: {
      p: 0.015, when: (s) => race(s) && me(s).family.spouse && me(s).family.spouse.close > 55,
      make: (s) => ({ title: 'Your spouse wants to help', body: `${me(s).family.spouse.fn} offers to campaign for you this month.`, choices: ['Welcome the help', 'Keep family out of politics'] }),
      res: (s, i) => { if (i === 0) { const c = race(s).cs.me; c.ground += race(s).scale * 0.02; c.enth.I += 1; c.rec += 1; return 'Voters love your spouse.'; } me(s).family.spouse.close += 3; return 'Family stays private.'; },
    },
    health: {
      p: 0.004, when: (s) => GR.life.age(s) > 45,
      make: () => ({ title: 'Health scare', body: 'You have been having chest pains. Your doctor wants tests.', choices: ['Take two weeks off for treatment', 'Push through'] }),
      res: (s, i) => { const m = me(s); if (i === 0) { m.health = Math.min(100, m.health + 12); s.hoursLeft = 0; m.money -= 4000; return 'Treatment went well.'; } m.health -= 15; m.stress += 10; return 'You ignored it. Your health suffers.'; },
    },
    inheritance: {
      p: 0.0015, when: () => true,
      make: () => { const amt = U.randInt(5, 120) * 1000; return { title: 'An inheritance', body: `A distant relative left you ${U.money(amt)}.`, choices: ['Accept'], data: { amt } }; },
      res: (s, i, d) => { me(s).money += d.amt; return 'Added to your savings.'; },
    },
    profile: {
      p: 0.008, when: (s) => me(s).recLocal > 20 || me(s).seat,
      make: () => ({ title: 'Magazine profile', body: 'A regional magazine wants to profile you as a rising star.', choices: ['Do the interview', 'Decline'] }),
      res: (s, i) => { if (i === 0) { const m = me(s); m.recLocal += 2; m.recState += 1.5; m.pp += 5; return 'The profile was glowing.'; } return 'Maybe next time.'; },
    },
    partyAsk: {
      p: 0.01, when: (s) => !s.campaign && !me(s).seat && me(s).standing > 40,
      make: () => ({ title: 'The party is recruiting', body: 'Your county party chair thinks you should run for office this cycle. Check the Campaign tab for open races.', choices: ['Thanks, I will think about it'] }),
      res: (s) => { me(s).pp += 3; return 'You have a friend at party headquarters.'; },
    },
  };

  function fire(s, key) {
    const e = EV[key];
    if (!e) return;
    const it = e.make(s);
    if (!it) return;
    GR.sim.inbox(s, { title: it.title, body: it.body, kind: 'event', choices: it.choices.map((c, i) => ({ label: c, act: `ev:${key}:${i}` })), data: it.data || {} });
  }

  function week(s) {
    if (s.inbox.filter((x) => !x.done).length >= 4) return;
    for (const k of U.shuffle(Object.keys(EV))) {
      const e = EV[k];
      if (e.p && e.when(s) && U.chance(e.p)) { fire(s, k); break; }
    }
  }

  function resolve(s, key, i, data) {
    const e = EV[key];
    if (!e) return '';
    return e.res(s, i, data || {});
  }

  return { EV, fire, week, resolve };
})();
