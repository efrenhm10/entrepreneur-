// State and city data. Figures are approximate 2025 values, rounded for play:
// income tax (low/high marginal %), minimum wage ($/hr), combined avg sales tax %,
// LLC filing fee and yearly report/franchise fee ($), cost-of-living index (US = 100),
// median household income ($k), Medicaid expansion, growing climate, natural hazards,
// and local industry clusters that boost matching businesses.
// City rows: [name, population (thousands), cost-of-living index, 1BR rent $/mo, tags]
var G = globalThis.G || (globalThis.G = {});

G.STATES = [
  { ab: 'AL', name: 'Alabama', tax: [2, 5], mw: 7.25, st: 9.29, llc: 200, ann: 50, col: 88, inc: 62, mx: false, clim: 'warm', haz: ['hurricane', 'tornado'], ind: ['aerospace', 'manufacturing'],
    cities: [['Birmingham', 196, 90, 1100, 'healthcare food'], ['Huntsville', 225, 93, 1250, 'tech aerospace college'], ['Montgomery', 196, 85, 950, 'government'], ['Mobile', 183, 87, 1000, 'port tourism'], ['Tuscaloosa', 110, 88, 1050, 'college']] },
  { ab: 'AK', name: 'Alaska', tax: [0, 0], mw: 11.91, st: 1.82, llc: 250, ann: 50, col: 125, inc: 86, mx: true, clim: 'cold', haz: ['earthquake', 'blizzard'], ind: ['energy', 'fishing', 'tourism'],
    cities: [['Anchorage', 287, 125, 1350, 'energy outdoor'], ['Fairbanks', 32, 120, 1200, 'college outdoor'], ['Juneau', 32, 130, 1450, 'government tourism']] },
  { ab: 'AZ', name: 'Arizona', tax: [2.5, 2.5], mw: 14.7, st: 8.38, llc: 50, ann: 0, col: 107, inc: 77, mx: true, clim: 'hot', haz: ['heat', 'wildfire', 'drought'], ind: ['tech', 'tourism', 'retirement'],
    cities: [['Phoenix', 1650, 105, 1450, 'tech retirement'], ['Tucson', 545, 97, 1100, 'college retirement'], ['Scottsdale', 245, 125, 1900, 'affluent tourism retirement'], ['Flagstaff', 77, 115, 1500, 'college outdoor'], ['Mesa', 510, 103, 1400, 'retirement'], ['Sedona', 10, 130, 1800, 'tourism art affluent']] },
  { ab: 'AR', name: 'Arkansas', tax: [2, 3.9], mw: 11, st: 9.45, llc: 45, ann: 150, col: 89, inc: 58, mx: true, clim: 'warm', haz: ['tornado', 'flood'], ind: ['retail', 'ag', 'logistics'],
    cities: [['Little Rock', 202, 88, 1000, 'government healthcare'], ['Fayetteville', 100, 95, 1050, 'college outdoor'], ['Bentonville', 58, 102, 1350, 'retail affluent outdoor'], ['Fort Smith', 90, 82, 850, 'manufacturing']] },
  { ab: 'CA', name: 'California', tax: [1, 13.3], mw: 16.5, st: 8.85, llc: 70, ann: 800, col: 139, inc: 96, mx: true, clim: 'warm', haz: ['wildfire', 'earthquake', 'drought'], ind: ['tech', 'entertainment', 'ag', 'biotech'],
    cities: [['Los Angeles', 3820, 175, 2400, 'film media music food'], ['San Francisco', 810, 200, 3200, 'tech affluent coffee food'], ['San Diego', 1380, 165, 2500, 'biotech beer tourism military'], ['San Jose', 970, 190, 2900, 'tech affluent'], ['Sacramento', 525, 125, 1700, 'government ag food'], ['Fresno', 545, 105, 1350, 'ag'], ['Oakland', 430, 165, 2300, 'tech art port food'], ['Santa Cruz', 62, 175, 2600, 'college outdoor tourism'], ['Napa', 79, 160, 2300, 'wine tourism affluent food'], ['Bakersfield', 410, 100, 1300, 'ag energy']] },
  { ab: 'CO', name: 'Colorado', tax: [4.4, 4.4], mw: 14.81, st: 7.81, llc: 50, ann: 25, col: 105, inc: 92, mx: true, clim: 'cold', haz: ['wildfire', 'blizzard', 'drought'], ind: ['outdoor', 'beer', 'aerospace', 'tech'],
    cities: [['Denver', 715, 125, 1800, 'tech beer outdoor'], ['Boulder', 105, 150, 2100, 'college tech outdoor affluent'], ['Colorado Springs', 490, 105, 1450, 'military outdoor'], ['Fort Collins', 170, 115, 1600, 'college beer'], ['Grand Junction', 66, 98, 1200, 'ag wine outdoor'], ['Aspen', 7, 210, 3200, 'ski affluent tourism']] },
  { ab: 'CT', name: 'Connecticut', tax: [2, 6.99], mw: 16.35, st: 6.35, llc: 120, ann: 80, col: 113, inc: 91, mx: true, clim: 'temperate', haz: ['hurricane', 'blizzard'], ind: ['finance', 'insurance', 'manufacturing'],
    cities: [['Hartford', 120, 105, 1350, 'finance government'], ['New Haven', 135, 115, 1600, 'college biotech food'], ['Stamford', 136, 140, 2500, 'finance affluent'], ['Bridgeport', 148, 115, 1600, 'manufacturing']] },
  { ab: 'DE', name: 'Delaware', tax: [2.2, 6.6], mw: 15, st: 0, llc: 110, ann: 300, col: 102, inc: 82, mx: true, clim: 'temperate', haz: ['hurricane', 'flood'], ind: ['finance', 'corporate', 'biotech'],
    cities: [['Wilmington', 71, 105, 1450, 'finance'], ['Dover', 39, 95, 1250, 'government'], ['Newark', 31, 100, 1350, 'college'], ['Rehoboth Beach', 2, 125, 1800, 'tourism']] },
  { ab: 'DC', name: 'District of Columbia', tax: [4, 10.75], mw: 17.95, st: 6, llc: 99, ann: 300, col: 148, inc: 106, mx: true, clim: 'temperate', haz: ['flood', 'heat'], ind: ['government', 'consulting', 'media'],
    cities: [['Washington', 680, 148, 2300, 'government finance media food affluent']] },
  { ab: 'FL', name: 'Florida', tax: [0, 0], mw: 14, st: 7, llc: 125, ann: 139, col: 102, inc: 73, mx: false, clim: 'hot', haz: ['hurricane', 'flood', 'heat'], ind: ['tourism', 'retirement', 'logistics'],
    cities: [['Miami', 450, 135, 2400, 'tourism finance food art'], ['Orlando', 320, 110, 1650, 'tourism'], ['Tampa', 400, 110, 1750, 'finance port'], ['Jacksonville', 990, 98, 1350, 'port military logistics'], ['Tallahassee', 200, 95, 1200, 'college government'], ['Gainesville', 145, 95, 1200, 'college'], ['Key West', 26, 160, 2600, 'tourism'], ['The Villages', 80, 100, 1500, 'retirement']] },
  { ab: 'GA', name: 'Georgia', tax: [5.39, 5.39], mw: 7.25, st: 7.38, llc: 100, ann: 50, col: 93, inc: 75, mx: false, clim: 'warm', haz: ['hurricane', 'tornado', 'heat'], ind: ['film', 'logistics', 'ag'],
    cities: [['Atlanta', 510, 108, 1750, 'film tech music food logistics'], ['Savannah', 147, 98, 1450, 'tourism port art'], ['Athens', 128, 92, 1100, 'college music'], ['Augusta', 202, 87, 1050, 'military healthcare'], ['Macon', 157, 82, 950, 'manufacturing']] },
  { ab: 'HI', name: 'Hawaii', tax: [1.4, 11], mw: 14, st: 4.5, llc: 50, ann: 15, col: 186, inc: 98, mx: true, clim: 'tropical', haz: ['hurricane', 'wildfire'], ind: ['tourism', 'ag', 'military'],
    cities: [['Honolulu', 345, 185, 2200, 'tourism military food'], ['Hilo', 47, 150, 1600, 'ag tourism'], ['Kahului', 28, 175, 2000, 'tourism']] },
  { ab: 'ID', name: 'Idaho', tax: [5.695, 5.695], mw: 7.25, st: 6.03, llc: 100, ann: 0, col: 103, inc: 74, mx: true, clim: 'cold', haz: ['wildfire', 'blizzard'], ind: ['ag', 'tech', 'outdoor'],
    cities: [['Boise', 237, 105, 1450, 'tech outdoor'], ['Idaho Falls', 66, 92, 1100, 'ag energy'], ["Coeur d'Alene", 56, 108, 1500, 'tourism outdoor'], ['Twin Falls', 53, 90, 1100, 'ag'], ['Sun Valley', 2, 175, 2600, 'ski affluent']] },
  { ab: 'IL', name: 'Illinois', tax: [4.95, 4.95], mw: 15, st: 8.86, llc: 150, ann: 75, col: 92, inc: 81, mx: true, clim: 'temperate', haz: ['tornado', 'blizzard'], ind: ['finance', 'food', 'logistics', 'ag'],
    cities: [['Chicago', 2660, 120, 1900, 'finance food logistics media music'], ['Springfield', 113, 85, 950, 'government'], ['Champaign', 89, 88, 1050, 'college tech'], ['Peoria', 110, 84, 950, 'manufacturing healthcare'], ['Naperville', 150, 115, 1750, 'affluent']] },
  { ab: 'IN', name: 'Indiana', tax: [3, 3], mw: 7.25, st: 7, llc: 95, ann: 32, col: 90, inc: 70, mx: true, clim: 'temperate', haz: ['tornado', 'blizzard'], ind: ['manufacturing', 'logistics', 'ag'],
    cities: [['Indianapolis', 880, 92, 1200, 'logistics healthcare'], ['Fort Wayne', 268, 85, 1000, 'manufacturing'], ['Bloomington', 80, 95, 1150, 'college'], ['Evansville', 115, 83, 900, 'manufacturing'], ['South Bend', 103, 86, 1000, 'college']] },
  { ab: 'IA', name: 'Iowa', tax: [3.8, 3.8], mw: 7.25, st: 6.94, llc: 50, ann: 30, col: 89, inc: 73, mx: true, clim: 'cold', haz: ['tornado', 'flood', 'blizzard'], ind: ['ag', 'insurance', 'manufacturing'],
    cities: [['Des Moines', 212, 92, 1100, 'insurance finance'], ['Cedar Rapids', 137, 88, 950, 'manufacturing'], ['Iowa City', 75, 98, 1150, 'college'], ['Ames', 66, 95, 1050, 'college ag'], ['Sioux City', 85, 84, 900, 'ag']] },
  { ab: 'KS', name: 'Kansas', tax: [5.2, 5.58], mw: 7.25, st: 8.65, llc: 160, ann: 50, col: 88, inc: 72, mx: false, clim: 'temperate', haz: ['tornado', 'drought'], ind: ['ag', 'aerospace', 'cattle'],
    cities: [['Wichita', 397, 85, 950, 'aerospace manufacturing'], ['Kansas City', 155, 88, 1050, 'logistics bbq'], ['Overland Park', 197, 98, 1300, 'affluent tech'], ['Lawrence', 95, 92, 1050, 'college'], ['Dodge City', 27, 80, 800, 'ag cattle rural']] },
  { ab: 'KY', name: 'Kentucky', tax: [4, 4], mw: 7.25, st: 6, llc: 40, ann: 15, col: 92, inc: 62, mx: true, clim: 'temperate', haz: ['flood', 'tornado'], ind: ['bourbon', 'manufacturing', 'horses'],
    cities: [['Louisville', 625, 92, 1100, 'bourbon food logistics'], ['Lexington', 320, 93, 1150, 'college horses bourbon'], ['Bowling Green', 75, 85, 950, 'manufacturing college'], ['Paducah', 27, 82, 850, 'art']] },
  { ab: 'LA', name: 'Louisiana', tax: [3, 3], mw: 7.25, st: 9.56, llc: 100, ann: 30, col: 91, inc: 60, mx: true, clim: 'warm', haz: ['hurricane', 'flood', 'heat'], ind: ['energy', 'food', 'tourism'],
    cities: [['New Orleans', 365, 103, 1450, 'food tourism music art'], ['Baton Rouge', 220, 92, 1150, 'energy college government'], ['Lafayette', 121, 88, 1000, 'energy food'], ['Shreveport', 180, 82, 900, 'gaming']] },
  { ab: 'ME', name: 'Maine', tax: [5.8, 7.15], mw: 14.65, st: 5.5, llc: 175, ann: 85, col: 112, inc: 72, mx: true, clim: 'cold', haz: ['blizzard', 'flood'], ind: ['tourism', 'fishing', 'food'],
    cities: [['Portland', 68, 125, 1800, 'food beer tourism art'], ['Bangor', 32, 100, 1200, 'healthcare'], ['Bar Harbor', 5, 125, 1700, 'tourism outdoor'], ['Lewiston', 37, 98, 1100, 'manufacturing']] },
  { ab: 'MD', name: 'Maryland', tax: [4.75, 9.0], mw: 15, st: 6, llc: 100, ann: 300, col: 115, inc: 98, mx: true, clim: 'temperate', haz: ['hurricane', 'flood'], ind: ['biotech', 'government', 'port'],
    cities: [['Baltimore', 565, 105, 1500, 'biotech port healthcare food'], ['Annapolis', 40, 130, 2100, 'government tourism'], ['Bethesda', 68, 165, 2600, 'biotech government affluent'], ['Frederick', 82, 115, 1650, 'biotech']] },
  { ab: 'MA', name: 'Massachusetts', tax: [5, 9], mw: 15, st: 6.25, llc: 500, ann: 500, col: 145, inc: 99, mx: true, clim: 'temperate', haz: ['blizzard', 'hurricane'], ind: ['biotech', 'education', 'tech'],
    cities: [['Boston', 650, 155, 3000, 'biotech college healthcare finance food'], ['Cambridge', 118, 170, 3200, 'biotech tech college'], ['Worcester', 206, 115, 1650, 'college healthcare'], ['Springfield', 155, 100, 1300, 'manufacturing'], ['Nantucket', 14, 220, 3500, 'tourism affluent']] },
  { ab: 'MI', name: 'Michigan', tax: [4.25, 4.25], mw: 12.48, st: 6, llc: 50, ann: 25, col: 91, inc: 69, mx: true, clim: 'cold', haz: ['blizzard', 'flood'], ind: ['auto', 'manufacturing', 'beer'],
    cities: [['Detroit', 633, 92, 1100, 'auto manufacturing music food'], ['Grand Rapids', 198, 95, 1300, 'beer furniture'], ['Ann Arbor', 123, 115, 1650, 'college tech'], ['Lansing', 112, 88, 1000, 'government'], ['Traverse City', 15, 105, 1400, 'tourism wine beer']] },
  { ab: 'MN', name: 'Minnesota', tax: [5.35, 9.85], mw: 11.13, st: 8.04, llc: 155, ann: 0, col: 95, inc: 87, mx: true, clim: 'cold', haz: ['blizzard', 'tornado', 'flood'], ind: ['medtech', 'corporate', 'ag'],
    cities: [['Minneapolis', 425, 108, 1500, 'corporate medtech food beer art'], ['Saint Paul', 303, 103, 1400, 'government'], ['Rochester', 121, 98, 1300, 'healthcare'], ['Duluth', 87, 95, 1150, 'outdoor port']] },
  { ab: 'MS', name: 'Mississippi', tax: [4.4, 4.4], mw: 7.25, st: 7.06, llc: 50, ann: 0, col: 85, inc: 55, mx: false, clim: 'warm', haz: ['hurricane', 'tornado', 'flood'], ind: ['ag', 'manufacturing', 'gaming'],
    cities: [['Jackson', 145, 84, 950, 'government healthcare'], ['Gulfport', 72, 86, 1050, 'tourism gaming port'], ['Oxford', 28, 95, 1200, 'college'], ['Hattiesburg', 48, 82, 950, 'college']] },
  { ab: 'MO', name: 'Missouri', tax: [2, 4.7], mw: 13.75, st: 8.39, llc: 50, ann: 0, col: 89, inc: 68, mx: true, clim: 'temperate', haz: ['tornado', 'flood'], ind: ['ag', 'biotech', 'logistics'],
    cities: [['Kansas City', 510, 92, 1200, 'food logistics art'], ['St. Louis', 280, 90, 1150, 'biotech beer healthcare'], ['Springfield', 170, 84, 950, 'logistics'], ['Columbia', 128, 90, 1050, 'college'], ['Branson', 13, 85, 1000, 'tourism music']] },
  { ab: 'MT', name: 'Montana', tax: [4.7, 5.9], mw: 10.55, st: 0, llc: 35, ann: 20, col: 104, inc: 70, mx: true, clim: 'cold', haz: ['wildfire', 'blizzard', 'drought'], ind: ['cattle', 'outdoor', 'energy'],
    cities: [['Billings', 120, 100, 1200, 'energy ag cattle'], ['Missoula', 77, 110, 1400, 'college outdoor beer'], ['Bozeman', 57, 125, 1800, 'outdoor tech college'], ['Helena', 34, 102, 1200, 'government'], ['Whitefish', 9, 135, 1900, 'ski tourism']] },
  { ab: 'NE', name: 'Nebraska', tax: [2.46, 5.2], mw: 13.5, st: 6.97, llc: 100, ann: 26, col: 92, inc: 74, mx: true, clim: 'cold', haz: ['tornado', 'blizzard', 'drought'], ind: ['ag', 'cattle', 'insurance'],
    cities: [['Omaha', 485, 92, 1150, 'insurance finance logistics'], ['Lincoln', 295, 90, 1050, 'college government'], ['Grand Island', 53, 85, 900, 'ag cattle'], ['Kearney', 34, 86, 950, 'ag college']] },
  { ab: 'NV', name: 'Nevada', tax: [0, 0], mw: 12, st: 8.24, llc: 425, ann: 350, col: 101, inc: 75, mx: true, clim: 'hot', haz: ['heat', 'drought', 'earthquake'], ind: ['tourism', 'gaming', 'logistics'],
    cities: [['Las Vegas', 660, 105, 1400, 'tourism gaming food music'], ['Reno', 275, 112, 1500, 'tech logistics gaming outdoor'], ['Henderson', 330, 108, 1500, 'retirement'], ['Carson City', 58, 100, 1300, 'government']] },
  { ab: 'NH', name: 'New Hampshire', tax: [0, 0], mw: 7.25, st: 0, llc: 100, ann: 100, col: 113, inc: 96, mx: true, clim: 'cold', haz: ['blizzard', 'flood'], ind: ['tech', 'tourism', 'manufacturing'],
    cities: [['Manchester', 115, 110, 1600, 'tech'], ['Portsmouth', 22, 130, 2100, 'tourism food'], ['Nashua', 91, 112, 1700, 'tech'], ['Concord', 44, 105, 1500, 'government']] },
  { ab: 'NJ', name: 'New Jersey', tax: [1.4, 10.75], mw: 15.49, st: 6.6, llc: 125, ann: 75, col: 114, inc: 99, mx: true, clim: 'temperate', haz: ['hurricane', 'flood'], ind: ['pharma', 'logistics', 'finance'],
    cities: [['Newark', 305, 115, 1700, 'port logistics'], ['Jersey City', 290, 140, 2700, 'finance'], ['Princeton', 31, 150, 2500, 'college biotech affluent'], ['Hoboken', 58, 150, 3000, 'affluent food'], ['Atlantic City', 38, 95, 1250, 'gaming tourism']] },
  { ab: 'NM', name: 'New Mexico', tax: [1.5, 5.9], mw: 12, st: 7.62, llc: 50, ann: 0, col: 93, inc: 62, mx: true, clim: 'hot', haz: ['wildfire', 'drought', 'heat'], ind: ['art', 'government', 'film'],
    cities: [['Albuquerque', 560, 95, 1150, 'film government'], ['Santa Fe', 89, 115, 1600, 'art tourism food'], ['Las Cruces', 113, 87, 950, 'ag college'], ['Taos', 6, 105, 1300, 'art ski']] },
  { ab: 'NY', name: 'New York', tax: [4, 10.9], mw: 15.5, st: 8.53, llc: 200, ann: 9, col: 125, inc: 82, mx: true, clim: 'cold', haz: ['blizzard', 'flood', 'hurricane'], ind: ['finance', 'media', 'publishing'],
    cities: [['New York City', 8300, 190, 3800, 'finance media publishing food art fashion tourism'], ['Buffalo', 275, 92, 1150, 'healthcare food'], ['Rochester', 210, 92, 1200, 'manufacturing college'], ['Albany', 100, 100, 1350, 'government'], ['Ithaca', 32, 112, 1600, 'college wine'], ['Hudson', 6, 130, 1900, 'art food artisan'], ['Syracuse', 145, 90, 1150, 'college']] },
  { ab: 'NC', name: 'North Carolina', tax: [4.25, 4.25], mw: 7.25, st: 6.99, llc: 125, ann: 200, col: 95, inc: 70, mx: true, clim: 'warm', haz: ['hurricane', 'flood'], ind: ['biotech', 'banking', 'furniture'],
    cities: [['Charlotte', 900, 100, 1550, 'finance'], ['Raleigh', 485, 102, 1500, 'tech biotech government'], ['Durham', 290, 100, 1450, 'biotech college food'], ['Asheville', 95, 110, 1600, 'beer tourism art food'], ['Wilmington', 120, 100, 1400, 'film tourism']] },
  { ab: 'ND', name: 'North Dakota', tax: [1.95, 2.5], mw: 7.25, st: 6.96, llc: 135, ann: 50, col: 94, inc: 76, mx: true, clim: 'cold', haz: ['blizzard', 'flood', 'drought'], ind: ['energy', 'ag'],
    cities: [['Fargo', 130, 93, 1000, 'ag tech'], ['Bismarck', 75, 95, 1050, 'government energy'], ['Williston', 30, 105, 1200, 'energy'], ['Grand Forks', 59, 90, 950, 'college ag']] },
  { ab: 'OH', name: 'Ohio', tax: [2.75, 3.5], mw: 10.7, st: 7.24, llc: 99, ann: 0, col: 93, inc: 69, mx: true, clim: 'temperate', haz: ['tornado', 'blizzard', 'flood'], ind: ['manufacturing', 'healthcare', 'consumer goods'],
    cities: [['Columbus', 910, 95, 1250, 'college insurance tech food'], ['Cleveland', 365, 88, 1100, 'healthcare manufacturing music'], ['Cincinnati', 310, 92, 1150, 'corporate beer'], ['Dayton', 135, 82, 900, 'aerospace'], ['Akron', 190, 83, 950, 'manufacturing']] },
  { ab: 'OK', name: 'Oklahoma', tax: [0.25, 4.75], mw: 7.25, st: 8.99, llc: 100, ann: 25, col: 86, inc: 62, mx: true, clim: 'warm', haz: ['tornado', 'drought', 'heat'], ind: ['energy', 'cattle', 'aerospace'],
    cities: [['Oklahoma City', 700, 87, 1050, 'energy government'], ['Tulsa', 410, 86, 1000, 'energy aerospace art'], ['Norman', 128, 89, 1050, 'college'], ['Stillwater', 50, 85, 900, 'college ag']] },
  { ab: 'OR', name: 'Oregon', tax: [4.75, 9.9], mw: 14.7, st: 0, llc: 100, ann: 100, col: 115, inc: 80, mx: true, clim: 'temperate', haz: ['wildfire', 'earthquake'], ind: ['beer', 'coffee', 'apparel', 'outdoor'],
    cities: [['Portland', 630, 120, 1650, 'beer coffee food art apparel'], ['Eugene', 178, 108, 1400, 'college outdoor'], ['Bend', 104, 120, 1750, 'outdoor beer tourism'], ['Salem', 178, 102, 1300, 'government ag'], ['Hood River', 8, 115, 1600, 'outdoor ag wine']] },
  { ab: 'PA', name: 'Pennsylvania', tax: [3.07, 3.07], mw: 7.25, st: 6.34, llc: 125, ann: 7, col: 97, inc: 76, mx: true, clim: 'temperate', haz: ['flood', 'blizzard'], ind: ['healthcare', 'education', 'manufacturing'],
    cities: [['Philadelphia', 1550, 105, 1600, 'healthcare college food art'], ['Pittsburgh', 300, 93, 1250, 'tech robotics healthcare college'], ['Harrisburg', 50, 92, 1150, 'government'], ['Lancaster', 58, 98, 1300, 'ag food artisan'], ['State College', 41, 100, 1350, 'college'], ['Erie', 92, 85, 950, 'manufacturing']] },
  { ab: 'RI', name: 'Rhode Island', tax: [3.75, 5.99], mw: 15, st: 7, llc: 150, ann: 50, col: 111, inc: 82, mx: true, clim: 'temperate', haz: ['hurricane', 'blizzard'], ind: ['design', 'healthcare', 'tourism'],
    cities: [['Providence', 190, 112, 1700, 'college art food design'], ['Newport', 25, 135, 2100, 'tourism affluent'], ['Warwick', 82, 108, 1500, '']] },
  { ab: 'SC', name: 'South Carolina', tax: [0, 6.2], mw: 7.25, st: 7.49, llc: 110, ann: 0, col: 95, inc: 67, mx: false, clim: 'warm', haz: ['hurricane', 'flood'], ind: ['manufacturing', 'tourism', 'auto'],
    cities: [['Charleston', 155, 110, 1750, 'tourism food port'], ['Columbia', 140, 90, 1150, 'college government'], ['Greenville', 72, 95, 1350, 'manufacturing food'], ['Myrtle Beach', 40, 95, 1300, 'tourism retirement']] },
  { ab: 'SD', name: 'South Dakota', tax: [0, 0], mw: 11.5, st: 6.11, llc: 150, ann: 50, col: 93, inc: 72, mx: true, clim: 'cold', haz: ['blizzard', 'tornado', 'drought'], ind: ['finance', 'ag', 'tourism'],
    cities: [['Sioux Falls', 205, 93, 1050, 'finance healthcare'], ['Rapid City', 77, 95, 1150, 'tourism outdoor'], ['Pierre', 14, 90, 950, 'government'], ['Brookings', 24, 88, 950, 'college ag']] },
  { ab: 'TN', name: 'Tennessee', tax: [0, 0], mw: 7.25, st: 9.55, llc: 300, ann: 300, col: 90, inc: 67, mx: false, clim: 'warm', haz: ['tornado', 'flood'], ind: ['music', 'healthcare', 'logistics'],
    cities: [['Nashville', 690, 107, 1700, 'music healthcare food tourism'], ['Memphis', 620, 85, 1000, 'logistics music food'], ['Knoxville', 195, 90, 1200, 'college outdoor'], ['Chattanooga', 185, 92, 1250, 'outdoor tech'], ['Gatlinburg', 4, 98, 1200, 'tourism']] },
  { ab: 'TX', name: 'Texas', tax: [0, 0], mw: 7.25, st: 8.2, llc: 300, ann: 0, col: 93, inc: 76, mx: false, clim: 'warm', haz: ['hurricane', 'heat', 'drought', 'tornado'], ind: ['energy', 'tech', 'cattle'],
    cities: [['Houston', 2300, 96, 1300, 'energy healthcare port food'], ['Austin', 980, 120, 1650, 'tech music food college'], ['Dallas', 1300, 104, 1500, 'corporate finance'], ['San Antonio', 1450, 92, 1150, 'military tourism food'], ['El Paso', 680, 85, 1000, 'logistics military'], ['Lubbock', 260, 85, 950, 'ag college cattle'], ['Marfa', 2, 100, 1200, 'art tourism'], ['Midland', 132, 105, 1400, 'energy']] },
  { ab: 'UT', name: 'Utah', tax: [4.55, 4.55], mw: 7.25, st: 7.25, llc: 59, ann: 18, col: 104, inc: 91, mx: true, clim: 'cold', haz: ['drought', 'earthquake', 'wildfire'], ind: ['tech', 'outdoor'],
    cities: [['Salt Lake City', 210, 112, 1450, 'tech outdoor'], ['Provo', 115, 102, 1250, 'college tech'], ['Park City', 8, 170, 2700, 'ski affluent tourism'], ['St. George', 100, 105, 1400, 'retirement outdoor'], ['Ogden', 87, 95, 1150, 'outdoor manufacturing']] },
  { ab: 'VT', name: 'Vermont', tax: [3.35, 8.75], mw: 14.01, st: 6.36, llc: 155, ann: 35, col: 115, inc: 78, mx: true, clim: 'cold', haz: ['flood', 'blizzard'], ind: ['dairy', 'food', 'tourism'],
    cities: [['Burlington', 45, 120, 1800, 'college food beer'], ['Montpelier', 8, 112, 1500, 'government'], ['Stowe', 5, 135, 1900, 'ski tourism'], ['Brattleboro', 12, 105, 1300, 'artisan art']] },
  { ab: 'VA', name: 'Virginia', tax: [2, 5.75], mw: 12.41, st: 5.77, llc: 100, ann: 50, col: 101, inc: 90, mx: true, clim: 'temperate', haz: ['hurricane', 'flood'], ind: ['government', 'defense', 'tech'],
    cities: [['Virginia Beach', 455, 100, 1450, 'military tourism'], ['Richmond', 230, 98, 1400, 'government food beer art'], ['Arlington', 235, 155, 2500, 'government tech affluent'], ['Charlottesville', 46, 112, 1600, 'college wine'], ['Roanoke', 100, 88, 1050, 'outdoor healthcare']] },
  { ab: 'WA', name: 'Washington', tax: [0, 0], mw: 16.66, st: 9.38, llc: 200, ann: 70, col: 116, inc: 94, mx: true, clim: 'temperate', haz: ['earthquake', 'wildfire'], ind: ['tech', 'aerospace', 'coffee', 'ag'],
    cities: [['Seattle', 755, 165, 2300, 'tech coffee food music'], ['Spokane', 230, 98, 1250, 'healthcare outdoor'], ['Tacoma', 220, 115, 1650, 'port military'], ['Bellevue', 152, 175, 2700, 'tech affluent'], ['Yakima', 97, 92, 1100, 'ag beer'], ['Walla Walla', 33, 100, 1200, 'wine ag']] },
  { ab: 'WV', name: 'West Virginia', tax: [2.22, 4.82], mw: 8.75, st: 6.55, llc: 100, ann: 25, col: 87, inc: 56, mx: true, clim: 'temperate', haz: ['flood'], ind: ['energy', 'outdoor'],
    cities: [['Charleston', 48, 88, 950, 'government energy'], ['Morgantown', 30, 92, 1100, 'college'], ['Huntington', 46, 84, 850, 'college healthcare'], ['Wheeling', 26, 84, 850, 'manufacturing']] },
  { ab: 'WI', name: 'Wisconsin', tax: [3.5, 7.65], mw: 7.25, st: 5.43, llc: 130, ann: 25, col: 96, inc: 74, mx: false, clim: 'cold', haz: ['blizzard', 'tornado', 'flood'], ind: ['dairy', 'beer', 'manufacturing'],
    cities: [['Milwaukee', 560, 92, 1150, 'beer manufacturing food'], ['Madison', 280, 105, 1450, 'college biotech tech food'], ['Green Bay', 107, 88, 1000, 'food manufacturing'], ['Eau Claire', 70, 90, 1000, 'college music'], ['Sturgeon Bay', 9, 100, 1150, 'tourism ag']] },
  { ab: 'WY', name: 'Wyoming', tax: [0, 0], mw: 7.25, st: 5.44, llc: 100, ann: 60, col: 93, inc: 72, mx: false, clim: 'cold', haz: ['blizzard', 'wildfire', 'drought'], ind: ['energy', 'cattle', 'tourism'],
    cities: [['Cheyenne', 65, 98, 1150, 'government'], ['Casper', 59, 95, 1050, 'energy'], ['Jackson', 10, 190, 2800, 'ski affluent tourism outdoor'], ['Laramie', 32, 94, 1050, 'college']] },
];

