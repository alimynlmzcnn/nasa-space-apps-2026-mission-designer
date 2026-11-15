// The scientific content of the game.
// NOTE: numbers are APPROXIMATE (based on the Artemis I flight and the US Standard Atmosphere 1976).
// The research team must verify each one against a primary source and add it to CREDITS.md.
window.DATA = {
  // Atmosphere layers (km). Boundaries vary with latitude and season.
  layers: [
    { id: "troposphere", name: "Troposphere", from: 0, to: 12, color: "#6aa6ee",
      fact: "About three-quarters of the mass of the whole atmosphere is packed into this lowest layer. The air we breathe and the clouds we see are here.",
      facts: [
        "About three-quarters of the mass of the whole atmosphere is packed into this lowest layer. The air we breathe and the clouds we see are here.",
        "Almost all weather happens in the troposphere. The rocket is climbing through the thickest, busiest part of the sky right now.",
        "The top of this layer (the tropopause) is not at a fixed height: it is higher in summer and lower in winter, because warm air expands.",
        "Jet streams, fast and narrow rivers of air, flow near the tropopause at the top of this layer.",
        "NASA counts five main layers of air above us. We start in the lowest one and will pass through all of them."] },
    { id: "stratosphere", name: "Stratosphere", from: 12, to: 50, color: "#4a72cf",
      fact: "The ozone layer is here. It absorbs and scatters the Sun's harmful ultraviolet light, especially the most dangerous UV-B and UV-C.",
      facts: [
        "The ozone layer is here. It absorbs and scatters the Sun's harmful ultraviolet light, especially the most dangerous UV-B and UV-C.",
        "There are no storms or turbulence to mix the air here: cold, heavy air sits at the bottom and warm, light air at the top, the opposite of the troposphere.",
        "NASA places the ozone layer roughly 11 to 50 km above the ground. Satellites such as Aura measure it from orbit.",
        "The stratosphere reaches up to about 50 km (31 miles). Above it comes the mesosphere, the layer where most meteors burn up."] },
    { id: "mesosphere", name: "Mesosphere", from: 50, to: 85, color: "#3b46a8",
      fact: "The mesosphere is the coldest layer of the atmosphere, and it is where most meteors burn up before they can reach the ground.",
      facts: [
        "The mesosphere is the coldest layer of the atmosphere, and it is where most meteors burn up before they can reach the ground.",
        "Night-shining (noctilucent) clouds form near the top of this layer, about 80 km up: they are the highest clouds on Earth.",
        "Those clouds are made of ice that freezes around dust left by disintegrating meteors. Volcanic ash and rocket exhaust can also seed them.",
        "Strangely, the summer months that are warmest near the ground are the coldest in the mesosphere, so the night-shining clouds appear in summer.",
        "NASA's AIM satellite studied these clouds from 2007 to 2023, then returned to Earth's atmosphere in August 2024."] },
    { id: "thermosphere", name: "Thermosphere", from: 85, to: 600, color: "#2a1f7a",
      fact: "The International Space Station orbits in this layer. The space around it is not completely empty: a few air molecules still touch it.",
      facts: [
        "The International Space Station orbits in this layer. The space around it is not completely empty: a few air molecules still touch it.",
        "The Sun's extreme ultraviolet light and X-rays heat the gas here to roughly 330 to 930 °C, depending on solar activity.",
        "When the Sun is active, this layer swells upward and drags on satellites. That is why the Space Station must periodically boost its orbit.",
        "The ionosphere lives inside the thermosphere. It reflects radio waves for communication, and auroras often glow in it.",
        "Above the thermosphere is the exosphere, mostly hydrogen and helium, which finally fades into the solar wind."] }
  ],
  karman: 100, // km: the traditional edge of space

  // Flight profile: [mission seconds, altitude km, speed km/h] (approximate, Artemis I)
  profile: [
    [0, 0, 0], [10, 0.15, 150], [30, 2.2, 900], [60, 9, 1600], [70, 13, 1750], [100, 27, 3300],
    [132, 45, 5100], [160, 64, 6300], [197, 90, 8200], [215, 100, 9000], [300, 126, 13500],
    [400, 148, 20500], [483, 158, 28000], [495, 160, 28100], [560, 162, 28100]
  ],

  // Events (mission seconds)
  events: [
    { t: -4, id: "ignition", title: "Main engines ignited",
      text: "The four RS-25 engines in the core stage start a few seconds before liftoff (about T−6 s in reality). The computer checks their thrust; if all is well, the boosters are lit." },
    { t: 0, id: "liftoff", title: "Liftoff!",
      text: "The two solid boosters light at T−0 and cannot be shut down. They provide more than 75% of the thrust at liftoff." },
    { t: 70, id: "maxq", title: "Max-Q: maximum air pressure",
      text: "The rocket is fast but the air is still dense. The aerodynamic load on its body (q = ½·ρ·v²) is at its highest right now.",
      alts: ["Max Q is the point of peak aerodynamic stress on the vehicle. For SLS, NASA's Artemis II timeline puts it about 1 minute 10 seconds after liftoff, shortly after the rocket goes supersonic.",
        "To reduce the loads at Max Q, the flight software throttles the core stage engines down for a while (NASA calls it a \"throttle bucket\") and throttles them back up once the air thins."] },
    { t: 132, id: "srbsep", title: "Boosters separated",
      text: "After about two minutes the two solid boosters burn out and fall away. Dropping empty mass lets the remaining fuel add much more speed (the rocket equation)." },
    { t: 196, id: "las", title: "Launch abort tower jettisoned",
      text: "The thick atmosphere is behind us. The tower that could pull the capsule away in an emergency is no longer needed, so it is dropped to save weight." },
    { t: 215, id: "karman", title: "The Kármán line: 100 km",
      text: "The traditional edge of space is behind us. But height alone does not keep you up there: you need about 28,000 km/h of sideways speed to stay in orbit." },
    { t: 483, id: "meco", title: "Main engine cutoff (MECO)",
      text: "After about eight minutes the core stage has used up its propellant. The speed is now very close to orbital speed." },
    { t: 495, id: "coresep", title: "Core stage separated",
      text: "The orange core stage separates and falls back toward the atmosphere. The upper stage (ICPS) and Orion continue." }
  ],
  tIgnition: -4, tLiftoff: 0, tSrbSep: 132, tLas: 196, tMeco: 483, tCoreSep: 495, tOrbit: 524,

  // Hangar info cards
  parts: {
    sls: { title: "SLS (Space Launch System) · Block 1",
      text: "NASA's Moon rocket. It is about 98 m tall and produces up to about 39 meganewtons (8.8 million pounds) of thrust at its maximum. Its first flight was Artemis I, on 16 November 2022." },
    stage1: { title: "Core stage",
      text: "The roughly 65 m orange tank holds liquid hydrogen and liquid oxygen and feeds the four RS-25 engines at its base. The orange color is not paint: it is the color of the insulating foam." },
    srb: { title: "Solid rocket booster (SRB)",
      text: "Two boosters provide more than 75% of the thrust at liftoff and burn for about 2 minutes. Once lit, a solid booster cannot be shut down." },
    stage2: { title: "Upper stage (ICPS) + Orion",
      text: "The ICPS performs the burn that sends Orion toward the Moon (TLI). The Orion capsule can carry 4 astronauts; the service module behind it provides power and propulsion." },
    las: { title: "Launch abort system (LAS)",
      text: "If something goes wrong on the pad or during ascent, it fires powerful motors that pull the capsule away from the rocket within a few seconds (NASA says 0 to 400-500 mph in about two seconds). If it is not needed, it is jettisoned about 3 minutes after liftoff." }
  },

  // research lab exhibits (hover info)
  labParts: {
    lab_window: { title: "Live satellite feed", text: "The lab is on the ground, so this wall screen shows a live camera feed from an Earth-observing satellite. Researchers use views like this to track weather, oceans and forests. From orbit, our planet looks like a thin blue shell: the whole atmosphere is only about 100 km deep." },
    lab_board: { title: "The rocket equation", text: "Δv = Isp · g0 · ln(m0 / mf). The speed a rocket can gain depends on how efficient the engine is (Isp) and how much of its mass is propellant. Engineers solve this before building anything." },
    lab_samples: { title: "Sample cabinet", text: "Rocks and dust brought back from the Moon and asteroids are stored in sealed containers. Keeping them clean matters: even a fingerprint could confuse the science." },
    lab_spec: { title: "Spectrometer", text: "A spectrometer splits light into colors. Every chemical element leaves its own pattern, so we can learn what a distant atmosphere or a rock is made of without touching it." },
    lab_table: { title: "Periodic table", text: "Every substance in the universe is built from the 118 known elements. Rocket fuel (hydrogen, oxygen), heat shields (carbon) and spacecraft frames (aluminum, titanium) all come from this chart." },
    lab_scope: { title: "Microscope", text: "Under the microscope, a grain of lunar soil shows sharp glassy edges made by meteorite impacts. Details like this reveal a world's history." },
    lab_chem: { title: "Chemistry bench", text: "Rocket propellants, life-support chemistry and heat-shield materials are all tested here first. Tiny experiments avoid expensive failures later." },
    lab_tele: { title: "Telescope", text: "Telescopes find the worlds we might visit. Space telescopes like Hubble and James Webb see clearly because they fly above Earth's blurring atmosphere." },
    lab_solar: { title: "Solar system model", text: "Planets circle the Sun on nearly flat orbits. Mars can be reached cheaply only when Earth and Mars line up, about every 26 months: that is a launch window." }
  },
  landingParts: {
    flag_moon: { title: "The first footsteps on the Moon", text: "On 20 July 1969 the Apollo 11 lander Eagle touched down in the Sea of Tranquility. US astronaut Neil Armstrong was the first person to step onto the Moon (02:56 UTC, 21 July), followed about 19 minutes later by Buzz Aldrin, while Michael Collins orbited above. Armstrong spent about 2.5 hours outside, planted a US flag and brought back about 21.5 kg of rock. Twelve people in total have walked on the Moon (Apollo 11 to 17, 1969-1972): all of them Americans." },
    mars_lander: { title: "Landing on Mars", text: "Mars is hard to land on: the air is too thin for a parachute alone, yet thick enough to heat a spacecraft. The Soviet Mars 3 touched down in 1971 but failed within seconds; NASA's Viking 1 (20 July 1976) was the first long-lived lander. Perseverance landed in February 2021 using a rocket-powered 'sky crane'. No human has been to Mars yet." },
    venus_probe: { title: "Landing on Venus", text: "The Soviet probe Venera 7 (15 December 1970) was the first spacecraft to transmit from the surface of another planet, for about 23 minutes. Venera 13 (1982) survived 127 minutes and sent the first colour photos of the surface of Venus. The surface is about 465 °C, with an air pressure roughly 90 times that of Earth." }
  },
  // things that really happen on other worlds (shown on the planets when the spacecraft arrives; hover for the note)
  planetEvents: {
    ev_venus_volcano: { title: "Volcanoes on Venus", text: "Venus has thousands of volcanic features. When scientists compared NASA Magellan radar images taken at different times in the early 1990s, they found a new lava flow on Maat Mons, Venus's tallest volcano. It is strong evidence that Venus is still volcanically active today." },
    ev_mars_dust: { title: "Dust devils on Mars", text: "Dust devils are small rotating columns of air that form near the surface. NASA's Perseverance rover has watched them in Jezero Crater: one was about 65 m wide and at least 400 m tall, and the shadow of another showed it rose about 2 km high." },
    ev_jupiter_lightning: { title: "Lightning on Jupiter", text: "Jupiter's lightning can be far more energetic than Earth's: NASA reports flashes up to three times stronger than our biggest superbolts. NASA's Juno spacecraft found most strikes near the poles and almost none near the equator, the opposite of Earth." },
    ev_mercury_ice: { title: "Ice at Mercury's poles", text: "Mercury is the closest planet to the Sun, yet NASA's MESSENGER found water ice in craters at its poles. The floors of some craters never see sunlight, so they stay cold enough for ice to survive for more than a billion years." }
  },
  lessons: [
    "A rocket has stages because dropping empty mass makes the remaining fuel far more effective (the Tsiolkovsky rocket equation).",
    "Reaching space means climbing 100 km; staying there means moving sideways at about 28,000 km/h. Most of the fuel goes into speed.",
    "Max-Q does not happen at top speed, but when speed and air density together give the largest pressure."
  ]
};

Object.assign(window.DATA.parts, window.DATA.labParts);
Object.assign(window.DATA.parts, window.DATA.landingParts);
Object.assign(window.DATA.parts, window.DATA.planetEvents);
