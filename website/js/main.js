(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Vertalingen voor teksten die door JS worden gegenereerd (kalender,
     diavoorstelling). De rest van de pagina staat al vertaald in de HTML;
     dit zijn alleen de stukjes die main.js zelf op het scherm zet.
     ------------------------------------------------------------------ */
  var I18N = {
    nl: {
      months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
      dayHeaders: ["ma", "di", "wo", "do", "vr", "za", "zo"],
      prevMonth: "Vorige maand",
      nextMonth: "Volgende maand",
      pauseAria: "Diavoorstelling pauzeren",
      playAria: "Diavoorstelling afspelen",
      legendAvailable: "Beschikbaar",
      legendBooked: "Al bezet",
      legendChosen: "Jouw keuze",
      hintStart: "Klik je aankomstdag aan, en daarna je vertrekdag.",
      hintEnd: function (aankomst, min) { return "Aankomst op " + aankomst + ". Kies nu je vertrekdag - minimaal " + min + " nachten."; },
      reset: "Opnieuw kiezen",
      chosenLabel: "Jouw periode",
      nightsLabel: function (n) { return n + (n === 1 ? " nacht" : " nachten"); },
      continueBtn: "Verder met de aanvraag",
      defaultBooked: "Bezet",
      availableAria: function (datum) { return datum + ", beschikbaar"; },
      totalLabel: function (totaal) { return "Totaal €" + totaal + " per persoon"; },
      groupTotalLabel: function (totaal, n, pp) { return "Totaal €" + totaal + " voor " + n + " personen (€" + pp + " p.p.)"; },
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " tot " + tot; },
      bookedSr: function (wat) { return " " + wat + ", niet beschikbaar"; },
      warnMinNights: function (min) { return "Een verblijf duurt minimaal " + min + " nachten. Kies een latere vertrekdag."; },
      warnOverlap: "In die periode zit een week die al bezet is. Kies een periode ervoor of erna."
    },
    en: {
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dayHeaders: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
      prevMonth: "Previous month",
      nextMonth: "Next month",
      pauseAria: "Pause slideshow",
      playAria: "Play slideshow",
      legendAvailable: "Available",
      legendBooked: "Already booked",
      legendChosen: "Your selection",
      hintStart: "Click your arrival day, then your departure day.",
      hintEnd: function (arrival, min) { return "Arrival on " + arrival + ". Now choose your departure day - minimum " + min + " nights."; },
      reset: "Start over",
      chosenLabel: "Your period",
      nightsLabel: function (n) { return n + (n === 1 ? " night" : " nights"); },
      continueBtn: "Continue to request",
      defaultBooked: "Booked",
      availableAria: function (date) { return date + ", available"; },
      totalLabel: function (totaal) { return "Total €" + totaal + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Total €" + total + " for " + n + " people (€" + pp + " per person)"; },
      bookedTitle: function (what, from, to) { return what + ": " + from + " to " + to; },
      bookedSr: function (what) { return " " + what + ", not available"; },
      warnMinNights: function (min) { return "A stay is at least " + min + " nights. Choose a later departure day."; },
      warnOverlap: "That period includes a week that's already booked. Choose a period before or after."
    },
    sv: {
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      dayHeaders: ["mån", "tis", "ons", "tor", "fre", "lör", "sön"],
      prevMonth: "Föregående månad",
      nextMonth: "Nästa månad",
      pauseAria: "Pausa bildspelet",
      playAria: "Spela bildspelet",
      legendAvailable: "Tillgänglig",
      legendBooked: "Redan bokad",
      legendChosen: "Ditt val",
      hintStart: "Klicka på din ankomstdag och sedan på din avresedag.",
      hintEnd: function (ankomst, min) { return "Ankomst " + ankomst + ". Välj nu din avresedag - minst " + min + " nätter."; },
      reset: "Välj igen",
      chosenLabel: "Din period",
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " nätter"); },
      continueBtn: "Gå vidare till förfrågan",
      defaultBooked: "Bokad",
      availableAria: function (datum) { return datum + ", tillgänglig"; },
      totalLabel: function (total) { return "Totalt €" + total + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Totalt €" + total + " för " + n + " personer (€" + pp + " per person)"; },
      bookedTitle: function (vad, fran, till) { return vad + ": " + fran + " till " + till; },
      bookedSr: function (vad) { return " " + vad + ", inte tillgänglig"; },
      warnMinNights: function (min) { return "En vistelse är minst " + min + " nätter. Välj en senare avresedag."; },
      warnOverlap: "Den perioden omfattar en vecka som redan är bokad. Välj en period före eller efter."
    },
    de: {
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      dayHeaders: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      prevMonth: "Vorheriger Monat",
      nextMonth: "Nächster Monat",
      pauseAria: "Diashow pausieren",
      playAria: "Diashow abspielen",
      legendAvailable: "Verfügbar",
      legendBooked: "Bereits belegt",
      legendChosen: "Deine Auswahl",
      hintStart: "Klicke deinen Ankunftstag an, danach deinen Abreisetag.",
      hintEnd: function (ankunft, min) { return "Ankunft am " + ankunft + ". Wähle jetzt deinen Abreisetag - mindestens " + min + " Nächte."; },
      reset: "Neu wählen",
      chosenLabel: "Dein Zeitraum",
      nightsLabel: function (n) { return n + (n === 1 ? " Nacht" : " Nächte"); },
      continueBtn: "Weiter zur Anfrage",
      defaultBooked: "Belegt",
      availableAria: function (datum) { return datum + ", verfügbar"; },
      totalLabel: function (gesamt) { return "Gesamt €" + gesamt + " pro Person"; },
      groupTotalLabel: function (gesamt, n, pp) { return "Gesamt €" + gesamt + " für " + n + " Personen (€" + pp + " pro Person)"; },
      bookedTitle: function (was, von, bis) { return was + ": " + von + " bis " + bis; },
      bookedSr: function (was) { return " " + was + ", nicht verfügbar"; },
      warnMinNights: function (min) { return "Ein Aufenthalt dauert mindestens " + min + " Nächte. Wähle einen späteren Abreisetag."; },
      warnOverlap: "In diesem Zeitraum liegt eine Woche, die bereits belegt ist. Wähle einen Zeitraum davor oder danach."
    },
    no: {
      months: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
      dayHeaders: ["man", "tir", "ons", "tor", "fre", "lør", "søn"],
      prevMonth: "Forrige måned",
      nextMonth: "Neste måned",
      pauseAria: "Sett lysbildefremvisning på pause",
      playAria: "Spill av lysbildefremvisning",
      legendAvailable: "Tilgjengelig",
      legendBooked: "Allerede booket",
      legendChosen: "Ditt valg",
      hintStart: "Klikk på ankomstdagen din, og deretter avreisedagen.",
      hintEnd: function (ankomst, min) { return "Ankomst " + ankomst + ". Velg nå avreisedagen din - minst " + min + " netter."; },
      reset: "Velg på nytt",
      chosenLabel: "Din periode",
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " netter"); },
      continueBtn: "Gå videre til forespørsel",
      defaultBooked: "Booket",
      availableAria: function (dato) { return dato + ", tilgjengelig"; },
      totalLabel: function (total) { return "Totalt €" + total + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Totalt €" + total + " for " + n + " personer (€" + pp + " per person)"; },
      bookedTitle: function (hva, fra, til) { return hva + ": " + fra + " til " + til; },
      bookedSr: function (hva) { return " " + hva + ", ikke tilgjengelig"; },
      warnMinNights: function (min) { return "Et opphold varer minst " + min + " netter. Velg en senere avreisedag."; },
      warnOverlap: "I den perioden ligger det en uke som allerede er booket. Velg en periode før eller etter."
    },
    fi: {
      months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
      dayHeaders: ["ma", "ti", "ke", "to", "pe", "la", "su"],
      prevMonth: "Edellinen kuukausi",
      nextMonth: "Seuraava kuukausi",
      pauseAria: "Pysäytä diaesitys",
      playAria: "Käynnistä diaesitys",
      legendAvailable: "Vapaa",
      legendBooked: "Jo varattu",
      legendChosen: "Valintasi",
      hintStart: "Valitse ensin saapumispäivä ja sitten lähtöpäivä.",
      hintEnd: function (saapuminen, min) { return "Saapuminen " + saapuminen + ". Valitse nyt lähtöpäivä - vähintään " + min + " yötä."; },
      reset: "Valitse uudelleen",
      chosenLabel: "Valittu ajanjakso",
      nightsLabel: function (n) { return n + (n === 1 ? " yö" : " yötä"); },
      continueBtn: "Jatka varauspyyntöön",
      defaultBooked: "Varattu",
      availableAria: function (pvm) { return pvm + ", vapaa"; },
      totalLabel: function (yhteensa) { return "Yhteensä €" + yhteensa + " / henkilö"; },
      groupTotalLabel: function (yhteensa, n, pp) { return "Yhteensä €" + yhteensa + ", " + n + " henkilöä (€" + pp + " / henkilö)"; },
      bookedTitle: function (mika, alkaen, saakka) { return mika + ": " + alkaen + " – " + saakka; },
      bookedSr: function (mika) { return " " + mika + ", ei vapaa"; },
      warnMinNights: function (min) { return "Vähimmäisoleskelu on " + min + " yötä. Valitse myöhäisempi lähtöpäivä."; },
      warnOverlap: "Kyseiselle ajanjaksolle osuu jo varattu viikko. Valitse ajanjakso ennen tai jälkeen."
    }
  };
  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var T = I18N[LANG] || I18N.nl;

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  var toggle = document.getElementById("navToggle");
  var closeBtn = document.getElementById("navClose");
  var nav = document.getElementById("mainNav");
  var header = document.querySelector(".site-header");

  /* ------------------------------------------------------------------
     Donker blok: kleurt pas om zodra het scherm volledig op deze sectie zit,
     dus wanneer de bovenrand voorbij de bovenkant van het scherm is en de
     sectie het beeld nog grotendeels vult. Zodra de sectie uit beeld raakt,
     valt hij terug op wit, zodat de omslag opnieuw afspeelt als je er weer
     langs scrolt. Zonder een thema dat hier styling voor heeft, doet deze
     klasse niets.
     Staat vóór de header-sync hieronder: syncHeader leest is-snapped, dus
     moet zowel bij page-load als bij elk scroll-event ná syncSnap draaien
     (registratie- en aanroepvolgorde bepalen de rAF-volgorde binnen een
     frame), anders loopt de balk een frame achter of start hij fout.
     ------------------------------------------------------------------ */
  var snapSection = document.querySelector(".why");

  if (snapSection) {
    var snapTicking = false;

    var syncSnap = function () {
      var rect = snapSection.getBoundingClientRect();
      var vh = window.innerHeight;

      // Terug naar wit gebeurt pas als de sectie volledig buiten beeld is —
      // boven- of onderlangs. Zo zie je die omslag nooit gebeuren.
      if (rect.bottom <= 0 || rect.top >= vh) {
        snapSection.classList.remove("is-snapped");
        return;
      }

      // Naar groen zodra de sectie het scherm vult. Is de sectie zelf korter
      // dan het scherm, dan telt of hij vrijwel helemaal in beeld staat.
      var zichtbaar = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      if (zichtbaar >= vh * 0.6 || zichtbaar >= rect.height * 0.8) {
        snapSection.classList.add("is-snapped");
      }
      // Zit hij daartussenin? Dan blijft staan wat er staat.
    };

    window.addEventListener("scroll", function () {
      if (snapTicking) return;
      snapTicking = true;
      window.requestAnimationFrame(function () {
        syncSnap();
        snapTicking = false;
      });
    }, { passive: true });

    window.addEventListener("resize", syncSnap);
    syncSnap();
  }

  /* ------------------------------------------------------------------
     Header: altijd doorzichtig, geen witte balk. De tekst en het logo
     wisselen automatisch tussen wit en donker, op basis van wat er op
     dat moment achter de balk zit (foto/donkere sectie = wit, lichte
     sectie = donker). De schaduwrand boven de openingsfoto is er alleen
     zolang die foto ook echt achter de balk zit.
     ------------------------------------------------------------------ */
  var heroEl = document.querySelector(".opener, .page-hero");
  /* Op de homepage staat het beeldmerk groot in het openingsscherm. Zolang
     dat grote logo nog in beeld is, blijft het kleine logo in de balk weg;
     het verschijnt pas rustig zodra er voorbij het grote logo is gescrold. */
  var openerMark = document.querySelector(".opener__mark");
  var darkZoneEls = Array.prototype.slice.call(
    document.querySelectorAll(".opener, .page-hero, .factbar, .why, .layered, .choice")
  );

  function overlapsHeaderBand(el) {
    var band = header.offsetHeight;
    var rect = el.getBoundingClientRect();
    return rect.top < band && rect.bottom > 0;
  }

  function syncHeader() {
    if (!header) return;

    header.classList.toggle("site-header--scrolled", window.scrollY > 4);

    if (openerMark) {
      var markPassed = openerMark.getBoundingClientRect().bottom <= header.offsetHeight;
      header.classList.toggle("site-header--logo-shown", markPassed);
    }

    header.classList.toggle("site-header--over-hero", !!heroEl && overlapsHeaderBand(heroEl));

    var onDark = darkZoneEls.some(function (el) {
      if (el.classList.contains("why")) {
        // De "why"-sectie is pas echt donker zodra hij is omgeslagen naar
        // groen (is-snapped, zie syncSnap hierboven). Zolang dat zo is
        // en de balk er nog overheen staat, blijft de balk donker — ook
        // verderop in een lange sectie, waar maar een klein stukje nog in
        // de balk-band valt.
        return el.classList.contains("is-snapped") && overlapsHeaderBand(el);
      }
      return overlapsHeaderBand(el);
    });
    header.classList.toggle("site-header--on-light", !onDark);
  }

  if (header) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        syncHeader();
        ticking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", syncHeader);
    syncHeader();
  }

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    closeLangSwitch();
    syncHeader();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("is-open");
      if (isOpen) {
        closeNav();
      } else {
        nav.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
        syncHeader();
      }
    });

    if (closeBtn) closeBtn.addEventListener("click", closeNav);

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });

    window.matchMedia("(min-width: 72rem)").addEventListener("change", function (e) {
      if (e.matches) closeNav();
    });

    // Bij terugkeer vanuit de bfcache (bv. via de terug-knop) herstelt de
    // browser de pagina precies zoals hij was toen je wegnavigeerde, zonder
    // dat main.js opnieuw draait. Stond het menu toen nog open, dan blijft
    // het dat ook nu — alsof het vanzelf openklapt bij het laden. Forceer
    // daarom een schone, gesloten staat bij elke bfcache-restore.
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) closeNav();
    });
  }

  /* ------------------------------------------------------------------
     Taalkiezer: toont alleen de actieve taal; klik op de knop opent een
     uitklapmenu met de overige talen.
     ------------------------------------------------------------------ */
  var langSwitch = document.querySelector(".lang-switch");
  var langToggle = langSwitch && langSwitch.querySelector(".lang-switch__toggle");

  function closeLangSwitch() {
    if (!langSwitch || !langToggle) return;
    langSwitch.classList.remove("is-open");
    langToggle.setAttribute("aria-expanded", "false");
  }

  if (langSwitch && langToggle) {
    langToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = langSwitch.classList.toggle("is-open");
      langToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!langSwitch.contains(event.target)) closeLangSwitch();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLangSwitch();
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal — runs once per element, opacity + transform only.
     Without JS the .js class is absent, so content stays visible.
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal, .stagger");
  if (revealEls.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------
     Tekst die meekleurt met het scrollen: woorden staan gedimd en worden
     woord voor woord vol zodra je verder scrolt. Werkt via opacity, dus
     zowel op donkere als op lichte vlakken.
     ------------------------------------------------------------------ */
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var wordBlocks = [];

  document.querySelectorAll("[data-reveal-words]").forEach(function (el) {
    var parts = el.textContent.split(/(\s+)/);
    el.textContent = "";
    var spans = [];
    parts.forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(part));
        return;
      }
      var span = document.createElement("span");
      span.className = "rw";
      span.textContent = part;
      el.appendChild(span);
      spans.push(span);
    });
    if (spans.length) wordBlocks.push({ el: el, spans: spans });
  });

  function syncWords() {
    var vh = window.innerHeight;

    // Eerst alles meten, daarna pas schrijven. Door lezen en schrijven niet af
    // te wisselen hoeft de browser de pagina niet telkens opnieuw te berekenen,
    // en blijft het scrollen soepel.
    var work = wordBlocks.map(function (block) {
      var rect = block.el.getBoundingClientRect();
      // 0 = nog niet begonnen, 1 = volledig doorgekleurd
      var progress = (vh * 0.85 - rect.top) / (vh * 0.55);
      return {
        block: block,
        progress: Math.min(1, Math.max(0, progress)),
        offscreen: rect.bottom < -vh || rect.top > vh * 1.5
      };
    });

    work.forEach(function (item) {
      var block = item.block;

      // Ver buiten beeld, of niets veranderd sinds de vorige keer? Overslaan.
      if (item.offscreen) return;
      if (block.progress !== undefined && Math.abs(block.progress - item.progress) < 0.004) return;
      block.progress = item.progress;

      // Alle woorden starten binnen de eerste 70% van de voortgang, zodat ook
      // het laatste woord volledig doorkleurt voordat de voortgang op 1 staat.
      var total = block.spans.length;
      block.spans.forEach(function (el, i) {
        var start = (i / total) * 0.7;
        var value = (item.progress - start) / 0.3;
        el.style.opacity = Math.min(1, Math.max(0.26, value));
      });
    });
  }

  if (wordBlocks.length) {
    if (reducedMotion.matches) {
      wordBlocks.forEach(function (b) {
        b.spans.forEach(function (s) { s.style.opacity = 1; });
      });
    } else {
      var wordTicking = false;
      window.addEventListener("scroll", function () {
        if (wordTicking) return;
        wordTicking = true;
        window.requestAnimationFrame(function () {
          syncWords();
          wordTicking = false;
        });
      }, { passive: true });
      window.addEventListener("resize", syncWords);
      syncWords();
    }
  }

  /* ------------------------------------------------------------------
     Openingsvideo: bij het naadloos herstarten van de loop toont de
     browser heel even het verkeerde frame (bekend `loop`-euvel bij
     H.264-video). Een korte opacity-dip rond het herstartmoment
     verbergt die flits.
     ------------------------------------------------------------------ */
  var heroVideo = document.querySelector(".opener__video");
  if (heroVideo) {
    /* De opening is een liggende 16:9-video. Op een staand telefoonscherm
       vergroot `object-fit: cover` die ruim twee keer uit, waardoor hij daar
       onscherp oogt terwijl hij op een breed scherm juist scherp is. Op smalle,
       staande schermen laden we daarom een staande uitsnede uit hetzelfde
       4K-origineel; het beeldkader op het scherm blijft precies gelijk. */
    var tallScreen = window.matchMedia("(max-aspect-ratio: 4/5)");
    var chooseHeroSource = function () {
      var kind = tallScreen.matches ? "tall" : "wide";
      if (heroVideo.dataset.active === kind) return;
      heroVideo.dataset.active = kind;
      var poster = kind === "tall" ? heroVideo.dataset.posterTall : heroVideo.dataset.posterWide;
      var src = kind === "tall" ? heroVideo.dataset.srcTall : heroVideo.dataset.srcWide;
      if (poster) heroVideo.poster = poster;
      if (src) {
        heroVideo.src = src;
        heroVideo.load();
      }
    };
    chooseHeroSource();
    if (tallScreen.addEventListener) {
      tallScreen.addEventListener("change", chooseHeroSource);
    } else if (tallScreen.addListener) {
      tallScreen.addListener(chooseHeroSource);
    }

    var LOOP_FADE_S = 0.26;
    heroVideo.addEventListener("timeupdate", function () {
      if (heroVideo.duration && heroVideo.duration - heroVideo.currentTime < LOOP_FADE_S) {
        heroVideo.classList.add("opener__video--loop-fade");
      }
    });
    heroVideo.addEventListener("seeked", function () {
      if (heroVideo.currentTime < LOOP_FADE_S) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            heroVideo.classList.remove("opener__video--loop-fade");
          });
        });
      }
    });

    /* De opening speelt automatisch en eindeloos door. Bezoekers die minder
       beweging willen krijgen een stilstaand beeld: de CSS-mediaquery raakt
       videoafspelen niet, dus dat moet hier. */
    var applyVideoMotion = function () {
      if (reducedMotion.matches) {
        heroVideo.removeAttribute("autoplay");
        heroVideo.loop = false;
        heroVideo.pause();
        heroVideo.currentTime = 0;
      } else if (heroVideo.paused) {
        heroVideo.loop = true;
        var speelt = heroVideo.play();
        if (speelt && speelt.catch) speelt.catch(function () {});
      }
    };
    applyVideoMotion();
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", applyVideoMotion);
    } else if (reducedMotion.addListener) {
      reducedMotion.addListener(applyVideoMotion);
    }
  }

  /* ------------------------------------------------------------------
     Openingsfoto's: een rustige diavoorstelling.

     - Elke foto blijft SLIDE_MS staan en vloeit daarna over in de volgende.
     - Bezoekers kunnen zelf doorklikken met de pijlen of de streepjes.
     - Er is een pauzeknop; wie zelf klikt, krijgt de volle wachttijd opnieuw.
     - Bij voorkeur voor minder beweging staat de voorstelling stil; klikken
       blijft dan gewoon werken.
     - Alleen de eerste foto laadt met de pagina mee; de rest volgt daarna,
       zodat de site snel blijft openen.
     ------------------------------------------------------------------ */
  var SLIDE_MS = 5000;   // hoe lang een foto blijft staan

  var slidesBox = document.getElementById("openerSlides");
  var dotsBox = document.getElementById("openerDots");

  if (slidesBox && dotsBox) {
    var slides = slidesBox.querySelectorAll(".opener__bg");
    var dots = dotsBox.querySelectorAll(".opener__dot");
    var prevBtn = document.getElementById("openerPrev");
    var nextBtn = document.getElementById("openerNext");
    var pauseBtn = document.getElementById("openerPause");
    var controls = slidesBox.parentNode.querySelector(".opener__controls");

    if (slides.length < 2) {
      if (controls) controls.style.display = "none";
    } else {
      var current = 0;
      var timer = null;
      var stoppedByUser = false;   // pauzeknop ingedrukt
      var inView = true;           // openingsfoto nog in beeld
      var autoplay = !reducedMotion.matches;

      dotsBox.style.setProperty("--opener-ms", SLIDE_MS + "ms");

      var loadSlide = function (index) {
        var img = slides[index];
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
      };

      var stopTimer = function () {
        if (timer) { window.clearTimeout(timer); timer = null; }
      };

      var startTimer = function () {
        stopTimer();
        if (!autoplay || stoppedByUser || !inView) {
          dotsBox.classList.remove("is-playing");
          return;
        }
        // De klasse opnieuw zetten laat het streepje weer vanaf nul vollopen.
        dotsBox.classList.remove("is-playing");
        void dotsBox.offsetWidth;
        dotsBox.classList.add("is-playing");
        timer = window.setTimeout(function () { show(current + 1); }, SLIDE_MS);
      };

      var show = function (index) {
        var next = (index + slides.length) % slides.length;
        loadSlide(next);
        loadSlide((next + 1) % slides.length);

        slides[current].classList.remove("is-active");
        dots[current].classList.remove("is-active");
        dots[current].removeAttribute("aria-current");

        current = next;
        slides[current].classList.add("is-active");
        dots[current].classList.add("is-active");
        dots[current].setAttribute("aria-current", "true");

        startTimer();
      };

      // Zelf doorklikken: de wachttijd begint daarna opnieuw.
      if (nextBtn) nextBtn.addEventListener("click", function () { show(current + 1); });
      if (prevBtn) prevBtn.addEventListener("click", function () { show(current - 1); });

      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          if (i !== current) show(i);
        });
      });

      if (pauseBtn) {
        if (!autoplay) {
          pauseBtn.style.display = "none";
        } else {
          pauseBtn.addEventListener("click", function () {
            stoppedByUser = !stoppedByUser;
            pauseBtn.classList.toggle("is-paused", stoppedByUser);
            pauseBtn.setAttribute(
              "aria-label",
              stoppedByUser ? T.playAria : T.pauseAria
            );
            dotsBox.classList.toggle("is-paused", stoppedByUser);
            if (stoppedByUser) { stopTimer(); } else { startTimer(); }
          });
        }
      }

      // Pijltjestoetsen werken zodra de aandacht in de openingssectie ligt.
      var opener = slidesBox.closest(".opener");
      if (opener) {
        opener.addEventListener("keydown", function (event) {
          if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1); }
        });
      }

      // Vegen op een telefoon
      var touchX = null;
      slidesBox.addEventListener("touchstart", function (event) {
        touchX = event.changedTouches[0].clientX;
      }, { passive: true });
      slidesBox.addEventListener("touchend", function (event) {
        if (touchX === null) return;
        var delta = event.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
      }, { passive: true });

      // Niets laten draaien als de foto niet in beeld staat of het tabblad weg is.
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { stopTimer(); } else { startTimer(); }
      });

      if ("IntersectionObserver" in window && opener) {
        new IntersectionObserver(function (entries) {
          inView = entries[0].isIntersecting;
          if (inView) { startTimer(); } else { stopTimer(); }
        }, { threshold: 0.15 }).observe(opener);
      }

      // De overige foto's pas ophalen als de pagina verder klaar is.
      window.addEventListener("load", function () {
        for (var i = 1; i < slides.length; i++) loadSlide(i);
      });

      startTimer();
    }
  }

  /* ------------------------------------------------------------------
     Reiskalender waarin de bezoeker zelf een periode kiest.

     De gegevens staan als lijstje boven in de pagina zelf, in een blokje
     <script type="application/json">. Daarin staat wanneer het seizoen loopt,
     wat een nacht per persoon kost, hoeveel nachten je minimaal boekt en welke
     periodes al bezet zijn. Wie iets wijzigt, hoeft alleen dat lijstje aan te
     passen - hier verandert niets.

     De dagprijs staat niet in de losse dagen. Pas als er een aankomst- en een
     vertrekdag gekozen zijn, verschijnt onderaan het totaalbedrag per persoon
     (aantal nachten x dagprijs).

     Bezette periodes kun je niet aanklikken en je kunt er ook niet overheen
     selecteren. Zodra er een geldige periode staat, verschijnt onderaan een
     knop naar de aanvraagpagina; de gekozen datums gaan als webadres mee.

     Gaat er iets mis in het lijstje, dan blijft de gewone tekst staan die er
     zonder JavaScript ook al is.
     ------------------------------------------------------------------ */
  var MAANDEN = T.months;
  var DAGKOPPEN = T.dayHeaders;

  /* Leest een datum als "2027-01-16". Alles wat die vorm niet heeft - een leeg
     webadres, een typefout, een dag die niet bestaat - geeft null terug. Zo
     komt er nooit een kapotte datum in de kalender of op het scherm. */
  function alsDatum(tekst) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tekst))) return null;
    var d = String(tekst).split("-");
    var datum = new Date(+d[0], +d[1] - 1, +d[2]);
    if (isNaN(datum.getTime())) return null;
    // Vangt 31 februari en dergelijke: die rolt stilletjes door naar de maand erna.
    if (datum.getMonth() !== +d[1] - 1 || datum.getDate() !== +d[2]) return null;
    return datum;
  }
  function alsTekst(datum) {
    function twee(n) { return (n < 10 ? "0" : "") + n; }
    return datum.getFullYear() + "-" + twee(datum.getMonth() + 1) + "-" + twee(datum.getDate());
  }
  function schrijfDatum(datum) {
    return datum.getDate() + " " + MAANDEN[datum.getMonth()] + " " + datum.getFullYear();
  }
  function dagenTussen(van, tot) {
    return Math.round((tot - van) / 86400000);
  }

  /* "" op de Nederlandse site, "../" in de taalmappen. De paden in het
     gegevensblokje gaan uit van de hoofdmap. */
  function mapVoorKalender() {
    var eigen = document.querySelector('script[src$="js/main.js"]');
    var src = eigen ? eigen.getAttribute("src") : "";
    return src.replace(/js\/main\.js$/, "");
  }

  document.querySelectorAll("[data-calendar]").forEach(function (box) {
    var bron = box.querySelector("script.calendar__data");
    if (!bron) return;

    var data;
    try { data = JSON.parse(bron.textContent); } catch (fout) { return; }
    if (!data) return;

    /* Staat er een prijzenbestand bij, dan komen het seizoen, het kortste
       verblijf, de bezette weken en de prijzen daarvandaan. Zo staan ze op
       een plek in plaats van zes keer in de taalversies. Lukt het ophalen
       niet, dan blijft de gewone tekst staan die er zonder JavaScript ook
       al is. */
    if (typeof data.prijzen === "string" && data.prijzen) {
      fetch(mapVoorKalender() + data.prijzen).then(function (antwoord) {
        return antwoord.ok ? antwoord.json() : null;
      }).then(function (uitBestand) {
        if (!uitBestand) return;
        Object.keys(uitBestand).forEach(function (sleutel) {
          // De regels die met // beginnen zijn uitleg voor wie het bestand
          // bijwerkt; die horen niet in de gegevens thuis.
          if (sleutel.indexOf("//") !== 0) data[sleutel] = uitBestand[sleutel];
        });
        bouwKalender(box, data);
      })["catch"](function () { /* gewone tekst blijft staan */ });
      return;
    }

    bouwKalender(box, data);
  });

  function bouwKalender(box, data) {
    if (!data.seizoenStart || !data.seizoenEind) return;

    var seizoenVan = alsDatum(data.seizoenStart);
    var seizoenTot = alsDatum(data.seizoenEind);
    // Staat er een onleesbare of omgekeerde periode in het blokje, dan blijft
    // de gewone tekst staan die er zonder JavaScript ook al is.
    if (!seizoenVan || !seizoenTot || seizoenTot <= seizoenVan) return;

    var minNachten = data.minimumNachten || 1;
    var dagprijs = data.prijsPerPersoonPerDag || 0;

    /* In welke periode van de leverancier de aankomstdag valt. De aankomstdag
       bepaalt het tarief voor het hele verblijf, net als in hun eigen
       prijslijst. Valt hij buiten alle periodes, dan komt er geen prijs in
       beeld en blijft het bij een aanvraag. */
    function tariefOp(datum) {
      var lijst = data.periodes || [];
      for (var i = 0; i < lijst.length; i++) {
        var van = alsDatum(lijst[i].van);
        var tot = alsDatum(lijst[i].tot);
        if (van && tot && datum >= van && datum < tot) return lijst[i].tarief;
      }
      return null;
    }

    /* Wat het verblijf per persoon kost. Staat er een prijstabel, dan geldt
       het bedrag dat bij dit tarief en dit aantal nachten hoort; blijft
       iemand langer dan de tabel gaat, dan telt elke nacht daarboven het
       losse nachttarief mee. Is er geen tabel, dan geldt de oude dagprijs. */
    function prijsPerPersoon(aankomst, nachten) {
      var tabel = data.prijsPerPersoon;
      if (!tabel) return dagprijs ? nachten * dagprijs : 0;

      var tarief = tariefOp(aankomst);
      var rij = tarief ? tabel[tarief] : null;
      if (!rij) return 0;
      if (typeof rij[String(nachten)] === "number") return rij[String(nachten)];

      var langste = 0;
      Object.keys(rij).forEach(function (sleutel) {
        var n = parseInt(sleutel, 10);
        if (n > langste && typeof rij[sleutel] === "number") langste = n;
      });
      if (!langste || nachten < langste) return 0;

      var extra = (data.extraNachtPerPersoon || {})[tarief] || 0;
      if (!extra) return 0;
      return rij[String(langste)] + (nachten - langste) * extra;
    }
    /* Staat het prijzenbestand voor alle talen tegelijk, dan mag het label bij
       een bezette week een blokje per taal zijn in plaats van een losse regel.
       Ontbreekt de taal, dan valt hij terug op het Nederlands en anders op het
       gewone woord "Bezet". */
    function labelVoor(wat) {
      if (wat && typeof wat === "object") return wat[LANG] || wat.nl || T.defaultBooked;
      return wat || T.defaultBooked;
    }

    var bezet = (data.bezet || []).map(function (blok) {
      return { van: alsDatum(blok.van), tot: alsDatum(blok.tot), wat: labelVoor(blok.wat) };
    }).filter(function (blok) {
      // Een bezette periode met een kapotte datum laten we liever weg dan dat
      // hij de hele kalender onbruikbaar maakt.
      return blok.van && blok.tot && blok.tot > blok.van;
    });

    var keuzeVan = null;
    var keuzeTot = null;

    var reizigersUitAdres = (function () {
      var aantal = parseInt(new URLSearchParams(window.location.search).get("personen"), 10);
      return isNaN(aantal) ? 0 : aantal;
    })();

    /* De prijzen gelden per persoon. Kwam het aantal reizigers uit de
       reiszoeker mee, dan staat het totaal voor de hele groep erbij, net als
       in het aanvraagformulier. */
    function prijsTekst(perPersoon) {
      function bedrag(n) { return n.toLocaleString("nl-NL"); }
      if (reizigersUitAdres > 1) {
        return T.groupTotalLabel(bedrag(perPersoon * reizigersUitAdres), reizigersUitAdres, bedrag(perPersoon));
      }
      return T.totalLabel(perPersoon);
    }

    function bezetOp(datum) {
      for (var i = 0; i < bezet.length; i++) {
        if (datum >= bezet[i].van && datum < bezet[i].tot) return bezet[i];
      }
      return null;
    }

    function bezetTussen(van, tot) {
      var loop = new Date(van.getTime());
      while (loop < tot) {
        if (bezetOp(loop)) return true;
        loop.setDate(loop.getDate() + 1);
      }
      return false;
    }

    var raster = document.createElement("div");
    raster.className = "calendar__months";
    var balk = document.createElement("div");
    balk.className = "calendar__bar";
    balk.setAttribute("aria-live", "polite");

    var legenda = document.createElement("div");
    legenda.className = "calendar__legend";
    legenda.innerHTML =
      '<span class="calendar__legend-item"><span class="calendar__chip is-vrij"></span>' + T.legendAvailable + '</span>' +
      '<span class="calendar__legend-item"><span class="calendar__chip is-bezet"></span>' + T.legendBooked + '</span>' +
      '<span class="calendar__legend-item"><span class="calendar__chip is-gekozen"></span>' + T.legendChosen + '</span>';

    box.innerHTML = "";
    box.appendChild(legenda);
    box.appendChild(raster);
    box.appendChild(balk);

    function toonBalk() {
      if (!keuzeVan) {
        balk.className = "calendar__bar";
        balk.innerHTML = '<p class="calendar__hint">' + T.hintStart + '</p>';
        return;
      }
      if (!keuzeTot) {
        balk.className = "calendar__bar is-busy";
        balk.innerHTML = '<p class="calendar__hint">' + T.hintEnd(schrijfDatum(keuzeVan), minNachten) + '</p>' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>';
        return;
      }
      var nachten = dagenTussen(keuzeVan, keuzeTot);
      var totaal = Math.round(prijsPerPersoon(keuzeVan, nachten));
      balk.className = "calendar__bar is-done";
      balk.innerHTML =
        '<div class="calendar__chosen">' +
          '<span class="calendar__chosen-label">' + T.chosenLabel + '</span>' +
          '<span class="calendar__chosen-dates">' + schrijfDatum(keuzeVan) + ' – ' + schrijfDatum(keuzeTot) + '</span>' +
          '<span class="calendar__chosen-nights">' + T.nightsLabel(nachten) + '</span>' +
          (totaal ? '<span class="calendar__chosen-price">' + prijsTekst(totaal) + '</span>' : '') +
        '</div>' +
        '<div class="calendar__bar-actions">' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>' +
          '<a class="btn btn--dark" href="boeken.html?' +
            (data.reis ? 'reis=' + encodeURIComponent(data.reis) + '&amp;' : '') +
            'van=' + alsTekst(keuzeVan) +
            '&amp;tot=' + alsTekst(keuzeTot) +
            // Kwam het aantal reizigers uit de reiszoeker mee, dan blijft dat
            // ook staan als iemand hier een andere periode kiest.
            (reizigersUitAdres ? '&amp;personen=' + reizigersUitAdres : '') + '">' + T.continueBtn + '</a>' +
        '</div>';
    }

    /* De kalender toont een maand tegelijk; met de pijltjes klik je door het
       seizoen. Verder dan de eerste en laatste seizoensmaand gaat het niet. */
    var eersteMaand = new Date(seizoenVan.getFullYear(), seizoenVan.getMonth(), 1);
    var laatsteMaand = new Date(seizoenTot.getFullYear(), seizoenTot.getMonth(), 1);
    var zichtbareMaand = eersteMaand;

    function maakPijl(stap, label) {
      var knop = document.createElement("button");
      knop.type = "button";
      knop.className = "calendar__month-nav";
      knop.innerHTML = '<span aria-hidden="true">' + (stap < 0 ? "&#8249;" : "&#8250;") + '</span>' +
        '<span class="sr-only">' + label + '</span>';
      knop.disabled = stap < 0 ? zichtbareMaand <= eersteMaand : zichtbareMaand >= laatsteMaand;
      knop.addEventListener("click", function () {
        zichtbareMaand = new Date(zichtbareMaand.getFullYear(), zichtbareMaand.getMonth() + stap, 1);
        tekenRaster(stap);
      });
      return knop;
    }

    function tekenRaster(focusOp) {
      raster.innerHTML = "";
      var jaar = zichtbareMaand.getFullYear();
      var nr = zichtbareMaand.getMonth();

      var kop = document.createElement("div");
      kop.className = "calendar__month-head";
      var terug = maakPijl(-1, T.prevMonth);
      var titel = document.createElement("h3");
      titel.className = "calendar__month-title";
      titel.setAttribute("aria-live", "polite");
      titel.textContent = MAANDEN[nr] + " " + jaar;
      var vooruit = maakPijl(1, T.nextMonth);
      kop.appendChild(terug);
      kop.appendChild(titel);
      kop.appendChild(vooruit);
      raster.appendChild(kop);

      var maandBox = document.createElement("div");
      maandBox.className = "calendar__month";

      var dagen = document.createElement("div");
      dagen.className = "calendar__grid";
      DAGKOPPEN.forEach(function (naam) {
        var kop = document.createElement("span");
        kop.className = "calendar__dayname";
        kop.setAttribute("aria-hidden", "true");
        kop.textContent = naam;
        dagen.appendChild(kop);
      });

      var start = (new Date(jaar, nr, 1).getDay() + 6) % 7;
      for (var leeg = 0; leeg < start; leeg++) {
        var gat = document.createElement("span");
        gat.className = "calendar__cell is-empty";
        dagen.appendChild(gat);
      }

      var aantal = new Date(jaar, nr + 1, 0).getDate();
      for (var d = 1; d <= aantal; d++) {
        dagen.appendChild(maakDag(new Date(jaar, nr, d)));
      }

      maandBox.appendChild(dagen);
      raster.appendChild(maandBox);

      // Na het doorklikken blijft de focus op het pijltje, zodat je met het
      // toetsenbord verder kunt klikken. Is dat pijltje nu uit, dan het andere.
      if (focusOp) {
        var doel = focusOp < 0 ? terug : vooruit;
        (doel.disabled ? (focusOp < 0 ? vooruit : terug) : doel).focus();
      }
    }

    function maakDag(datum) {
      var buitenSeizoen = datum < seizoenVan || datum > seizoenTot;
      var blok = bezetOp(datum);

      if (buitenSeizoen || blok) {
        var uit = document.createElement("span");
        uit.className = "calendar__cell " + (blok ? "is-bezet" : "is-buiten");
        uit.textContent = datum.getDate();
        if (blok) {
          uit.title = T.bookedTitle(blok.wat, schrijfDatum(blok.van), schrijfDatum(blok.tot));
          var uitleg = document.createElement("span");
          uitleg.className = "sr-only";
          uitleg.textContent = T.bookedSr(blok.wat);
          uit.appendChild(uitleg);
        }
        return uit;
      }

      var knop = document.createElement("button");
      knop.type = "button";
      knop.className = "calendar__cell is-vrij";
      knop.innerHTML = '<span class="calendar__daynr">' + datum.getDate() + "</span>";
      knop.setAttribute("aria-label", T.availableAria(schrijfDatum(datum)));

      if (keuzeVan && datum.getTime() === keuzeVan.getTime()) {
        knop.classList.add("is-gekozen", "is-start");
      }
      if (keuzeTot && datum.getTime() === keuzeTot.getTime()) {
        knop.classList.add("is-gekozen", "is-eind");
      }
      if (keuzeVan && keuzeTot && datum > keuzeVan && datum < keuzeTot) {
        knop.classList.add("is-tussen");
      }

      knop.addEventListener("click", function () { kiesDag(datum); });
      return knop;
    }

    function kiesDag(datum) {
      if (!keuzeVan || keuzeTot) {
        keuzeVan = datum;
        keuzeTot = null;
      } else if (datum <= keuzeVan) {
        keuzeVan = datum;
      } else if (dagenTussen(keuzeVan, datum) < minNachten) {
        balk.className = "calendar__bar is-warn";
        balk.innerHTML = '<p class="calendar__hint">' + T.warnMinNights(minNachten) + '</p>' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>';
        koppelReset();
        return;
      } else if (bezetTussen(keuzeVan, datum)) {
        balk.className = "calendar__bar is-warn";
        balk.innerHTML = '<p class="calendar__hint">' + T.warnOverlap + '</p>' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>';
        koppelReset();
        return;
      } else {
        keuzeTot = datum;
      }
      tekenRaster();
      toonBalk();
      koppelReset();
    }

    function koppelReset() {
      var knop = balk.querySelector(".calendar__reset");
      if (!knop) return;
      knop.addEventListener("click", function () {
        keuzeVan = null;
        keuzeTot = null;
        tekenRaster();
        toonBalk();
      });
    }

    /* Komt de bezoeker via de reiszoeker binnen, dan staat zijn periode in het
       webadres. Die nemen we hier over, zodat de kalender meteen goed staat.
       Past de periode niet (te kort of over een bezette week heen), dan blijft
       de kalender gewoon leeg en kiest hij zelf. */
    (function () {
      var params = new URLSearchParams(window.location.search);
      var uitVan = alsDatum(params.get("van"));
      var uitTot = alsDatum(params.get("tot"));
      if (!uitVan || !uitTot || uitTot <= uitVan) return;
      if (uitVan < seizoenVan || uitTot > seizoenTot) return;
      if (dagenTussen(uitVan, uitTot) < minNachten) return;
      if (bezetOp(uitVan) || bezetTussen(uitVan, uitTot)) return;
      keuzeVan = uitVan;
      keuzeTot = uitTot;
    })();

    // Staat er al een periode, dan opent de kalender in de maand van de
    // aankomstdag; anders in de eerste maand met een vrije dag.
    zichtbareMaand = (function () {
      if (keuzeVan) return new Date(keuzeVan.getFullYear(), keuzeVan.getMonth(), 1);
      var loop = new Date(seizoenVan.getTime());
      while (loop <= seizoenTot) {
        if (!bezetOp(loop)) return new Date(loop.getFullYear(), loop.getMonth(), 1);
        loop.setDate(loop.getDate() + 1);
      }
      return eersteMaand;
    })();

    tekenRaster();
    toonBalk();
  }

  /* ------------------------------------------------------------------
     Collage bij het persoonlijke verhaal: elke foto schuift tijdens het
     scrollen een klein stukje mee in een eigen tempo. De afstand staat per
     foto in data-speed (in pixels over de hele doorloop). Er wordt alleen een
     transform gezet, en alleen zolang de collage in beeld is.
     ------------------------------------------------------------------ */
  var collage = document.querySelector("[data-collage]");

  if (collage && !reducedMotion.matches) {
    var collageItems = collage.querySelectorAll(".collage__item");

    var syncCollage = function () {
      var rect = collage.getBoundingClientRect();
      var vh = window.innerHeight;

      // Niets uitrekenen zolang de collage ver buiten beeld is.
      if (rect.bottom < -vh || rect.top > vh * 2) return;

      // -1 net onder het scherm, +1 net erboven; 0 als de collage in het midden staat
      var progress = ((vh - rect.top) / (vh + rect.height)) * 2 - 1;
      progress = Math.min(1, Math.max(-1, progress));

      // Op een smal scherm is dezelfde verschuiving verhoudingsgewijs veel
      // groter, dus daar wordt de afstand teruggeschroefd.
      var scale = Math.max(0.45, Math.min(1, window.innerWidth / 1100));

      // De onderste twee foto's lopen sneller dan de grote bovenste (zie
      // data-speed in de HTML): daardoor kruipen ze tijdens het scrollen
      // naar elkaar toe. De afstand is bewust groot — dat is het effect.
      collageItems.forEach(function (item) {
        var speed = parseFloat(item.dataset.speed) || 0;
        item.style.setProperty(
          "--collage-shift",
          (progress * speed * scale).toFixed(1) + "px"
        );
      });
    };

    var collageTicking = false;
    window.addEventListener("scroll", function () {
      if (collageTicking) return;
      collageTicking = true;
      window.requestAnimationFrame(function () {
        syncCollage();
        collageTicking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", syncCollage);

    syncCollage();
  }

  /* ------------------------------------------------------------------
     Muisvolger: een ring die de muis volgt en een stipje dat er iets
     achteraan loopt. Sta je stil, dan haalt het stipje de ring weer in.
     Alleen op apparaten met een echte muisaanwijzer.
     ------------------------------------------------------------------ */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (finePointer.matches && !reducedMotion.matches) {
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var ringX = mouseX, ringY = mouseY;
    var dotX = mouseX, dotY = mouseY;
    var visible = false;

    document.addEventListener("mousemove", function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!visible) {
        visible = true;
        ringX = dotX = mouseX;
        ringY = dotY = mouseY;
        ring.classList.add("is-visible");
        dot.classList.add("is-visible");
      }
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      visible = false;
      ring.classList.remove("is-visible");
      dot.classList.remove("is-visible");
    });

    // Ring volgt snel, het stipje duidelijk trager — daardoor loopt het er
    // zichtbaar achteraan tijdens beweging en komt het bij stilstand weer samen.
    (function follow() {
      ringX += (mouseX - ringX) * 0.32;
      ringY += (mouseY - ringY) * 0.32;
      dotX += (mouseX - dotX) * 0.055;
      dotY += (mouseY - dotY) * 0.055;
      ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0)";
      dot.style.transform = "translate3d(" + dotX + "px," + dotY + "px,0)";
      window.requestAnimationFrame(follow);
    })();

    // Ring wordt groter boven klikbare dingen
    document.querySelectorAll("a, button, summary, [role='button'], input, select, textarea")
      .forEach(function (el) {
        el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
        el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
      });
  }

  /* ------------------------------------------------------------------
     Trip carousel: horizontal scroll progress bar
     ------------------------------------------------------------------ */
  var scroller = document.getElementById("tripScroll");
  var bar = document.getElementById("tripProgress");

  if (scroller && bar) {
    var updateProgress = function () {
      var max = scroller.scrollWidth - scroller.clientWidth;
      var pct = max > 0 ? (scroller.scrollLeft / max) * 100 : 0;
      bar.style.width = Math.max(18, pct) + "%";
    };
    scroller.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* ------------------------------------------------------------------
     Trip carousel: markeer de kaart die net gesnapt is als "is-current"
     zodat die subtiel groter/helderder toont dan de rest (zie styles.css).
     ------------------------------------------------------------------ */
  if (scroller && "IntersectionObserver" in window) {
    var tripCards = scroller.querySelectorAll(".trip-card");
    if (tripCards.length) {
      scroller.classList.add("is-tracking");
      var currentCard = null;
      var visibleRatios = new Map();

      var markCurrent = function (card) {
        if (card === currentCard) return;
        if (currentCard) currentCard.classList.remove("is-current");
        card.classList.add("is-current");
        currentCard = card;
      };

      var cardObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            visibleRatios.set(entry.target, entry.intersectionRatio);
          });
          var bestCard = null;
          var bestRatio = 0;
          visibleRatios.forEach(function (ratio, card) {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestCard = card;
            }
          });
          if (bestCard) markCurrent(bestCard);
        },
        { root: scroller, threshold: [0, 0.25, 0.5, 0.6, 0.75, 0.9, 1] }
      );

      tripCards.forEach(function (card) { cardObserver.observe(card); });
    }
  }

  /* ------------------------------------------------------------------
     Dagprogramma: balkje dat meeloopt met het zijwaarts scrollen
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-dayscroll]").forEach(function (baan) {
    var balk = baan.parentNode.querySelector(".days__progress-bar");
    if (!balk) return;
    var bijwerken = function () {
      var max = baan.scrollWidth - baan.clientWidth;
      var deel = max > 0 ? (baan.scrollLeft / max) * 100 : 0;
      balk.style.width = Math.max(20, deel) + "%";
    };
    baan.addEventListener("scroll", bijwerken, { passive: true });
    window.addEventListener("resize", bijwerken);
    bijwerken();
  });

  /* ------------------------------------------------------------------
     Trip cards: photo gallery — tap or click cycles to the next photo
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-gallery]").forEach(function (media) {
    var images = media.querySelectorAll("img");
    var dots = media.querySelectorAll(".trip-card__dots span");
    if (images.length < 2) return;

    var index = 0;

    function showNext() {
      images[index].classList.remove("is-active");
      if (dots[index]) dots[index].classList.remove("is-active");
      index = (index + 1) % images.length;
      images[index].classList.add("is-active");
      if (dots[index]) dots[index].classList.add("is-active");
    }

    media.addEventListener("click", showNext);
    media.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showNext();
      }
    });
  });

  /* ------------------------------------------------------------------
     Leesrust: de pagina komt na het scrollen zachtjes tot stilstand bij een
     kop, zodat je van kop naar kop leest in plaats van er middenin te blijven
     hangen. Ligt er geen kop in de buurt, dan blijft de pagina staan waar je
     stopte - er wordt dus nooit een heel eind gesprongen.

     Bewust geen CSS scroll-snap: dat vecht met de vloeiende scroll van de
     browser en met de vaartafloop van een trackpad, wat gehaper geeft. Hier
     gebeurt er tijdens het scrollen niets. Pas als je echt stilstaat en er al
     een kop dichtbij staat, schuift de pagina dat laatste stukje bij.
     Elke muis-, toets- of scrollbeweging breekt dat direct af.
     ------------------------------------------------------------------ */
  var settleMedia = window.matchMedia("(min-width: 48rem) and (pointer: fine)");

  if (!reducedMotion.matches && settleMedia.matches) {
    var SETTLE_IDLE = 180;     // ms stilstand voordat we bijsturen
    var SETTLE_RANGE = 0.2;    // deel van het scherm waarbinnen we bijsturen
    var SETTLE_MIN = 6;        // px, kleiner verschil laten we staan
    var SETTLE_MAX_MS = 480;

    // Hoogte van de vaste balk; valt terug op 5rem als de balk er niet is.
    var headerOffset = function () {
      return header ? header.offsetHeight : 80;
    };

    var settleTimer = null;
    var settleFrame = null;
    var settleActive = false;

    var stopSettle = function () {
      if (settleFrame !== null) window.cancelAnimationFrame(settleFrame);
      settleFrame = null;
      settleActive = false;
      // De vloeiende scroll van de browser weer aan de stylesheet overlaten.
      document.documentElement.style.scrollBehavior = "";
    };

    var maxScrollY = function () {
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    // De rustpunten van de pagina: de koppen. Je leest zo van kop naar kop.
    // Heeft een sectie geen eigen kop (bijvoorbeeld de openingsfoto), dan
    // telt de bovenkant van die sectie, zodat er geen blok wordt overgeslagen.
    var settlePoints = function () {
      var y = window.scrollY;
      var vh = window.innerHeight;
      var offset = headerOffset();
      var air = Math.min(48, Math.round(vh * 0.05)); // beetje lucht boven de kop
      var points = [];

      document.querySelectorAll("main > section").forEach(function (section) {
        var found = false;

        section.querySelectorAll("h1, h2").forEach(function (heading) {
          // Verborgen koppen (dichtgeklapt, andere taal) tellen niet mee.
          if (!heading.getClientRects().length) return;
          points.push(Math.round(y + heading.getBoundingClientRect().top - offset - air));
          found = true;
        });

        if (!found) {
          points.push(Math.round(y + section.getBoundingClientRect().top - offset));
        }
      });

      points.sort(function (a, b) { return a - b; });

      // Koppen die vlak bij elkaar staan - twee kolommen naast elkaar, of een
      // kop direct onder een tussenkop - leveren samen één rustpunt op.
      var minGap = Math.max(140, vh * 0.35);
      var spread = [];

      points.forEach(function (point) {
        if (!spread.length || point - spread[spread.length - 1] >= minGap) {
          spread.push(point);
        }
      });

      return spread;
    };

    // Het dichtstbijzijnde rustpunt, gemeten vanaf de huidige scrollpositie.
    var nearestPoint = function (y) {
      var best = null;
      var bestGap = Infinity;

      settlePoints().forEach(function (point) {
        var gap = Math.abs(point - y);
        if (gap < bestGap) {
          bestGap = gap;
          best = point;
        }
      });

      return best;
    };

    var runSettle = function (from, to) {
      var distance = to - from;
      var duration = Math.min(SETTLE_MAX_MS, 200 + Math.abs(distance) * 1.1);
      var start = null;

      // De eigen animatie zet de scrollpositie per frame; de vloeiende scroll
      // van de browser moet daar even uit, anders animeren er twee dingen.
      document.documentElement.style.scrollBehavior = "auto";

      settleActive = true;

      var step = function (now) {
        if (start === null) start = now;

        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic: rustig uitlopen
        var y = Math.round(from + distance * eased);

        window.scrollTo(0, y);

        if (t < 1 && settleActive) {
          settleFrame = window.requestAnimationFrame(step);
          return;
        }

        stopSettle();
      };

      settleFrame = window.requestAnimationFrame(step);
    };

    var settle = function () {
      if (settleActive) return;

      var y = window.scrollY;
      var limit = maxScrollY();

      // Boven- en onderkant van de pagina laten we met rust.
      if (y <= 4 || y >= limit - 4) return;

      var target = nearestPoint(y);
      if (target === null) return;

      target = Math.max(0, Math.min(limit, target));

      var delta = Math.abs(target - y);
      if (delta < SETTLE_MIN || delta > window.innerHeight * SETTLE_RANGE) return;

      runSettle(y, target);
    };

    window.addEventListener("scroll", function () {
      // Tijdens de eigen animatie komen de scroll-events van onszelf.
      if (settleActive) return;

      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, SETTLE_IDLE);
    }, { passive: true });

    // Elke eigen beweging van de bezoeker gaat voor: de wachttijd wordt
    // opnieuw ingesteld en een lopende bijstuur-animatie stopt meteen.
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (type) {
      window.addEventListener(type, function () {
        if (settleTimer) window.clearTimeout(settleTimer);
        if (settleActive) stopSettle();
      }, { passive: true });
    });
  }

})();
