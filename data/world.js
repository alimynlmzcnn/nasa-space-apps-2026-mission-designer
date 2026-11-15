// Destinations, spacecraft, upgrades and rival agencies.
// NOTE: numbers are APPROXIMATE and tuned for gameplay. The research team must verify distances, travel times
// and delta-v values against NASA sources (see CREDITS.md). The rival agencies are fictional.
window.WORLD = {
  // need = total delta-v (km/s) from the launch pad, including ~1.5 km/s of gravity/drag/steering losses.
  dest: {
    leo:     { name: "Earth orbit", short: "Earth orbit", need: 9.3, transfer: false, days: 0, pts: 40, reward: 300, hard: 0.0, dist: "about 400 km up", delay: "none", color: "#3f7fe0",
               fact: "Low Earth orbit is where the International Space Station flies, about 400 km up and moving at roughly 28,000 km/h." },
    moon:    { name: "The Moon", short: "Moon", need: 12.45, transfer: true, days: 3, pts: 100, reward: 700, hard: 0.1, dist: "384,400 km", delay: "1.3 seconds", color: "#b8b8c8",
               fact: "The Moon is about 384,400 km away. Apollo-era spacecraft needed roughly 3 days to get there, and radio signals take 1.3 seconds each way." },
    mars:    { name: "Mars", short: "Mars", need: 12.9, transfer: true, days: 210, pts: 250, reward: 1500, hard: 0.25, dist: "55 to 400 million km", delay: "3 to 22 minutes", color: "#d9693a",
               fact: "Mars is reachable in about 7 months, but only when the planets line up, roughly every 26 months. Radio signals take 3 to 22 minutes each way." },
    venus:   { name: "Venus", short: "Venus", need: 12.8, transfer: true, days: 150, pts: 250, reward: 1400, hard: 0.25, dist: "38 to 261 million km", delay: "2 to 14 minutes", color: "#e6c27a",
               fact: "Venus is the hottest planet: about 465 °C on the surface, under air pressure about 90 times that of Earth. The longest any lander has lasted there is about two hours." },
    jupiter: { name: "Jupiter", short: "Jupiter", need: 15.6, transfer: true, days: 1000, pts: 400, reward: 2600, hard: 0.4, dist: "588 to 968 million km", delay: "33 to 54 minutes", color: "#d3a373",
               fact: "Jupiter is so far that sunlight is only about 4% as strong as at Earth, and its radiation belts are deadly to electronics and astronauts." },
    outpost: { name: "Orbital outpost", short: "Outpost", need: 9.3, transfer: false, days: 0, pts: 30, reward: 250, hard: 0.0, dist: "about 400 km up", delay: "none", color: "#3f7fe0",
               fact: "Crews living in orbit need a steady supply of food, water and oxygen. Every kilogram has to be launched from Earth." }
  },

  craft: {
    orion:  { name: "Orion crew capsule", mass: 26, crew: 4, cost: 100, sprite: "rocket_sls_stage2", dests: ["leo", "moon", "mars", "venus"],
              why: { jupiter: "A crewed trip to Jupiter lasts about 1000 days and needs roughly 24 t of food, water and oxygen on top of the 26 t capsule. No rocket can lift that far. Every real mission to Jupiter (Galileo, Juno, Europa Clipper) is a robotic probe: choose the probe." },
              text: "Carries 4 astronauts. Crew need food, water and oxygen: pack enough supplies as cargo for the whole trip." },
    probe:  { name: "Science probe", mass: 6, crew: 0, cost: 150, sprite: "craft_probe", dests: ["leo", "moon", "mars", "venus", "jupiter"],
              text: "A light robotic probe. Cheap to launch, so it can fly the fastest and farthest routes." },
    lander: { name: "Cargo lander", mass: 20, crew: 0, cost: 120, sprite: "craft_lander", dests: ["moon", "mars"],
              text: "Delivers equipment to the surface of the Moon or Mars. Heavy, so budget your delta-v." }
  },

  // One-time research purchases (cost in $M).
  upgrades: [
    { id: "engines", name: "Upgraded RS-25 engines", cost: 350, text: "Core stage engines burn about 6% more efficiently." },
    { id: "boosters", name: "Advanced boosters", cost: 300, text: "Solid boosters get about 5% more out of their propellant." },
    { id: "light", name: "Lightweight tanks", cost: 300, text: "A lighter core stage structure: 12 tonnes less dead weight." },
    { id: "eus", name: "Exploration upper stage", cost: 550, text: "A larger upper stage carries about 18 tonnes more propellant for the push out of Earth orbit." }
  ],

  rivals: [
    { id: "aurora", name: "Aurora Space Agency", color: "#ff7ab8", skill: 0.7 },
    { id: "helios", name: "Helios Aerospace", color: "#ffd23f", skill: 0.6 },
    { id: "vanguard", name: "Vanguard Orbital", color: "#6fb4ff", skill: 0.8 }
  ],

  // Real satellites (simplified: placed in the parking orbit so the player can meet them). Satellites sharing the parking orbit the rocket flies into. s0 = along-track position (km) at launch time 0; alt offset (km) from the rocket's insertion altitude.
  sats: [
    { id: "iss", name: "ISS · International Space Station", s0: 3000, dalt: -4, pts: 140, fact: "The ISS is about 109 m wide and orbits Earth every ~92 minutes at about 400 km. People have lived on board continuously since November 2000." },
    { id: "hubble", name: "Hubble Space Telescope", s0: 9500, dalt: 2, pts: 120, fact: "Hubble was launched in 1990 and orbits at roughly 500 km, slowly sinking because of the thin air. Above the blurring atmosphere, it has photographed galaxies billions of light-years away." },
    { id: "rasat", name: "RASAT · Türkiye's first domestic Earth observation satellite", s0: 16000, dalt: -2, pts: 150, fact: "RASAT was designed and built in Türkiye (TÜBİTAK UZAY) and launched in 2011 into a ~700 km sun-synchronous orbit. Its camera sees details of about 7.5 m. It was planned for 3 years and worked for about 11." },
    { id: "gokturk1", name: "Göktürk-1 · Turkish reconnaissance satellite", s0: 22500, dalt: 3, pts: 160, fact: "Göktürk-1 was launched in December 2016. It is a Turkish high-resolution (about 0.5 m) imaging satellite built by Telespazio and Thales Alenia Space, flying in a ~700 km sun-synchronous orbit." },
    { id: "gokturk", name: "Göktürk-2 · Turkish imaging satellite", s0: 29000, dalt: 6, pts: 130, fact: "Göktürk-2 is a Turkish imaging satellite (about 2.5 m resolution, ~685 km orbit) developed by TUSAŞ and TÜBİTAK UZAY and launched in December 2012. Imaging satellites fly over every point of Earth at the same local time, which makes before/after comparisons easy." },
    { id: "imece", name: "İMECE · Türkiye's Earth observation satellite", s0: 35500, dalt: 1, pts: 200, fact: "İMECE is a high-resolution Earth observation satellite developed in Türkiye (TÜBİTAK UZAY) and launched in April 2023 into a ~680 km sun-synchronous orbit. It sees details of about 1 m." }
  ],   // altitudes are simplified for gameplay: real orbits differ by hundreds of km
  satW: 7.5,   // km/s ground-track speed of a low-orbit satellite

  season: { rounds: 12, startBudget: 900, outpostStart: 45, outpostDrain: 12, outpostMax: 90, daysPerTonne: 20 },

  // Space Shuttle supply flight
  shuttle: { capacity: 27.5, minCargo: 2, cost: 120,
    profile: [[0, 0, 0], [10, 0.2, 160], [30, 2.5, 1000], [60, 10, 1700], [124, 45, 4900], [200, 100, 9000], [300, 128, 14500], [450, 150, 26000], [520, 160, 28000], [600, 162, 28100]],
    events: [
      { t: -4, id: "ignition", title: "Main engines ignited", text: "The shuttle's three main engines start before liftoff. Computers check their thrust before the two solid boosters are lit." },
      { t: 0, id: "liftoff", title: "Liftoff!", text: "The shuttle rises with food, water and spare parts for the crew waiting in orbit." },
      { t: 62, id: "maxq", title: "Max-Q: maximum air pressure", text: "The shuttle's wings and body feel the largest aerodynamic load right now. The engines are briefly throttled back." },
      { t: 124, id: "srbsep", title: "Boosters separated", text: "The two white solid boosters burn out and fall away. They parachute into the ocean and are recovered and reused." },
      { t: 200, id: "karman", title: "The Kármán line: 100 km", text: "The traditional edge of space. The orbiter is still burning fuel from its big orange external tank." },
      { t: 520, id: "etsep", title: "External tank jettisoned", text: "The empty orange tank is released and burns up over the ocean. The orbiter is now in orbit." },
      { t: 560, id: "dock", title: "Docked with the outpost", text: "The orbiter's cargo bay opens and the crew unloads the supplies. Every tonne of food, water and oxygen keeps the crew alive for weeks." }
    ],
    tm: { ign: -4, meco: 520, orbit: 548 }
  }
};

