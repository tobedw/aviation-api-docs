# Aviation Data API

REST API for aviation data including airlines, airports, cities, countries, routes, and aircraft types.

**Base URL:** `https://aviation-api.logostream.dev`

---

## Authentication

All requests require an API key passed in the request header:

```
x-api-key: YOUR_API_KEY
```

---

## Rate Limits

Every response includes rate limit headers:

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Total requests allowed this month |
| `X-RateLimit-Remaining` | Requests remaining this month |
| `X-RateLimit-Reset` | Reset date (first of next month, YYYY-MM-DD) |

Limits reset on the 1st of each month.

### Plans

| Plan | Requests/month | Max page size | Bulk download |
|---|---|---|---|
| Community | 1,000 | 50 | Filter required |
| Startup | 10,000 | 100 | ✅ |
| Pro | 100,000 | 500 | ✅ |
| Enterprise | 1,000,000 | 500 | ✅ |

**Bulk download** means querying an endpoint without any filter. On the Community plan, at least one filter parameter is required for airlines, airports, and cities.

---

## Response Format

All endpoints return the same envelope:

```json
{
  "data": [...],
  "total": 825,
  "truncated": true,
  "page": 1,
  "limit": 50
}
```

### Pagination

| Parameter | Default | Max (Community) | Max (Pro/Enterprise) |
|---|---|---|---|
| `limit` | 50 | 50 | 500 |
| `offset` | 0 | — | — |

```
GET /v1/airlines?country_code=DE&limit=100&offset=0
GET /v1/airlines?country_code=DE&limit=100&offset=100
```

### Error Responses

```json
{ "error": "Description of the error" }
```

| Status | Meaning |
|---|---|
| 401 | Missing or invalid API key |
| 403 | API key inactive or plan restriction |
| 404 | Unknown endpoint |
| 405 | Method not allowed (only GET) |
| 429 | Monthly request limit reached |
| 500 | Internal server error |

---

## Endpoints

### Airlines — `GET /v1/airlines`

#### Filters

| Parameter | Description | Example |
|---|---|---|
| `iata` | IATA code(s), comma-separated | `?iata=LH` or `?iata=LH,BA,AF` |
| `icao` | ICAO code | `?icao=DLH` |
| `name` | Fuzzy name search | `?name=Emirates` |
| `alliance` | Alliance name | `?alliance=star_alliance` |
| `country_code` | ISO 2-letter country code | `?country_code=DE` |

#### Examples

```bash
# Single airline by IATA
curl "https://aviation-api.logostream.dev/v1/airlines?iata=LH" \
  -H "x-api-key: YOUR_API_KEY"

# Multiple airlines by IATA
curl "https://aviation-api.logostream.dev/v1/airlines?iata=LH,BA,AF,DL,AA" \
  -H "x-api-key: YOUR_API_KEY"

# Search by name
curl "https://aviation-api.logostream.dev/v1/airlines?name=Emirates" \
  -H "x-api-key: YOUR_API_KEY"

# All Star Alliance members
curl "https://aviation-api.logostream.dev/v1/airlines?alliance=star_alliance" \
  -H "x-api-key: YOUR_API_KEY"

# All airlines in Germany
curl "https://aviation-api.logostream.dev/v1/airlines?country_code=DE" \
  -H "x-api-key: YOUR_API_KEY"

# Full database (Startup plan and above)
curl "https://aviation-api.logostream.dev/v1/airlines?limit=100&offset=0" \
  -H "x-api-key: YOUR_API_KEY"
```

#### Response fields

| Field | Type | Description |
|---|---|---|
| `iata` | string | IATA 2-letter code |
| `icao` | string | ICAO 3-letter code |
| `name` | string | Official airline name |
| `marketing_name` | string | Commercial brand name |
| `country_code` | string | ISO 2-letter country code |
| `alliance` | string | `star_alliance`, `oneworld`, `skyteam` or null |
| `type` | string | e.g. `Full service carrier`, `Low-cost carrier`, `Cargo carrier` |
| `colors` | string | Primary brand color (hex) |
| `color2` | string | Secondary brand color (hex) |
| `text_color` | string | Text color (hex) |
| `is_lowcost` | boolean | Low-cost carrier flag |
| `is_oneworld` | boolean | oneworld member |
| `is_staralliance` | boolean | Star Alliance member |
| `is_skyteam` | boolean | SkyTeam member |
| `rating_tripadvisor` | number | TripAdvisor rating (1–5) |
| `rating_skytrax_stars` | number | Skytrax star rating |
| `website` | string | Official website URL |
| `description` | string | Airline description |
| `hq_address` | string | Headquarters address |
| `image_url` | string | Airline logo image URL |
| `aircraft_types` | array | List of `{iata, name}` objects |

