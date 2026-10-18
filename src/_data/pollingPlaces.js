const sourceUrl = "https://lookup.boe.ohio.gov/vtrapp/ashtabula/precandpoll.aspx";
const mapBaseUrl = "https://www.boe.ohio.gov/ashtabula/c/precmap/";
const censusPrecinctBoundaryUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/15";
const rows = [
  ["elks-club", "ELKS CLUB", "3115 LAKE RD W", "ASHTABULA", "44004", "001:ASHTABULA 1-A;002:ASHTABULA 1-B;004:ASHTABULA 1-D;008:ASHTABULA 2-D"],
  ["move-church", "MOVE CHURCH", "2310 W 9TH ST", "ASHTABULA", "44004", "003:ASHTABULA 1-C;005:ASHTABULA 2-A;010:ASHTABULA 3-B"],
  ["ashtabula-twp-park-commission", "ASHTABULA TWP PARK COMMISSION", "1700 E 1ST ST", "ASHTABULA", "44004", "006:ASHTABULA 2-B;007:ASHTABULA 2-C;046:ASHTABULA TWP. 3"],
  ["ymca", "YMCA", "263 W PROSPECT RD", "ASHTABULA", "44004", "009:ASHTABULA 3-A;013:ASHTABULA 4-A"],
  ["peoples-baptist-church", "PEOPLES BAPTIST CHURCH", "3837 WEST AV", "ASHTABULA", "44004", "011:ASHTABULA 3-C;012:ASHTABULA 3-D;017:ASHTABULA 5-A;020:ASHTABULA 5-D"],
  ["county-district-library", "ASHTABULA CO. DISTRICT LIBRARY", "4335 PARK AVENUE", "ASHTABULA", "44004", "014:ASHTABULA 4-B;015:ASHTABULA 4-C;016:ASHTABULA 4-D;018:ASHTABULA 5-B;019:ASHTABULA 5-C"],
  ["conneaut-human-resources", "CONNEAUT HUMAN RESOURCES CENTR", "327 MILL ST", "CONNEAUT", "44030", "021:CONNEAUT 1-A;022:CONNEAUT 1-B;023:CONNEAUT 1-C;025:CONNEAUT 2-B;026:CONNEAUT 2-C;033:CONNEAUT 4-C"],
  ["first-assembly-of-god", "FIRST ASSEMBLY OF GOD", "389 W MAIN RD", "CONNEAUT", "44030", "024:CONNEAUT 2-A;027:CONNEAUT 3-A"],
  ["good-shepherd-lutheran", "GOOD SHEPHERD LUTHERAN CHURCH", "876 GROVE ST", "CONNEAUT", "44030", "028:CONNEAUT 3-B;029:CONNEAUT 3-C;030:CONNEAUT 3-D;031:CONNEAUT 4-A;032:CONNEAUT 4-B"],
  ["geneva-recreation-center", "GENEVA RECREATION CENTER", "81 E MAIN ST", "GENEVA", "44041", "034:GENEVA 1;037:GENEVA 4;038:GENEVA 5"],
  ["geneva-community-center", "GENEVA COMMUNITY CENTER", "72 W MAIN ST", "GENEVA", "44041", "035:GENEVA 2;036:GENEVA 3;057:GENEVA TWP. 1"],
  ["geneva-public-library", "GENEVA PUBLIC LIBRARY", "860 SHERMAN ST", "GENEVA", "44041", "039:GENEVA 6;040:GENEVA 7"],
  ["first-united-methodist-andover", "FIRST UNITED METHODIST CHURCH", "181 SOUTH MAIN STREET", "ANDOVER", "44003", "041:ANDOVER VILLAGE;042:ANDOVER TWP. 1;043:ANDOVER TWP. 2"],
  ["pent-church-of-god", "PENT. CHURCH OF GOD", "2201 COOK RD", "ASHTABULA", "44004", "044:ASHTABULA TWP. 1;047:ASHTABULA TWP. 4;048:ASHTABULA TWP. 5;049:ASHTABULA TWP. 6"],
  ["odot-facility", "ODOT FACILITY", "492 SEVEN HILLS RD", "ASHTABULA", "44004", "045:ASHTABULA TWP. 2"],
  ["bud-field-student-center", "BUD FIELD STUDENT CENTER", "3042 COLLEGE ST.", "AUSTINBURG", "44010", "050:AUSTINBURG TWP. 1;051:AUSTINBURG TWP. 2"],
  ["cherry-valley-township-hall", "CHERRY VALLEY TOWNSHIP HALL", "5299 ST RT 193", "DORSET", "44032", "052:CHERRY VALLEY"],
  ["colebrook-community-center", "COLEBROOK COMMUNITY CENTER", "682 RT 322", "ORWELL", "44076", "053:COLEBROOK TWP."],
  ["denmark-township-hall", "DENMARK TOWNSHIP HALL", "42 CLAY RD", "JEFFERSON", "44047", "054:DENMARK TWP."],
  ["dorset-community-center", "DORSET COMMUNITY CENTER", "2681 RT 193", "DORSET", "44032", "055:DORSET TWP."],
  ["geneva-on-lake-village-hall", "VILLAGE HALL", "4929 S WARNER DR", "GENEVA", "44041", "056:GENEVA ON LAKE VILLAGE"],
  ["geneva-township-hall", "GENEVA TOWNSHIP HALL", "256 NORTH CEDAR ST", "GENEVA", "44041", "058:GENEVA TWP. 2;059:GENEVA TWP. 3"],
  ["harpersfield-community-center", "HARPERSFIELD COMMUNITY CENTER", "5636 CORK COLD SPRINGS RD", "GENEVA", "44041", "060:HARPERSFLD TWP 1;061:HARPERSFLD TWP 2;062:HARPERSFLD TWP 3"],
  ["hartsgrove-township-hall", "HARTSGROVE TOWNSHIP HALL", "5321 ST RT 534", "ROME", "44085", "063:HARTSGROVE TWP"],
  ["jefferson-village-rec", "JEFF VILL RECREATIONAL CENTER", "11 E JEFFERSON ST", "JEFFERSON", "44047", "064:JEFFERSON VILLAGE 1;065:JEFFERSON VILLAGE 2;066:JEFFERSON VILLAGE 3"],
  ["jefferson-united-methodist", "JEFF. UNITED METHODIST CHURCH", "125 E JEFFERSON ST", "JEFFERSON", "44047", "067:JEFFERSON TWP. 1;068:JEFFERSON TWP. 2;069:JEFFERSON TWP. 3"],
  ["first-baptist-kingsville", "FIRST BAPTIST CHURCH", "6003 STATE ROUTE 193", "KINGSVILLE", "44048", "070:KINGSVILLE TWP. 1;071:KINGSVILLE TWP. 2"],
  ["lenox-community-hall", "LENOX COMMUNITY HALL", "2509 LENOX NEW LYME RD", "JEFFERSON", "44047", "072:LENOX TWP. 1;073:LENOX TWP. 2"],
  ["monroe-fire-hall", "MONROE FIRE HALL", "4095 CENTER RD", "CONNEAUT", "44030", "074:MONROE TWP. 1;075:MONROE TWP. 2"],
  ["rock-creek-village-fire-hall", "ROCK CREEK VILLAGE FIRE HALL", "3033 E WATER ST", "ROCK CREEK", "44084", "076:ROCK CREEK VILLAGE;077:MORGAN TWP."],
  ["new-lyme-township-service-building", "NEW LYME TOWNSHIP SERVICE BLDG", "810 DODGEVILLE RD", "ROME", "44085", "078:NEW LYME TWP."],
  ["north-kingsville-municipal-building", "N KINGSVILLE MUNICIPAL BLDG", "3541 E CENTER ST", "NORTH KINGSVILLE", "44068", "079:N KINGS VILL 1"],
  ["living-waters-baptist", "LIVING WATERS BAPTIST CHURCH", "2314 W. CENTER ST.", "NORTH KINGSVILLE", "44068", "080:N KINGS VILL 2;081:N KINGS VILL 3"],
  ["orwell-village-fire-hall", "ORWELL VILLAGE FIRE HALL", "78 E MAIN ST", "ORWELL", "44076", "082:ORWELL VILLAGE"],
  ["orwell-township-hall", "ORWELL TOWNSHIP HALL", "2693 RT 322 E", "ORWELL", "44076", "083:ORWELL TWP."],
  ["pierpont-presbyterian-church", "PIERPONT PRESBYTERIAN CHURCH", "71 STATE ROUTE 7", "PIERPONT", "44082", "084:PIERPONT TWP."],
  ["plymouth-fire-hall", "PLYMOUTH FIRE HALL", "1001 PLYMOUTH RD", "ASHTABULA", "44004", "085:PLYMOUTH TWP. 1;086:PLYMOUTH TWP. 2"],
  ["richmond-grange-hall", "RICHMOND GRANGE HALL", "5939 FOOTVILLE RICHMOND R", "ANDOVER", "44003", "087:RICHMOND TWP."],
  ["roaming-shores-village-hall", "ROAMING SHORES VILLAGE HALL", "2500 HAYFORD RD", "ROCK CREEK", "44084", "088:ROAMING SHORES VILLAGE"],
  ["rome-fire-hall", "ROME FIRE HALL", "3162 US RT 6 E", "ROME", "44085", "089:ROME TWP."],
  ["saybrook-township-hall", "SAYBROOK TWP HALL", "7247 CENTER RD S", "ASHTABULA", "44004", "090:SAYBROOK TWP. 1;096:SAYBROOK TWP. 7"],
  ["lakeside-junior-high", "LAKESIDE JUNIOR HIGH SCHOOL", "6620 SANBORN RD", "ASHTABULA", "44004", "091:SAYBROOK TWP. 2;093:SAYBROOK TWP. 4;097:SAYBROOK TWP. 8"],
  ["first-covenant-church", "FIRST COVENANT CHURCH", "3300 CARPENTER RD", "ASHTABULA", "44004", "092:SAYBROOK TWP. 3;094:SAYBROOK TWP. 5;095:SAYBROOK TWP. 6"],
  ["sheffield-fire-hall", "SHEFFIELD FIRE HALL", "3636 SHEFFIELD MONROE RD", "KINGSVILLE", "44048", "098:SHEFFIELD TWP. 1;099:SHEFFIELD TWP. 2"],
  ["trumbull-township-fire-hall", "TRUMBULL TWP FIRE HALL", "2443 ST RT 534", "GENEVA", "44041", "100:TRUMBULL TWP."],
  ["wayne-township-hall", "WAYNE TOWNSHIP HALL", "3280 US RT 322", "WILLIAMSFIELD", "44093", "101:WAYNE TWP."],
  ["williamsfield-community-hall", "WILLIAMSFIELD COMMUNITY HALL", "5920 US RT 322", "WILLIAMSFIELD", "44093", "102:WMSFLD TWP 1;103:WMSFLD TWP 2"],
  ["windsor-community-center", "WINDSOR COMMUNITY CENTER", "5430 US RT 322 W", "WINDSOR", "44099", "104:WINDSOR TWP."]
];

