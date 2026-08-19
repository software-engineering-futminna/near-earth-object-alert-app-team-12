# NEO Alert — Near-Earth Object Tracker

A live, colour-coded dashboard tracking Near-Earth Objects using NASA's NeoWs API. No science degree required — just a quick, readable view of what's flying past Earth this week.

## Features

- **Live data** from NASA's Near Earth Object Web Service (NeoWs), covering a 7-day window
- **Risk classification** — objects are tagged Safe, Caution, or Hazardous based on NASA's official hazard flag and proximity (measured in lunar distances)
- **Filtering** — view all objects or narrow down by risk level
- **Client-side caching** — responses are cached for 30 minutes to reduce API calls and speed up repeat visits
- **Accessible by design** — semantic HTML, ARIA live regions, and full support for reduced-motion preferences
- **Fully responsive** — works from mobile to wide desktop screens

## Tech Stack

- HTML5, CSS3, vanilla JavaScript — no frameworks, no backend
- [NASA NeoWs API](https://api.nasa.gov/) for asteroid data
- Google Fonts (Space Grotesk, Inter, JetBrains Mono)

## How Risk Levels Work

| Level | Meaning |
|---|---|
| Green means Safe | Not flagged, comfortable distance |
| yellow means Caution | Not flagged hazardous, but within 20 lunar distances |
| red means Hazardous | NASA-flagged as potentially hazardous |

## Setup

1. Clone this repository
2. Get a free API key at [api.nasa.gov](https://api.nasa.gov/)
3. Replace the API key in `app.js`
4. Open `index.html` in any browser — no build step required

## Team 12

- Obama Destiny Ikechukwu — 2024/1/99421SW
- Ibrahim Abdallah Salihu — 2024/1/96954SW
- Surajudeen Abdullah Adebayo — 2024/1/95628SW
- Micheal Ugochukwu — 2024/1/96174SW


