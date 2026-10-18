# Polling-place and precinct map

## Map behavior

The `/polling-places/` page loads Leaflet when the map approaches the viewport. It requests the Ashtabula County Census 2020 Voting District layer from U.S. Census TIGERweb and accepts the overlay only when it contains exactly 104 unique precinct polygons and every polygon name maps to one of the 104 precincts in the current BOE directory. A location card highlights every precinct assigned to that polling place. A precinct polygon or its **Highlight** button selects one precinct and shows its BOE polling-place assignment. The list remains available without JavaScript or if the map service is unavailable.

Precinct names are the crosswalk between the current 2026 BOE list and the 2020 Census polygon layer. The names and total count match, but the Board has not confirmed that no boundary geometry changed after 2020. The map labels this vintage and directs voters to the Ohio Secretary of State lookup to verify their own precinct and location. It never infers an address assignment from proximity or requests device location.

## Sources and dates

* Ashtabula County BOE precinct/polling-place report: <https://lookup.boe.ohio.gov/vtrapp/ashtabula/precandpoll.aspx>. Its Election Day assignments were reported updated October 16, 2026 and transcribed/checked October 18, 2026 for the November 3, 2026 General Election.
* U.S. Census Bureau 2020 TIGER/Line Voting Districts for Ohio: <https://catalog.data.gov/dataset/tiger-line-shapefile-2020-state-ohio-voting-districts>. The Ashtabula County subset is served by <https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/15>.
* Ohio Secretary of State voter lookup: <https://voterlookup.ohiosos.gov/voterlookup.aspx>.
* Historical BOE map PDFs: <https://www.boe.ohio.gov/ashtabula/c/precmap/>. The PDFs reviewed have 2013 map dates; they remain historical references, not the map overlay source.

## Data checks

The map query filters the Census layer to Ohio (state FIPS 39), Ashtabula County (county FIPS 007), and defined voting districts (`VTDI='A'`). It validates complete, unique name coverage against the current BOE precinct directory before drawing polygons. A missing, duplicate, or unexpected precinct disables the overlay and leaves the BOE directory and official voter lookup available. The runtime does not treat an unmatched polygon as an approximate match.

The county's public GIS portal does not list a precinct boundary dataset. A similarly named ArcGIS ElectoralDistricts service previously referenced by the implementation was verified to contain Lawrence County, Pennsylvania polling sites and precincts; it has been removed. The site does not use its unrelated features.

## Third-party requests and privacy

* Leaflet JavaScript and CSS are requested from `unpkg.com` when the map is reached.
* Census TIGERweb provides the public 2020 precinct geometry; no visitor address, search term, or device coordinates are sent to Census.
* Map tiles are requested from `tile.openstreetmap.org`; visible attribution links to OpenStreetMap. Tiles are not prefetched or downloaded in bulk. OSM services may process request IP addresses and page referrers.
* Directions sends the public polling-place address to Google Maps only if clicked. Official verification opens the Ohio Secretary of State directly.