const locations = rows.map(([id, name, street, city, zip, list]) => ({
  id, name, address: { street, city, state: "OH", zip }, electionId: "2026-general", sourceUrl, verifiedAt: "2026-10-18",
  precincts: list.split(";").map(entry => {
    const [precinctId, precinctName] = entry.split(":");
    return { id: precinctId, name: precinctName, mapUrl: `${mapBaseUrl}${precinctId}.pdf` };
  }),
  searchText: `${name} ${street} ${city} ${zip} ${list}`.toLowerCase()
}));

module.exports = {
  county: "Ashtabula County", state: "Ohio", election: "November 3, 2026 General Election", electionDate: "2026-11-03",
  verifiedAt: "2026-10-18", sourceUpdatedAt: "2026-10-16T22:15:07-04:00", sourceUrl,
  censusPrecinctBoundaryUrl,
  precinctBoundaryVintage: "2020 U.S. Census TIGER/Line Voting Districts",
  precinctMapNote: "The BOE's linked precinct PDFs are dated February 27, 2013. The map overlay uses 2020 U.S. Census voting-district boundaries whose names match all 104 current BOE precinct names; the BOE has not published an election-specific GIS boundary file in its public GIS portal. Boundary changes since 2020 cannot be ruled out.",
  limitations: ["Precinct polygons are from the 2020 U.S. Census TIGER/Line Voting Districts. Their names match the 104 precinct names in the current BOE report, but the BOE has not confirmed that the boundary geometry is unchanged for the 2026 election. Confirm your own precinct and polling place with the Ohio Secretary of State.", "The BOE's linked precinct PDF maps are dated February 27, 2013 and are shown only as historical reference maps.", "The polling-place assignment report was current as of October 16, 2026; voters should confirm their personal assignment with the Ohio Secretary of State."],
  locations
};
