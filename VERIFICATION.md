# Fact-check report (15 November 2026)

What was checked: every real-world claim in `data/world.js` (destinations, satellites, spacecraft, shuttle, orbit data) and `data/data.js` (flight events, hangar and lab notes, landing notes, atmosphere notes). Sources are NASA pages and, for the Turkish satellites, TÜBİTAK UZAY, Thales and launch reports. **Status words:** OK = matches the source. FIXED = was wrong or out of date and has been changed in the files. SIMPLIFIED = deliberately simplified for gameplay. OPEN = could not be confirmed, please check by hand.

## Corrections made in the files

| Item | Was | Now | Source |
|---|---|---|---|
| MAVEN | "active" | historic: contact lost 6 Dec 2025, mission declared ended 3 Jun 2026 | [CBS News](https://www.cbsnews.com/news/nasa-declares-end-mars-orbiter-maven-mission/), [Space.com](https://www.space.com/space-exploration/launches-spacecraft/nasa-wont-give-up-hope-on-silent-maven-mars-probe-were-still-looking-for-it) |
| Europa Clipper | "reaches Europa in 2030" | reaches **Jupiter** in April 2030; first Europa flyby is 2031 | [NASA timeline](https://science.nasa.gov/mission/europa-clipper/mission-timeline), [JPL](https://www.jpl.nasa.gov/press-kits/europa-clipper/mission/) |
| Parker Solar Probe | "uses Venus gravity assists" | used seven Venus assists (2018 to 2024); the last was 6 Nov 2024 | [NASA](https://science.nasa.gov/science-research/heliophysics/final-venus-flyby-for-nasas-parker-solar-probe-queues-closest-sun-pass) |
| Hubble altitude | ~540 km | ~500 km, slowly sinking (NASA FAQ: about 300 miles, 483 km) | [NASA Hubble FAQ](https://science.nasa.gov/mission/hubble/overview/faqs/) |
| RASAT | sounded active | added: planned for 3 years, worked about 11 (retired 28 Aug 2022; eoPortal's quick-facts "2023" contradicts its own text) | [TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/?p=2308), [eoPortal](https://eoportal.org/satellite-missions/rasat) |
| Göktürk-1 orbit and builder | ~680 km, no builder | ~700 km; built by Telespazio and Thales Alenia Space | [Thales](https://www.thalesgroup.com/en/news-centre/press-releases/gokturk-1-satellite-launched-successfully), [Spaceflight Now](https://spaceflightnow.com/2016/12/05/turkeys-military-gets-a-new-eye-in-the-sky-with-successful-vega-launch/) |
| Göktürk-2 | no details | added 2.5 m resolution, ~685 km, built by TUSAŞ and TÜBİTAK UZAY | [TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/gokturk-2-satellite-achieves-12-years-of-operation-in-orbit/) |
| İMECE | no resolution | "smaller than 1 m (sub-metre)": TÜBİTAK says only "Submeter PAN, 3.96 m RGB-NIR", the 0.99 m figure is not from TÜBİTAK. Added: taken into the Turkish Air Force inventory as GÖKTÜRK-2B on 22 May 2025 | [TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/imece/), [TÜBİTAK news](https://tubitak.gov.tr/en/node/17741), [DHA](https://www.dha.com.tr/teknoloji/imece-uydusu-hava-kuvvetleri-komutanligi-envanterine-alindi-2644841) |
| CAPSTONE | "active" | "historic": NASA's activities on CAPSTONE concluded in June 2026; Advanced Space keeps using the spacecraft as a testbed | [NASA](https://www.nasa.gov/technology/space-comms/nasas-capstone-completes-extended-mission-testing-lunar-technologies) |
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

## Checked on 15 November 2026 (formerly OPEN)

1. **Mars Odyssey:** NASA's page is labelled "Active Mission", last updated 7 Nov 2026, "2001 - ongoing", more than 100,000 orbits. No fuel estimate is given; the last one (2023) said enough "through the end of 2025". Kept as "active". ([NASA](https://science.nasa.gov/mission/odyssey/); the old address /mission/mars-odyssey/ gives a 404.)
2. **Juno:** NASA's page is labelled "Active Mission", but its text still says "through September 2025". Wikipedia says it was operational on 6 Aug 2026 (second extended mission from Oct 2025). Space.com reports it may have ended but nobody can confirm, and CNES lists it as completed. Kept as "active" because of NASA's label; there is no official end statement. ([NASA](https://science.nasa.gov/mission/juno/))
3. **CAPSTONE:** NASA's activities ended in June 2026. Changed to "historic" with that explanation (see the corrections table). ([NASA](https://www.nasa.gov/technology/space-comms/nasas-capstone-completes-extended-mission-testing-lunar-technologies))
4. **ARTEMIS P1:** NASA's page is labelled "Active Mission" (updated 9 Jan 2026), but the only "operating in good health" sentence dates from 2017. Kept as "active". ([NASA](https://science.nasa.gov/mission/themis-artemis))
5. **Lunar Reconnaissance Orbiter:** NASA's page is labelled "Active Mission", updated 27 Oct 2026. OK. ([NASA](https://science.nasa.gov/mission/lro/))
6. **RASAT retirement:** 28 Aug 2022 (eoPortal mission text, a rail-news report of 28 Aug 2022, Hürriyet 29 Aug 2022, Wikipedia). The "29 Aug 2023" in eoPortal's quick-facts table contradicts its own text; 17 Aug 2011 plus 11 years also gives 2022. ([eoPortal](https://eoportal.org/satellite-missions/rasat))
7. **İMECE resolution:** TÜBİTAK says "Submeter PAN, 3.96 m Red-Green-Blue-Near Infrared", about 680 km, launched 15 Apr 2023. The game now says "smaller than 1 m". ([TÜBİTAK UZAY](https://uzay.tubitak.gov.tr/en/imece/))
8. **Standard values:** mesopause about −85 °C (NASA; the game no longer states −90 °C); Venus 464 to 467 °C and 90 to 93 times Earth's pressure (NASA fact sheet 464 °C and 92 bar); Jupiter sunlight about 4% (NASA Juno page; fact sheet gives 3.7%); Moon 384,400 km, about 1.3 s one way (NASA Space Place); Mars launch window about every 26 months and Perseverance landing 18 Feb 2021 with the sky crane (NASA/JPL press kit).
9. **Max-Q:** NASA's Artemis I timeline lists max dynamic pressure at MET 00:01:10, booster separation 00:02:12, launch abort system jettison 00:03:16 and core stage engine cutoff 00:08:03. ([NASA](https://www.nasa.gov/reference/artemis-i-mission-timeline/))

## STILL OPEN: please check by hand

- **Core stage separation time:** the game uses 8:15 (495 s). An automated read of NASA's Artemis I timeline page returned 8:03 for the separation row, which looks like a reading error. Open the page and check the "Core stage/Interim cryogenic propulsion stage separation" row. ([NASA](https://www.nasa.gov/reference/artemis-i-mission-timeline/))
- **İMECE as GÖKTÜRK-2B:** TÜBİTAK's own announcement page could not be opened by our tool; the 22 May 2025 date comes from the announcement's title and two news agencies (DHA, Haber7).
