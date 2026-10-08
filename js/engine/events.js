// Events: decisions that interrupt your week. Each event has when(s), a weight,
// text(s, d), and choices(s, d) -> [{ label, hint, fn(s, d) -> result text, disabled }].
var G = globalThis.G || (globalThis.G = {});

G.events = (function () {
  const U = G.util;
  const M = (n) => U.money(n);
  const tpl = (s) => G.state.tpl(s);
  const open = (s) => s.biz && s.biz.phase === 'open';
  const setup = (s) => s.biz && s.biz.phase === 'setup';
  const local = (s) => open(s) && !tpl(s).online && ['traffic', 'subscription'].includes(tpl(s).engine) && !tpl(s).capped;
  const hasRisk = (s, r) => open(s) && tpl(s).risks.includes(r);
  const has = (s, id) => s.p.traits.includes(id) || s.p.flaw === id;
  const pr = (s) => G.PRONOUNS[s.p.pronouns] || G.PRONOUNS.they;
  const shielded = (s) => s.biz && ['llc', 'scorp', 'ccorp'].includes(s.biz.entity);
  const rep = (s, d) => { if (s.biz) s.biz.rep = U.clamp(s.biz.rep + d, 1, 5); };

  // Pay a liability claim the way the law would.
  function payClaim(s, amount, insured) {
    const b = s.biz;
    if (insured) {
      const ded = Math.min(amount, 1000);
      if (b) b.cash -= ded; else s.p.cash -= ded;
      return `Your insurance covers it after a ${M(ded)} deductible.`;
    }
    if (b && shielded(s)) {
      b.cash -= amount;
      return `The ${M(amount)} comes out of the business. Your LLC keeps your personal assets out of it.`;
    }
    s.p.cash -= amount;
    return `As a sole proprietor you are personally liable. ${M(amount)} comes out of your own pocket.`;
  }
  function bizPay(s, amount) { if (s.biz) s.biz.cash -= amount; else s.p.cash -= amount; }

  const E = {};

  // ===================== Queued (triggered by the simulation) =====================
  E.joboffer = {
    kind: 'career', title: 'Job offer',
    text: (s, d) => { const j = G.jobs.byId[d.jobId]; return `They want you as a ${j.title.toLowerCase()} at ${M(G.jobs.wageFor(j, s.p, s.loc))}/hour, ${j.hours} hours a week${j.benefits ? ', with health insurance' : ''}.${s.p.job ? ` That means leaving your job as a ${s.p.job.title.toLowerCase()}.` : ''}`; },
    choices: (s, d) => [
      { label: 'Accept the offer', fn: (s) => { const j = G.jobs.byId[d.jobId]; if (s.p.job) G.life.quitJob(s, `You hand in your notice as a ${s.p.job.title.toLowerCase()}.`); G.life.takeJob(s, j); G.journal.add(s, 'career', `New job: ${j.title}.`); return `You start Monday.`; } },
      { label: 'Decline', fn: () => 'You turn it down politely.' },
    ],
  };
  E.burnout = {
    kind: 'life', title: 'Burnout',
    text: (s) => `You wake up and cannot make yourself get out of bed. The next few weeks you will get almost nothing done. Your body is sending the bill for all those 80-hour weeks.`,
    choices: () => [
      { label: 'Take real time off', hint: 'Recover faster', fn: (s) => { s.p.stress = Math.max(0, s.p.stress - 25); s.p.schedule.biz = Math.min(s.p.schedule.biz, 20); return 'You cut your business hours and sleep. It helps.'; } },
      { label: 'Push through', hint: 'Health takes another hit', fn: (s) => { s.p.health -= 8; return 'You keep going on caffeine and spite. It does not feel sustainable.'; } },
      { label: 'See a therapist ($180/session)', fn: (s) => { s.p.cash -= 720; s.p.stress = Math.max(0, s.p.stress - 35); s.p.happiness += 8; return 'Four sessions in, you have words for things you did not before.'; } },
    ],
  };
  E.sick = {
    kind: 'life', title: 'You are sick',
    text: (s) => `Fever, chills, the works. You are out of commission for about a week.${s.p.insurance === 'none' ? ' You do not have health insurance.' : ''}`,
    choices: (s) => [
      { label: `See a doctor (${s.p.insurance === 'none' ? '$350' : '$40 copay'})`, fn: (s) => { s.p.cash -= s.p.insurance === 'none' ? 350 : 40; s.p.sickWeeks = 1; s.p.health = Math.min(100, s.p.health + 5); return 'Antibiotics and rest. You bounce back.'; } },
      { label: 'Tough it out', fn: (s) => { s.p.sickWeeks = 2; s.p.health -= 6; return 'It drags on for two weeks.'; } },
    ],
  };
  E.hospital = {
    kind: 'life', title: 'Emergency room',
    text: (s, d) => {
      d.bill = s.p.insurance === 'none' ? U.randInt(28000, 52000) : (s.p.insurance === 'medicaid' ? 0 : U.randInt(2500, 4500));
      return `Sharp abdominal pain at 2 a.m. turns into emergency surgery: your appendix. ${s.p.insurance === 'none' ? 'You are uninsured. The itemized bill will be brutal.' : 'Thankfully you have insurance.'}`;
    },
    choices: (s, d) => {
      const bill = d.bill || 0;
      return [
        { label: s.p.insurance === 'none' ? `Set up a payment plan on ${M(bill)}` : `Pay your ${M(bill)} out-of-pocket`, fn: (s) => {
          s.p.sickWeeks = 3; s.p.health -= 10;
          if (s.p.insurance === 'none') {
            s.p.debts.push(G.finance.makeLoan({ name: 'Hospital bill', kind: 'medical', acct: 'p', amount: bill, rate: 0, weeks: 260 }));
            s.p.credit -= 20;
            G.journal.add(s, 'life', `Emergency surgery without insurance. ${M(bill)} of medical debt.`);
            return `You leave with a scar and ${M(bill)} of medical debt on a 5-year plan.`;
          }
          s.p.cash -= bill;
          return `Three weeks of recovery and a ${M(bill)} bill.`;
        } },
        ...(s.p.insurance === 'none' ? [{ label: 'Apply for hospital charity care', hint: 'Takes hours, may reduce the bill', fn: (s) => {
          s.p.sickWeeks = 3; s.p.health -= 10;
          const income = G.finance.annualIncome(s);
          const cut = income < 45000 ? 0.85 : income < 70000 ? 0.5 : 0.1;
          const owe = Math.round(bill * (1 - cut));
          if (owe > 0) s.p.debts.push(G.finance.makeLoan({ name: 'Hospital bill', kind: 'medical', acct: 'p', amount: owe, rate: 0, weeks: 260 }));
          return cut > 0.4 ? `Financial assistance knocks the bill down to ${M(owe)}. Hospitals do not advertise this.` : `They knock off a little. You still owe ${M(owe)}.`;
        } }] : []),
      ];
    },
  };
  E.ultimatum = {
    kind: 'life', title: 'The talk',
    text: (s) => `${s.p.rel.partner} sits you down. "I never see you. When I do, you are on your phone checking sales. Something has to change, or I am done."`,
    choices: () => [
      { label: 'Promise to change and mean it', hint: 'Set family time to 16+ hrs/week', fn: (s) => { s.p.schedule.family = Math.max(16, s.p.schedule.family); s.p.rel.patience += 18; return 'You block out real time. Phones in a drawer.'; } },
      { label: 'Plan a weekend away ($1,200)', fn: (s) => { s.p.cash -= 1200; s.p.rel.patience += 22; s.p.stress -= 8; return 'Two days without Wi-Fi. You remember why you are together.'; } },
      { label: '"This is what building something takes."', fn: (s) => { s.p.rel.patience -= 10; return `${s.p.rel.partner} goes quiet. That is worse than yelling.`; } },
    ],
  };
  E.breakup = {
    kind: 'life', title: 'It is over',
    text: (s) => `${s.p.rel.partner} is moving out. ${s.p.rel.status === 'married' ? 'Divorce lawyers are already involved.' : 'No drama, just exhaustion.'}`,
    choices: (s) => [{ label: 'Let go', fn: (s) => {
      const p = s.p;
      let msg = '';
      if (p.rel.status === 'married') { const split = Math.max(0, p.cash * 0.4) + 9000; p.cash -= split; msg = ` Lawyers and splitting assets cost you ${M(split)}.`; }
      G.journal.add(s, 'life', `${p.rel.partner} leaves.${msg}`);
      p.rel = { status: 'single', partner: null, patience: 70, income: 0 };
      p.happiness -= 20; p.stress += 15;
      if (p.housing === 'house') p.housing = 'apartment';
      return 'Your rent share just doubled.' + msg;
    } }],
  };
  E.cashcrisis = {
    kind: 'biz', title: 'The business is out of cash',
    text: (s) => `${s.biz.name} is ${M(-s.biz.cash)} in the hole. Payroll and suppliers are due, and your personal account is tapped out.${(s.biz.flags.crisisWeeks || 0) >= 6 ? ' Creditors have run out of patience.' : ''}`,
    choices: (s) => {
      const b = s.biz, opts = [];
      const short = -b.cash;
      if (s.p.ccLimit - s.p.ccBal > short) opts.push({ label: `Put ${M(short)} on your personal credit card`, hint: '24% APR', fn: (s) => { s.p.ccBal += short; b.cash += short; return 'You buy yourself a little time at 24% interest.'; } });
      if (b.staff.length) opts.push({ label: 'Lay off staff', fn: (s) => { const n = Math.ceil(b.staff.length / 2); b.staff.splice(0, n); b.staff.forEach((e) => { e.morale -= 15; }); G.journal.add(s, 'biz', `You lay off ${n} people. Worst day of your life so far.`); return `You let ${n} people go.`; } });
      if (!s.p.debts.some((d) => d.kind === 'payable')) opts.push({ label: 'Ask suppliers and the landlord for 30 days', hint: 'A 5% late fee, and some goodwill lost', fn: (s) => { rep(s, -0.15); s.p.credit -= 8; b.cash += short; s.p.debts.push(G.finance.makeLoan({ name: 'Overdue supplier bills', kind: 'payable', acct: 'b', amount: short * 1.05, rate: 0, weeks: 5 })); return 'They give you 30 days. A couple put you on cash-on-delivery.'; } });
      const weeks = b.flags.crisisWeeks || 0;
      if (weeks < 6) opts.push({ label: 'Scramble for money this week', hint: `${6 - weeks} week${6 - weeks === 1 ? '' : 's'} before creditors force the issue`, fn: (s) => { s.p.credit -= 6; rep(s, -0.05); b.staff.forEach((e) => { e.morale -= 8; }); s.p.stress += 6; return 'Paychecks go out late and vendors start calling. Move money in, borrow, or cut costs before next week.'; } });
      opts.push({ label: 'Close the business', fn: (s) => { G.biz.close(s); return 'You turn off the lights for the last time.'; } });
      return opts;
    },
  };
  E.licenseoffer = {
    kind: 'biz', title: 'A pharma company calls',
    text: (s, d) => d.acquisition ? `A large pharmaceutical company wants to acquire ${s.biz.name} outright for ${U.money(d.upfront, { short: true })}.` : `A big pharma partner wants to license your program: ${U.money(d.upfront, { short: true })} upfront plus royalties if it ever reaches market.`,
    choices: (s, d) => [
      { label: d.acquisition ? 'Sell the company' : 'Take the licensing deal', fn: (s) => {
        if (d.acquisition) { G.biz.sell(s, d.upfront, 0.02); return 'The deal closes. You are, on paper, extremely rich.'; }
        s.biz.cash += d.upfront; s.biz.rnd.val *= 0.85;
        G.journal.add(s, 'biz', `Licensing deal: ${U.money(d.upfront, { short: true })} upfront.`);
        return 'Non-dilutive money. Your investors are thrilled.';
      } },
      { label: 'Hold out for more', fn: () => 'You decline. Maybe the next milestone gets a bigger offer. Maybe not.' },
    ],
  };
  E.buyeroffer = {
    kind: 'biz', title: 'A buyer makes an offer',
    text: (s, d) => `${d.broker ? 'Your broker has a buyer.' : 'Out of the blue, a buyer reaches out.'} They offer ${M(d.offer)} for ${s.biz.name}${d.broker ? ', minus a 10% broker fee' : ''}. You own ${s.biz.equity.toFixed(0)}%.`,
    choices: (s, d) => [
      { label: `Sell for ${M(d.offer)}`, fn: (s) => { G.biz.sell(s, d.offer, d.broker ? 0.1 : 0.03); return 'You sign. It is done.'; } },
      { label: 'Counter 15% higher', hint: 'Sales skill matters', fn: (s) => { if (Math.random() < 0.3 + s.p.skills.sales / 200) { G.biz.sell(s, d.offer * 1.15, d.broker ? 0.1 : 0.03); return 'They grumble and accept.'; } return 'They walk away. The deal is dead.'; } },
      { label: 'Decline', fn: () => 'Not for sale. Not at that price, anyway.' },
    ],
  };
  E.viral = {
    kind: 'biz', title: 'You went viral',
    text: (s) => `A video about ${s.biz.name} hits millions of views overnight. Your phone will not stop buzzing.`,
    choices: () => [
      { label: 'Ride the wave', fn: (s) => { s.biz.awareness = Math.min(100, s.biz.awareness + 35); s.p.stress += 6; return 'Awareness skyrockets. Now can you keep up with demand?'; } },
    ],
  };
  E.vcboard = {
    kind: 'biz', title: 'Board meeting',
    text: (s) => `It has been a year since your ${s.biz.vc.stage === 'seed' ? 'seed round' : 'last round'}. Growth is behind plan, and the board wants changes.`,
    choices: () => [
      { label: 'Cut burn: lay off a third of staff', fn: (s) => { const n = Math.ceil(s.biz.staff.length / 3); s.biz.staff.splice(0, n); s.biz.vc.week = s.week; return `You cut ${n} people and extend your runway.`; } },
      { label: 'Hire the board\'s COO pick ($4,800/week)', fn: (s) => { s.biz.staff.push({ id: U.uid('e'), name: G.randName(), role: 'manager', skill: 82, wage: 120, hours: 40, morale: 75, weeks: 0 }); s.biz.vc.week = s.week; return 'A polished operator joins. Things get more organized and more expensive.'; } },
      { label: 'Fight for your vision', hint: 'Risky', fn: (s) => {
        if (Math.random() < 0.45 + s.p.skills.sales / 300) { s.biz.vc.week = s.week; return 'You win the room. For now.'; }
        const payout = G.biz.equityValue(s, s.biz) * 0.25;
        s.p.cash += payout;
        G.journal.add(s, 'biz', `The board votes to replace you as CEO of ${s.biz.name}. You sell some shares on the way out for ${M(payout)}.`);
        s.biz.equity = 0; G.biz.sell(s, 0, 0);
        return 'The board replaces you as CEO. It happens to founders more than people think.';
      } },
    ],
  };

  E.taxday = {
    kind: 'money', title: 'Tax day',
    text: (s, d) => {
      const r = d.r;
      const lines = [`Your ${d.year} federal and ${G.loc.state(s.loc.state).name} return is done.`,
        `Income: wages ${M(r.wages)}, gig ${M(r.gig)}, business ${M(r.biz)}${r.other ? `, other ${M(r.other)}` : ''}${r.cap ? `, capital gains ${M(r.cap)}` : ''}.`,
        `Tax: federal ${M(r.fed)}, state ${M(r.state)}, self-employment ${M(r.se)}${r.capTax ? `, capital gains ${M(r.capTax)}` : ''}${r.penalty ? `, penalties ${M(r.penalty)}` : ''}${r.qbi ? ` (the 20% QBI deduction saved you about ${M(r.qbi * 0.15)})` : ''}.`,
        `Already paid through withholding and estimates: ${M(r.paid)}.`];
      if (d.corp) lines.push(`Your C-corp also owes ${M(d.corp)} in corporate income tax.`);
      lines.push(r.due > 0 ? `You owe ${M(r.due)}.` : `You get a refund of ${M(-r.due)}.`);
      return lines.join(' ');
    },
    choices: (s, d) => {
      const due = d.r.due;
      if (due <= 0) return [{ label: `Deposit the ${M(-due)} refund`, fn: (s) => { s.p.cash += -due; if (d.corp && s.biz) s.biz.cash -= d.corp; return 'Nice.'; } }];
      const opts = [{ label: `Pay ${M(due)}`, fn: (s) => { s.p.cash -= due; if (d.corp && s.biz) s.biz.cash -= d.corp; return due > 5000 ? 'That stings. Consider quarterly estimated payments.' : 'Paid.'; } }];
      if (s.p.cash < due) opts.push({ label: 'Set up an IRS payment plan', hint: '~8% interest', fn: (s) => { s.p.cash -= 130; s.p.debts.push(G.finance.makeLoan({ name: 'IRS installment agreement', kind: 'irs', acct: 'p', amount: due, rate: 0.08, weeks: 260 })); if (d.corp && s.biz) s.biz.cash -= d.corp; return 'The IRS will take monthly payments. Interest and penalties keep accruing.'; } });
      return opts;
    },
  };

  // ===================== Random: life =====================
  E.carrepair = {
    kind: 'life', title: 'Car trouble', w: 3, when: (s) => s.p.transport === 'car',
    text: () => 'The check-engine light was not lying. The mechanic says the transmission is going: $2,600.',
    choices: () => [
      { label: 'Fix it ($2,600)', fn: (s) => { s.p.cash -= 2600; return 'Expensive, but you have wheels.'; } },
      { label: 'Sell it for scrap and go car-free', fn: (s) => { s.p.cash += 900; s.p.transport = ['large', 'metro'].includes(s.loc.size) ? 'transit' : 'bike'; if (s.p.job && s.p.job.id === 'gig') G.life.quitJob(s, 'No car, no gig driving.'); return 'You get $900 and a lot more walking.'; } },
    ],
  };
  E.wedding = {
    kind: 'life', title: 'Destination wedding', w: 2,
    text: () => 'Your college roommate is getting married in Tulum. Flights, hotel and a gift come to about $1,800.',
    choices: () => [
      { label: 'Go ($1,800)', fn: (s) => { s.p.cash -= 1800; s.p.happiness += 10; s.p.stress -= 12; s.p.network += 2; return 'Best weekend in a year. You come back with a sunburn and two new contacts.'; } },
      { label: 'Send a gift and your regrets', fn: (s) => { s.p.cash -= 150; s.p.happiness -= 4; return 'You watch the photos roll in on Instagram.'; } },
    ],
  };
  E.parentsick = {
    kind: 'life', title: 'A parent is sick', w: 1.5,
    text: () => 'Your mom calls: your dad had a minor stroke. He is stable, but the next few months will be hard on everyone.',
    choices: () => [
      { label: 'Send money ($3,000)', fn: (s) => { s.p.cash -= 3000; s.p.stress += 6; return 'It helps cover what insurance does not.'; } },
      { label: 'Fly home for two weeks', hint: 'Business hours drop', fn: (s) => { s.p.cash -= 700; s.p.burnoutWeeks = Math.max(s.p.burnoutWeeks, 2); s.p.happiness += 3; return 'You are there when it matters. Work waits.'; } },
      { label: 'Call more often', fn: (s) => { s.p.stress += 10; s.p.happiness -= 6; return 'You feel the distance.'; } },
    ],
  };
  E.meetsomeone = {
    kind: 'life', title: 'Someone catches your eye', w: 2, when: (s) => s.p.rel.status === 'single' && s.p.schedule.family + G.life.hours(s).leisure > 30,
    text: () => `At a friend's birthday you end up talking to someone for three hours. They ask for your number.`,
    choices: () => [
      { label: 'Give it to them', fn: (s) => { const n = G.randName().split(' ')[0]; s.p.rel = { status: 'partner', partner: n, patience: 75, income: Math.round(G.loc.state(s.loc.state).inc * 1000 * 0.55 / 52), since: s.week }; s.p.happiness += 12; G.journal.add(s, 'life', `You start seeing ${n}.`); return `You and ${n} start dating. Time for that family-hours slider.`; } },
      { label: 'Not now. Too busy.', fn: () => 'Maybe in another life.' },
    ],
  };
  E.proposal = {
    kind: 'life', title: 'Big question', w: 1.2, when: (s) => s.p.rel.status === 'partner' && s.p.rel.patience > 70 && s.week - (s.p.rel.since || -60) > 52,
    text: (s) => `You and ${s.p.rel.partner} have been together a while. It feels like time to talk about marriage.`,
    choices: () => [
      { label: 'Big wedding ($28,000)', fn: (s) => { s.p.cash -= 28000; s.p.rel.status = 'married'; s.p.rel.patience = 95; s.p.happiness += 18; G.journal.add(s, 'life', `You marry ${s.p.rel.partner}. 140 guests, one open bar.`); return 'A perfect day and a painful credit card statement.'; } },
      { label: 'Courthouse and dinner ($400)', fn: (s) => { s.p.cash -= 400; s.p.rel.status = 'married'; s.p.rel.patience = 90; s.p.happiness += 14; G.journal.add(s, 'life', `You marry ${s.p.rel.partner} at the county courthouse.`); return 'Small, sweet, and fiscally responsible.'; } },
      { label: 'Not yet', fn: (s) => { s.p.rel.patience -= 12; return 'They say they understand.'; } },
    ],
  };
  E.baby = {
    kind: 'life', title: 'Two pink lines', w: 0.8, when: (s) => s.p.rel.status === 'married' && G.state.age(s) < 43 && s.p.kids < 3,
    text: () => 'You are going to be a parent.',
    choices: () => [{ label: 'Wow.', fn: (s) => { s.p.kids += 1; s.p.happiness += 10; s.p.stress += 10; s.p.cash -= 3500; G.journal.add(s, 'life', 'A baby arrives. Sleep becomes a memory.'); return 'Hospital bills, a crib, and a whole new kind of tired. Childcare costs are now in your budget.'; } }],
  };
  E.rentup = {
    kind: 'life', title: 'Lease renewal', w: 2, when: (s) => ['apartment', 'house', 'roommates'].includes(s.p.housing),
    text: (s) => `Your landlord is raising rent ${Math.round(s.flags.rentBump * 100) || 7}% at renewal.`,
    choices: () => [
      { label: 'Pay it', fn: (s) => { s.loc.rent = Math.round(s.loc.rent * 1.07); return 'Your rent goes up.'; } },
      { label: 'Move somewhere cheaper ($1,800 moving)', fn: (s) => { s.p.cash -= 1800; s.loc.rent = Math.round(s.loc.rent * 0.94); s.p.stress += 6; return 'A worse kitchen, a better rent.'; } },
    ],
  };
  E.jury = {
    kind: 'life', title: 'Jury duty', w: 1,
    text: () => 'A summons arrives. A civil trial expected to last a week.',
    choices: () => [
      { label: 'Serve', fn: (s) => { s.p.burnoutWeeks = Math.max(s.p.burnoutWeeks, 1); return 'A week of your life. You find it oddly interesting.'; } },
      { label: 'Request a hardship deferral', fn: (s) => Math.random() < 0.6 ? 'Granted.' : (s.p.burnoutWeeks = Math.max(s.p.burnoutWeeks, 1), 'Denied. You serve anyway.') },
    ],
  };
  E.mentor = {
    kind: 'life', title: 'A mentor appears', w: 1.5, when: (s) => s.p.network >= 18 && !s.flags.mentor,
    text: (s) => `${G.randName()}, a retired founder who volunteers with SCORE, offers to meet every two weeks for free.`,
    choices: () => [
      { label: 'Gratefully accept', fn: (s) => { s.flags.mentor = s.week; ['management', 'finance', 'sales'].forEach((k) => { s.p.skills[k] = Math.min(100, s.p.skills[k] + 4); }); s.p.network += 3; return 'You learn more over coffee than you did in four years of school.'; } },
      { label: 'You are too busy', fn: () => 'They leave their card.' },
    ],
  };
  E.freelancegig = {
    kind: 'life', title: 'Side project offer', w: 2, when: (s) => Math.max(s.p.skills.tech, s.p.skills.creative, s.p.skills.finance) >= 40,
    text: (s) => { const k = G.jobs.bestSkill(s.p); return `A former coworker needs ${k === 'tech' ? 'a website rebuilt' : k === 'creative' ? 'a brand refresh' : 'their books cleaned up'}. $3,000 for about 30 hours over the next couple of weeks.`; },
    choices: () => [
      { label: 'Take it', fn: (s) => { s.p.cash += 3000; s.p.ytd.gig += 3000; s.p.stress += 9; return 'Easy money, hard weeks. Remember: no taxes were withheld.'; } },
      { label: 'Pass', fn: () => 'You stay focused.' },
    ],
  };
  E.phishing = {
    kind: 'life', title: 'Urgent: IRS notice', w: 1.5, when: (s) => !!s.biz,
    text: () => 'An email says your EIN has been "flagged for suspension" unless you pay a $480 compliance fee within 24 hours. It has the IRS logo.',
    choices: (s) => [
      { label: 'Pay it to be safe', fn: (s) => { if (has(s, 'numbers')) return 'Your numbers brain kicks in before you click. The IRS does not email. You delete it.'; bizPay(s, 480); return 'It was a scam. The IRS never emails demands. $480 gone.'; } },
      { label: 'Delete it', fn: () => 'Good instinct. The IRS sends letters, not threatening emails.' },
    ],
  };
  E.inheritance = {
    kind: 'life', title: 'An unexpected letter', w: 0.4,
    text: () => 'A great-aunt you met twice has passed away and left you something in her will.',
    choices: () => [{ label: 'Open it', fn: (s) => { const x = U.randInt(4, 30) * 1000; s.p.cash += x; G.journal.add(s, 'life', `Inheritance: ${M(x)}.`); return `${M(x)}, and a note that says "Do something brave."`; } }],
  };
  E.friendinvest = {
    kind: 'biz', title: 'A friend wants in', w: 1.2, when: (s) => s.biz && s.biz.equity > 80 && s.p.network > 10 && !s.flags.friendInvest,
    text: (s) => `An old friend believes in ${s.biz.name} and offers ${M(20000)} for 10% of the business.`,
    choices: () => [
      { label: 'Take the money', fn: (s) => { s.flags.friendInvest = true; s.biz.cash += 20000; s.biz.equity *= 0.9; s.biz.investors.push({ stage: 'friend', amount: 20000, pct: 10 }); return 'Fresh capital, and now a friend has skin in the game.'; } },
      { label: 'Keep it all', fn: (s) => { s.flags.friendInvest = true; return 'They understand. Mostly.'; } },
    ],
  };
  E.layoff = {
    kind: 'career', title: 'Layoffs', w: 3, when: (s) => s.p.job && !s.p.job.flex && s.econ.phase === 'recession',
    text: () => 'A calendar invite titled "Quick sync" from HR. Your position has been eliminated. Two weeks of severance.',
    choices: () => [{ label: 'Pack your desk', fn: (s) => { s.p.cash += s.p.job.wage * s.p.job.hours * 2 * 0.75; G.life.quitJob(s, 'You are laid off.'); return 'Your health insurance ends this month. Maybe this is the push you needed.'; } }],
  };
  E.promotion = {
    kind: 'career', title: 'Promotion offer', w: 2, when: (s) => s.p.job && !s.p.job.flex && s.p.job.perf > 72 && s.p.job.weeks > 40,
    text: (s) => `Your boss offers you a promotion: +18% pay, but expect about 8 more hours a week.`,
    choices: () => [
      { label: 'Accept', fn: (s) => { s.p.job.wage = Math.round(s.p.job.wage * 1.18 * 100) / 100; s.p.job.hours += 8; s.p.job.title = 'Senior ' + s.p.job.title.toLowerCase(); return 'More money, less time. The eternal trade.'; } },
      { label: 'Decline: protect your side business time', fn: (s) => { s.p.job.perf -= 8; return 'Your boss looks confused, then disappointed.'; } },
    ],
  };
  E.bossfinds = {
    kind: 'career', title: 'Your boss found out', w: 2.5, when: (s) => s.p.job && !s.p.job.flex && s.biz && s.p.job.hours >= 30 && !s.flags.bossKnows,
    text: (s) => `Your manager saw ${s.biz.name} on LinkedIn. "Is this going to be a problem?"`,
    choices: () => [
      { label: '"It is just a side project."', fn: (s) => { s.flags.bossKnows = true; s.p.job.perf -= 6; s.p.stress += 4; return 'They nod slowly. You are now on their radar.'; } },
      { label: 'Use it as the push to quit', fn: (s) => { s.flags.bossKnows = true; G.life.quitJob(s); return 'You give two weeks\' notice. Terrifying. Exhilarating.'; } },
    ],
  };
  E.splurge = {
    kind: 'life', title: 'Impulse', w: 2, when: (s) => has(s, 'impulsive') && s.p.cash > 1500,
    text: () => 'There is a sale. There is always a sale.',
    choices: () => [
      { label: 'Treat yourself ($900)', fn: (s) => { s.p.cash -= 900; s.p.happiness += 4; return 'New things. A brief glow.'; } },
      { label: 'Close the tab', fn: (s) => { s.p.stress += 2; return 'Growth.'; } },
    ],
  };

  // ===================== Random: business =====================
  E.inspection = {
    kind: 'biz', title: 'Health inspection', w: 3, when: (s) => hasRisk(s, 'food'),
    text: () => 'The county health inspector walks in unannounced with a clipboard.',
    choices: (s) => [{ label: 'Show them around', fn: (s) => {
      const b = s.biz;
      const score = b.quality + (s.p.creds.includes('servsafe') ? 15 : 0) + U.gauss() * 15;
      if (score > 45) { rep(s, 0.03); return 'You pass with a few minor notes. The certificate goes in the window.'; }
      const fine = 750; b.cash -= fine; rep(s, -0.2); b.awareness -= 4;
      G.journal.add(s, 'biz', 'Failed a health inspection. It is on the county website now.');
      return `Critical violations: a cooler running warm and no sanitizer at the bar. ${M(fine)} fine and a re-inspection. ${s.p.creds.includes('servsafe') ? '' : 'A ServSafe Manager certification would help.'}`;
    } }],
  };
  E.slipfall = {
    kind: 'biz', title: 'Slip and fall', w: 1.5, when: (s) => local(s) && s.biz.space,
    text: () => 'A customer slips on a wet floor, breaks a wrist, and hires a lawyer. The demand letter asks for $45,000.',
    choices: (s) => [
      { label: 'Settle for $22,000', fn: (s) => payClaim(s, 22000, s.biz.ins.gl) },
      { label: 'Fight it in court', hint: '$9k legal fees, maybe you win', fn: (s) => {
        if (s.biz.ins.gl) return 'Your insurer\'s lawyers handle it and settle quietly. Your premium will go up.';
        bizPay(s, 9000);
        if (Math.random() < 0.5) return 'The jury sides with you. You still paid $9,000 in legal fees.';
        return 'You lose. ' + payClaim(s, 45000, false);
      } },
    ],
  };
  E.breakdown = {
    kind: 'biz', title: 'Equipment failure', w: 2.5, when: (s) => open(s) && s.biz.equipValue > 5000,
    text: (s) => `Your most important piece of equipment dies mid-shift. ${s.biz.equipCond < 60 ? 'It has been overdue for service.' : 'Bad luck.'}`,
    choices: (s) => {
      const cost = Math.round(Math.min(18000, s.biz.equipValue * 0.06 + 800) * (has(s, 'handy') ? 0.8 : 1));
      return [
        { label: `Repair it properly (${M(cost)})`, fn: (s) => { bizPay(s, cost); s.biz.equipCond = Math.min(100, s.biz.equipCond + 25); return 'Back up and running, better than before.'; } },
        { label: 'Patch it yourself', hint: 'Quality suffers for a while', fn: (s) => { s.biz.equipCond -= 18; s.p.stress += 4; return 'Duct tape and YouTube tutorials. It works. Mostly.'; } },
      ];
    },
  };
  E.poached = {
    kind: 'biz', title: 'An employee got an offer', w: 2, when: (s) => open(s) && s.biz.staff.length > 0,
    text: (s) => { const e = U.pick(s.biz.staff); s.flags.poachId = e.id; return `${e.name} has an offer from ${s.biz.rival}: 15% more money. They would rather stay, if you can match it.`; },
    choices: (s) => [
      { label: 'Match it', fn: (s) => { const e = s.biz.staff.find((x) => x.id === s.flags.poachId); if (e) { e.wage = Math.round(e.wage * 1.15 * 100) / 100; e.morale = Math.min(100, e.morale + 18); } return 'They stay, and they know you value them.'; } },
      { label: 'Let them go', fn: (s) => { const e = s.biz.staff.find((x) => x.id === s.flags.poachId); s.biz.staff = s.biz.staff.filter((x) => x.id !== s.flags.poachId); return `${e ? e.name.split(' ')[0] : 'They'} leave${e ? 's' : ''} for ${s.biz.rival}.`; } },
    ],
  };
  E.competitor = {
    kind: 'biz', title: 'New competitor', w: 2.5, when: (s) => local(s),
    text: (s) => { s.flags.newRival = G.biz.rivalName(tpl(s), s.loc); return `${s.flags.newRival} is opening ${s.loc.size === 'metro' || s.loc.size === 'large' ? 'four blocks away' : 'across town'}. Their grand-opening flyers are already everywhere.`; },
    choices: () => [
      { label: 'Cut prices 10%', fn: (s) => { s.biz.comps += 1; s.biz.price = Math.max(0.6, s.biz.price * 0.9); s.biz.rival = s.flags.newRival; return 'You protect your customers and squeeze your margin.'; } },
      { label: 'Double down on quality', hint: 'Move up a tier', fn: (s) => { s.biz.comps += 1; s.biz.tier = Math.min(2, s.biz.tier + 1); s.biz.rival = s.flags.newRival; return 'Compete on being better, not cheaper.'; } },
      { label: 'Ignore them', fn: (s) => { s.biz.comps += 1; s.biz.rival = s.flags.newRival; return 'Plenty of room for everyone. Probably.'; } },
    ],
  };
  E.compcloses = {
    kind: 'biz', title: 'A competitor closes', w: 1.5, when: (s) => local(s) && s.biz.comps > 1,
    text: (s) => `${s.biz.rival} has a "Closed. Thank you for 6 wonderful years" sign on the door.`,
    choices: () => [{ label: 'Welcome their customers', fn: (s) => { s.biz.comps -= 1; s.biz.awareness = Math.min(100, s.biz.awareness + 5); s.biz.rival = G.biz.rivalName(tpl(s), s.loc); return 'Some of their regulars wander in. You feel a little guilty about how happy you are.'; } }],
  };
  E.press = {
    kind: 'biz', title: 'Local press', w: 1.5, when: (s) => open(s) && s.biz.rep > 3.6,
    text: (s) => `A reporter from the ${s.loc.city} paper wants to feature ${s.biz.name} in a "businesses to watch" story.`,
    choices: () => [
      { label: 'Do the interview', fn: (s) => { s.biz.awareness = Math.min(100, s.biz.awareness + 12); s.p.network += 2; return 'The story runs with a flattering photo. Traffic picks up.'; } },
      { label: 'Decline', fn: () => 'You are too busy, or too shy. The story runs without you.' },
    ],
  };
  E.bigclient = {
    kind: 'biz', title: 'A big contract', w: 2.5, when: (s) => open(s) && (tpl(s).payLag >= 2 || tpl(s).network),
    text: (s) => { const t = tpl(s); const v = Math.round(t.price * G.loc.priceIndex(s.loc) * 4); s.flags.bigVal = v; return `A regional company wants a deal worth ${M(v)}. The catch: net-60 payment terms, and the work starts now.`; },
    choices: (s) => [
      { label: 'Accept', fn: (s) => { const v = s.flags.bigVal; const t = tpl(s); s.biz.backlog += 4; s.biz.ar.push({ w: s.week + 9, amt: v * 0.4 }); s.biz.awareness += 4; return 'Huge win, and a cash-flow headache: you do the work now and get paid in two months.'; } },
      { label: 'Negotiate net-30', hint: 'Sales check', fn: (s) => { if (Math.random() < 0.35 + s.p.skills.sales / 200) { s.biz.backlog += 4; s.biz.ar.push({ w: s.week + 5, amt: s.flags.bigVal * 0.4 }); return 'They agree to net-30. Nicely done.'; } return 'They go with someone else who would take net-60.'; } },
      { label: 'Decline', fn: () => 'You cannot float that much work.' },
    ],
  };
  E.nonpayment = {
    kind: 'biz', title: 'A client will not pay', w: 2, when: (s) => open(s) && s.biz.ar.length > 0,
    text: (s) => { const a = U.pick(s.biz.ar); s.flags.badAr = a; return `A client owes you ${M(a.amt)} and has stopped answering emails.`; },
    choices: () => [
      { label: 'Send it to collections', hint: 'Recover ~60%', fn: (s) => { const a = s.flags.badAr; s.biz.ar = s.biz.ar.filter((x) => x !== a && !(x.w === a.w && x.amt === a.amt)); s.biz.cash += a.amt * 0.6; s.p.ytd.biz -= a.amt * 0.4; return `You recover ${M(a.amt * 0.6)}.`; } },
      { label: 'Sue in small claims', hint: 'Takes hours, may win in full', fn: (s) => { const a = s.flags.badAr; s.biz.ar = s.biz.ar.filter((x) => !(x.w === a.w && x.amt === a.amt)); s.p.stress += 6; if (Math.random() < 0.65) { s.biz.cash += a.amt; return 'You win and they pay. Eventually.'; } s.p.ytd.biz -= a.amt; return 'You win a judgment you will never collect.'; } },
      { label: 'Write it off', fn: (s) => { const a = s.flags.badAr; s.biz.ar = s.biz.ar.filter((x) => !(x.w === a.w && x.amt === a.amt)); s.p.ytd.biz -= a.amt; return 'A lesson in requiring deposits.'; } },
    ],
  };
  E.supplier = {
    kind: 'biz', title: 'Supplier price hike', w: 2.5, when: (s) => open(s) && (tpl(s).cogs || 0) > 0.2,
    text: () => 'Your main supplier is raising prices 9%, effective immediately. They blame tariffs and freight.',
    choices: () => [
      { label: 'Raise your prices 5%', fn: (s) => { s.biz.price *= 1.05; return 'Most customers do not notice. Some do.'; } },
      { label: 'Shop for a new supplier', hint: 'Finance skill helps', fn: (s) => { if (Math.random() < 0.4 + s.p.skills.finance / 200) return 'You find a better supplier. Crisis averted.'; s.biz.tier = Math.max(0, s.biz.tier); s.p.ytd.biz -= 300; return 'The alternatives are worse. You eat the increase.'; } },
      { label: 'Absorb it', fn: (s) => 'Your margin shrinks a little.' },
    ],
  };
  E.tariff = {
    kind: 'biz', title: 'Tariffs hit your products', w: 2, when: (s) => open(s) && ['retail', 'making'].includes(tpl(s).cat) && tpl(s).engine === 'traffic',
    text: () => 'New import tariffs mean your next inventory order will cost about 15% more.',
    choices: () => [
      { label: 'Raise prices 8%', fn: (s) => { s.biz.price *= 1.08; return 'You pass most of it on.'; } },
      { label: 'Switch to a domestic manufacturer', hint: '$4,000 retooling', fn: (s) => { bizPay(s, 4000); s.biz.tier = Math.min(2, s.biz.tier + 1); return '"Made in USA" goes on the label. It costs more and sells better.'; } },
    ],
  };
  E.renewal = {
    kind: 'biz', title: 'Your lease is up', w: 0, when: () => false,
    text: (s) => `Your 3-year lease is ending. The landlord wants ${Math.round(s.flags.leaseBump * 100)}% more for the renewal.`,
    choices: () => [
      { label: 'Sign the renewal', fn: (s) => { s.biz.space.rentMo = Math.round(s.biz.space.rentMo * (1 + s.flags.leaseBump)); s.biz.space.left = 156; return 'Another three years.'; } },
      { label: 'Negotiate', hint: 'Sales skill', fn: (s) => { const cut = Math.random() < 0.4 + s.p.skills.sales / 200 ? 0.5 : 1; s.biz.space.rentMo = Math.round(s.biz.space.rentMo * (1 + s.flags.leaseBump * cut)); s.biz.space.left = 156; return cut < 1 ? 'You talk them down to half the increase.' : 'They will not budge. You sign.'; } },
      { label: 'Move to a cheaper space', hint: 'Lose some regulars', fn: (s) => { bizPay(s, s.biz.space.rentMo * 2 + 8000); s.biz.space.rentMo = Math.round(s.biz.space.rentMo * 0.88); s.biz.space.left = 156; s.biz.awareness *= 0.75; return 'Moving costs money and some customers do not follow you.'; } },
    ],
  };
  E.breach = {
    kind: 'biz', title: 'Data breach', w: 1.5, when: (s) => hasRisk(s, 'data'),
    text: () => 'A security researcher emails: your database with customer emails was publicly exposed.',
    choices: () => [
      { label: 'Disclose and fix it ($8,000)', fn: (s) => { bizPay(s, 8000); rep(s, -0.1); return 'Forensics, notifications and an apology. Customers respect the honesty.'; } },
      { label: 'Quietly patch it', hint: 'Risky', fn: (s) => { if (Math.random() < 0.3) { bizPay(s, 25000); rep(s, -0.5); s.biz.subs *= 0.8; return 'A journalist finds out. Lawsuits and churn follow.'; } return 'No one notices. This time.'; } },
    ],
  };
  E.platform = {
    kind: 'biz', title: 'The algorithm changed', w: 2, when: (s) => hasRisk(s, 'platform'),
    text: (s) => `${tpl(s).cat === 'media' ? 'YouTube and Amazon' : 'Etsy, Meta and Google'} changed their algorithm overnight. Your traffic dropped by a third.`,
    choices: () => [
      { label: 'Build your own email list ($1,500)', fn: (s) => { bizPay(s, 1500); s.biz.awareness *= 0.85; return 'Owned audience beats rented audience. Lesson learned.'; } },
      { label: 'Wait it out', fn: (s) => { s.biz.awareness *= 0.7; return 'Painful weeks.'; } },
    ],
  };
  E.theft = {
    kind: 'biz', title: 'Missing money', w: 1.5, when: (s) => open(s) && s.biz.staff.length > 1 && tpl(s).cardFees,
    text: () => 'The register has been short a few times. Inventory counts are off.',
    choices: () => [
      { label: 'Install cameras & audit ($1,800)', fn: (s) => { bizPay(s, 1800); return has(s, 'numbers') ? 'You spot the pattern quickly and confront the person. It stops.' : 'The losses stop.'; } },
      { label: 'Trust your team', fn: (s) => { const loss = U.randInt(2, 7) * 1000; bizPay(s, loss); return `By the time you look closely, ${M(loss)} is gone.`; } },
    ],
  };
  E.audit = {
    kind: 'biz', title: 'IRS audit', w: 1, when: (s) => open(s) && s.biz.hist.length > 52 && !s.biz.bookkeeper,
    text: () => 'A letter from the IRS: your return has been selected for examination.',
    choices: (s) => [
      { label: 'Hire a CPA to represent you ($3,500)', fn: (s) => { s.p.cash -= 3500; return 'Your CPA handles it. Minor adjustments, no penalty.'; } },
      { label: 'Handle it yourself', hint: 'Finance skill matters', fn: (s) => {
        const ok = s.p.skills.finance + (has(s, 'disorganized') ? -20 : 0) + U.gauss() * 15;
        if (ok > 50) return 'Your records hold up. No change.';
        const pen = U.randInt(4, 14) * 1000; s.p.cash -= pen;
        return `Sloppy records cost you ${M(pen)} in back taxes and penalties. Get a bookkeeper.`;
      } },
    ],
  };
  E.reviewbomb = {
    kind: 'biz', title: 'One-star pile-on', w: 1.5, when: (s) => open(s) && s.biz.reviewsCount > 20,
    text: () => 'A customer\'s angry post went semi-viral. Strangers are leaving one-star reviews.',
    choices: () => [
      { label: 'Respond publicly and gracefully', fn: (s) => { rep(s, Math.random() < 0.4 + s.p.skills.sales / 200 ? -0.05 : -0.25); return 'Some people respect the response. Some do not.'; } },
      { label: 'Ignore it', fn: (s) => { rep(s, -0.25); return 'It blows over in a couple of weeks, leaving a dent.'; } },
    ],
  };
  E.award = {
    kind: 'biz', title: `Best in town`, w: 1, when: (s) => open(s) && s.biz.rep >= 4.4 && s.biz.reviewsCount > 30,
    text: (s) => `${s.biz.name} wins a "Best of ${s.loc.city}" readers' poll.`,
    choices: () => [{ label: 'Frame it', fn: (s) => { s.biz.awareness = Math.min(100, s.biz.awareness + 15); s.p.happiness += 8; return 'It goes on the wall, the website, and your mom\'s Facebook.'; } }],
  };
  E.sponsor = {
    kind: 'biz', title: 'Sponsorship offer', w: 3, when: (s) => open(s) && s.biz.tid === 'creator' && s.biz.awareness > 20,
    text: (s) => { const v = Math.round((s.biz.awareness * 120 + 800) / 100) * 100; s.flags.sponsor = v; return `A brand offers ${M(v)} for a sponsored segment. Their product is... fine.`; },
    choices: () => [
      { label: 'Take it', fn: (s) => { s.biz.cash += s.flags.sponsor; s.p.ytd.biz += s.flags.sponsor; rep(s, -0.03); return 'Easy money. A few comments call you a sellout.'; } },
      { label: 'Only sponsors you believe in', fn: (s) => { rep(s, 0.04); return 'Your audience trusts you more for it.'; } },
    ],
  };
  E.wholesale = {
    kind: 'biz', title: 'A retail buyer calls', w: 1.5, when: (s) => open(s) && ['foodbrand', 'candles', 'skincare', 'apparel', 'mushroom', 'apiary'].includes(s.biz.tid),
    text: () => 'A regional grocery chain wants to carry your products in 40 stores. Slotting fees, a big first order, and net-60 payment.',
    choices: () => [
      { label: 'Do it ($12,000 slotting + inventory)', fn: (s) => { bizPay(s, 12000); s.biz.ar.push({ w: s.week + 9, amt: 26000 }); s.biz.awareness = Math.min(100, s.biz.awareness + 15); return 'You are on real shelves. Payment comes in nine weeks.'; } },
      { label: 'Stay direct-to-consumer', fn: () => 'You keep control of your margins and your sanity.' },
    ],
  };
  E.pollination = {
    kind: 'biz', title: 'Almond pollination contract', w: 6, when: (s) => open(s) && s.biz.tid === 'apiary' && [0, 1].includes(U.monthOf(s.week)) && !s.flags['poll' + U.yearOf(s.week)],
    text: (s) => `California almond growers will pay $195 per hive to rent your ${s.biz.crop.units} colonies for February. ${s.loc.state === 'CA' ? 'You are already in California.' : 'You would truck them cross-country.'}`,
    choices: (s) => [
      { label: 'Send the bees', fn: (s) => { s.flags['poll' + U.yearOf(s.week)] = true; const n = s.biz.crop.units; const pay = n * 195 - (s.loc.state === 'CA' ? 0 : n * 35); s.biz.cash += pay; s.p.ytd.biz += pay; const lost = Math.round(n * (Math.random() * 0.2)); s.biz.crop.units -= lost; return `${M(pay)} for the season. ${lost} colonies did not survive the trip.`; } },
      { label: 'Keep them home', fn: (s) => { s.flags['poll' + U.yearOf(s.week)] = true; return 'Healthier bees, less money.'; } },
    ],
  };
  E.pests = {
    kind: 'biz', title: 'Pest outbreak', w: 2.5, when: (s) => open(s) && tpl(s).harvest && s.biz.crop.status === 'growing' && !tpl(s).harvest.indoor,
    text: () => 'Something is eating your crop. Leaves are spotted and wilting.',
    choices: (s) => [
      { label: `Treat it (${M(s.biz.crop.units * 250)})`, fn: (s) => { bizPay(s, s.biz.crop.units * 250); s.biz.crop.health -= 5; return 'Caught it early. Minor damage.'; } },
      { label: 'Go organic: hand-pick and pray', hint: 'Cheaper, riskier', fn: (s) => { s.biz.crop.health -= 25; s.p.stress += 5; return 'You lose a chunk of this cycle.'; } },
    ],
  };
  E.recall = {
    kind: 'biz', title: 'Regulatory problem', w: 1.5, when: (s) => hasRisk(s, 'recall') || hasRisk(s, 'regulatory'),
    text: (s) => `A ${tpl(s).cat === 'food' ? 'FDA labeling' : 'state regulator'} warning letter arrives. You have 15 days to fix the issue.`,
    choices: () => [
      { label: 'Hire a compliance consultant ($4,500)', fn: (s) => { bizPay(s, 4500); return 'Fixed properly. The file is closed.'; } },
      { label: 'Fix it yourself', hint: 'Science/finance skills', fn: (s) => { if (Math.random() < 0.3 + (s.p.skills.science + s.p.skills.finance) / 300) return 'You read the regulations twice and fix it.'; bizPay(s, 9000); rep(s, -0.15); return 'You missed something. A recall and fine follow.'; } },
    ],
  };
  E.aidisrupt = {
    kind: 'biz', title: 'A giant ships your feature', w: 1.5, when: (s) => open(s) && ['ai', 'saas', 'app'].includes(s.biz.tid),
    text: () => 'A big tech company just announced a free feature that does about 70% of what your product does.',
    choices: () => [
      { label: 'Go deeper on your niche', hint: 'Product focus', fn: (s) => { s.biz.focus = Math.min(s.biz.focus, 0.3); s.biz.subs *= 0.9; return 'You lose some customers but the ones who stay need you.'; } },
      { label: 'Cut prices 30%', fn: (s) => { s.biz.price *= 0.7; return 'Cheaper than "free" is impossible, but you try.'; } },
    ],
  };
  E.strban = {
    kind: 'biz', title: 'City cracks down on rentals', w: 2, when: (s) => open(s) && s.biz.tid === 'inn',
    text: (s) => `${s.loc.city} passes new short-term rental rules: a new registration, inspections and a cap on nights.`,
    choices: () => [
      { label: 'Comply ($3,000)', fn: (s) => { bizPay(s, 3000); return 'Licensed and legal. Your competitors who did not comply get fined.'; } },
      { label: 'Switch some units to monthly rentals', fn: (s) => { s.biz.price *= 0.85; return 'Steadier, lower income.'; } },
    ],
  };
  E.laborshort = {
    kind: 'biz', title: 'Nobody is applying', w: 1.5, when: (s) => open(s) && s.econ.phase === 'expansion' && s.biz.staff.length > 0,
    text: () => 'Your job posting has been up three weeks: two applicants, one did not show to the interview. Every business in town is hiring.',
    choices: () => [
      { label: 'Raise everyone\'s pay 6%', fn: (s) => { s.biz.staff.forEach((e) => { e.wage = Math.round(e.wage * 1.06 * 100) / 100; e.morale += 10; }); return 'Your team stays, and word gets around that you pay well.'; } },
      { label: 'Work more shifts yourself', fn: (s) => { s.p.schedule.biz = Math.min(100, s.p.schedule.biz + 10); s.p.stress += 8; return 'You are back on the line.'; } },
    ],
  };
  E.acquirer = {
    kind: 'biz', title: 'Acquisition interest', w: 1, when: (s) => open(s) && G.biz.enterpriseValue(s, s.biz) > 300000 && s.biz.hist.length > 40,
    text: (s) => `A larger company in your industry wants to talk about buying ${s.biz.name}.`,
    choices: (s) => [
      { label: 'Hear them out', fn: (s) => { s.eventQueue.push({ id: 'buyeroffer', data: { offer: Math.round(G.biz.enterpriseValue(s, s.biz) * (0.95 + Math.random() * 0.6) / 1000) * 1000, broker: false } }); return 'They send over a number.'; } },
      { label: 'Not interested', fn: () => 'You are building for the long run.' },
    ],
  };

  // ===================== Natural hazards =====================
  E.disaster = {
    kind: 'biz', title: (s, d) => `${G.HAZARDS[d.haz].label} in ${s.loc.city}`, w: 0, when: () => false,
    text: (s, d) => ({
      hurricane: `A hurricane makes landfall near ${s.loc.city}. Power is out across the region.`,
      tornado: `A tornado tears through the edge of ${s.loc.city}.`,
      wildfire: `Wildfire smoke turns the sky orange. Evacuation warnings cover parts of the county.`,
      flood: `Days of rain push the river over its banks in ${s.loc.city}.`,
      earthquake: `A magnitude 6.1 earthquake shakes the region.`,
      blizzard: `A blizzard buries ${s.loc.city} under two feet of snow. Roads are closed.`,
      drought: `Officials declare an extreme drought. Water restrictions take effect.`,
      heat: `A record heat wave: 112°F for nine days straight.`,
    }[d.haz]),
    choices: (s, d) => {
      const b = s.biz;
      const sev = d.sev;
      return [{ label: 'Deal with it', fn: (s) => {
        let msg = '';
        if (b && b.phase === 'open') {
          const t = tpl(s);
          if (t.harvest && !t.harvest.indoor && ['drought', 'heat', 'flood', 'hurricane', 'wildfire'].includes(d.haz)) {
            b.crop.weather = Math.min(b.crop.weather, 1 - sev * 0.5);
            msg += `Your crop takes a hit. `;
          }
          if (b.space || b.equipValue > 0) {
            const dmg = Math.round((b.equipValue * 0.15 + (b.space ? b.space.rentMo * 2 : 0)) * sev);
            if (dmg > 500) {
              if (b.ins.prop) { b.cash -= 2500; msg += `Property insurance covers ${M(dmg)} of damage after a $2,500 deductible. `; }
              else { b.cash -= dmg; msg += `${M(dmg)} of uninsured damage. `; }
            }
          }
          if (!t.online) { b.flags.closedWeeks = Math.round(1 + sev * 2); msg += `You are closed for about ${b.flags.closedWeeks} week${b.flags.closedWeeks > 1 ? 's' : ''}. `; }
        }
        if (['hurricane', 'flood', 'tornado', 'earthquake'].includes(d.haz) && Math.random() < sev * 0.5) { s.p.cash -= 1500; msg += 'Your apartment has damage too: $1,500 out of pocket. '; }
        return msg || 'You make it through with minor inconvenience.';
      } }];
    },
  };

  // ---------- Selection ----------
  function rollRandom(s) {
    const p = (open(s) ? 0.38 : 0.22);
    if (Math.random() > p) return null;
    const pool = Object.entries(E).filter(([id, e]) => e.w > 0 && (!e.when || e.when(s)) && (s.flags['ev_' + id] == null || s.week - s.flags['ev_' + id] > 20));
    const pick = U.weighted(pool, ([, e]) => (typeof e.w === 'function' ? e.w(s) : e.w));
    return pick ? { id: pick[0] } : null;
  }

  function rollHazard(s) {
    const st = G.loc.state(s.loc.state);
    const m = U.monthOf(s.week);
    for (const h of st.haz) {
      if (!G.HAZARDS[h].months.includes(m)) continue;
      const base = { hurricane: 0.012, tornado: 0.008, wildfire: 0.01, flood: 0.006, earthquake: 0.0015, blizzard: 0.01, drought: 0.008, heat: 0.008 }[h];
      if (Math.random() < base) return { id: 'disaster', data: { haz: h, sev: U.clamp(0.3 + Math.random() * 0.7, 0, 1) } };
    }
    return null;
  }

  // Prepare the next event for display.
  function next(s) {
    if (s.event) return s.event;
    const ev = s.eventQueue.shift();
    if (!ev) return null;
    const def = E[ev.id];
    if (!def || (def.when && def.w > 0 && !def.when(s) && !['joboffer'].includes(ev.id))) return next(s);
    const data = ev.data || {};
    try {
      s.event = { id: ev.id, data, title: typeof def.title === 'function' ? def.title(s, data) : def.title, kind: def.kind, text: def.text(s, data), choices: def.choices(s, data).map((c) => ({ label: c.label, hint: c.hint || '', disabled: !!c.disabled })) };
    } catch (e) {
      s.event = null;
      return next(s);
    }
    s.flags['ev_' + ev.id] = s.week;
    return s.event;
  }

  function choose(s, idx) {
    const ev = s.event;
    if (!ev) return '';
    const def = E[ev.id];
    const choices = def.choices(s, ev.data);
    const c = choices[idx];
    s.event = null;
    if (!c) return '';
    const res = c.fn(s, ev.data) || '';
    G.journal.add(s, ev.kind === 'biz' ? 'biz' : 'life', `${ev.title}: ${c.label}. ${res}`);
    return res;
  }

  return { E, rollRandom, rollHazard, next, choose, payClaim };
})();