G.CLIMATES = {
  cold: { label: 'Short growing season', months: [3, 4, 5, 6] },
  temperate: { label: 'Four seasons', months: [2, 3, 4, 5, 6, 7] },
  warm: { label: 'Long growing season', months: [1, 2, 3, 4, 5, 6, 7, 8] },
  hot: { label: 'Winter growing season', months: [0, 1, 2, 8, 9, 10, 11] },
  tropical: { label: 'Year-round growing', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
};

G.HAZARDS = {
  hurricane: { label: 'Hurricanes', months: [5, 6, 7, 8, 9, 10] },
  tornado: { label: 'Tornadoes', months: [2, 3, 4, 5] },
  wildfire: { label: 'Wildfire', months: [6, 7, 8, 9] },
  flood: { label: 'Flooding', months: [2, 3, 4, 5, 8] },
  earthquake: { label: 'Earthquakes', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  blizzard: { label: 'Blizzards', months: [0, 1, 2, 11] },
  drought: { label: 'Drought', months: [5, 6, 7, 8] },
  heat: { label: 'Extreme heat', months: [5, 6, 7, 8] },
};

G.CITY_SIZES = [
  { id: 'rural', label: 'Rural area', pop: 4, max: 10 },
  { id: 'town', label: 'Small town', pop: 25, max: 50 },
  { id: 'mid', label: 'Mid-size city', pop: 120, max: 250 },
  { id: 'large', label: 'Large city', pop: 500, max: 1000 },
  { id: 'metro', label: 'Major metro', pop: 1500, max: 1e9 },
];

G.loc = (function () {
  const byAb = {};
  G.STATES.forEach((s) => { byAb[s.ab] = s; });
  const state = (ab) => byAb[ab];

  function sizeOf(popK) {
    return G.CITY_SIZES.find((z) => popK < z.max) || G.CITY_SIZES[G.CITY_SIZES.length - 1];
  }

  // Build the location record the game stores.
  function make(ab, cityName, custom) {
    const st = byAb[ab];
    let c;
    if (custom) {
      const size = G.CITY_SIZES.find((z) => z.id === custom.size) || G.CITY_SIZES[1];
      const colAdj = { rural: 0.9, town: 0.95, mid: 1, large: 1.08, metro: 1.25 }[size.id];
      const col = Math.round(st.col * colAdj);
      c = [cityName, size.pop, col, Math.round(1250 * Math.pow(col / 100, 1.6) / 10) * 10, (custom.tags || []).join(' ') + (size.id === 'rural' ? ' rural' : '')];
    } else {
      c = st.cities.find((x) => x[0] === cityName) || st.cities[0];
    }
    const tags = c[4].split(/\s+/).filter(Boolean);
    st.ind.forEach((t) => { if (!tags.includes(t)) tags.push(t); });
    if (c[1] < 10 && !tags.includes('rural')) tags.push('rural');
    return { state: ab, city: c[0], pop: c[1], col: c[2], rent: c[3], tags, size: sizeOf(c[1]).id, custom: !!custom };
  }

  // Commercial rent in $ per sq ft per year.
  function commercialRent(L, type) {
    const base = { retail: 24, office: 27, industrial: 11, lab: 58, kitchen: 26, home: 0 }[type] || 22;
    const sizeF = { rural: 0.62, town: 0.78, mid: 0.95, large: 1.15, metro: 1.45 }[L.size] || 1;
    return Math.round(base * Math.pow(L.col / 100, 1.25) * sizeF * 10) / 10;
  }

  // Population a business can draw from: the surrounding region, and for
  // tourist businesses in tourist towns, the visitors too (thousands).
  function marketPop(L, t) {
    const region = L.pop * ({ rural: 6, town: 3, mid: 2.2, large: 2.2, metro: 2.3 }[L.size] || 2);
    let pop = region;
    if (t && t.tourist && L.tags.some((x) => x === 'tourism' || x === 'ski')) pop = Math.max(region, 300);
    return pop;
  }

  // Price level for local goods and services relative to the US average.
  const priceIndex = (L) => Math.pow(L.col / 100, 0.55);
  const wageIndex = (L) => {
    const st = byAb[L.state];
    return Math.pow(st.inc / 75, 0.45) * Math.pow(L.col / 100, 0.35);
  };

  return { state, make, sizeOf, commercialRent, priceIndex, wageIndex, marketPop };
})();
