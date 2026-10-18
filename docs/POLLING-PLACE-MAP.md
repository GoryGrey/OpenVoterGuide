# Polling-place map data and operation

## Current implementation

The `/polling-places/` page loads Leaflet only when the map approaches the viewport. It then requests the county's ArcGIS `Polling Places` point layer and displays a point only when its street address and city match a location in the current Ashtabula County Board of Elections (BOE) report. This prevents old/unused GIS points from being presented as current polling sites. BOE locations and precinct assignments remain statically available as the accessible search directory even if the map service or tile provider is unavailable.

Selecting a marker shows the matching location, its current BOE precinct list, directions, and the Ohio Secretary of State voter lookup. Searching the list filters the map pins and directory together. The address search is deliberately omitted: proximity cannot assign a voter to a precinct, and the existing official lookup is the authoritative address-based fallback. Device location is never requested.

## Sources and dates

* Ashtabula County BOE precinct/polling-place report: <https://lookup.boe.ohio.gov/vtrapp/ashtabula/precandpoll.aspx>. Its Election Day assignment data was reported updated October 16, 2026 and transcribed/checked October 18, 2026 for the November 3, 2026 General Election.
* ArcGIS `ElectoralDistricts` service, `Polling Places` layer (0): <https://services6.arcgis.com/SPg6lw9jlYmTOiLi/ArcGIS/rest/services/ElectoralDistricts/FeatureServer/0>. The service metadata showed 74 available point records and data last edited May 29, 2026. Only records matching a current BOE address and city are displayed; unmatched records are excluded. Point coordinates are county GIS reference points, not independently surveyed coordinates.
* Related `Voting Precincts` polygon layer (1): <https://services6.arcgis.com/SPg6lw9jlYmTOiLi/ArcGIS/rest/services/ElectoralDistricts/FeatureServer/1>. Its available layer estimate was 77 features, versus 104 precinct assignments in the current BOE report. Its May 2026 data timestamp also predates the current election assignment report.
* Ohio Secretary of State voter lookup: <https://voterlookup.ohiosos.gov/voterlookup.aspx>.
* Historical BOE map PDFs: <https://www.boe.ohio.gov/ashtabula/c/precmap/>. The PDFs reviewed have 2013 map dates and are not treated as current boundaries.

## Why precinct highlighting is disabled

The current official BOE report lists 104 precincts, but the related GIS polygon layer exposes only 77 features and predates the current election report. There is no validated one-to-one relationship proving those polygons cover every current precinct and correspond to the October 2026 BOE precinct-to-location assignments. Therefore the site does **not** draw precinct polygons, highlight precincts, or use point-in-polygon to infer a voter's assignment. This is an intentional accuracy safeguard, not a missing map interaction.

To enable those functions later, obtain an election-specific boundary dataset from the BOE or County Auditor GIS, confirm complete coverage of all 104 current precinct IDs, validate each polygon-to-precinct ID and each precinct-to-polling-location relationship against the BOE report, and record the source and effective date. Store that validated snapshot in the repository as versioned GeoJSON so the static site does not depend on a live boundary API.

## Third-party requests and privacy

* Leaflet JavaScript and CSS are requested from `unpkg.com` when the map is reached.
* Map tiles are requested on demand from `tile.openstreetmap.org`; visible attribution links to OpenStreetMap. Standard OSM tiles are not prefetched or downloaded in bulk. Browser caching is left enabled. OSM services may process request IP addresses and page referrers.
* GIS point records are requested from the ArcGIS FeatureServer. The browser requests county location data; it never sends a visitor's address, search string, or device coordinates.
* Directions sends the public polling-place address to Google Maps only if clicked. Official verification opens the Ohio Secretary of State directly.

The map can be switched to another tile provider by replacing the single tile URL and attribution in `src/js/polling-places.js`, after reviewing that provider's terms, caching requirements, attribution rules, and privacy policy. Do not add OSM tile prefetching or offline packs to the public OSM tile endpoint.
