# Space Mission Designer

*NASA Space Apps Challenge 2026 · Bursa*

**Türkçe özet:** Tarayıcıda çalışan, sunucu gerektirmeyen, eğitici bir uzay görevi simülasyonu. Roketini tasarla, hedef dünyayı seç, yakıtı ve yükü ayarla, fırlat; Δv, atmosfer katmanları, yörüngeler ve gerçek uzay araçları hakkında gerçek bilimi oynayarak öğren. Açmak için `index.html` dosyasına çift tıklamak yeterli.

---

An educational space-mission simulation that runs **entirely in the browser** (no server, no installation, no third-party libraries). Design a rocket, choose a destination, tune the fuel and cargo, launch it, and learn the real science behind the flight.

## How to run

1. Download or clone this folder.
2. Double-click **`index.html`** (any modern desktop browser: Chrome, Edge, Firefox, Safari).

That is all. To publish it online, upload the folder to any static host, for example GitHub Pages.

**Controls:** click the big screen in Mission Control to go to the launch pad · `←` `→` change room · `Enter` / `Space` opens the pad or launches · `Esc` returns to Mission Control · hover over parts of the rocket, hangar, lab, planets and landing sites to read short notes.

## What you can do

- **Walk through the base:** Hangar (the assembled SLS with engineers), Mission Control (flight director and consoles) and the Research Lab (hover over exhibits for science notes).
- **Plan a mission:** pick the launch vehicle (SLS or Space Shuttle), the destination (Earth orbit, Moon, Mars, Venus, Jupiter) and the spacecraft (Orion crew capsule, science probe, cargo lander) in a visual wizard, then fine-tune core fuel, booster fuel, cargo and the launch window.
- **Learn the physics:** the flight is computed with the Tsiolkovsky rocket equation (Δv = Isp · g0 · ln(m0 / mf)) and a gravity-turn ascent. If your Δv is too low you see exactly why the mission fails.
- **Climb through the atmosphere:** the troposphere, stratosphere, mesosphere and thermosphere each show a different short note from NASA sources on every flight, with the Kármán line marked.
- **Meet real satellites:** in the parking orbit you can pass the ISS, Hubble and Türkiye's RASAT, Göktürk-1/2 and İMECE (the launch delay decides who is near). Türksat 5A/5B/6A appear in the geostationary belt.
- **Cruise through the Solar System to scale:** a continuous zoom shows the Sun, planets in the correct order and orbits, the asteroid belt, real distances and radio delay.
- **Arrive and land:** orbit insertion with the real NASA orbiters of each world, and landing scenes for the Moon (the Apollo 11 flag, hover for facts), Mars and Venus. Small hot spots show real events: volcanoes on Venus, dust devils on Mars, lightning on Jupiter.
- **Run a space agency:** the Space Exchange page has a contract board, research upgrades, three rival agencies and a 12-round season. Resupply the orbital outpost with the Space Shuttle or its crew runs out of supplies.
- **Read the mission report:** score, Δv budget, timeline, what went well or wrong, what you learned. Print it or download it as an HTML file.

## Project layout

| Path | What it is |
|---|---|
| `index.html` | Page, styles and the interface markup |
| `game.js` | Mission phases and the rocket-equation model |
| `trajectory.js` | Gravity-turn ascent computed from physics |
| `economy.js` | Budget, contracts, research, rival agencies, season |
| `scene.js` | All drawing (hand-drawn look on a 2D canvas) |
| `ui.js` | Interface, wizard, economy page, report, main loop |
| `data/` | Science data (`data.js`), worlds and agencies (`world.js`), sprite sheet index |
| `assets/` | The illustrator's art, generated sprites, NASA photos (`assets/nasa/`) |
| `tools/` | The scripts that produced the generated sprites and the sprite index (`data/sprites.js`) |
| `CREDITS.md`, `SOURCES.md`, `VERIFICATION.md` | Who made what, the NASA pages behind each science note, and the fact-check report (what was corrected, simplified or still open) |

## Honest limits

Numbers in the game are **approximate and tuned for play**. Mission times, masses, Isp values, Δv requirements, distances and many details follow NASA's Artemis I and public sources, but they are simplified. Check each value against a primary source before treating it as fact (see `SOURCES.md`). The rival agencies, the orbital outpost and its crew are fictional.

## License

Apache License 2.0. See `LICENSE` and `NOTICE`. NASA images are public domain; see `CREDITS.md` for every third-party item.
