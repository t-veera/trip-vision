# Trip Vision

A daydreaming board for your trips. Interactive map at the top, day by day timeline on the right, plus logistics, expenses, packing, and contacts below. One page, all live editable.

Vibecoded to run on GitHub Pages with zero backend. No accounts, no API keys, no credit card.

### Live example

You can see a working version at [https://t-veera.github.io/trip-vision/?trip=ladakh-winter-2027](https://t-veera.github.io/trip-vision/?trip=ladakh-winter-2027)

Switch trips from the dropdown at the top to see the Sri Lanka sample as well.

---

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:5173. The app loads with the sample Sri Lanka surf trip.

No `.env`, no signup, no tokens. The map works immediately.

---

## The tour, how to actually use this thing

When the page loads, you're looking at one of two sample trips. Sri Lanka Surf & Slow, or Ladakh Frozen River. Everything you see is already live. Hover anything, click anything.

### The top nav

* **Trip name** in the middle. Click it to switch trips, create new, import JSON, export, reset, or delete.
* **Share** on the top right copies a link with the trip ID baked in (`?trip=sri-lanka-surf-2026`). Send it to a friend and they'll open the same trip.
* **Edit** toggle on the top right opens the editor drawer on the right side of the screen. More on that below.

### The hero

The big title block at the top. The title, origin ("Hyderabad, India"), and italic vision paragraph are all click to edit in place. No mode switching needed. Just click, type, click away.

### The map + sidebar

The main event. Left side is a MapLibre map with Carto Voyager tiles. Right side is the day by day sidebar.

**Map interactions**

* Numbered pins follow the active day's sequence. Color means category. Yellow is stay, orange is cafe, red is restaurant, green is chill, purple is special, blue is rental, white is transport.
* Hover a pin and the card in the top left updates with price, distance from your stay, experience notes, and photo.
* Click a pin to lock it as the active card. The map zooms in.
* Route lines between stops follow actual roads via OSRM. Flights draw as great circle arcs.
* When Edit mode is on, clicking anywhere on the map drops a pin. The editor drawer pops open to fill in the details.

**Sidebar**

* Day picker at the top. Dropdown plus prev and next arrows.
* **Play day** button runs a cinematic fly through. The map pans, zooms, and rotates through each stop while the card updates.
* Sequence list shows all stops for the active day. Hover to highlight on the map, click to lock.
* **Misc, + add**. Log street food, coffees, souvenirs, anything not tied to a specific place card. These roll into the day and trip totals.
* Day/Whole trip toggle at the bottom with a currency switcher. INR, USD, EUR, LKR, GBP, AED, THB, JPY.

### Below the fold

Scroll down and you get, in order:

1. **Logistics.** Six cards. Visa, E-SIM, Network, Exchange Rate, Insurance, Medical. Each has an Edit button in the top right of the card, an **Open ↗** link to the relevant booking site, a big cost number, and a notes area. Exchange rate gets a huge mono display like "1 INR ≈ 3.55 LKR" so it's impossible to miss. Use **+ Add card** to create custom cards for anything else (power adapter, lounge access, pet sitter).

2. **Flights · Trains · Cabs · Ferries.** Transport table. Add rows with the five type buttons (+Flight, +Train, +Cab, +Bus, +Ferry). Everything is inline editable.

3. **Expenses.** Full breakdown table. Pre trip items (visa, e-SIM, insurance) grouped as "Day 0", transport subtotals, then every day's stops plus misc. Grand total at the bottom. This is a read only summary. Edit the source data in the sidebar or the cards above.

4. **Packing.** Grouped by bag. Suitcase, Backpack, Fanny pack. Rename them freely. **+ Add bag** creates new groups. Each group has its own checklist, progress counter, and an inline input to add items.

5. **Pre trip checklist.** Flat list of one time tasks. Check off as you go.

6. **Contacts & addresses.** Every place with an address or phone. Addresses are clickable and open Google Maps. Phone numbers are clickable and open the dialer. Each card has an Edit button to update the address or phone inline.

---

## Where all the edit buttons live

If you're looking for a way to change something, here's the map.

| What you want to edit | Where the edit lives |
|---|---|
| Trip name, origin, vision paragraph | Click directly on them in the hero |
| Trip dates, accent color, hero image | Editor drawer → **Meta** tab |
| A place's price, notes, address, phone, image | Hover the pin, click **Edit** on the card image |
| A place's coordinates | Editor drawer → **Places** → expand row → edit lng/lat OR paste a Google Maps URL |
| Day title, stop order, which stops are in a day | Editor drawer → **Days** tab |
| A day's street food / cab / souvenir spend | Sidebar → **Misc, + add** |
| Logistics (visa, e-SIM, insurance, etc.) | Click **Edit** on the logistics card itself |
| Custom logistics (power adapter, lounge pass) | Logistics section → **+ Add card** |
| Transport (flights, trains, cabs) | Inline in the transport table, or in the editor's **Transport** tab |
| Packing bag titles & items | Click directly on the title or items. Use **+ add item** / **+ Add bag** |
| Checklist items | Click directly on them |
| Contact addresses & phones | **Contacts** section, click **Edit** on the contact card |
| Currency display | Sidebar, currency dropdown next to Day/Trip toggle |

The general rule. If there's an Edit button on a card, click it for a structured edit mode. If there's no Edit button, the field is already click to edit.

---

## Typical flows

### Tweak the Sri Lanka sample trip for yourself

1. Click the hero title and rename it.
2. Switch on **Edit** (top right).
3. Go to the **Days** tab. Rename days, delete stops you don't want, add your own.
4. Go to **Places**. Edit existing places' prices and addresses, or add new ones (click the map to drop a pin, or hit **+ New place**).
5. For transport and packing, use the dedicated tabs.
6. When done, toggle **Edit** off to see the clean result.
7. Hit **Share** to get a link.

### Start a new trip from scratch

1. Click the trip name at the top → **New trip**.
2. You get an empty shell. Fill in the hero (name, origin, vision) inline.
3. Open **Edit → Meta** and set dates, accent color, and hero image URL.
4. Go to the **Places** tab and add your places (click the map to drop pins, or paste Google Maps URLs).
5. **Days** tab, create your daily sequences.
6. Fill **Transport**, **Logistics**, **Packing** as you go.

### Have Claude generate a JSON for your next trip

Paste this into any Claude conversation along with the repo link.

> Using the Trip Vision JSON schema in [repo link], generate a trip JSON for [destination], [number of days], [vibe]. I'll fly from [your city]. My style is [slow / adventurous / luxe / backpacker / etc.].

Then in the app, go to the trip name dropdown → **Import trip JSON**, pick the file. Done.

---

## Sharing

Hit **Share** in the top nav. The link lands whoever opens it on the same trip. Since everything is static plus localStorage, the recipient gets a fresh read only feeling copy. Their edits go to their own browser storage, not yours.

If you want to share a snapshot that can be forked, use the trip switcher → **Export this trip** to get a JSON file. Send that over. They import it into their own copy.

---

## Storage

Everything lives in your browser's `localStorage` under the key `tv:trips:v2`. Nothing ever gets uploaded anywhere.

* Clearing browser storage resets you to the two default sample trips.
* The **Reset this trip** option in the trip menu restores the current trip to its original JSON. Useful if you've mangled the Sri Lanka sample and want it back.
* Always **Export** before you nuke anything you care about.

---

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In repo settings → **Pages** → Source, pick **GitHub Actions**.
3. Push to `main`. The workflow at `.github/workflows/deploy.yml` builds and publishes automatically.
4. Your site goes live at `https://<username>.github.io/<repo-name>/`.

`VITE_BASE` is set automatically from the repo name by the workflow.

If you want a custom domain or a user level page, override `VITE_BASE=/` in the workflow env block.

---

## JSON schema

```jsonc
{
  "id": "unique-kebab-case-id",              // required, used as URL param
  "name": "Trip name",                        // required
  "origin": "Hyderabad, India",               // where you're flying from
  "vision": "What you want this to feel like",
  "startDate": "2026-05-10",                  // ISO date
  "endDate": "2026-05-19",
  "currency": "INR",                          // default display currency
  "accentColor": "#E8583A",                   // hex, drives the whole theme
  "heroImage": "https://...",
  "mapCenter": [80.45, 5.97],                 // [lng, lat] where map opens
  "mapZoom": 9,

  "info": {
    "visa":      { "title": "Visa",             "notes": "...", "cost": 4200, "url": "https://..." },
    "esim":      { "title": "E-SIM",            "notes": "...", "cost": 1800, "url": "https://..." },
    "network":   { "title": "Mobile Network",   "notes": "...", "cost": 0,    "url": "https://..." },
    "exchange":  { "title": "Exchange Rate",    "rate": "1 INR = 3.55 LKR", "notes": "...", "cost": 0, "url": "..." },
    "insurance": { "title": "Travel Insurance", "notes": "...", "cost": 3500, "url": "https://..." },
    "medical":   { "title": "Medical",          "notes": "...", "cost": 2000, "url": "https://..." }
    // You can add any number of custom keys here too. They'll show up as extra cards.
  },

  "transport": [
    { "id": "t1", "type": "flight", "from": "HYD", "to": "CMB",
      "date": "2026-05-10", "time": "06:30",
      "provider": "IndiGo 6E 1223", "cost": 18500, "notes": "..." }
    // type options are flight, train, cab, bus, ferry
  ],

  "places": [
    {
      "id": "unique-place-id",
      "name": "Hangtime Hostel",
      "category": "stay",                     // stay, cafe, restaurant, chill, special, rental, transport
      "coords": [80.4293, 5.9734],            // [lng, lat], GeoJSON order
      "address": "Weligama Beach Rd, Weligama",
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
        { "placeId": "unique-place-id", "time": "morning",       // morning, afternoon, evening
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
    }
    // Add as many bag groups as you want
  ],

  "checklist": [
    { "id": "c1", "text": "Apply for ETA", "checked": false }
  ]
}
```

A few rules to keep in mind.

* All prices stored in INR. The UI converts on display.
* Coordinates are always [longitude, latitude] (GeoJSON convention, opposite of Google Maps which shows lat,lng).
* Every `id` must be unique within its own array.
* Category and transport type values are closed sets. See the comments above.

---

## Customization pointers

* **Map style.** Change the tile URL in `src/components/MapCanvas.jsx`. Carto also offers `dark_all`, `light_all`, and `dark_nolabels`. Just swap the URLs in `MAP_STYLE.sources`.
* **Categories & colors.** `src/lib.js` (`CATEGORIES`) plus matching CSS tokens in `src/index.css` (`.cat-*`).
* **Currencies.** `DEFAULT_RATES` and `CURRENCY_SYMBOLS` in `src/lib.js`.

## Stack

* React 18 + Vite + Tailwind v3
* MapLibre GL JS 4 + Carto Voyager tiles
* OSRM public demo for driving directions
* `motion` (framer-motion successor) for animations
* Fonts are Fraunces (display) and Geist / Geist Mono (body and numbers)

## Attribution

* Tiles © OpenStreetMap contributors, © Carto
* Routing via OSRM (`router.project-osrm.org`)

## License

MIT.