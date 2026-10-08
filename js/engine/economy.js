// The macro economy: business cycle, interest rates, inflation, housing and freight markets.
var G = globalThis.G || (globalThis.G = {});

G.econ = (function () {
  const U = G.util;
  const PHASES = {
    expansion: { label: 'Expansion', demand: 1.03, next: [['slowdown', 0.035]] },
    slowdown: { label: 'Slowdown', demand: 0.97, next: [['recession', 0.12], ['expansion', 0.1]] },
    recession: { label: 'Recession', demand: 0.86, next: [['recovery', 0.11]] },
    recovery: { label: 'Recovery', demand: 0.95, next: [['expansion', 0.14]] },
  };

  function init() {
    return { phase: 'expansion', months: 8, rate: 3.75, infl: 2.8, mult: 1.0, housing: 1.0, freight: 0.95, confidence: 62, last: '' };
  }

  function month(s) {
    const e = s.econ;
    e.months += 1;
    const ph = PHASES[e.phase];
    for (const [to, p] of ph.next) {
      if (e.months > 3 && Math.random() < p) {
        e.phase = to; e.months = 0;
        const msg = {
          slowdown: 'Economists warn of a slowdown. Hiring is cooling and consumers are pulling back a little.',
          recession: 'It is official: the economy is in recession. Layoffs are spreading and people are cutting back on extras.',
          recovery: 'The worst seems to be over. Consumer spending is slowly coming back.',
          expansion: 'The economy is growing again. Customers are spending, and so are your competitors.',
        }[to];
        G.journal.add(s, 'econ', msg);
        e.last = msg;
        break;
      }
    }
    // Demand drifts toward its phase target.
    e.mult = U.lerp(e.mult, PHASES[e.phase].demand, 0.35) + U.gauss() * 0.005;
    e.confidence = U.clamp(Math.round(U.lerp(e.confidence, { expansion: 68, slowdown: 55, recession: 40, recovery: 52 }[e.phase], 0.3)), 20, 95);
    // The Fed responds to the cycle.
    const target = { expansion: 4.0, slowdown: 3.5, recession: 1.5, recovery: 2.5 }[e.phase];
    if (Math.random() < 0.35) {
      const step = target > e.rate + 0.2 ? 0.25 : target < e.rate - 0.2 ? -0.25 : 0;
      if (step) {
        e.rate = Math.max(0.25, Math.round((e.rate + step) * 100) / 100);
        G.journal.add(s, 'econ', `The Federal Reserve ${step > 0 ? 'raises' : 'cuts'} rates to ${e.rate.toFixed(2)}%. The prime rate is now ${(e.rate + 3).toFixed(2)}%.`);
      }
    }
    e.infl = U.clamp(U.lerp(e.infl, { expansion: 3.0, slowdown: 2.6, recession: 1.6, recovery: 2.2 }[e.phase], 0.15) + U.gauss() * 0.1, 0.5, 7);
    // Housing prices follow rates and demand.
    e.housing = U.clamp(e.housing * (1 + (0.004 - (e.rate - 3.5) * 0.002 + (e.mult - 1) * 0.04) + U.gauss() * 0.006), 0.6, 1.8);
    e.freight = U.clamp(U.lerp(e.freight, e.mult * 0.98, 0.25) + U.gauss() * 0.03, 0.7, 1.3);
  }

  const label = (s) => PHASES[s.econ.phase].label;
  return { init, month, label, PHASES };
})();
