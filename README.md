# Self Made

A realistic American entrepreneur life simulator that runs in the browser. Build a character, start anywhere in the United States, work a day job, save up, and try to turn any idea into a living.

## Play

Open `index.html` in a browser. No build step or server is needed. Saves are kept in your browser's local storage; you can also copy a save as text from the Money tab and import it from the title screen.

For a local server instead: `python3 -m http.server` and visit http://localhost:8000.

## What makes it different

- **Time is a currency.** Every week has 168 hours. Sleep, your day job, commute, chores, family, networking, classes and the business all compete. Short sleep and long weeks raise stress, lower productivity and can burn you out for weeks.
- **Real places.** All 50 states and DC with income tax, minimum wage, sales tax, LLC filing and annual fees, cost of living, median income, Medicaid expansion, growing climate, natural hazards and industry clusters. 240+ cities, or type in your own town.
- **Any business.** 59 business types across food, retail, tech, publishing, agriculture, biotech, services, trades, manufacturing, logistics, hospitality, health and real estate, plus a builder for your own idea. They run on five engines:
  - **Customers**: market size, competitors, awareness, reputation, price elasticity, staffing, opening-hour coverage, backlog and payment terms.
  - **Recurring revenue**: subscribers, churn, product quality, paid acquisition, sales hours, and capacity-limited local memberships (gyms, daycare).
  - **Releases**: books, games, videos and house flips that sell over time, with rare breakout hits.
  - **Harvests**: crops and livestock tied to your state's growing season, labor, weather and commodity prices.
  - **Research**: biotech milestones, phase funding, SBIR grants, and pharma licensing or acquisition offers.
- **A real launch checklist.** Entity registration, EIN, licenses with processing times, leases you personally guarantee, build-outs, equipment, inventory, insurance, and the actual work of building the product.
- **Two wallets.** Personal and business accounts, credit score, credit cards, student loans, SBA 7(a) and microloans, equipment financing, USDA farm loans, revenue-based financing, hard money, crowdfunding, grants, angels and VCs (with board pressure).
- **Taxes that bite.** Federal brackets, state tax, self-employment tax, the QBI deduction, quarterly estimates, underpayment penalties, S-corp and C-corp options, capital gains when you sell.
- **Buy other companies.** Once you are big enough, a deal marketplace lists businesses for sale in any industry, from Main Street shops to middle-market companies. Pay for due diligence or risk inflated earnings, finance with SBA or seller notes, put a GM in charge or run it yourself, reinvest, and sell.
- **Give it away.** Donate to nine causes with real-world impact rates, earn naming rights on $1M gifts, join nonprofit boards, and endow a private foundation that must pay out 5% a year. Gifts are deductible under the 2026 itemizing rules.
- **Life happens.** Health insurance (lose it when you quit), hospital bills, relationships that need your time, kids, car trouble, recessions, Fed rate moves, hurricanes, lawsuits, inspections, poached employees, viral moments and acquisition offers.
- **A written story.** A journal records your life as it happens, and your legacy is scored against the reason you chose at the start.

## Code layout

```
index.html            entry point
css/style.css         visual system (highway-signage inspired, light and dark)
js/util.js            helpers, calendar, formatting
js/data/              states & cities, character options, jobs, business templates
js/engine/            state, finance & taxes, economy, life, business engines, events, weekly sim
js/ui/                rendering core, title & character creation, main game screen
```

The engine has no DOM dependencies, so it can be loaded in Node for headless balance testing.

Figures are approximate 2025–2026 values, simplified for play. This is a game, not financial or legal advice.
