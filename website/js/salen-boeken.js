/* ==========================================================================
   Schaatsen vanuit Sälen - booking form (schaatsen-salen.html)

   - Loads data/salen-prijzen.json and uses window.SalenPrice (js/salen-prijs.js)
     for every price on the page, so nothing here hard-codes an amount.
   - Recalculates the summary and the button total on every change.
   - Sends the booking to /api/salen-checkout, which recalculates the price on
     the server and answers { url } (Stripe Checkout) or { error }.
   - Shows a message when Stripe sends the visitor back:
     ?betaling=gelukt  or  ?betaling=geannuleerd
   ========================================================================== */
(function () {
  "use strict";

  var MAIL = "schaatsennovakse@outlook.com";
  var PRICES_URL = "/data/salen-prijzen.json";
  var CHECKOUT_URL = "/api/salen-checkout";
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var prices = null;
  var submitting = false;

  function $(id) { return document.getElementById(id); }

  // Today in Europe/Stockholm ("YYYY-MM-DD"), the same rule the server uses.
  function today() {
    return window.SalenPrice && window.SalenPrice.todayStockholm
      ? window.SalenPrice.todayStockholm()
      : new Date().toISOString().slice(0, 10);
  }

  function euro(amount) {
    var n = typeof amount === "number" && isFinite(amount) ? amount : 0;
    return "€ " + n.toLocaleString("nl-NL");
  }

  /* ------------------------------------------------------------------
     Return from Stripe
     ------------------------------------------------------------------ */
  function showReturnMessage() {
    var status = new URLSearchParams(window.location.search).get("betaling");
    var box = null;
    if (status === "gelukt") box = $("salenPaid");
    if (status === "geannuleerd") box = $("salenCancelled");
    if (!box) return;

    box.hidden = false;
    var section = $("boeken");
    window.requestAnimationFrame(function () {
      if (section) section.scrollIntoView({ block: "start" });
      box.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------
     Route line: drawn once when it comes into view
     ------------------------------------------------------------------ */
  function initRouteLine() {
    var route = document.querySelector(".salen-route");
    if (!route) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      route.classList.add("is-drawn");
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          route.classList.add("is-drawn");
          observer.disconnect();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(route);
  }

  /* ------------------------------------------------------------------
     Package tables: prices and bar lengths come from the JSON
     ------------------------------------------------------------------ */
  function setBars() {
    document.querySelectorAll(".salen-rates").forEach(function (table) {
      var cells = table.querySelectorAll("[data-rate]");
      var values = [];
      cells.forEach(function (cell) {
        var n = parseInt(String(cell.textContent).replace(/[^\d]/g, ""), 10);
        values.push(isFinite(n) ? n : 0);
      });
      var max = Math.max.apply(null, values.concat([1]));
      cells.forEach(function (cell, i) {
        var bar = cell.parentNode.querySelector(".salen-rates__bar");
        if (bar) bar.style.setProperty("--w", (values[i] / max).toFixed(3));
      });
    });
  }

  function syncDisplayedPrices() {
    if (!prices || !prices.packages) return;

    document.querySelectorAll(".salen-rates[data-package]").forEach(function (table) {
      var pkg = prices.packages[table.getAttribute("data-package")];
      if (!pkg || !pkg.adultRates) return;
      table.querySelectorAll("[data-rate]").forEach(function (cell) {
        var rate = pkg.adultRates[cell.getAttribute("data-rate")];
        if (typeof rate === "number") cell.textContent = euro(rate);
      });
    });

    document.querySelectorAll("[data-child-rate]").forEach(function (el) {
      var pkg = prices.packages[el.getAttribute("data-child-rate")];
      if (pkg && typeof pkg.child === "number") el.textContent = euro(pkg.child);
    });

    if (typeof prices.transferPerAdult === "number") {
      document.querySelectorAll("[data-transfer-rate]").forEach(function (el) {
        el.textContent = euro(prices.transferPerAdult);
      });
    }
    if (typeof prices.rentalPerPair === "number") {
      document.querySelectorAll("[data-rental-rate]").forEach(function (el) {
        el.textContent = euro(prices.rentalPerPair);
      });
    }

    var season = prices.season;
    var dateInput = $("salenDate");
    if (season && dateInput && /^\d{4}-\d{2}-\d{2}$/.test(season.from) && /^\d{4}-\d{2}-\d{2}$/.test(season.to)) {
      // No dates in the past: the earliest choice is today once the season has started.
      var now = today();
      dateInput.min = now > season.from ? now : season.from;
      dateInput.max = season.to;
    }

    setBars();
  }

  /* ------------------------------------------------------------------
     Form
     ------------------------------------------------------------------ */
  var form = $("salenForm");
  if (!form) {
    showReturnMessage();
    initRouteLine();
    return;
  }

  var el = {
    name: $("salenName"),
    email: $("salenEmail"),
    phone: $("salenPhone"),
    date: $("salenDate"),
    adults: $("salenAdults"),
    children: $("salenChildren"),
    toddlers: $("salenToddlers"),
    rentalFields: $("salenRentalFields"),
    rentals: $("salenRentals"),
    shoeSizes: $("salenShoeSizes"),
    loading: $("salenSummaryLoading"),
    lines: $("salenSummaryLines"),
    sumAdultsLabel: $("sumAdultsLabel"),
    sumAdults: $("sumAdults"),
    sumChildrenLabel: $("sumChildrenLabel"),
    sumChildren: $("sumChildren"),
    sumTransferLabel: $("sumTransferLabel"),
    sumTransfer: $("sumTransfer"),
    sumRentalLabel: $("sumRentalLabel"),
    sumRental: $("sumRental"),
    sumTotal: $("sumTotal"),
    error: $("salenError"),
    submit: $("salenSubmit")
  };

  function count(select) {
    var n = parseInt(select && select.value, 10);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function radioValue(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  }

  function isRenting() { return radioValue("rent") === "yes"; }

  function readInput() {
    return {
      package: radioValue("package") || "half",
      adults: count(el.adults),
      children: count(el.children),
      toddlers: count(el.toddlers),
      transfer: radioValue("transfer") === "yes",
      rentals: isRenting() ? count(el.rentals) : 0
    };
  }

  // Rental count can never exceed the number of people in the group.
  function syncRentalOptions() {
    var people = count(el.adults) + count(el.children) + count(el.toddlers);
    var max = Math.max(1, people);
    var current = count(el.rentals) || people;
    var chosen = Math.min(Math.max(current, 1), max);

    if (el.rentals.options.length !== max) {
      el.rentals.innerHTML = "";
      for (var i = 1; i <= max; i++) {
        var option = document.createElement("option");
        option.value = String(i);
        option.textContent = String(i);
        el.rentals.appendChild(option);
      }
    }
    el.rentals.value = String(chosen);
  }

  function syncRentalVisibility() {
    var on = isRenting();
    el.rentalFields.hidden = !on;
    el.rentals.disabled = !on;
    el.shoeSizes.disabled = !on;
    el.shoeSizes.required = on;
    if (!on) clearFieldError(el.shoeSizes);
  }

  function setButtonIdle(total) {
    if (submitting) return;
    el.submit.textContent = typeof total === "number" ? "Boek nu voor " + euro(total) : "Boek nu";
  }

  // Show or hide one summary row (the <div> around a <dt>/<dd> pair).
  function setLineVisible(amountEl, visible) {
    var row = amountEl && amountEl.parentNode;
    if (row) row.hidden = !visible;
  }

  function render() {
    var input = readInput();
    var result = prices && window.SalenPrice ? window.SalenPrice.calc(input, prices) : null;

    if (!result) {
      el.lines.hidden = true;
      el.loading.hidden = false;
      el.submit.disabled = true;
      setButtonIdle(null);
      return;
    }

    el.submit.disabled = submitting;

    el.sumAdultsLabel.textContent = "Volwassenen (" + input.adults + " × " + euro(result.adultRate) + ")";
    el.sumAdults.textContent = euro(result.adultsTotal);

    var childLabel = "Kinderen";
    if (input.children > 0) childLabel += " (" + input.children + " × " + euro(result.childRate) + ")";
    if (input.toddlers > 0) childLabel += (input.children > 0 ? ", " : " (") + input.toddlers + " t/m 3 jaar gratis" + (input.children > 0 ? "" : ")");
    el.sumChildrenLabel.textContent = childLabel;
    el.sumChildren.textContent = euro(result.childrenTotal);
    // Lines without anything in them are hidden. Children 0-3 are free but
    // still listed, so the visitor sees they are counted.
    setLineVisible(el.sumChildren, input.children > 0 || input.toddlers > 0);

    el.sumTransferLabel.textContent = input.transfer
      ? "Vervoer (" + input.adults + " × " + euro(prices.transferPerAdult) + ")"
      : "Vervoer (eigen vervoer)";
    el.sumTransfer.textContent = euro(result.transferTotal);
    setLineVisible(el.sumTransfer, result.transferTotal > 0);

    el.sumRentalLabel.textContent = input.rentals > 0
      ? "Schaatsverhuur (" + input.rentals + " × " + euro(prices.rentalPerPair) + ")"
      : "Schaatsverhuur (eigen schaatsen)";
    el.sumRental.textContent = euro(result.rentalTotal);
    setLineVisible(el.sumRental, result.rentalTotal > 0);

    el.sumTotal.textContent = euro(result.total);
    // Reveal only now, so hidden lines never flash in on the first render.
    el.loading.hidden = true;
    el.lines.hidden = false;
    setButtonIdle(result.total);
  }

  function update() {
    syncRentalOptions();
    syncRentalVisibility();
    render();
  }

  /* Inline field errors ------------------------------------------------ */
  function errorId(field) { return field.id + "Error"; }

  function setFieldError(field, message) {
    var id = errorId(field);
    var msg = $(id);
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "salen-field__error";
      msg.id = id;
      field.parentNode.appendChild(msg);
    }
    msg.textContent = message;
    field.setAttribute("aria-invalid", "true");
    var described = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (described.indexOf(id) === -1) described.push(id);
    field.setAttribute("aria-describedby", described.join(" "));
  }

  function clearFieldError(field) {
    var id = errorId(field);
    var msg = $(id);
    if (msg) msg.parentNode.removeChild(msg);
    field.removeAttribute("aria-invalid");
    var described = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (x) {
      return x && x !== id;
    });
    if (described.length) field.setAttribute("aria-describedby", described.join(" "));
    else field.removeAttribute("aria-describedby");
  }

  function checkFields() {
    var problems = [];
    var name = el.name.value.trim();
    var email = el.email.value.trim();
    var phone = el.phone.value.trim();
    var date = el.date.value;

    if (!name) problems.push([el.name, "Vul je naam in."]);
    if (!email) problems.push([el.email, "Vul je e-mailadres in."]);
    else if (!EMAIL_PATTERN.test(email)) problems.push([el.email, "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl."]);
    if (!phone) problems.push([el.phone, "Vul je telefoonnummer in."]);

    if (!date) {
      problems.push([el.date, "Kies een datum."]);
    } else if (date < today()) {
      problems.push([el.date, "Deze datum is al voorbij. Kies een datum vanaf vandaag."]);
    } else if ((el.date.min && date < el.date.min) || (el.date.max && date > el.date.max)) {
      problems.push([el.date, "Kies een datum van 10 januari tot en met 20 februari 2027."]);
    }

    if (isRenting() && !el.shoeSizes.value.trim()) {
      problems.push([el.shoeSizes, "Vul de schoenmaten in voor de huurschaatsen."]);
    }

    [el.name, el.email, el.phone, el.date, el.shoeSizes].forEach(clearFieldError);
    problems.forEach(function (p) { setFieldError(p[0], p[1]); });
    return problems.length ? problems[0][0] : null;
  }

  function showError(message) {
    el.error.textContent = message;
    el.error.hidden = false;
  }

  function hideError() {
    el.error.hidden = true;
    el.error.textContent = "";
  }

  /* Events ------------------------------------------------------------- */
  form.addEventListener("change", function (event) {
    if (event.target && event.target.getAttribute("aria-invalid") === "true") {
      clearFieldError(event.target);
    }
    update();
  });
  form.addEventListener("input", function (event) {
    var t = event.target;
    if (t && t.tagName === "INPUT" && t.getAttribute("aria-invalid") === "true" && t.value.trim()) {
      clearFieldError(t);
    }
  });

  document.querySelectorAll("[data-choose-package]").forEach(function (link) {
    link.addEventListener("click", function () {
      var value = link.getAttribute("data-choose-package");
      var radio = form.querySelector('input[name="package"][value="' + value + '"]');
      if (radio) {
        radio.checked = true;
        update();
      }
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (submitting) return;
    hideError();

    if (!prices || !window.SalenPrice) {
      showError("De prijzen zijn nog niet geladen. Probeer het zo opnieuw of neem contact op via " + MAIL + ".");
      return;
    }

    var firstInvalid = checkFields();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var trip = readInput();
    var payload = {
      name: el.name.value.trim(),
      email: el.email.value.trim(),
      phone: el.phone.value.trim(),
      date: el.date.value,
      package: trip.package,
      adults: trip.adults,
      children: trip.children,
      toddlers: trip.toddlers,
      transfer: trip.transfer,
      rentals: trip.rentals,
      shoeSizes: trip.rentals > 0 ? el.shoeSizes.value.trim() : ""
    };

    var invalid = window.SalenPrice.validate(payload, prices);
    if (invalid) {
      showError(invalid);
      return;
    }

    submitting = true;
    el.submit.disabled = true;
    el.submit.textContent = "Bezig met doorsturen...";

    fetch(CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          return { ok: response.ok, data: data || {} };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.url) {
          throw new Error(result.data.error || "Er ging iets mis bij het afrekenen");
        }
        window.location.href = result.data.url;
      })
      .catch(function (err) {
        submitting = false;
        var reason = err && err.message && err.message !== "Failed to fetch"
          ? err.message.replace(/\.$/, "")
          : "Er kon geen verbinding worden gemaakt";
        // The server message may already name the contact address; do not repeat it.
        showError(reason.indexOf(MAIL) !== -1
          ? "Boeken lukte niet: " + reason + "."
          : "Boeken lukte niet: " + reason + ". Probeer het opnieuw of neem contact op via " + MAIL + ".");
        render();
      });
  });

  /* Start ---------------------------------------------------------------- */
  showReturnMessage();
  initRouteLine();
  setBars();
  update();

  fetch(PRICES_URL, { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) throw new Error("status " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!data || !data.packages) throw new Error("no packages");
      prices = data;
      syncDisplayedPrices();
      update();
    })
    .catch(function () {
      prices = null;
      el.loading.textContent = "De prijzen konden niet worden geladen. Ververs de pagina of neem contact op via " + MAIL + ".";
      render();
    });
})();
