# Trip Vision

A daydreaming board for your trips. Interactive Mapbox map as the hero, with your day-by-day itinerary, budgets, packing list, and logistics all woven into an editorial layout. Hover pins to see distance/time from where you're staying. Hit play to cinematically fly through a day.

Built to live on GitHub Pages so you can share links with friends.

---

## Quick start

```bash
npm install
cp .env.example .env.local
# Edit .env.local and paste your Mapbox public token
npm run dev
```

Open http://localhost:5173. You'll see the sample Sri Lanka surf trip.

### Get a Mapbox token (free, takes 90 seconds)

1. Sign up at https://account.mapbox.com/
2. Go to **Access tokens** → use the default public token (or make a new one)
3. Recommended: restrict it to your production domain (`https://<your-username>.github.io/*`) and to `localhost` for dev
4. Paste into `.env.local` as `VITE_MAPBOX_TOKEN=pk.xxxxx`

The free tier gives you 50,000 map loads and 100,000 Directions API requests per month. Plenty for a personal daydreaming board.

---

## How to use it

### The map
- **Pins are numbered by the day's sequence.** Colour = category (stay, cafe, restaurant, chill, special, rental, transport).
- **Hover a pin** for a detail card with the experience, price, vision tags, and travel time/distance from your stay (hostel/hotel).
- **Click a pin** to lock it as active.
- **Routes follow roads** (Mapbox Directions API). For flights between airports, a great-circle arc is drawn. Train routing falls back to driving geometry since Mapbox doesn't do rail — you can adjust coordinates in the editor for approximate rail visuals if needed.

### The sidebar
- Pick a day from the dropdown or arrows
- Hit **Play day** for a cinematic fly-through — map pans, zooms, and rotates through each stop with the card updating as it goes
- Toggle between **day total** and **whole trip total**. Switch currencies (INR, USD, EUR, LKR, GBP, AED, THB, JPY).

### The sections below
- **Logistics** — visa, e-SIM, mobile network, exchange rate. All editable.
- **Flights & transport** — inline table, add rows as you go.
- **Packing list** — editable, with checkboxes.
- **Pre-trip checklist** — editable, with an animated progress bar.
- **Contacts & addresses** — a filterable directory of every place with a phone number or useful note.

### Editor mode
Flip the **Edit** toggle (top right). A side panel opens with three tabs:

- **Places** — add/edit/delete all places. Click anywhere on the map to drop a new pin with coordinates prefilled.
- **Day composer** — build or reorder days. Pick stops from your place pool, set time-of-day, vision tags, and the experience sentence.
- **Meta** — change the trip name, vision statement, dates, accent color, and hero image.

**Export JSON** at any time to save a backup. **Import JSON** to restore or move between browsers.

> Everything is persisted to `localStorage` in your browser. If you clear storage, the default Sri Lanka trip comes back, and any other trips are lost unless you exported them.

---

## Adding a new trip

Two options:

**1. Through the UI (fastest)**
Click the trip name in the top nav → **New trip** → fill in name → edit in place.

**2. Pre-made JSON**
Drop a JSON file into `src/trips/` and import it in `src/store.js`:

```js
import mySnowTrip from './trips/ladakh-winter.json'
const DEFAULT_TRIPS = [sriLankaSurf, mySnowTrip]
```

### Trip JSON structure

```jsonc
{
  "id": "unique-id",
  "name": "Display name",
  "vision": "The feeling you're chasing",
  "startDate": "2026-01-15",
  "endDate": "2026-01-22",
  "currency": "INR",
  "accentColor": "#E8583A",   // hex, drives the whole UI theme
  "heroImage": "https://…",
  "mapCenter": [lng, lat],
  "mapZoom": 9,
  "info": {
    "visa":     { "title": "Visa",     "notes": "…", "cost": 4200 },
    "esim":     { "title": "E-SIM",    "notes": "…", "cost": 1800 },
    "network":  { "title": "Network",  "notes": "…", "cost": 0 },
    "exchange": { "title": "Exchange", "notes": "…", "cost": 0 }
  },
  "flights": [
    { "from": "BLR", "to": "CMB", "date": "…", "time": "…", "airline": "…", "cost": 18500 }
  ],
  "places": [
    {
      "id": "unique-place-id",
      "name": "Hangtime Hostel",
      "category": "stay",      // stay | cafe | restaurant | chill | special | rental | transport
      "coords": [80.4293, 5.9734],   // [lng, lat]
      "image": "https://…",
      "notes": "…",
      "priceINR": 2100,
      "priceUnit": "per night",
      "contact": "+94 …",
      "travelMode": "driving"  // driving | walking | cycling | train | flight
    }
  ],
  "days": [
    {
      "day": 1,
      "date": "2026-01-15",
      "title": "Landing",
      "stops": [
        { "placeId": "unique-place-id", "time": "morning", "experience": "…", "visionTags": ["slow"] }
      ]
    }
  ],
  "packing":   [{ "id": "p1", "text": "…", "checked": false }],
  "checklist": [{ "id": "c1", "text": "…", "checked": false }]
}
```

---

## Deploying to GitHub Pages

1. Push this repo to GitHub (e.g. `https://github.com/you/trip-vision`)
2. In your repo: **Settings → Pages → Source** = **GitHub Actions**
3. In your repo: **Settings → Secrets and variables → Actions** → add a new secret `VITE_MAPBOX_TOKEN` with your Mapbox public token
4. Edit `.github/workflows/deploy.yml`:
   - If deploying to `https://<user>.github.io/trip-vision/` → keep `VITE_BASE: /trip-vision/` (adjust name to match your repo)
   - If deploying to a custom domain or a user page → set `VITE_BASE: /`
5. Push to `main`. The workflow builds and publishes. Site goes live at `https://<user>.github.io/<repo-name>/`.

Restrict your Mapbox token to your `*.github.io` domain so people can't hammer it from elsewhere.

### Sharing with friends

Every trip has a deep link: `https://<your-site>/?trip=<trip-id>`. Send that and it opens straight to the right trip.

---

## Customising

### Categories
Edit `src/lib.js` → `CATEGORIES` array. For each new category, add a matching CSS class in `src/index.css`:

```css
.cat-yourcategory { --cat: #YOURCOLOR; }
```

### Currencies / exchange rates
Edit `DEFAULT_RATES` in `src/lib.js`. Rates are INR → target. The UI switcher uses these.

### Colors & fonts
- Global palette in `tailwind.config.js` (`base` + `ink` + `accent`).
- Fonts in `index.html` and `src/index.css`. Currently: **Fraunces** (display), **Geist** (body), **Geist Mono** (numbers).
- Per-trip accent is driven by `trip.accentColor` and automatically flows to the map route, buttons, progress bars, etc.

---

## Stack

- React 18 + Vite
- Tailwind v3
- Mapbox GL JS v3
- `motion` (the new Framer Motion) for animations

No backend. No database. Just a static site + localStorage + Mapbox.

---

## Notes

- **Train routes** fall back to driving geometry. Mapbox doesn't do rail routing. Acceptable for a vision board; if you want literal train tracks, you'd need to drop custom GeoJSON for the route.
- **Images** can be any URL — Unsplash, your own Cloudinary, a hotel's website, whatever. The app doesn't upload or host anything.
- **Prices are stored in INR** internally, converted on display. This keeps math consistent when you switch currencies.
- **Distance/time from stay** is computed via Mapbox Directions and cached in localStorage so repeated hovers don't hit the API.

Daydream louder.
