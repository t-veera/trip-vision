# Trip Vision

An interactive trip-planning daydream board. Editorial dark-theme aesthetic. Hero map, per-day timelines, budget breakdowns, packing lists grouped by bag, expense rollups, and live-editable everything.

![Trip Vision](https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1400&q=80)

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:5173. That's it — no API keys, no tokens, no credit card.

- **Map:** MapLibre GL + Carto's free dark basemap
- **Routing:** OSRM public demo server
- **Storage:** localStorage (your edits persist in your browser)

## What's inside

- Two sample trips out of the box: **Sri Lanka (Surf & Slow)** and **Ladakh (Frozen River)**
- Cinematic "Play day" mode that flies through stops
- Clickable contacts — addresses open Google Maps, phone numbers open your dialer
- Inline edit everywhere: click the **Edit** button on any card, or toggle **Edit** in the top nav for the full editor
- Share button (top-right) copies a link you can send anyone
- Full expense breakdown: pre-trip (visa, e-SIM, insurance) + transport + daily + misc

## Ask Claude to generate a JSON for a new trip

Share this repo link with any Claude and say:

> "Using the trip JSON schema in this repo (`src/trips/sri-lanka-surf.json` is a good reference), generate a new trip JSON for [destination], [duration], [vibe]."

Then drop the JSON into Trip Vision via **Edit → Import** (top-right of the editor drawer). Done. Below is the schema.

### Trip JSON schema

```jsonc
{
  "id": "unique-kebab-case-id",              // required, used as URL param
  "name": "Trip name",                        // required
  "origin": "Hyderabad, India",               // where you're flying from
  "vision": "What you want this to feel like",// freeform paragraph
  "startDate": "2026-05-10",                  // ISO date
  "endDate": "2026-05-19",
  "currency": "INR",                          // default display currency
  "accentColor": "#E8583A",                   // hex, drives the whole theme
  "heroImage": "https://...",                 // large image, Unsplash works
  "mapCenter": [80.45, 5.97],                 // [lng, lat] where map opens
  "mapZoom": 9,

  "info": {
    "visa":      { "title": "Visa",               "notes": "...", "cost": 4200, "url": "https://..." },
    "esim":      { "title": "E-SIM",              "notes": "...", "cost": 1800, "url": "https://..." },
    "network":   { "title": "Mobile Network",     "notes": "...", "cost": 0,    "url": "https://..." },
    "exchange":  { "title": "Exchange Rate",      "rate": "1 INR = 3.55 LKR",   "notes": "...", "cost": 0, "url": "..." },
    "insurance": { "title": "Travel Insurance",   "notes": "...", "cost": 3500, "url": "https://..." },
    "medical":   { "title": "Medical",            "notes": "...", "cost": 2000, "url": "https://..." }
  },

  "transport": [
    { "id": "t1", "type": "flight", "from": "HYD", "to": "CMB",
      "date": "2026-05-10", "time": "06:30",
      "provider": "IndiGo 6E 1223", "cost": 18500, "notes": "..." },
    { "id": "t2", "type": "train", "from": "Colombo Fort", "to": "Weligama", ... },
    { "id": "t3", "type": "cab",   "from": "...",   "to": "...", ... }
    // type can be: flight | train | cab | bus | ferry
  ],

  "places": [
    {
      "id": "hangtime-hostel",
      "name": "Hangtime Hostel",
      "category": "stay",               // stay | cafe | restaurant | chill | special | rental | transport
      "coords": [80.4293, 5.9734],      // [lng, lat]
      "address": "Weligama Beach Rd, Weligama, Sri Lanka",
      "image": "https://...",
      "notes": "...",
      "priceINR": 2100,
      "priceUnit": "per night",
      "contact": "+94 77 123 4567"
    }
  ],

  "days": [
    {
      "day": 1, "date": "2026-05-10", "title": "Landing into slow",
      "stops": [
        { "placeId": "cmb-airport", "time": "morning",
          "experience": "Land, e-SIM, LKR cash, kottu breakfast",
          "visionTags": ["slow", "chill"] }
      ],
      "miscExpenses": [
        { "id": "m1-1", "label": "Street food + coconut", "cost": 450 }
      ]
    }
  ],

  "packing": [
    {
      "id": "bag-suitcase", "title": "Suitcase",
      "items": [{ "id": "p1", "text": "Boardshorts × 3", "checked": false }]
    },
    { "id": "bag-backpack", "title": "Backpack", "items": [...] },
    { "id": "bag-fanny",    "title": "Fanny pack", "items": [...] }
  ],

  "checklist": [
    { "id": "c1", "text": "Apply for ETA", "checked": false }
  ]
}
```

### Field reference

- **`time`** on stops: `morning` | `afternoon` | `evening`
- **`category`** on places: `stay` | `cafe` | `restaurant` | `chill` | `special` | `rental` | `transport`
- **`type`** on transport: `flight` | `train` | `cab` | `bus` | `ferry`
- **`coords`**: always `[longitude, latitude]` (GeoJSON order, not Google's)
- **`cost` / `priceINR`**: all prices stored in INR; users can toggle display currency in the UI
- Every `id` must be unique within its array; IDs can be any string without spaces

## Adding your trip to the bundled examples

Drop your JSON into `src/trips/` and import it in `src/store.js`:

```js
import myTrip from './trips/my-trip.json'
const DEFAULT_TRIPS = [sriLankaSurf, ladakhWinter, myTrip]
```

## Deploy to GitHub Pages

1. Push to GitHub
2. Settings → Pages → Source: **GitHub Actions**
3. Make sure `vite.config.js` has the right `base` for your repo name (already set via `VITE_BASE`)
4. Push to `main` — the workflow in `.github/workflows/deploy.yml` will build and deploy
5. Share: your site will be at `https://<username>.github.io/<repo>/?trip=<trip-id>`

The built HTML is fully static — you can also host it anywhere (Netlify, Cloudflare Pages, S3) or just open `dist/index.html` locally after `npm run build`.

## Customization

- **Accent color:** edit in the trip JSON or live via the editor (Meta tab)
- **Map style:** change the tile URL in `src/components/MapCanvas.jsx` (Carto also offers `light_all`, `dark_nolabels`, `voyager`)
- **Currencies:** add to `DEFAULT_RATES` and `CURRENCY_SYMBOLS` in `src/lib.js`

## Attribution

- Tiles © OpenStreetMap contributors, © Carto
- Routing via OSRM (`router.project-osrm.org`)
- Fonts: Fraunces + Geist (Google Fonts)

## License

MIT.
