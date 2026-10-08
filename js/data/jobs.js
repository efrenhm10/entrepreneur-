// Day jobs. Wages are national-average base pay per hour; the game scales them by
// the local wage index and never pays below the state minimum wage.
// tips: average tips per hour. flex: you pick the hours (gig work, no withholding).
// req: minimum skills / education / credentials. trains: skill gains per 40 hours.
var G = globalThis.G || (globalThis.G = {});

G.JOBS = [
  { id: 'barista', title: 'Barista', wage: 13.5, tips: 3, hours: 30, xp: 'food', trains: { craft: 1, sales: 0.5 } },
  { id: 'linecook', title: 'Line cook', wage: 17.5, hours: 40, xp: 'food', trains: { craft: 1.4 } },
  { id: 'server', title: 'Restaurant server', wage: 9, tips: 14, hours: 30, xp: 'food', trains: { sales: 1 } },
  { id: 'bartender', title: 'Bartender', wage: 10, tips: 17, hours: 32, xp: 'hospitality', trains: { sales: 1, craft: 0.4 } },
  { id: 'retail', title: 'Retail sales associate', wage: 15, hours: 32, xp: 'retail', trains: { sales: 1 } },
  { id: 'warehouse', title: 'Warehouse associate', wage: 19.5, hours: 40, benefits: true, xp: 'logistics', trains: { craft: 0.4, management: 0.3 } },
  { id: 'gig', title: 'Delivery & rideshare driver', wage: 21, hours: 0, flex: true, needsCar: true, costPerHour: 6, xp: 'logistics', trains: {} },
  { id: 'farmhand', title: 'Farmhand', wage: 16.5, hours: 45, xp: 'ag', trains: { craft: 1.2 } },
  { id: 'landscaper', title: 'Landscaping crew', wage: 17.5, hours: 40, xp: 'services', trains: { craft: 1 } },
  { id: 'cleaner', title: 'House cleaner', wage: 16.5, hours: 35, xp: 'services', trains: { craft: 0.5 } },
  { id: 'caregiver', title: 'Home caregiver', wage: 17.5, hours: 40, xp: 'health', trains: { management: 0.3 } },
  { id: 'laborer', title: 'Construction laborer', wage: 21, hours: 40, xp: 'trades', trains: { craft: 1.2 } },
  { id: 'apprentice', title: 'Electrician apprentice', wage: 20, hours: 40, benefits: true, xp: 'trades', trains: { craft: 1.5, science: 0.2 } },
  { id: 'assembler', title: 'Manufacturing technician', wage: 22, hours: 40, benefits: true, xp: 'making', trains: { craft: 1, tech: 0.3 } },
  { id: 'cellar', title: 'Brewery cellar worker', wage: 18, hours: 40, xp: 'food', trains: { craft: 1, science: 0.3 } },
  { id: 'admin', title: 'Office administrator', wage: 21, hours: 40, benefits: true, req: { edu: 'hs' }, xp: 'services', trains: { management: 0.6, finance: 0.5 } },
  { id: 'teller', title: 'Bank teller', wage: 19, hours: 40, benefits: true, req: { edu: 'hs' }, xp: 'finance', trains: { finance: 1, sales: 0.3 } },
  { id: 'support', title: 'Customer support rep', wage: 20, hours: 40, benefits: true, req: { edu: 'hs' }, xp: 'tech', trains: { tech: 0.5, sales: 0.4 } },
  { id: 'sdr', title: 'Sales development rep', wage: 25, commission: 7, hours: 45, benefits: true, req: { sales: 25 }, xp: 'tech', trains: { sales: 1.6 } },
  { id: 'trucker', title: 'Truck driver (CDL)', wage: 30, hours: 55, benefits: true, req: { cred: 'cdl' }, xp: 'logistics', trains: { craft: 0.2 } },
  { id: 'stylist', title: 'Hair stylist', wage: 16, tips: 9, hours: 35, req: { cred: 'cosmetology' }, xp: 'services', trains: { craft: 1, sales: 0.5 } },
  { id: 'electrician', title: 'Licensed electrician / plumber', wage: 36, hours: 42, benefits: true, req: { cred: 'trade', craft: 45 }, xp: 'trades', trains: { craft: 1 } },
  { id: 'realtor', title: 'Real estate agent', wage: 28, hours: 0, flex: true, volatile: true, req: { cred: 'realestate' }, xp: 'realestate', trains: { sales: 1.2 } },
  { id: 'marketing', title: 'Marketing coordinator', wage: 27, hours: 40, benefits: true, req: { edu: 'bach' }, xp: 'media', trains: { sales: 0.8, creative: 0.8 } },
  { id: 'editorial', title: 'Editorial assistant', wage: 22, hours: 40, benefits: true, req: { edu: 'bach', creative: 25 }, xp: 'media', trains: { creative: 1.2 } },
  { id: 'designer', title: 'Graphic designer', wage: 29, hours: 40, benefits: true, req: { creative: 40 }, xp: 'media', trains: { creative: 1, tech: 0.3 } },
  { id: 'freelance', title: 'Freelancer (your best skill)', wage: 0, hours: 0, flex: true, xp: null, trains: {} },
  { id: 'teacher', title: 'Public school teacher', wage: 31, hours: 45, benefits: true, req: { edu: 'bach' }, xp: 'services', trains: { management: 0.8, creative: 0.3 } },
  { id: 'labtech', title: 'Lab technician', wage: 25, hours: 40, benefits: true, req: { edu: 'bach', science: 30 }, xp: 'bio', trains: { science: 1.3 } },
  { id: 'analyst', title: 'Data analyst', wage: 39, hours: 40, benefits: true, req: { edu: 'bach', tech: 30 }, xp: 'tech', trains: { tech: 0.8, finance: 0.6 } },
  { id: 'accountant', title: 'Staff accountant', wage: 36, hours: 45, benefits: true, req: { edu: 'bach', finance: 40 }, xp: 'finance', trains: { finance: 1.5 } },
  { id: 'nurse', title: 'Registered nurse', wage: 46, hours: 36, benefits: true, req: { edu: 'bach', science: 35 }, xp: 'health', trains: { science: 0.6, management: 0.4 } },
  { id: 'pm', title: 'Project manager', wage: 46, hours: 45, benefits: true, req: { edu: 'bach', management: 40 }, xp: 'tech', trains: { management: 1.4 } },
  { id: 'swe', title: 'Software engineer', wage: 64, hours: 42, benefits: true, req: { tech: 50 }, xp: 'tech', trains: { tech: 1.3 } },
  { id: 'scientist', title: 'Research scientist', wage: 52, hours: 45, benefits: true, req: { edu: 'phd', science: 55 }, xp: 'bio', trains: { science: 1.4 } },
  { id: 'consultant', title: 'Management consultant', wage: 72, hours: 55, benefits: true, req: { edu: 'master', finance: 45 }, xp: 'finance', trains: { management: 1, finance: 1, sales: 0.6 } },
];