---

### Airports — `GET /v1/airports`

#### Filters

| Parameter | Description | Example |
|---|---|---|
| `iata` | IATA code(s), comma-separated | `?iata=LHR` or `?iata=LHR,CDG,JFK` |
| `icao` | ICAO code | `?icao=EGLL` |
| `city_name` | Fuzzy city name search | `?city_name=London` |
| `country_code` | ISO 2-letter country code | `?country_code=DE` |
| `major_only` | Only large airports (`1` to enable) | `?major_only=1` |

#### Examples

```bash
# Single airport by IATA
curl "https://aviation-api.logostream.dev/v1/airports?iata=LHR" \
  -H "x-api-key: YOUR_API_KEY"

# Multiple airports
curl "https://aviation-api.logostream.dev/v1/airports?iata=LHR,CDG,JFK,NRT,SIN" \
  -H "x-api-key: YOUR_API_KEY"

# All airports serving London
curl "https://aviation-api.logostream.dev/v1/airports?city_name=London" \
  -H "x-api-key: YOUR_API_KEY"

# Major airports in Germany
curl "https://aviation-api.logostream.dev/v1/airports?country_code=DE&major_only=1" \
  -H "x-api-key: YOUR_API_KEY"
```

#### Response fields

| Field | Type | Description |
|---|---|---|
| `iata` | string | IATA 3-letter code |
| `icao` | string | ICAO 4-letter code |
| `name` | string | Airport name |
| `type` | string | `large_airport`, `medium_airport`, `small_airport`, `heliport`, `seaplane_base` |
| `latitude` | number | Decimal latitude |
| `longitude` | number | Decimal longitude |
| `elevation_ft` | integer | Elevation in feet |
| `timezone` | string | IANA timezone (e.g. `Europe/Berlin`) |
| `passengers` | integer | Annual passenger count |
| `aircraft_movements` | integer | Annual aircraft movements |
| `cargo_tonnes` | integer | Annual cargo in tonnes |
| `hub_for` | string | Airlines using this as a hub |
| `terminals` | string | Terminal information |
| `website` | string | Official website URL |
| `phone` | string | Contact phone number |
| `description` | string | Airport description |
| `wikipedia_url` | string | Wikipedia article URL |
| `image_1` | string | Airport image filename |
| `city` | object | `{iata_code, city_name, latitude, longitude}` |
| `country` | object | `{code2, name, continent_code}` |

---

### Cities — `GET /v1/cities`

#### Filters

| Parameter | Description | Example |
|---|---|---|
| `iata` | City IATA code | `?iata=LON` |
| `name` | Fuzzy city name search | `?name=london` |
| `country` | ISO 2-letter country code | `?country=GB` |

#### Examples

```bash
# City by IATA
curl "https://aviation-api.logostream.dev/v1/cities?iata=LON" \
  -H "x-api-key: YOUR_API_KEY"

# Search by name
curl "https://aviation-api.logostream.dev/v1/cities?name=london" \
  -H "x-api-key: YOUR_API_KEY"

# All cities in the UK
curl "https://aviation-api.logostream.dev/v1/cities?country=GB" \
  -H "x-api-key: YOUR_API_KEY"
```

#### Response fields

| Field | Type | Description |
|---|---|---|
| `iata_code` | string | City IATA code |
| `city_name` | string | City name |
| `state_short` | string | State/province abbreviation |
| `state_full` | string | State/province full name |
| `latitude` | number | Decimal latitude |
| `longitude` | number | Decimal longitude |
| `timezone` | string | IANA timezone |
| `population` | integer | City population |
| `wikipedia_url` | string | Wikipedia article URL |
| `website` | string | Official city website |
| `country` | object | `{code2, name, continent_code}` |

---

### Countries — `GET /v1/countries`

#### Filters

