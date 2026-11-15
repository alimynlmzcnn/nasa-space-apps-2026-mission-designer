# Credits

## Team
- Game design, research and direction: LA FAMILIA ES TODO (NASA Space Apps Challenge 2026, Bursa)
- Illustrations: Ela Balım: the SLS rocket pieces (`rocket_sls_*`), the Space Shuttle (`shuttle_idle`) and the 8-frame flame animation (`fx_flame_*`). The rest of the artwork imitates this style and is generated (see below).
- Science research and fact-checking: Ihsan Emir Han

## AI assistance (disclosure)
The code (`game.js`, `scene.js`, `ui.js`, `economy.js`, `trajectory.js`, `data/*.js`) was written with Claude (Anthropic) during the event, from scratch. Claude also generated, as code, all the other sprites, drawn to match the illustrator's style: characters, rooms, hangar, launch pad, backgrounds, clouds and smoke, spacecraft and satellites (scripts in `tools/`). The file list is in `ASSETLER.md`; the illustrator's original rocket drawings are kept by the illustrator (the files in `assets/rocket_sls_*.png` are cleaned and enlarged copies of them). A watermarked stock image was used only as a pose reference for the flame animation and is **not** used in the game. No code was copied from another project.

## NASA images (public domain)
All planet and Sun pictures come from NASA, sourced via Wikimedia Commons. They were cropped to the disc and masked to a circle; nothing else was changed.

| File | Source |
|---|---|
| `assets/nasa/earth.png`, `earth_hi.jpg` | The Blue Marble (remastered), NASA / Apollo 17 crew, 1972 |
| `assets/nasa/moon.png` | Full Moon, Apollo 17 crew (NASA) |
| `assets/nasa/mars.png` | Viking orbiter mosaic of Mars (Valles Marineris hemisphere), NASA / USGS |
| `assets/nasa/venus.png` | Venus, Mariner 10 (NASA/JPL-Caltech) |
| `assets/nasa/jupiter.png` | Jupiter, Hubble Space Telescope WFC3, 21 April 2014 (NASA, ESA, A. Simon, Goddard Space Flight Center) |
| `assets/nasa/sun.png` | The Sun, Solar Dynamics Observatory (SDO) Atmospheric Imaging Assembly, 19 August 2010 (NASA/SDO/AIA). The orange colour is false colour: the instrument records invisible extreme-ultraviolet light. |

NASA does not endorse this project. NASA images are used according to the NASA media usage guidelines. Mission and spacecraft names (ISS, Hubble, Juno, and others) are used only to identify real missions; the satellite pictures in `assets/sats/` are our own simplified drawings, not official artwork or logos.

## Science content
Atmosphere notes, planet events and Max-Q notes come from NASA pages listed with their links in `SOURCES.md`. Numbers in `data/data.js` and `data/world.js` are approximate (Artemis I flight, US Standard Atmosphere 1976, public NASA fact sheets) and must be verified by the research team.

## Fictional elements
The rival agencies (Aurora Space Agency, Helios Aerospace, Vanguard Orbital), the orbital outpost and its crew are made up for the game.

## Software
No third-party libraries or fonts are used. The interface uses the operating system's own fonts.