G.EDU_RANK = { none: 0, hs: 1, trade: 1, assoc: 2, bach: 3, master: 4, phd: 5 };

G.jobs = (function () {
  const byId = {};
  G.JOBS.forEach((j) => { byId[j.id] = j; });

  function qualifies(p, j) {
    const r = j.req || {};
    if (r.edu && (G.EDU_RANK[p.edu] || 0) < G.EDU_RANK[r.edu]) return false;
    if (r.cred && !p.creds.includes(r.cred)) return false;
    for (const k of Object.keys(G.SKILLS)) if (r[k] && p.skills[k] < r[k]) return false;
    if (j.needsCar && p.transport !== 'car') return false;
    return true;
  }

  function bestSkill(p) {
    return Object.keys(G.SKILLS).filter((k) => ['tech', 'creative', 'finance', 'sales', 'science'].includes(k))
      .sort((a, b) => p.skills[b] - p.skills[a])[0];
  }

  // Hourly pay for this job in this place.
  function wageFor(j, p, L) {
    const st = G.loc.state(L.state);
    let w = j.wage;
    if (j.id === 'freelance') w = 14 + p.skills[bestSkill(p)] * 0.55;
    w = w * G.loc.wageIndex(L);
    return Math.max(st.mw, Math.round(w * 100) / 100);
  }

  return { byId, qualifies, wageFor, bestSkill };
})();
