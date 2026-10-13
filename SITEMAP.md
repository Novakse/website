# Sitemap — huidige staat van de website

Datum: 2026-10-13
Status: beschrijft de daadwerkelijk gebouwde website in `website/`, gecontroleerd tegen de echte bestanden. Vervangt de eerdere "eerste versie" hieronder, die nog van vóór de bouw was en inmiddels op meerdere punten verouderd is (zie "Verschillen met de eerste versie").

---

## Hoofdmenu (NL, root)

1. Reizen
2. Schaatslessen
3. Schaatsonderhoud
4. Over Novakse
5. Contact

Navigatie en footer staan los in elk HTML-bestand (geen gedeeld include/template-bestand). Een wijziging in het menu of de footer moet dus handmatig doorgevoerd worden in elk bestand dat die navigatie bevat, inclusief de taalversies.

---

## Talenstructuur

- **Nederlands (root, `website/*.html`)** is de hoofdversie.
- **Duits (`website/de/`), Engels (`website/en/`), Fins (`website/fi/`), Noors (`website/no/`), Zweeds (`website/sv/`)** bevatten elk dezelfde 17 pagina's, één-op-één vertaald:
  - `index.html`, `reizen.html`, `orsa.html`, `falun.html`, `finland.html`, `lulea.html`, `weissensee.html`, `schaatsen-salen.html`, `wellness.html`, `reisinformatie.html`, `schaatslessen.html`, `schaatsonderhoud.html`, `over-novakse.html`, `contact.html`, `boeken.html`, `privacyverklaring.html`, `algemene-voorwaarden.html`.
- De volgende pagina's bestaan **alleen in het Nederlands** (geen vertaalde versie in `de/`, `en/`, `fi/`, `no/`, `sv/`): `blog.html` + de hele `blog/`-map, `belafspraak.html`, `offerte.html`, `uitchecken.html`, `betaling-verwerkt.html`, `schaatsreizen-zweden.html`, `404.html`. **Bevestigd door de klant: dit is niet bewust, dit zijn ontbrekende vertalingen.** Nog niet zelf aangevuld — alleen benoemd, zie `website_content/CONTENT-INVENTORY.md`.

---

## Volledige paginastructuur (root, Nederlands)

**Reizen**
1. `reizen.html` — overzichtspagina reizen
2. `orsa.html` — reispagina Orsa (Dalarna)
3. `falun.html` — reispagina Falun
4. `finland.html` — reispagina Punkaharju, Finland
5. `lulea.html` — reispagina Luleå, Zweeds Lapland
6. `weissensee.html` — reispagina Weissensee, Oostenrijk
7. `schaatsen-salen.html` — dagtocht Sälen (geen meerdaagse reis)
8. `wellness.html` — Wellness & schaatsen
9. `reisinformatie.html` — praktische info die voor alle reizen geldt
10. `schaatsreizen-zweden.html` — SEO-overzichtspagina "schaatsen in Zweden" (alleen NL)

**Lessen & onderhoud**
11. `schaatslessen.html` — schaatslessen Leeuwarden
12. `schaatsonderhoud.html` — slijpen & onderhoud Noordwolde

**Overig**
13. `index.html` — home
14. `over-novakse.html` — over Novakse / Joey Novak
15. `contact.html` — contact
16. `blog.html` + `blog/` (33 artikelen) — blogoverzicht en -artikelen, alleen NL

**Boeken & betalen**
17. `boeken.html` — reis boeken
18. `uitchecken.html` — betaling afronden
19. `betaling-verwerkt.html` — bevestiging na betaling
20. `offerte.html` — offerte aanvragen
21. `belafspraak.html` — belafspraak inplannen

**Footer / juridisch**
22. `privacyverklaring.html`
23. `algemene-voorwaarden.html`

**Systeem**
24. `404.html` — paginaniet-gevonden

Ondersteunend (geen pagina's, maar onderdeel van de live site): `api/` (serverless functions, o.a. Stripe), `data/` (JSON met prijzen/activiteiten per reis), `sitemap.xml`, `robots.txt`, `llms.txt`.

---

## Niet-actieve mappen

De volgende mappen in `website/` zijn **geen actieve/live versies** van de site en mogen niet als huidige structuur gelezen worden:
- `_backup-v1/`, `_backup-v2-oude-index/`, `_backup-v3-voor-logofix/`, `_backup-v4-voor-slideshow/`, `_backup-v5-kleurvarianten/`, `_backup-v6-voor-nieuw-logo/`, `_backup-v7-oude-favicons/` — oudere back-ups.
- `previews/` — losse ontwerp-previews (richtingen/varianten), geen onderdeel van de live navigatie.

---

## Lokaal testen

Start de lokale server direct met:

```
node website/dev-server.js
```

Er is geen `package.json` in de projectroot of in `website/`, dus `npm run dev` werkt niet. Het commentaar in `dev-server.js` dat naar `npm run dev` verwijst is op dit punt niet (meer) klopt.

---

## Clinics, Skatefitting, Workshop slijpen

Zoals in de eerste versie: dit zijn secties binnen `schaatslessen.html` (Clinics) en `schaatsonderhoud.html` (Skatefitting, Workshop slijpen), geen eigen pagina's. Dat is ongewijzigd.

---

## Niet meegenomen

- **Webshop** — nog steeds niet gebouwd, ongewijzigd t.o.v. de eerste versie.

---

## Verschillen met de eerste versie (2026-08-03)

De eerste versie van deze sitemap ging ervan uit dat nog niets gebouwd was. Inmiddels zijn er duidelijke afwijkingen:
- **Luleå** heeft wél een eigen reispagina (`lulea.html`), terwijl de eerste versie dit expliciet uitsloot ("geen actuele reis beschikbaar"). Kennelijk later alsnog besloten; niet opnieuw geverifieerd in dit document.
- **Sälen** (`schaatsen-salen.html`, dagtocht) en **Wellness & schaatsen** (`wellness.html`) zijn nieuwe pagina's die niet in de eerste versie stonden.
- **Blog** is gebouwd als los overzicht (`blog.html`) plus 33 artikelen in `blog/`, in plaats van alleen "indeling nog te bepalen".
- Er zijn functionele pagina's bijgekomen voor het boekingsproces (`boeken.html`, `uitchecken.html`, `betaling-verwerkt.html`, `offerte.html`, `belafspraak.html`) die in de eerste versie nog niet benoemd waren.
- Er is een extra SEO-pagina (`schaatsreizen-zweden.html`) die niet in de eerste versie stond.
- De eerste versie noemde geen taalversies; de site heeft nu 5 vertalingen (de, en, fi, no, sv) van 17 pagina's.
