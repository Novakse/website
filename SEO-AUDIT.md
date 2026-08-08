# SEO Audit Novakse

Datum: 7–8 augustus 2026
Methodiek: handmatige code-audit + DataForSEO OnPage API (Instant Pages) op de live site, 11 NL-pagina's gecontroleerd voor en na eerdere fixes.

## Executive summary

De technische SEO-basis van novakse.com stond zwak: geen canonical-tags, geen structured data, geen robots.txt of sitemap, hreflang die naar een verkeerd (niet-eigen) domein wees, en vier van de zes taalversies misten op acht pagina's de complete hero-sectie inclusief de H1 — een serieus, losstaand technisch defect dat buiten de oorspronkelijke SEO-vraag viel maar wel is opgelost. Contentmatig ontbrak een duidelijke keyword-architectuur: homepage en reizenpagina concurreerden bijna met identieke titels, bestemmingspagina's hadden alleen de plaatsnaam als H1, en de site presenteerde zichzelf nog als "Zweden en Finland" terwijl Weissensee (Oostenrijk) al een bestaande vierde bestemming is.

Deze audit heeft de technische basis gelegd (robots.txt, sitemap.xml, canonicals, structured data, Open Graph, 404-pagina) én de keyword-architectuur uit de opdracht doorgevoerd (homepage → "schaatsreizen op natuurijs", reizenpagina → "schaatsreizen", elke bestemming → eigen zoekintentie). Wat nog moet gebeuren staat onder "Openstaande externe acties" en "Aanbevolen vervolgstappen".

**Belangrijk:** tijdens dit werk is gebleken dat er gelijktijdig ook door jou (of een andere sessie) is gecommit aan de repository (formulieren gekoppeld aan Resend). Er is in deze ronde dus bewust **niets automatisch gecommit** — bekijk `git diff` zelf voordat je commit.

---

## Huidige situatie (vóór deze audit)

- Geen `robots.txt`, geen `sitemap.xml` op de live site (beide gaven 404).
- Geen enkele pagina had een `<link rel="canonical">`.
- hreflang-tags op alle 68 live NL-bestanden verwezen naar **novakse.nl** — een domein dat niet van Novakse is, maar een geparkeerde "domain for sale"-pagina (al gefixt in een eerdere sessie, zie commit `2884317`).
- Geen structured data (`application/ld+json`) op de hele site.
- Geen Open Graph- of Twitter-tags.
- Footer had vrijwel geen interne links (alleen voorwaarden + blog).
- Homepage-H1 was "Natuurijs" — geen directe indicatie dat Novakse reizen verkoopt.
- Reizenpagina-title en homepage-title waren bijna identiek — cannibalization-risico.
- Bestemmingspagina's (Orsa, Falun, Finland, Luleå, Weissensee) hadden alleen de plaatsnaam als H1.
- Homepage- en reizenpagina-copy noemde alleen "Zweden en Finland", terwijl Weissensee (Oostenrijk) een bestaande, actieve vierde bestemming is.
- **Kritiek, niet eerder bekend:** in de talen Duits, Fins, Noors en Zweeds ontbrak op 8 van de 12 pagina's de complete hero-sectie inclusief `<h1>` — een structurele knip, geen vertaalprobleem (de rest van de content was wél correct vertaald).
- **Kritiek, niet eerder bekend:** het boekingsformulier (`boeken.html`) is in alle vier deze talen kapot — geen `<form>`, geen prijsdata-blok, geen reisnaam-veld. Bewust niet aangeraakt (zie hieronder).
- Footer linkte op alle 68 pagina's naar `facebook.com/komcycling.tours.1` — de Facebook-pagina van een ander (fiets)bedrijf, niet van Novakse.
- Geen eigen 404-pagina; Vercel toonde de generieke NOT_FOUND-pagina (wel met correcte 404-statuscode).
- Footer bevatte een "Privacyverklaring"-link die naar `href="#"` wijst — een dode link, want er bestaat geen privacyverklaring-pagina.

---

## Technische problemen gevonden

