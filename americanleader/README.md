# American Leader

A political simulation of American government, built on the *World Leader* engine and look. You
start as the newly elected mayor of one of 22 real American cities. Win reelection, run for
governor of your state, then for president.

Open `index.html` in a browser. No build step and no server. The game autosaves every week;
**Continue** on the title screen resumes your save. Keys: **Space** advances a week, **1–9** pick an
option.

## The cities

Atlanta, Phoenix, Milwaukee, Philadelphia, Las Vegas, Detroit, San Francisco, Seattle, Portland
(Oregon), Austin, Houston, Chicago, New Orleans, Honolulu, Minneapolis, Buffalo, New York City,
Providence, Portland (Maine), Burlington, Albuquerque and Anchorage.

Each has its real form of government (strong mayor or council-manager, veto and override rules,
recall, term limits), a council of the real size and name (Chicago's 50 aldermen, San Francisco's
Board of Supervisors, Anchorage's Assembly), realistic budgets, structural gaps, pension health and
credit ratings, the revenue sources it actually relies on (Philadelphia's wage tax, Houston's
revenue cap, Seattle's JumpStart tax), its power groups, natural hazards, economy (industry mix
and biggest employers), and its own crises as decision scenes.

Their 20 states have their real governor's party, legislative split and attitude toward their
cities: Texas preempts Austin and Houston every session, Louisiana sends State Police into the
French Quarter, Albany controls New York City's taxes and rents.

## Governing

- **Major issues.** Homelessness, housing costs, food costs and grocery deserts, low wages, economic
  diversification, roads, water and sewer, crime, police trust, schools, transit, disasters, jobs
  and basic services. Each shows how bad it is, real numbers, its trend and the laws and orders that
  address it. Pick up to three priorities: your staff focuses on them and voters judge you on them.
- **The council, legislature or Congress.** Every member is a person with a district, bloc
  (progressives, mainstream Democrats, moderates, old guard, conservatives), party, loyalty,
  ambition, grudges and a pet issue. Committee chairs can bury bills; whip counts show where every
  vote stands. Meet members, promise projects, lean on them, file discharge petitions, water bills
  down. Members introduce their own ordinances, which land on your desk to sign or veto, and veto
  overrides are real fights.
- **Demands.** Members want recreation centers, police patrols, jobs for allies, contracts for
  friends and your backing for their bills. Grant them, split the difference or refuse, and they
  remember.
- **The budget.** Budget season opens three months before the fiscal year. Set department funding
  and the tax rates you control, choose whether to make the full pension payment, draw on the
  rainy-day fund, and get it through. State and city budgets must balance; miss the deadline and
  you run on last year's numbers (or, in Washington, shut down).
- **Above you.** The governor and the President preempt your laws, threaten takeovers of your
  police and schools, freeze grants, send troopers or troops, approve or deny disaster aid, and
  offer deals. Party and relations decide how hard they push.
- **Intrigue.** FBI probes of steered contracts, staff scandals, leaks, council investigations of
  your administration, rivals who build campaigns against you, and recall drives where the law
  allows them.
- **Events.** Hurricanes, floods, heat waves, blizzards, earthquakes, freezes, tsunamis and
  chemical explosions by city; shootings, police shootings and mass shootings; strikes; companies
  coming and going; ICE raids; overdose spikes; collapsing infrastructure.

## The career

Mayors serve one term and must win reelection (nonpartisan first rounds and runoffs, or partisan
primaries where cities have them). Once reelected you can run for governor when your state's race
comes up. As governor you work a two-chamber legislature, every mayor in the state asks you for
money, and the President meddles. From there, run for president: primaries, then the Electoral
College. Lose an election or a recall and your career ends with a legacy score.

## Code

```
index.html              entry point
css/style.css           World Leader's situation-room look
js/portrait.js          portraits (from World Leader)
js/data_places.js       cities, states, Washington, city economies
js/data_rules.js        conditions, power groups, departments, laws, staff, issues
js/engine.js            time, conditions, approval, money, groups, overseers, saves
js/politics.js          members, councils and legislatures, votes, bills, demands, lobbying
js/sim.js               the week, budget season, intrigue, events, elections, promotions
js/scenes.js            decision scenes
js/scenes_cities.js     each city's own scenes
js/ui.js, js/main.js    screens, views and input
```
