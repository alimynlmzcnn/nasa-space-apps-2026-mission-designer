# NASA sources for the science notes

All atmosphere notes and planet events in the game come from these NASA pages. Altitudes and numbers are approximate and differ a little between NASA pages; the research team should re-check each one before the final submission.

## Atmosphere layers (`data/data.js` → `layers[].facts`)
- Earth's Atmosphere: A Multi-layered Cake: https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/ (five layers, weather in the troposphere, ozone, coldest mesosphere with meteors, ISS and ionosphere/aurora in the thermosphere, exosphere with hydrogen and helium)
- Space Place, Troposphere: https://spaceplace.nasa.gov/troposphere/en/ (three-quarters of the atmosphere's mass)
- NASA, Dressing for Altitude (tropopause is higher in summer, jet streams): https://www.nasa.gov/wp-content/uploads/2023/05/dressing-for-altitude-nov-2017.pdf
- Space Place, Stratosphere: https://spaceplace.nasa.gov/stratosphere/en/ (cold air below, warm air above)
- NASA Science, Ozone (Aura): https://science.nasa.gov/mission/aura/ozone/ (ozone absorbs and scatters UV-B and UV-C)
- NASA, Ozone layer fact sheet: https://science.nasa.gov/wp-content/uploads/2024/09/ozone-layer.pdf (ozone layer about 11 to 50 km up)
- NASA AIM, night-shining clouds: https://www.nasa.gov/solar-system/nasas-aim-spots-first-arctic-noctilucent-clouds-of-the-season/ , https://science.nasa.gov/earth/earth-observatory/night-shining-clouds-86036/ , https://science.nasa.gov/earth/earth-observatory/early-start-for-noctilucent-clouds-81446/ , https://www.nasa.gov/image-article/aeronomy-of-ice-mesosphere-aim/ (about 50 miles up, meteor dust, summer season; AIM 2007 to 2023, re-entry 19 Aug 2024)
- Helio Data, Earth's Thermosphere: https://helio.data.nasa.gov/region/earth-thermosphere (about 330 to 930 °C, heated by EUV and X-rays)
- NASA TM, Neutral orbital altitude density effects on the ISS: https://ntrs.nasa.gov/citations/19970028145 (drag and reboost planning)

## Max-Q (`events[].alts`)
- NASA Artemis II press kit: https://www.nasa.gov/artemis-ii-press-kit/ (Max Q about 1 min 10 s after liftoff, supersonic at +00:56)
- NASA NTRS, SLS flight readiness analysis cycle approach: https://ntrs.nasa.gov/citations/20205004534 (core-stage "throttle bucket" through Max Q)

## Planet events (`data/data.js` → `planetEvents`)
- Mercury, polar ice: https://www.jpl.nasa.gov/news/nasa-spacecraft-finds-new-mercury-water-ice-evidence/ , https://nssdc.gsfc.nasa.gov/planetary/ice/ice_mercury.html , https://science.nasa.gov/photojournal/water-ice-on-mercury/ (MESSENGER; ice can survive over a billion years in shadowed craters; not every shadowed crater has ice). Mercury is not a destination in the game yet, so this note is stored but not shown.
- Venus, volcanoes: https://www.jpl.nasa.gov/news/ongoing-venus-volcanic-activity-discovered-with-nasas-magellan-data/ (Magellan, new lava flow on Maat Mons), https://www.jpl.nasa.gov/news/nasa-funded-research-suggests-venus-is-geologically-alive/
- Mars, dust devils: https://www.jpl.nasa.gov/news/nasas-perseverance-captures-dust-filled-martian-whirlwind/ (shadow shows about 2 km height), https://www.jpl.nasa.gov/images/pia26528-perserverance-captures-crater-rim-dust-devil-eating-its-own/ (at least 400 m tall, about 65 m wide)
- Jupiter, lightning: https://science.nasa.gov/science-research/planetary-science/lightning-across-the-solar-system/ (flashes up to three times more energetic than Earth's largest superbolts), https://www.jpl.nasa.gov/news/juno-solves-39-year-old-mystery-of-jupiter-lightning/ (strikes near the poles, none near the equator)
