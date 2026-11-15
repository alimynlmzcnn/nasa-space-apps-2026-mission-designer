# Fact-check report (15 November 2026)

What was checked: every real-world claim in `data/world.js` (destinations, satellites, spacecraft, shuttle, orbit data) and `data/data.js` (flight events, hangar and lab notes, landing notes, atmosphere notes). Sources are NASA pages and, for the Turkish satellites, TÜBİTAK UZAY, Thales and launch reports. **Status words:** OK = matches the source. FIXED = was wrong or out of date and has been changed in the files. SIMPLIFIED = deliberately simplified for gameplay. OPEN = could not be confirmed, please check by hand.

## Corrections made in the files

| Item | Was | Now | Source |
|---|---|---|---|
| MAVEN | "active" | historic: contact lost 6 Dec 2025, mission declared ended 3 Jun 2026 | [CBS News](https://www.cbsnews.com/news/nasa-declares-end-mars-orbiter-maven-mission/), [Space.com](https://www.space.com/space-exploration/launches-spacecraft/nasa-wont-give-up-hope-on-silent-maven-mars-probe-were-still-looking-for-it) |
| Europa Clipper | "reaches Europa in 2030" | reaches **Jupiter** in April 2030; first Europa flyby is 2031 | [NASA timeline](https://science.nasa.gov/mission/europa-clipper/mission-timeline), [JPL](https://www.jpl.nasa.gov/press-kits/europa-clipper/mission/) |
| Parker Solar Probe | "uses Venus gravity assists" | used seven Venus assists (2018 to 2024); the last was 6 Nov 2024 | [NASA](https://science.nasa.gov/science-research/heliophysics/final-venus-flyby-for-nasas-parker-solar-probe-queues-closest-sun-pass) |
| Hubble altitude | ~540 km | ~500 km, slowly sinking (NASA FAQ: about 300 miles, 483 km) | [NASA Hubble FAQ](https://science.nasa.gov/mission/hubble/overview/faqs/) |
| RASAT | sounded active | added: planned for 3 years, worked about 11 (retired 2022; one source says 2023) | [TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/?p=2308), [eoPortal](https://eoportal.org/satellite-missions/rasat) |
| Göktürk-1 orbit and builder | ~680 km, no builder | ~700 km; built by Telespazio and Thales Alenia Space | [Thales](https://www.thalesgroup.com/en/news-centre/press-releases/gokturk-1-satellite-launched-successfully), [Spaceflight Now](https://spaceflightnow.com/2016/12/05/turkeys-military-gets-a-new-eye-in-the-sky-with-successful-vega-launch/) |
| Göktürk-2 | no details | added 2.5 m resolution, ~685 km, built by TUSAŞ and TÜBİTAK UZAY | [TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/gokturk-2-satellite-achieves-12-years-of-operation-in-orbit/) |
| İMECE | no resolution | added "about 1 m" (Wikipedia lists 0.99 m panchromatic) | [TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/?p=3091) |
| Jupiter radio delay | 33 to 53 min | 33 to 54 min (588.5 and 968.5 million km at the speed of light) | [NASA Jupiter fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html) |
| SLS thrust | "at liftoff" | "up to about 39 MN (8.8 million lb) at its maximum" (NASA lists 8.27 million lb at launch) | [NASA SLS](https://www.nasa.gov/reference/space-launch-system/) |
| Launch abort system | "pulls the capsule away in under a second" | "within a few seconds (0 to 400-500 mph in about two seconds)" | [NASA LAS](https://www.nasa.gov/reference/launch-abort-system/) |
| LAS jettison time | T+3:17 (197 s) | T+3:16 (196 s) | [NASA Artemis I timeline](https://www.nasa.gov/reference/artemis-i-mission-timeline/) |
| Venera 13 | "first colour photos" | "first colour photos of the surface of Venus" | [NASA StarChild](https://starchild.gsfc.nasa.gov/docs/StarChild/space_level2/venus.html) |
| Venus probes "survive only for hours" | hours | longest lander life about two hours (Venera 13: 127 min) | [NASA Venera 7](https://solarsystem.nasa.gov/missions/venera-7/in-depth/) |
| Periodic table | "about 100 elements" | "118 known elements" | general chemistry |
| Atmosphere note (stratosphere) | "air gets thin enough for meteors to start glowing" (was our own wording, no source) | "above it comes the mesosphere, where most meteors burn up" | [NASA](https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/) |
| Apollo 11 | "about 2.5 hours outside" | "Armstrong spent about 2.5 hours outside" (2 h 31 min; Aldrin about 40 min less) | [NASA Apollo 11 mission report](https://history.nasa.gov/wp-content/uploads/static/history/alsj/a11/A11_PAOMissionReport.html) |
| ISS | "since 1998" | first module 1998, crews since Nov 2000 (the old text mixed the two) | [NASA ISS](https://www.nasa.gov/reference/international-space-station/) |

## Verified, no change needed

**Turkish satellites.**
- Göktürk-1: launched 5 Dec 2016 on Vega from Kourou, 0.5 m panchromatic. ([Spaceflight Now](https://spaceflightnow.com/2016/12/05/turkeys-military-gets-a-new-eye-in-the-sky-with-successful-vega-launch/))
- Göktürk-2: launched 18 Dec 2012 from Jiuquan on a Long March 2D, designed for 5 years, still working after 12. ([TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/gokturk-2-satellite-achieves-12-years-of-operation-in-orbit/))
- RASAT: launched 17 Aug 2011 (a UN filing says 12 Aug) on a Dnepr, ~700 km sun-synchronous, 7.5 m black-and-white and 15 m multispectral. ([TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/?p=2308))
- İMECE: launched 15 Apr 2023 on Falcon 9 (Transporter-7), ~680 km sun-synchronous, developed by TÜBİTAK UZAY. ([TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/?p=3091))
- Türksat 5A: launched 8 Jan 2021 (UTC), 31°E. ([Spaceflight Now](https://spaceflightnow.com/2021/01/08/spacex-deploys-turkish-satellite-in-first-launch-of-2021/))
- Türksat 5B: launched 19 Dec 2021, 42°E. ([NASASpaceflight](https://nasaspaceflight.com/2021/12/turksat-5b-falcon-9))
- Türksat 6A: launched 8/9 July 2024, 42°E, Türkiye's first domestically built communications satellite. ([Anadolu](https://aa.com.tr/en/science-technology/turkiyes-1st-homegrown-communications-satellite-launched-successfully/3269827))

**Other spacecraft and places.**
- ISS: 109 m across the arrays, about 92.7 min per orbit, 370 to 460 km, occupied since 2 Nov 2000. ([NASA](https://www.nasa.gov/reference/international-space-station/))
- Landsat 9: 705 km, still operating. ([NASA](https://science.nasa.gov/mission/landsat-9/))
- Magellan (radar mapped 98% of Venus, 1990 to 1994), Pioneer Venus Orbiter (1978 to 1992), Galileo (1995 to 2003, then plunged into Jupiter on 21 Sep 2003). ([NSSDC](https://nssdc.gsfc.nasa.gov/planetary/magellan.html))
- Distances from Earth: Mars 54.6 to 401 million km, Venus about 38 to 261 million km, Jupiter 588.5 to 968.5 million km. ([NASA Mars fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html), [NASA Venus](https://science.nasa.gov/venus/venus-facts/)). Divided by the speed of light these give the game's 3 to 22 minutes (Mars) and 2 to 14 minutes (Venus). NASA pages round Mars to "4 to 24 minutes".

**Flight events (Artemis I).**
- Booster separation T+2:12 (132 s), main engine cutoff T+8:03 (483 s), core stage separation T+8:15 (495 s). ([NASA](https://www.nasa.gov/reference/artemis-i-mission-timeline/))
- Max-Q about T+1:10, booster thrust above 75% at liftoff, SLS height 322 ft (98 m), core stage over 212 ft (65 m). ([NASA SLS](https://www.nasa.gov/reference/space-launch-system/), [Artemis II press kit](https://www.nasa.gov/artemis-ii-press-kit/))

**Landing notes.**
- Apollo 11: first step 02:56 UTC on 21 July, Aldrin about 19 min later, about 21.55 kg of samples. ([NASA](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A))
- Viking 1 landed on 20 July 1976 and worked more than six years. ([NASA](https://science.nasa.gov/mission/viking-1/))
- Mars 3 landed 2 Dec 1971 and stopped after 14.5 to 20 seconds. ([JPL](https://www.jpl.nasa.gov/news/nasa-mars-orbiter-images-may-show-1971-soviet-lander/))
- Venera 7 (15 Dec 1970) sent a weak signal from the surface for about 23 minutes. ([NASA](https://solarsystem.nasa.gov/missions/venera-7/in-depth/))

## SIMPLIFIED on purpose (tell the jury if asked)

- **Δv requirements** (`need` in `data/world.js`: 9.3, 12.45, 12.9, 12.8, 15.6 km/s) are typical textbook values from a low Earth orbit plus about 1.5 km/s of losses. Not taken from one NASA page.
- **Booster Isp is 300 s** in `game.js`. A real solid rocket booster is around 250 to 270 s. The higher value was tuned so the three-stage model still reaches orbit with a simple staging. Engine Isp values (450 s for RS-25, 462 s for the upper stage) are close to real ones.
- **Masses** (core 987 t propellant, boosters 630 t each, Orion 26 t) are rounded and approximate.
- **Flight profile** in `data/data.js` (altitude and speed against time) is a smooth approximation of Artemis I, not telemetry.
- **Shuttle:** main engine cutoff at 520 s (real: about 8.5 min, around 510 s). Payload capacity 27.5 t: NASA documents give 25 to 29.5 t depending on orbit.
- **Satellite positions** are placed in one parking orbit so the player can meet them. Real orbits differ by hundreds of kilometres. Göktürk and İMECE also fly in sun-synchronous orbits that do not match the SLS parking orbit.
- **Layer boundaries** (troposphere 12 km, mesosphere 85 km and so on) vary with latitude and season. NASA pages differ a little between each other.
- **Mission times:** Mars 210 days, Venus 150 days, Jupiter 1000 days are gameplay values near typical fast trajectories (Perseverance took about 6.5 months).

## OPEN: please check by hand

1. **Mars Odyssey** is listed as "active". 2026 trackers and Wikipedia say yes, but we found no NASA page for November 2026. Its propellant was predicted to last until the end of 2025. (Check NASA's Mars Odyssey mission page.)
2. **Juno** is listed as "active". NASA's extended mission ran to September 2025; a 2026 report says the probe is healthy and funded, but we found no official NASA statement. ([JPL Juno](https://jpl.nasa.gov/missions/juno/))
3. **CAPSTONE** and **ARTEMIS P1**: last confirmed operating in 2025 and 2017 respectively. Check NASA's pages. ([CAPSTONE](https://www.nasa.gov/blogs/artemis/2022/11/13/capstone-arrives-to-orbit-at-the-moon/), [ARTEMIS](https://science.nasa.gov/mission/themis-artemis))
4. **Lunar Reconnaissance Orbiter**: listed as operational by NASA Goddard, no 2026 confirmation found. ([NASA](https://science.gsfc.nasa.gov/solarsystem/projects/29/))
5. **RASAT retirement date:** August 2022 (Wikipedia) or August 2023 (eoPortal). Ask TÜBİTAK UZAY.
6. **İMECE resolution:** one source says 0.99 m, another says only "sub-meter".
7. **Mesosphere "about −90 °C"** in the lab text, **Venus 465 °C and 90 times Earth's pressure**, **Jupiter "sunlight about 4%"**, **Moon 384,400 km**, **Mars launch window every 26 months**, **Perseverance sky crane (Feb 2021)**: standard values, not re-checked here.
8. **Max-Q for Artemis I:** we used the Artemis II time (about 1 min 10 s), because that is what the NASA press kit states.