| Parameter | Description | Example |
|---|---|---|
| `code` | ISO 2-letter country code | `?code=DE` |
| `name` | Fuzzy name search | `?name=germany` |
| `continent` | Continent code | `?continent=EU` |

Continent codes: `AF`, `AN`, `AS`, `EU`, `NA`, `OC`, `SA`

#### Examples

```bash
# Single country
curl "https://aviation-api.logostream.dev/v1/countries?code=DE" \
  -H "x-api-key: YOUR_API_KEY"

# All European countries
curl "https://aviation-api.logostream.dev/v1/countries?continent=EU" \
  -H "x-api-key: YOUR_API_KEY"

# Full list (252 countries, available on all plans)
curl "https://aviation-api.logostream.dev/v1/countries" \
  -H "x-api-key: YOUR_API_KEY"
```

#### Response fields

| Field | Type | Description |
|---|---|---|
| `code2` | string | ISO 3166-1 alpha-2 code |
| `code3` | string | ISO 3166-1 alpha-3 code |
| `name` | string | Country name |
| `continent_code` | string | Continent code |
| `region` | string | Geographic region |

---

### Routes — `GET /v1/routes`

At least one filter is required.

#### Filters

| Parameter | Description | Example |
|---|---|---|
| `departureIata` | Departure airport IATA | `?departureIata=FRA` |
| `departureIcao` | Departure airport ICAO | `?departureIcao=EDDF` |
| `arrivalIata` | Arrival airport IATA | `?arrivalIata=LHR` |
| `airlineIata` | Airline IATA code | `?airlineIata=LH` |

Filters can be combined, e.g. `?departureIata=FRA&arrivalIata=JFK`.

#### Examples

```bash
# All routes from Frankfurt
curl "https://aviation-api.logostream.dev/v1/routes?departureIata=FRA" \
  -H "x-api-key: YOUR_API_KEY"

# Specific route FRA → JFK
curl "https://aviation-api.logostream.dev/v1/routes?departureIata=FRA&arrivalIata=JFK" \
  -H "x-api-key: YOUR_API_KEY"

# All Lufthansa routes
curl "https://aviation-api.logostream.dev/v1/routes?airlineIata=LH" \
  -H "x-api-key: YOUR_API_KEY"
```

#### Response fields

| Field | Type | Description |
|---|---|---|
| `departure_iata` | string | Departure airport IATA |
| `departure_icao` | string | Departure airport ICAO |
| `arrival_iata` | string | Arrival airport IATA |
| `arrival_icao` | string | Arrival airport ICAO |
| `duration_min` | integer | Flight duration in minutes |
| `flights_per_week` | integer | Weekly frequency |
| `flights_per_day` | string | Daily frequency range (e.g. `"3-5 flights"`) |
| `price` | integer | Approximate price in USD |
| `day_mon` … `day_sun` | boolean | Operating days |
| `first_flight` | date | Date route first operated |
| `last_flight` | date | Date route last operated |
| `airlines` | array | Airlines operating the route (see below) |

**Route airline object:**

| Field | Type | Description |
|---|---|---|
| `airline_iata` | string | Airline IATA code |
| `airline_name` | string | Airline name |
| `aircraft_codes` | string | Aircraft types (e.g. `"32S,787"`) |
| `class_first` | boolean | First class available |
| `class_business` | boolean | Business class available |
| `class_economy` | boolean | Economy class available |
| `lcc` | boolean | Low-cost carrier |

---

### Aircraft Types — `GET /v1/aircraft-types`

#### Filters

| Parameter | Description | Example |
|---|---|---|
| `iata` | IATA code(s), comma-separated | `?iata=32S` or `?iata=32S,787,350` |

#### Examples

```bash
# Single aircraft type
curl "https://aviation-api.logostream.dev/v1/aircraft-types?iata=32S" \
  -H "x-api-key: YOUR_API_KEY"

# Multiple types
curl "https://aviation-api.logostream.dev/v1/aircraft-types?iata=32S,787,350,380" \
  -H "x-api-key: YOUR_API_KEY"

# Full list (74 types, available on all plans)
curl "https://aviation-api.logostream.dev/v1/aircraft-types" \
  -H "x-api-key: YOUR_API_KEY"
```

#### Response fields

| Field | Type | Description |
|---|---|---|
| `iata` | string | IATA aircraft type code |
| `name` | string | Aircraft name |