| # | Probleem | Status |
|---|---|---|
| 1 | Geen robots.txt | **Opgelost** — aangemaakt, verwijst naar sitemap |
| 2 | Geen sitemap.xml | **Opgelost** — 69 URL's (14 NL + 55 vertaald, exclusief noindex-pagina's) |
| 3 | Geen canonical-tags | **Opgelost** — op alle 65 indexeerbare pagina's (NL + 5 talen) |
| 4 | hreflang naar verkeerd domein | Al opgelost in eerdere sessie (commit `2884317`) |
| 5 | Geen structured data | **Deels opgelost** — Organization + WebSite (homepage), BreadcrumbList (6 pagina's) |
| 6 | Geen Open Graph/Twitter-tags | **Opgelost** op de 12 belangrijkste NL-pagina's |
| 7 | Geen eigen 404-pagina | **Opgelost** — `website/404.html`, hergebruikt bestaande stijl |
| 8 | H1/hero ontbreekt in DE/FI/NO/SV (8 van 12 pagina's) | **Opgelost** — hersteld met vertaalde content o.b.v. NL-bron en EN-structuur |
| 9 | Kapot boekingsformulier in DE/FI/NO/SV | **Niet opgelost — bewuste keuze**, zie hieronder |
| 10 | Verkeerde Facebook-link site-breed | **Niet opgelost — vereist jouw input**, zie hieronder |
| 11 | Dode "Privacyverklaring"-link | **Niet opgelost — vereist een echte privacypagina**, zie hieronder |
| 12 | Footer met vrijwel geen interne links | **Opgelost** — 4e kolom "Reizen & diensten" toegevoegd (NL) |
| 13 | Render-blocking CSS (van eerdere audit) | Nog openstaand, lage prioriteit |

---

## On-page problemen gevonden (en opgelost)

- **Homepage/reizen-cannibalization**: titels leken te veel op elkaar. Nu: homepage = "Schaatsreizen op natuurijs \| Novakse Reizen", reizen = "Alle schaatsreizen op natuurijs \| Novakse".
- **Homepage-H1** "Natuurijs" → "Schaatsreizen op natuurijs" (expliciet de belangrijkste wijziging uit de opdracht).
- **Reizen-H1** "Vijf bestemmingen, één seizoen" → "Onze schaatsreizen op natuurijs" (oude tekst is nu onderdeel van de lede-tekst: "Vijf bestemmingen, één seizoen — de meren en zeeën van natuurijs in Zweden, Finland en Oostenrijk").
- **5 bestemmings-H1's**: van kale plaatsnaam naar een korte, zoekwoordrijke variant die het bestaande ontwerp niet breekt (zie "Ontwerpkeuzes" hieronder): "Schaatsen in Orsa", "Schaatsen in Falun", "Schaatsen in Punkaharju, Finland", "Schaatsen in Luleå", "Schaatsen op de Weissensee".
- **Zweden/Finland-only-claim** gecorrigeerd naar Zweden/Finland/Oostenrijk op homepage en reizenpagina (title, meta description, H1-omgeving) — dit was feitelijk verouderd sinds Weissensee is toegevoegd.
- **Te lange titels** (Luleå, Weissensee: 75-77 tekens) ingekort.
- **Contact-titel** specifieker gemaakt (in een eerdere sessie).
- **Breadcrumbs** op de 6 bestemmings-/infopagina's uitgebreid van "Reizen > X" naar "Home > Schaatsreizen > X", met bijpassend BreadcrumbList-schema.
- **Interne cross-linking** tussen bestemmingen bleek al goed aanwezig (elke bestemmingspagina linkt al terug naar Reizen en naar gerelateerde bestemmingen) — geen wijziging nodig.

---

## Uitgevoerde wijzigingen (per categorie)

### Technisch
- `website/robots.txt` aangemaakt.
- `website/sitemap.xml` aangemaakt (69 URL's).
- `website/404.html` aangemaakt, hergebruikt bestaande header/footer-stijl.
- Canonical-tags toegevoegd op alle 65 indexeerbare pagina's (11 NL + 5 × 11 vertaald). `boeken.html` bewust overgeslagen (staat al op `noindex`).
- `text-wrap: balance` toegevoegd aan `.page-hero__title` in `css/styles.css` (voorkomt lelijke regelafbrekingen bij de langere H1's — kleine, veilige CSS-toevoeging, geen redesign).
- Footer-grid CSS aangepast van 3 naar 4 kolommen (`grid-template-columns`).

### Metadata
- Homepage- en reizen-title/meta description herschreven (zie boven).
- 5 bestemmings-H1's aangescherpt.
- Homepage/reizen-lede-teksten gecorrigeerd (Zweden/Finland/Oostenrijk i.p.v. alleen Zweden/Finland).
- Dezelfde H1/lede-aanscherping doorgevoerd in EN/DE/FI/NO/SV waar dat al bestond (homepage, reizenpagina) — zie "Openstaande externe acties" voor wat nog synchroniseert.

### Content/structuur
- Footer uitgebreid met een 4e kolom "Reizen & diensten" (Schaatsreizen, Schaatslessen, Schaatsonderhoud, Over Novakse) — op alle 17 NL-pagina's.
- Breadcrumbs uitgebreid met "Home" als eerste stap, op 6 pagina's.
- Ontbrekende hero/H1-secties hersteld in DE/FI/NO/SV (32 secties over 32 pagina's), vertaald vanuit de NL-brontekst, met behoud van bestaande terminologie per taal.

### Structured data
- `Organization` + `WebSite` JSON-LD op de homepage (naam, url, logo, e-mail, telefoon, adres, Instagram — **niet** Facebook, zie hieronder).
- `BreadcrumbList` JSON-LD op de 6 pagina's met een zichtbare breadcrumb.

### Performance
- Geen nieuwe wijzigingen deze ronde (render-blocking CSS blijft een openstaand, lage-prioriteit punt uit de vorige audit).

---

## Keyword mapping

| URL | Primaire intentie | Secundaire intentie |
|---|---|---|
| `/index.html` | schaatsreizen op natuurijs | Zweden, Finland, Oostenrijk, kleine groepen |
| `/reizen.html` | schaatsreizen | schaatsvakantie, natuurijs reizen, begeleid/zelfstandig |
| `/orsa.html` | schaatsen Orsa | schaatsreis Orsa, natuurijs Dalarna, schaatsreis Zweden |
| `/falun.html` | schaatsen Falun | schaatsreis Falun, natuurijs Dalarna, schaatsreis Zweden |
| `/finland.html` | schaatsen Punkaharju / schaatsreis Finland | Saimaameer, schaatsvakantie Finland |
| `/lulea.html` | schaatsen Luleå | Zweeds Lapland, Botnische Golf, zelfstandige schaatsreis |
| `/weissensee.html` | schaatsen Weissensee | natuurijs Oostenrijk, schaatsvakantie Weissensee |
| `/schaatslessen.html` | schaatslessen | personal training, natuurijstraining |
| `/schaatsonderhoud.html` | schaatsen slijpen / schaatsonderhoud | skatefitting, Noordwolde |
| `/over-novakse.html` | Novakse / Joey Novak | vertrouwen, expertise |
| `/reisinformatie.html` | praktische reisinformatie | wat meenemen, hoe werkt een schaatsreis |
| `/contact.html` | contact Novakse | WhatsApp, telefoon, e-mail |
| Toekomstige blogs | informatieve long-tail | zie `SEO-CONTENT-PLAN.md` |

---

## Definitieve title/H1-mapping (NL)

| URL | Title | H1 |
|---|---|---|
| `/index.html` | Schaatsreizen op natuurijs \| Novakse Reizen | Schaatsreizen op natuurijs |
| `/reizen.html` | Alle schaatsreizen op natuurijs \| Novakse | Onze schaatsreizen op natuurijs |
| `/orsa.html` | Orsa, Dalarna — begeleide schaatsreis \| Novakse | Schaatsen in Orsa |
| `/falun.html` | Falun, Dalarna — begeleide schaatsreis \| Novakse | Schaatsen in Falun |
| `/finland.html` | Finland, Punkaharju — zelfstandige schaatsreis \| Novakse | Schaatsen in Punkaharju, Finland |
| `/lulea.html` | Schaatsen in Luleå, Zweeds Lapland \| Novakse | Schaatsen in Luleå |
| `/weissensee.html` | Schaatsen op de Weissensee, Oostenrijk \| Novakse | Schaatsen op de Weissensee |
| `/schaatslessen.html` | Schaatslessen en personal training \| Novakse | Beter leren schaatsen *(marketing-H1 behouden, past goed)* |
| `/schaatsonderhoud.html` | Schaatsen slijpen, onderhoud en skatefitting \| Novakse | Slijpen en afstellen *(marketing-H1 behouden, past goed)* |
| `/over-novakse.html` | Over Novakse — het verhaal van Joey Novak \| Novakse | Hej, ik ben Joey Novak *(bewust ongewijzigd — E-E-A-T/merkwaarde)* |
| `/contact.html` | Contact — WhatsApp, telefoon of e-mail \| Novakse Reizen | Even overleggen? *(bewust ongewijzigd)* |
| `/reisinformatie.html` | Reisinformatie voor je schaatsreis \| Novakse Reizen | Reisinformatie *(bewust ongewijzigd)* |

---

## Interne linkstructuur

- **Commerciële route** (Home → Reizen → Bestemming → Aanvraag) was al grotendeels aanwezig, nu versterkt met bredere breadcrumbs en een uitgebreide footer.
- **Cross-linking tussen bestemmingen**: Orsa ↔ Falun/Finland, Finland → Orsa, Luleå → begeleide reizen, Weissensee → begeleide reizen — allemaal al aanwezig, geen wijziging nodig.
- **Footer** linkt nu naar Reizen, Schaatslessen, Schaatsonderhoud, Over Novakse (naast Contact, Blog, Voorwaarden) — voorheen ontbrak dit vrijwel volledig.
- Geen nieuwe pagina's per plaatsnaam aangemaakt (conform opdracht §51/§99) — Noordwolde/Wolvega/Heerenveen e.d. blijven op de bestaande schaatsonderhoud-pagina staan.

---

## Structured data

- `Organization`: naam, url, logo, e-mail, telefoon, adres (Friesland/Noordwolde), `sameAs` met **alleen Instagram**.
- **Facebook is bewust NIET in `sameAs` opgenomen** — de huidige footer-link (`facebook.com/komcycling.tours.1`) hoort bij een ander bedrijf. Structured data met een verkeerde `sameAs`-link zou actief misleidend zijn voor Google.
- `WebSite`: naam + url, geen `SearchAction` (er is geen zoekfunctie op de site).
- `BreadcrumbList`: op Orsa, Falun, Finland, Luleå, Weissensee, Reisinformatie — komt exact overeen met de zichtbare breadcrumb.
- **Niet geïmplementeerd**: `TouristTrip`/`Product`/`Offer`-schema voor de reizen zelf — de meeste reizen hebben nog geen definitieve prijs/datum ("volgt binnenkort"), en schema met placeholder-data zou misleidend zijn. Aanbevolen om dit alsnog toe te voegen zodra prijzen/data vaststaan.
- **Niet geïmplementeerd**: `FAQPage`-schema — er staat wel een zichtbare FAQ op meerdere pagina's, maar dit vereist zorgvuldige 1-op-1 matching met de zichtbare tekst; aanbevolen als apart, gericht vervolgstapje.

---

## Robots en sitemap

- `robots.txt`: `Allow: /` voor alle user-agents, verwijst naar `sitemap.xml`. `boeken.html` is bewust niet geblokkeerd via robots.txt (de `noindex`-meta-tag doet dat al, en blokkeren via robots.txt zou Google verhinderen die tag te lezen).
- `sitemap.xml`: 69 URL's — 14 NL-pagina's (incl. `algemene-voorwaarden.html` en `blog.html`) + 5 × 11 vertaalde pagina's. `boeken.html`, `uitchecken.html`, `betaling-verwerkt.html` en `404.html` zijn bewust uitgesloten (noindex/utility).

---

## Canonicals en redirects

- Alle 65 indexeerbare pagina's hebben nu een zelfverwijzende canonical.
- HTTP → HTTPS en `novakse.com` → `www.novakse.com` redirecten al correct (308), geverifieerd via curl — geen wijziging nodig.
- Geen URL's gewijzigd (conform opdracht §56 — korte bestaande URL's blijven behouden).

---

## Hreflang

- hreflang-blokken zijn wederkerig en technisch correct op alle pagina's, **behalve `boeken.html`** (geen enkele taalversie heeft een geldig `<link>`-hreflang-blok in de head — alleen de taalwisselaar-links in de nav, die Google negeert). Gezien `boeken.html` op `noindex` staat, is dit laag-risico en bewust niet opgelost (geen SEO-waarde op een niet-geïndexeerde pagina).
- **Let op**: `lulea.html` en `weissensee.html` bestaan alleen in het Nederlands — geen hreflang-alternatieven in andere talen, want die pagina's bestaan daar niet. Dit is geen fout, maar een echte contentleemte (zie vervolgstappen).

---

## Performance

Geen wijzigingen deze ronde. Openstaand vanuit de vorige audit: render-blocking CSS op alle pagina's (lage prioriteit, scores waren al 94-97/100).

---

## Openstaande externe acties (vereisen jouw input)

1. **Facebook-link is fout** — `facebook.com/komcycling.tours.1` staat in de footer van alle 68 pagina's en hoort bij een ander bedrijf. Graag de juiste URL (of bevestigen dat Novakse geen Facebook heeft, dan verwijderen we de link).
2. **Privacyverklaring ontbreekt** — de footer-link wijst naar `#` (nergens naartoe). Er is geen privacyverklaring-pagina. Dit is ook een AVG/GDPR-vereiste, niet alleen SEO — dit kan ik niet zelf opstellen (juridische tekst), maar wel technisch inbouwen zodra de tekst er is.
3. **Kapot boekingsformulier in DE/FI/NO/SV** — `boeken.html` mist in deze 4 talen het hele formulier, prijsdata en reisnaam-veld. Bewust niet aangeraakt op jouw verzoek, omdat dit de boekingsflow raakt. Dit is een echte, waarschijnlijk niet-werkende checkout voor internationale bezoekers — aanbevolen om dit snel op te pakken, los van SEO.
4. **`lulea.html` en `weissensee.html` bestaan alleen in het Nederlands** — geen Engelse/Duitse/Finse/Noorse/Zweedse versie. Als deze bestemmingen ook voor internationale bezoekers relevant zijn, is vertaling een aparte vervolgklus.
5. **`reizen.html` toont in de vertaalde versies (EN/DE/FI/NO/SV) maar 3 van de 5 bestemmingen** (Orsa, Finland, Falun — Weissensee en Luleå ontbreken als kaart op de reizenpagina zelf). Dit bleek een al langer bestaand gat in de Engelse versie (waar de andere talen structureel van zijn afgeleid), niet iets wat deze ronde is veroorzaakt. Aanbevolen als vervolgstap.
6. **Consistentie-check H1/lede in vertalingen** — de homepage- en reizenpagina-koppen zijn in alle 6 talen bijgewerkt naar de nieuwe positionering (schaatsreizen i.p.v. alleen "natuurijs", en Zweden/Finland/Oostenrijk i.p.v. alleen Zweden/Finland). De 5 bestemmings-H1's (Orsa/Falun/Finland/Luleå/Weissensee) zijn **alleen in het Nederlands** aangescherpt — de vertaalde versies van Orsa/Falun/Finland tonen nog de kale plaatsnaam als H1. Dit is bewust niet in deze ronde meegenomen (vertaalkwaliteit door een native speaker is hier belangrijker dan snelheid); zie vervolgstappen.
7. **Google Search Console, Google Business Profile, reviews, backlinks** — kan niet vanuit de code, zie vervolgstappen.
8. **`TouristTrip`/`Offer`-schema** — pas zinvol zodra prijzen/data per reis definitief zijn.

---

## Mogelijke risico's om na deployment te controleren

- Ik heb **5 destination-H1's flink verlengd** (bv. "Orsa" → "Schaatsen in Orsa", "Weissensee" → "Schaatsen op de Weissensee") en de homepage-H1 fors verlengd ("Natuurijs" → "Schaatsreizen op natuurijs", tot 5,5rem lettergrootte). Ik heb dit beoordeeld op basis van de CSS (`clamp()`-waarden, `text-wrap: balance`) maar **niet visueel getest in een browser** — controleer de hero's op de homepage en de 5 bestemmingspagina's op mobiel en desktop voordat je live gaat.
- De footer is van 3 naar 4 kolommen gegaan (CSS-aanpassing in `grid-template-columns`) — controleer of dit er op alle schermformaten netjes uitziet.
- De 3 taalagents die de hero-secties in DE/FI/NO/SV hersteld hebben, liepen tegen een sessielimiet aan tijdens het werk. Ik heb ze gecontroleerd (sectie-/H1-tellingen, div-balans) en waar nodig zelf afgemaakt (`sv/reizen.html`, `de/schaatslessen.html`), maar een **inhoudelijke check door een native speaker** van de vertaalde hero-teksten (vooral DE/FI/SV) is aan te raden voordat dit lang online staat.
- Er is **gelijktijdig door jou/een andere sessie gecommit** aan formulieren (Resend-koppeling). Bekijk `git diff` zorgvuldig — met name of er geen overlap zit tussen mijn wijzigingen en die commits (ik heb specifiek gecontroleerd dat ik geen bestanden heb aangeraakt die met formulieren/betalingen te maken hebben, buiten het puur constateren van het kapotte `boeken.html`-formulier in 4 talen).

---

## Top 10 vervolgstappen (op verwachte impact)

1. **Deployen en live verifiëren** — commit/push (na jouw review), daarna homepage + bestemmingen visueel checken.
2. **Kapot boekingsformulier DE/FI/NO/SV oplossen** — waarschijnlijk de grootste directe impact op omzet uit internationale bezoekers.
3. **Facebook-link corrigeren of verwijderen** — vertrouwenskwestie, kost 5 minuten zodra de juiste URL bekend is.
4. **Privacyverklaring laten opstellen en linken** — SEO + wettelijke verplichting.
5. **H1's van de 5 bestemmingen ook in EN/DE/FI/NO/SV aanscherpen** (native-speaker review aanbevolen).
6. **Weissensee/Luleå toevoegen aan de reizenpagina in de vertaalde versies** (nu alleen 3 van 5 bestemmingen zichtbaar voor internationale bezoekers).
7. **Content uit `SEO-CONTENT-PLAN.md` oppakken**, te beginnen met "Begeleid vs. zelfstandig" en "Schaatsen op natuurijs in Zweden".
8. **Google Search Console koppelen** en de nieuwe sitemap.xml indienen.
9. **Google Business Profile controleren/aanmaken** (buiten code om).
10. **`TouristTrip`/`Offer`-schema toevoegen** zodra prijzen/data per reis definitief zijn.

---

## Wat bewust niet is gewijzigd (en waarom)

- **Boekingsformulier/betaalflow** (`api/`, `boeken.html`-structuur) — actief in ontwikkeling door jou, expliciet buiten scope gehouden op jouw verzoek.
- **Facebook-link, privacyverklaring** — vereisen feitelijke input die ik niet heb/mag verzinnen.
- **Prijzen, data, aantallen, jaren ervaring, garanties** — nergens verzonnen; waar informatie ontbrak is "volgt binnenkort" gerespecteerd.
- **Design/CSS-framework** — geen redesign; enige CSS-wijzigingen zijn een `text-wrap: balance`-toevoeging en een footer-grid van 3 naar 4 kolommen.
- **URL-structuur** — geen URL's gewijzigd, ook niet voor keywords in de URL (conform opdracht §56).
- **Alt-teksten** — bij handmatige controle bleken alle afbeeldingen al een correct `alt`-attribuut te hebben (lege `alt=""` alleen bij bewust decoratieve iconen); geen wijziging nodig.