// Real NASA spacecraft at or near each destination. st: "active" | "historic" | "en route". Verify status/dates (CREDITS.md).
WORLD.dest.leo.orb = [
  { n: "International Space Station", st: "active", t: "Crewed lab, ~400 km up. First module launched 1998, crews since 2000" },
  { n: "Hubble Space Telescope", st: "active", t: "Space telescope launched 1990, ~500 km" },
  { n: "Landsat 9", st: "active", t: "Earth-imaging satellite, ~705 km" }
];
WORLD.dest.outpost.orb = WORLD.dest.leo.orb;
WORLD.dest.moon.orb = [
  { n: "Lunar Reconnaissance Orbiter (LRO)", st: "active", t: "Mapping the Moon from orbit since 2009" },
  { n: "CAPSTONE", st: "active", t: "Cubesat testing the Gateway's halo orbit (2022)" },
  { n: "ARTEMIS P1", st: "active", t: "Two-probe mission studying the Moon's space environment" }
];
WORLD.dest.mars.orb = [
  { n: "Mars Reconnaissance Orbiter (MRO)", st: "active", t: "High-resolution camera orbiter since 2006" },
  { n: "MAVEN", st: "historic", t: "Studied how Mars lost its atmosphere, 2014 to 2025. Contact lost Dec 2025, mission ended June 2026" },
  { n: "Mars Odyssey", st: "active", t: "Longest-serving Mars orbiter, since 2001" }
];
WORLD.dest.venus.orb = [
  { n: "Magellan", st: "historic", t: "Radar-mapped 98% of Venus, 1990–1994" },
  { n: "Pioneer Venus Orbiter", st: "historic", t: "Orbited Venus from 1978 to 1992" },
  { n: "Parker Solar Probe", st: "active", t: "Used seven Venus gravity assists (2018 to 2024) to dive close to the Sun" }
];
WORLD.dest.jupiter.orb = [
  { n: "Juno", st: "active", t: "Polar orbiter studying Jupiter's interior since 2016" },
  { n: "Galileo", st: "historic", t: "Orbited Jupiter 1995–2003, then plunged into it" },
  { n: "Europa Clipper", st: "en route", t: "Launched 2024, reaches Jupiter in April 2030, then flies past Europa" }
];

