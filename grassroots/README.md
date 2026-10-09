# Grassroots

A political career simulator in the spirit of *The Political Process*. Pick any state, city and ZIP code in the United States, build a candidate, and climb from school board to the White House: win primaries and general elections against hundreds of AI politicians, write laws, balance budgets, fight your way up the leadership ladder, and raise a family that can carry on your dynasty.

## Play

Open `index.html` in a browser. No build step or server is needed. Games save in your browser's local storage, and the Menu can copy a save code you can paste on the title screen anywhere.

For a local server instead: `python3 -m http.server` in this folder, then visit http://localhost:8000.

## How it plays

- **Start anywhere.** Choose a state on the US map, then enter any real residential ZIP code (about 33,000 of them) or pick a city. Your ZIP decides your city council ward, school board district, state house and state senate districts, and congressional district. Districts are drawn from real ZIP code populations, and each one has its own partisan lean and profile: population, density, income, poverty, education, age, veterans, gun owners, union members and more.
- **Build a character.** Name, gender, age, party (Democrat or Republican), a cartoon portrait, upbringing, education, occupation, two traits, five skills (charisma, debate, policy, fundraising, grassroots) and positions on 54 policies across 12 categories. Your fiscal and social ideology and caucus follow from those positions.
- **Weeks and hours.** Each Next Turn is one week. A day job costs about 18 hours of your 40. Spend the rest campaigning, governing, networking, studying, dating or with your family.
- **Nine offices.** School board, city council, mayor, state house, state senate, U.S. House, governor, U.S. Senate and President, each on its real election cycle (local races in odd years, governors on each state's schedule, Senate seats by class, filing deadlines in March, primaries in June, generals in November).
- **Campaigns.** The tabs follow the classic layout: Overview (campaign manager, opportunities, finances, name recognition, voter enthusiasm by party, effect on public opinion, Predict Election), Events (rallies, town halls, door-knocking by county or neighborhood, donor calls, fundraisers, interviews, debate prep, opposition research), Marketing (TV, radio, digital and mail ads with positive, contrast or attack tone), Opponents, Poll Data, Finance, Contacts (endorsements from interest groups and officeholders), Staff, Policy (promote positions to move each party's enthusiasm), Volunteers (offices that recruit and canvass) and a Campaign Map colored by projected margin.
- **Votes come from voters.** Every district is a mix of Democrats, Republicans and independents. Each group weighs party loyalty, how much your positions excite them, name recognition, money, ground game, endorsements, incumbency, debates and scandals. Results are reported county by county or neighborhood by neighborhood.
- **A living world.** Every seat in your state (all of New Hampshire's 400 House seats included) is held by an AI politician with a career, ideology, traits and ambitions. They retire, run for higher office, lose primaries and get appointed to vacancies. Other states' congressional and Senate races follow the national environment, and the presidency is contested state by state.
- **Governing runs on relationships and respect.** Colleagues vote on your bills based on their views, their districts, their party *and how much they like and respect you*. Build relationships over coffee, at caucus meetings, by co-sponsoring and voting for their bills, campaigning for them and donating from your war chest. Ask for pledges, check the whip count, trade votes, and keep your word, or watch respect collapse.
- **Leadership.** After each election, run for Assistant Whip, Whip, Caucus Chair, Majority or Minority Leader, Speaker or President pro tempore. Caucus members vote one by one based on their relationship with you and your rival. Leaders control which bills reach the floor, and committee chairs decide what advances.
- **Laws change the world.** Bills move policies one option at a time through committee, the floor, the other chamber and the executive (with vetoes and overrides). Laws and budgets move metrics like unemployment, growth, income, poverty, crime, uninsured rate, graduation, rent and emissions, and executives are judged on them. Executives propose yearly budgets and can issue executive orders.
- **Presidential runs.** Nominating contests from Iowa to the final primaries with proportional delegates, a convention, a running mate, and an Electoral College map.
- **Life.** Date, marry, have or adopt kids, keep your family close (or not), manage money, health and stress, go back to school, change jobs, move. When you die or retire, an adult child can carry on the family name.

## Code layout

```
index.html              entry point
css/style.css           visual system (manila folder tabs, black-banded tables; light and dark)
js/util.js              helpers, seeded random numbers, calendar
js/data/                states, 54 policy positions, characters, offices, leadership, committees, groups
js/geo/                 per-state ZIP, city and county data plus map outlines (loaded on demand)
js/engine/              geography and districts, world, elections, campaign, government, presidency,
                        debates, life, events, weekly turn, save/load
js/ui/                  rendering core and portraits, character creation, game shell, tabs
tools/                  scripts that build the state and geography data files
```

The engine has no DOM dependencies, so it loads in Node for headless testing.

## Data

ZIP code, city, county and population data come from the SimpleMaps US ZIP code database (CC BY 4.0), via the `zipcode-detail-lookup` package. State and county outlines come from the U.S. Census Bureau via `us-atlas` (ISC). Partisan leans, legislature sizes, salaries and election cycles are approximate mid-2020s values. All politicians in the game are fictional. This is a game, not a forecast.
