/* ==========================================================================
   Price policy for children and babies. SERVER ONLY.

   This file holds the internal flight amounts. It must never be copied into
   data/, js/ or any HTML file: those are public, and the flight amount is the
   one number the browser must not be able to read. The file lives in api/ and
   starts with an underscore, so Vercel does not publish it as an endpoint.

   Only the flight part of the package is reduced for a child or a baby.
   Hotel, cottage, car, activities, surcharges and the group discount stay at
   full price for everyone. The browser only ever sees the resulting price per
   person (through /api/reis-prijs and /api/falun-prijs), never the amounts
   below. These prices are what Novakse charges for its own package; they are
   not what an airline charges.

   Percentages are a share of the adult flight price:
     adult  100  (12 years and older: no change)
     child   85  (2 up to and including 11 years)
     baby    25  (0 and 1 years, so under 2 on the outbound date)
   The age counts on the OUTBOUND date (arrival day of the booking).

   Change the numbers here, nowhere else. An admin screen for this may come
   later; until then this file is the single place.
   ========================================================================== */

module.exports = {
  // Defaults for every airline (percentage of the adult flight price).
  standaard: {
    baby_price_percentage: 25,
    child_price_percentage: 85,
    adult_price_percentage: 100
  },

  // Age limits in whole years on the outbound date.
  leeftijden: {
    baby_max: 1,          // 0 and 1 years
    kind_min: 2,
    kind_max: 11,         // 12 and older counts as an adult
    bestuurder_min: 21    // at least one traveller (and the main driver) of this age
  },

  // Per airline: optional overrides of the percentages above, for example
  // { Helsinki: { child_price_percentage: 80 } }. Empty means "use the defaults".
  luchthavens: {
    Helsinki: {},
    Salzburg: {},
    Arlanda: {},
    "Falun airport": {}
  },

  // Per trip: the airline (key in "luchthavens") and the flight amount in whole
  // euros per person, including hold luggage. The amounts apply to the 2-person
  // base prices and are treated as a per-person amount.
  // Falun: the same amount as "opties.vluchtZelf" (the deduction when a
  // traveller books their own flight). Change both together.
  reizen: {
    finland: { luchthaven: "Helsinki", vluchtPerPersoon: 350 },
    weissensee: { luchthaven: "Salzburg", vluchtPerPersoon: 300 },
    lulea: { luchthaven: "Arlanda", vluchtPerPersoon: 380 },
    orsa: { luchthaven: "Arlanda", vluchtPerPersoon: 250 },
    wellness: { luchthaven: "Arlanda", vluchtPerPersoon: 250 },
    falun: { luchthaven: "Falun airport", vluchtPerPersoon: 250 }
  }
};
