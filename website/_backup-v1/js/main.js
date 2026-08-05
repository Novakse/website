(function () {
  "use strict";

  var toggle = document.getElementById("navToggle");
  var closeBtn = document.getElementById("navClose");
  var nav = document.getElementById("mainNav");

  if (!toggle || !nav) return;

  function openNav() {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeNav() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", function () {
    var isOpen = nav.classList.contains("is-open");
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeNav);
  }

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  var mq = window.matchMedia("(min-width: 62rem)");
  mq.addEventListener("change", function (e) {
    if (e.matches) {
      closeNav();
    }
  });

  /* ------------------------------------------------------------------
     Scroll-onthulling: eenmalig, alleen opacity/transform (via CSS).
     Zonder JS blijft alles zichtbaar (geen .js-klasse => geen .reveal
     verbergstijl). Reduced motion wordt door de CSS zelf afgevangen.
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------
     Groepsvorm-keuze: open groepsreis vs. eigen groep.
     Functioneel, geen versiering: zet de keuze klaar in het
     aanvraagformulier en geeft een korte bevestiging.
     ------------------------------------------------------------------ */
  var choiceGrid = document.getElementById("choiceGrid");
  var choiceFeedback = document.getElementById("choiceFeedback");
  var groepsvormSelect = document.getElementById("groepsvorm");

  if (choiceGrid && choiceFeedback) {
    var choiceLabels = {
      open: "open groepsreis",
      "eigen-groep": "eigen groep",
    };

    choiceGrid.querySelectorAll(".choice-card").forEach(function (card) {
      card.addEventListener("click", function () {
        choiceGrid.querySelectorAll(".choice-card").forEach(function (c) {
          c.classList.remove("is-selected");
          c.setAttribute("aria-pressed", "false");
        });
        card.classList.add("is-selected");
        card.setAttribute("aria-pressed", "true");

        var value = card.getAttribute("data-groepsvorm");
        if (groepsvormSelect && value) {
          groepsvormSelect.value = value;
        }
        choiceFeedback.textContent =
          "Gekozen: " + choiceLabels[value] + " — alvast klaargezet bij je reisaanvraag.";
      });
    });
  }
})();
