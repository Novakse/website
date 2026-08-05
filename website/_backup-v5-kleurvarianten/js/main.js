(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  var toggle = document.getElementById("navToggle");
  var closeBtn = document.getElementById("navClose");
  var nav = document.getElementById("mainNav");
  var header = document.querySelector(".site-header");

  /* ------------------------------------------------------------------
     Header: transparent over the opening photo, fades to a solid bar
     once you have scrolled most of that photo out of view.
     ------------------------------------------------------------------ */
  function syncHeader() {
    if (!header) return;
    var navOpen = nav && nav.classList.contains("is-open");
    var pastHero = window.scrollY > window.innerHeight * 0.6;
    header.classList.toggle("is-solid", navOpen || pastHero);
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

    window.matchMedia("(min-width: 64rem)").addEventListener("change", function (e) {
      if (e.matches) closeNav();
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal — runs once per element, opacity + transform only.
     Without JS the .js class is absent, so content stays visible.
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
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
     Donker blok: kleurt pas om zodra het scherm volledig op deze sectie zit,
     dus wanneer de bovenrand voorbij de bovenkant van het scherm is en de
     sectie het beeld nog grotendeels vult. Zodra de sectie uit beeld raakt,
     valt hij terug op wit, zodat de omslag opnieuw afspeelt als je er weer
     langs scrolt. Zonder een thema dat hier styling voor heeft, doet deze
     klasse niets.
     ------------------------------------------------------------------ */
  var snapSection = document.querySelector(".why");

  if (snapSection) {
    var snapTicking = false;

    var syncSnap = function () {
      var rect = snapSection.getBoundingClientRect();
      var vh = window.innerHeight;
      // Bovenrand voorbij de schermrand én nog minstens 60% van het beeld gevuld
      var fillsScreen = rect.top <= 0 && rect.bottom >= vh * 0.6;
      snapSection.classList.toggle("is-snapped", fillsScreen);
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
    wordBlocks.forEach(function (block) {
      var rect = block.el.getBoundingClientRect();
      // 0 = nog niet begonnen, 1 = volledig doorgekleurd
      var progress = (vh * 0.85 - rect.top) / (vh * 0.55);
      progress = Math.min(1, Math.max(0, progress));

      // Alle woorden starten binnen de eerste 70% van de voortgang, zodat ook
      // het laatste woord volledig doorkleurt voordat de voortgang op 1 staat.
      var total = block.spans.length;
      block.spans.forEach(function (el, i) {
        var start = (i / total) * 0.7;
        var value = (progress - start) / 0.3;
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
              stoppedByUser ? "Diavoorstelling afspelen" : "Diavoorstelling pauzeren"
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
     Trip cards: photo gallery — tap or click cycles to the next photo
     ------------------------------------------------------------------ */
  document.querySelectorAll(".trip-card__media[data-gallery]").forEach(function (media) {
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
})();
