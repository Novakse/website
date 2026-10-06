/* ==========================================================================
   Children and babies: the shared server-side rules. SERVER ONLY.

   api/_reis-prijs.js (Lulea, Orsa, Weissensee, Finland, Wellness),
   api/_falun-prijs.js and api/create-payment.js all use this one module, so
   the amount shown on the checkout page and the amount charged can never
   disagree. The flight amounts and percentages come from api/_prijsbeleid.js
   and never leave the server; only the resulting prices per person do.

   Rules (decided by the client):
   - Categories by age on the OUTBOUND date: baby 0-1 (under 2), child 2-11,
     12 and older pays the adult price.
   - Only the flight part is reduced:
       discount per person = flight * (1 - percentage / 100)
       price per person    = adult price per person - discount, rounded UP to
                             a multiple of 5 euro, never above the adult price
     Hotel, cottage, car, activities, surcharges and the group discount stay at
     full price. A group of only adults is priced exactly as before.
   - A traveller of 21 or older must be on every booking (rental car).
   ========================================================================== */
var beleid = require("./_prijsbeleid.js");

var LEEFTIJDEN = beleid.leeftijden;

/* Whole number written as digits only. Empty, undefined or null count as 0,
   anything else ("2.5", "-1", "1abc") gives NaN, like alsGetal() elsewhere. */
function alsAantal(waarde) {
  if (waarde === undefined || waarde === null || waarde === "") return 0;
  if (typeof waarde === "number") return Number.isInteger(waarde) && waarde >= 0 ? waarde : NaN;
  return /^\d{1,3}$/.test(String(waarde)) ? parseInt(waarde, 10) : NaN;
}

/* The head count split into adults (12+), children (2-11) and babies (0-1).
   personen is the validated total; kinderen and baby are optional in the
   choice. Without them everyone is an adult, as before. */
function leesAantallen(keuze, personen) {
  var kinderen = alsAantal(keuze && keuze.kinderen);
  var baby = alsAantal(keuze && keuze.baby);
  if (isNaN(kinderen) || isNaN(baby)) return { fout: "Ongeldig aantal kinderen of baby's." };
  var volwassenen = personen - kinderen - baby;
  if (volwassenen < 1) return { fout: "Er moet minstens 1 volwassene (12 jaar of ouder) meereizen." };
  return { volwassenen: volwassenen, kinderen: kinderen, baby: baby };
}

// The percentages for a trip: defaults, overridden per airline.
function percentagesVoor(reisSleutel) {
  var uit = {
    baby_price_percentage: beleid.standaard.baby_price_percentage,
    child_price_percentage: beleid.standaard.child_price_percentage,
    adult_price_percentage: beleid.standaard.adult_price_percentage
  };
  var reis = beleid.reizen[reisSleutel];
  var eigen = reis && beleid.luchthavens[reis.luchthaven];
  if (eigen) {
    Object.keys(uit).forEach(function (sleutel) {
      if (typeof eigen[sleutel] === "number" && isFinite(eigen[sleutel]) && eigen[sleutel] >= 0) uit[sleutel] = eigen[sleutel];
    });
  }
  return uit;
}

/* Price per person for one category: the adult price minus the flight
   discount, rounded up to a multiple of 5 euro and never above the adult
   price. Works in cents so no float noise creeps in. */
function categoriePrijs(volwassenePrijs, vlucht, percentage) {
  if (!(vlucht > 0) || percentage === 100) return volwassenePrijs;
  var kortingCenten = Math.round(vlucht * (100 - percentage));
  var euros = Math.ceil((volwassenePrijs * 100 - kortingCenten) / 500) * 5;
  if (percentage < 100) euros = Math.min(euros, volwassenePrijs);
  return Math.max(euros, 0);
}

/* The price per person per category, in whole euros. opties.zonderVlucht is
   true when the traveller books their own flight (Falun): the flight is then
   not part of the package, so there is nothing left to discount. */
function prijzenPerCategorie(reisSleutel, volwassenePrijs, opties) {
  var reis = beleid.reizen[reisSleutel];
  if (!reis || (opties && opties.zonderVlucht)) {
    return { volwassene: volwassenePrijs, kind: volwassenePrijs, baby: volwassenePrijs };
  }
  var p = percentagesVoor(reisSleutel);
  return {
    volwassene: categoriePrijs(volwassenePrijs, reis.vluchtPerPersoon, p.adult_price_percentage),
    kind: categoriePrijs(volwassenePrijs, reis.vluchtPerPersoon, p.child_price_percentage),
    baby: categoriePrijs(volwassenePrijs, reis.vluchtPerPersoon, p.baby_price_percentage)
  };
}

/* The group total for the chosen head count; the amount for the guiding and
   anything else that is a group amount is added by the caller. */
function groepsPrijs(aantallen, prijzen) {
  return aantallen.volwassenen * prijzen.volwassene +
    aantallen.kinderen * prijzen.kind +
    aantallen.baby * prijzen.baby;
}

/* Whole years between a date of birth and a day ("YYYY-MM-DD" both); NaN when
   either is not a real date. The birthday itself counts as turned. */
function alsDelen(tekst) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(tekst));
  if (!m) return null;
  var jaar = +m[1];
  var maand = +m[2];
  var dag = +m[3];
  var d = new Date(Date.UTC(jaar, maand - 1, dag));
  if (isNaN(d.getTime()) || d.getUTCMonth() !== maand - 1 || d.getUTCDate() !== dag) return null;
  return { jaar: jaar, maand: maand, dag: dag };
}
function leeftijdOp(geboortedatum, dag) {
  var g = alsDelen(geboortedatum);
  var d = alsDelen(dag);
  if (!g || !d) return NaN;
  var jaren = d.jaar - g.jaar;
  if (d.maand < g.maand || (d.maand === g.maand && d.dag < g.dag)) jaren--;
  return jaren;
}

// "baby", "kind" or "volwassene" for an age in whole years.
function categorieVoorLeeftijd(jaren) {
  if (!(jaren >= 0)) return "";
  if (jaren <= LEEFTIJDEN.baby_max) return "baby";
  if (jaren <= LEEFTIJDEN.kind_max) return "kind";
  return "volwassene";
}

// Dutch part of the description, empty for a group of only adults.
function omschrijvingDeel(aantallen) {
  var delen = [];
  if (aantallen.kinderen > 0) delen.push(aantallen.kinderen + (aantallen.kinderen === 1 ? " kind" : " kinderen") + " (2 t/m 11 jaar)");
  if (aantallen.baby > 0) delen.push(aantallen.baby + (aantallen.baby === 1 ? " baby" : " baby's") + " (0 en 1 jaar)");
  return delen.length ? ", waarvan " + delen.join(" en ") : "";
}

module.exports = {
  alsAantal: alsAantal,
  leesAantallen: leesAantallen,
  percentagesVoor: percentagesVoor,
  prijzenPerCategorie: prijzenPerCategorie,
  groepsPrijs: groepsPrijs,
  leeftijdOp: leeftijdOp,
  categorieVoorLeeftijd: categorieVoorLeeftijd,
  omschrijvingDeel: omschrijvingDeel,
  MIN_LEEFTIJD_BESTUURDER: LEEFTIJDEN.bestuurder_min
};