// give every NASA orbiter a sprite id (see assets/sats)
{ const OID = { "International Space Station": "iss", "Hubble Space Telescope": "hubble", "Landsat 9": "landsat9", "Lunar Reconnaissance Orbiter (LRO)": "lro", "CAPSTONE": "capstone", "ARTEMIS P1": "artemis", "Mars Reconnaissance Orbiter (MRO)": "mro", "MAVEN": "maven", "Mars Odyssey": "odyssey", "Magellan": "magellan", "Pioneer Venus Orbiter": "pioneer", "Parker Solar Probe": "parker", "Juno": "juno", "Galileo": "galileo", "Europa Clipper": "clipper" };
  for (const k in WORLD.dest) (WORLD.dest[k].orb || []).forEach(o => { o.id = OID[o.n] || null; }); }

// Geostationary Turkish communications satellites (seen when leaving Earth: ring radius = 6.6 Earth radii, i.e. 35,786 km above the surface)
WORLD.geo = [
  { id: "turksat", name: "Türksat 5A", lon: 31, fact: "Launched Jan 2021, at 31°E." },
  { id: "turksat", name: "Türksat 5B", lon: 42, fact: "Launched Dec 2021, at 42°E." },
  { id: "turksat", name: "Türksat 6A", lon: 42.4, fact: "Türkiye's first domestically built communications satellite, launched July 2024 (42°E)." }
];
// Orbits for the heliocentric (solar system) cruise view: semi-major axis in AU, period in days, phase = ecliptic longitude at departure (rad). The destination's phase is computed so it meets the spacecraft.
WORLD.helio = {
  mercury: { name: "Mercury", au: 0.387, per: 87.97, ph: 2.1 }, venus: { name: "Venus", au: 0.723, per: 224.7, ph: 4.4 }, earth: { name: "Earth", au: 1.0, per: 365.25, ph: 0 },
  mars: { name: "Mars", au: 1.524, per: 686.98, ph: 5.0 }, jupiter: { name: "Jupiter", au: 5.203, per: 4332.6, ph: 1.0 }, saturn: { name: "Saturn", au: 9.537, per: 10759, ph: 3.2 }
};
