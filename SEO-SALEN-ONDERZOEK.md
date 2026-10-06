# SEO-onderzoek: schaatsen vanuit Sälen, Stöten en Tandådalen

Datum: 26-09-2026
Voor: Joey Novak, Novakse
Pagina waar het om draait: https://www.novakse.com/schaatsen-salen.html (live sinds 25-09-2026, alleen Nederlands)
Dit is alleen onderzoek en planning. Er is geen enkel websitebestand aangepast.

---

## Bronnen en betrouwbaarheid

Elke belangrijke bewering in dit rapport heeft een label. Zo zie je meteen hoe hard iets is.

| Label | Betekenis | Hoe hard? |
|---|---|---|
| [website] | Gemeten in de code of op de live site (scripts, headless browser, curl). Meetdatum 26-09-2026. | Hard |
| [DataForSEO 26-09-2026] | Gemeten via DataForSEO: Google Ads-zoekvolume Nederland (gemiddelde per maand, sep 2025 t/m aug 2026) en 10 live Google.nl-zoekresultaten (desktop, diepte 20). | Hard, maar zie beperkingen hieronder |
| [DataForSEO 08-09-2026] | Oudere meting uit `SEO-RANKING-ANALYSE.md` (posities en backlinks). Niet opnieuw gemeten. | Hard, maar 18 dagen oud |
| [WebSearch] | Gezien via de WebSearch-tool. **Dit is geen Google-zoekpagina.** Zegt iets over wat er online bestaat, niet over wie in Google op 1 staat. | Middel |
| [externe bron] | Een externe pagina die zelf is geopend en gelezen. | Hard voor wat er op die pagina staat |
| [analyse] | Conclusie of advies op basis van de data. | Oordeel |
| [aanname] | Niet gemeten of niet te controleren. Redelijke verwachting. | Zacht |

**Wat we niet hebben:**
- **Search Console-data niet beschikbaar.** Search Console is via DNS gekoppeld, maar in deze sessie niet in te zien. We weten dus niet of de Sälen-pagina al geïndexeerd is, hoeveel vertoningen of klikken er zijn.
- **Geen Google Analytics.** Op de site draaien alleen Vercel Web Analytics en Vercel Speed Insights [website]. Geen GA4, geen Tag Manager.
- **Geen Belgische zoekvolumes** en **geen tekst van de Google AI-overzichten** (DataForSEO toont alleen dát er een AI-overzicht is). Het DataForSEO-tegoed is op (ongeveer $0).
- **"Geen data" bij een zoekwoord** betekent: Google Ads geeft geen volume terug. Dat is meestal minder dan 10 zoekopdrachten per maand. Het betekent niet precies nul.

**Vaste copyregels die in al het advies zijn toegepast:** geen woorden van Joey's verboden lijst, geen naam, plek of route van het ijs, het ene skigebied dat Joey bewust niet noemt blijft onbenoemd, alleen ijsprikkers als veiligheidsmiddel noemen, "samen het ijs op" en Novakse is niet verantwoordelijk op het ijs, Novakse is een eenmansbedrijf, geen lange gedachtestreepjes, geen verzonnen prijzen, data, diensten of claims, niet ranken op namen van organisaties of concurrenten.

---

## 1. Executive summary

**Kort gezegd: de Sälen-pagina is een goed product op een goede pagina, maar Google gaat er weinig bezoekers voor leveren. De meeste boekingen zullen via partners en bloggers moeten komen, niet via zoekverkeer.**

1. **Er is bijna geen meetbare zoekvraag.** Alle 40+ Nederlandse varianten van "schaatsen / natuurijs" plus Sälen, Tandådalen of Stöten geven geen data, ook zonder umlaut [DataForSEO 26-09-2026]. De vraag zit in bredere termen: "sälen" 590, "wintersport zweden" 590, "lindvallen" 170, "hundfjället" 140, "tandådalen" 110 per maand. Daarop winnen TUI, Sunweb, BBI en skiportals; Novakse maakt daar geen kans [analyse].
2. **Maar de niche is bijna leeg.** "schaatsen sälen" geeft in Google.nl maar 118 resultaten. Er zijn twee echte aanbieders: BBI Travel (hele dag vanaf € 296, dunne pagina) en Explore Sälen (via Tripadvisor). Na plek 4 staat er geen enkele pagina meer die echt over schaatsen vanuit Sälen gaat [DataForSEO 26-09-2026]. Een goede pagina kan hier hoog komen, ook met weinig autoriteit. Dat levert weinig, maar wel de juiste bezoekers op [analyse].
3. **De pagina zelf is technisch schoon**: prijzen in een echte tabel, direct betalen, snel, eigen foto's [website]. **Zwak:** maar één andere pagina linkt ernaar (`/reizen.html`), de eerste prijs staat pas op ongeveer 2.585 px op mobiel, geen TouristTrip/Offer-schema, maar 2 FAQ-vragen, meta van 202 tekens, en "Zweden" en "dagtocht" ontbreken in de title [website].
4. **Groter risico dan SEO: de regels kloppen niet.** De boekknop zegt dat je akkoord gaat met de algemene voorwaarden, maar die noemen minimaal 4 deelnemers, annuleren "in weken voor vertrek" en geen regel voor slecht ijs. `reisinformatie.html` zegt "ijsprikkers en een helm zijn verplicht" en "alle reizen zijn standaard zelfstandig, zonder begeleiding op het ijs". Dat botst met "samen het ijs op" [website, gecontroleerd].
5. **Het hoofdkanaal is niet Google.** Wie deze dagtocht boekt, heeft zijn skireis al. "wintersport zweden" zit **nu** (september) op zijn hoogste punt [DataForSEO 26-09-2026]. Nederlandse reisorganisaties (BBI, Voigt, Scandinavian Dreams), accommodaties in Sälen en Nederlandstalige bloggers (Kids in de bergen, Stralend Zweden) schrijven over activiteiten in Sälen, maar niemand noemt schaatsen [externe bron]. Dat gat vullen levert zowel boekingen als echte backlinks op [analyse].
6. **Geen nieuwe pagina's.** Van de 9 voorgestelde pagina's is er geen enkele nodig. Tandådalen- en Stöten-pagina's zouden doorway pages zijn (zelfde aanbod, andere plaatsnaam). Alles hoort op de ene Sälen-pagina plus een blok op de Zweden-pagina. Een Engelse pagina is nu niet zinvol [analyse].
7. **Sitebreed blijft autoriteit de grootste rem** (11 spamlinks, domain rank 0) [DataForSEO 08-09-2026]. SEO-matig is de Weissensee (1.300 zoekopdrachten per maand) een grotere kans dan Sälen.

**De vijf dingen die het meeste opleveren voor Sälen:** (1) voorwaarden, ijs- en annuleringsregel voor de dagtocht vastleggen en de tegenstrijdigheid met reisinformatie oplossen, (2) partners en bloggers benaderen vóór november, (3) interne links naar de Sälen-pagina en een Sälen-blok op de Zweden-pagina, (4) prijs, halve/hele dag, huur en seizoen in het eerste scherm plus een zichtbare boekknop op mobiel, (5) title, meta, schema en FAQ op orde met Joey's antwoorden.

---

## 2. Huidige SEO-status

### Wat gaat goed

| Onderdeel | Bevinding | Bron |
|---|---|---|
| Techniek sitebreed | 121 indexeerbare pagina's, elk met eigen canonical; sitemap bevat precies die 121; hreflang 0 fouten; 0 kapotte links op 2.919 interne links; alle `lang`-attributen kloppen | [website] |
| Sälen-pagina techniek | Status 200, zelfverwijzende canonical, in sitemap (lastmod 25-09) en in `llms.txt`, geen horizontale scroll op 390 px, geen JavaScript-fouten, TTFB 69 ms, ongeveer 685 KB | [website] |
| Prijzen | Volledige prijstabellen per groepsgrootte in echte HTML (leesbaar voor Google en AI), gelijk aan `data/salen-prijzen.json`; server rekent de prijs opnieuw uit | [website] |
| Direct boeken | Formulier met live totaalprijs en Stripe-betaling; geen offerte-omweg | [website] |
| Foto's | Vier eigen foto's met beschrijvende alt, AVIF/WebP/srcset, geen GPS-gegevens in de bestanden | [website] |
| Copyregels | 0 treffers op verboden woorden en 0 tekst over plek of route van het ijs | [website] |
| Toegankelijkheid | Skip-link, labels, fieldsets, `aria-live` op de prijs, foutmeldingen met `role="alert"` | [website] |
| Positie tegenover concurrenten | Novakse is de enige met een halve dag, kinderprijzen, groepskorting en een FAQ | [externe bron], [analyse] |

### Wat moet beter

| Onderdeel | Bevinding | Bron |
|---|---|---|
| Interne links naar Sälen | 1 bronpagina (`/reizen.html`, ankers "Bekijk deze reis" en "Boek direct"). Niet vanaf homepage, Zweden-pagina of blogs. Het woord "Sälen" staat op de hele site alleen op `/reizen.html` en de Sälen-pagina | [website] |
| Zweden-pagina | `/schaatsreizen-zweden.html` noemt alleen Orsa, Falun en Luleå; Sälen en wellness ontbreken. Staat nog steeds niet in het hoofdmenu | [website] |
| Verouderde tekst | Blog `schaatsen-zweden.html` zegt nog "we richten ons op twee regio's" | [website] |
| Title Sälen | 67 tekens; "Zweden" en "dagtocht" ontbreken. Google.nl verbetert "activiteiten sälen winter" naar Sölden | [website], [DataForSEO 26-09-2026] |
| Meta Sälen | 202 tekens; het stuk "halve of hele dag, direct te boeken" valt weg | [website] |
| Schema Sälen | Alleen FAQPage (2 vragen). Geen TouristTrip, Offer, BreadcrumbList of verwijzing naar de organisatie, terwijl Orsa, Falun, Weissensee en wellness die wel hebben | [website] |
| Eerste scherm mobiel | Geen prijs, geen halve/hele dag, geen seizoen, geen "schaatsen te huur". Eerste prijs op ongeveer 2.585 px, formulier op ongeveer 5.100 px | [website] |
| Boekknop mobiel | De vaste header verbergt "Boek je dagtocht" in het uitklapmenu; na de hero geen zichtbare knop tot de pakketten | [website] |
| Hero-knop | Tekst "Bekijk pakketten & boek direct" springt naar het formulier en slaat de pakketten over | [website] |
| Vertrouwen | Geen reviews, geen naam of foto van Joey, telefoon en WhatsApp alleen in de footer | [website] |
| Regels | Voorwaarden en reisinformatie passen niet bij de dagtocht (zie hoofdstuk 13) | [website] |
| Autoriteit | 11 verwijzende domeinen (spam), domain rank 0; Natuurijswijzer linkt nog naar het oude novakse.nl | [DataForSEO 08-09-2026] |
| Meten | Geen Search Console-toegang in deze sessie, geen GA; alleen Vercel Web Analytics | [website] |

---

## 3. Zoekwoorden

### 3a. De belangrijkste termen

| Term | Volume per maand | Bron | Wat het betekent |
|---|---:|---|---|
| sälen | 590 | [DataForSEO 26-09-2026] | Skivakantie- en plaatsnaamzoekers. Doelgroep, maar geen rankingkans |
| wintersport zweden | 590 | [DataForSEO 26-09-2026] | Idem; piek al in september |
| salen (zonder umlaut) | 390 | [DataForSEO 26-09-2026] | Deels ander onderwerp [aanname] |
| sälen zweden | 320 | [DataForSEO 26-09-2026] (Labs) | Navigatie |
| schaatsen zweden / schaatsen in zweden | 170 / 170 | [DataForSEO 26-09-2026] | Het enige echte schaatsvolume; hoort bij de Zweden-pagina |
| lindvallen / hundfjället / tandådalen | 170 / 140 / 110 | [DataForSEO 26-09-2026] | Skigebieden; mensen zoeken op hun eigen gebied |
| schaatsen sälen, schaatsen vanuit sälen, natuurijs sälen, schaatsen tandådalen, schaatsen stöten en 35+ varianten | geen data | [DataForSEO 26-09-2026] | Onder de meetgrens. Labs kent "schaatsen salen zweden" wel, dus er wordt soms op gezocht |
| activiteiten sälen / wat te doen in sälen zweden | 10 / 10 | [DataForSEO 26-09-2026] | Klein, SERP vol reisorganisaties |

In de 276 Labs-suggesties rond "sälen" staat **geen enkele schaats- of ijsterm**. Alleen webcam, weer, vliegveld, skipas, verhuur en "sälen icekart" (10) [DataForSEO 26-09-2026].

Let op bij "stöten / stoten" (480): "stoten" is ook een gewoon Nederlands werkwoord en Google Ads telt beide spellingen samen. Het echte volume voor het skigebied is waarschijnlijk lager [aanname].

### 3b. Volledige zoekwoordtabel

Volume = gemiddelde per maand, Nederland, sep 2025 t/m aug 2026. Geen cijferscores; alleen prioriteit.

| Keyword | Volume (bron) | Intent | Thema | Relevantie Novakse | Bestaande pagina | Nieuwe pagina nodig? | Prioriteit |
|---|---|---|---|---|---|---|---|
| schaatsen sälen / salen | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Sälen schaatsen | Zeer hoog, exact het aanbod | /schaatsen-salen.html | Nee | P1 |
| schaatsen vanuit sälen | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Sälen schaatsen | Zeer hoog, staat al in H1 | /schaatsen-salen.html | Nee | P1 |
| natuurijs schaatsen sälen | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Sälen schaatsen | Zeer hoog | /schaatsen-salen.html | Nee | P1 |
| schaatsen sälen boeken / natuurijs schaatsen sälen boeken | geen data [DataForSEO 26-09-2026] | Transactioneel | Boeken | Zeer hoog | /schaatsen-salen.html | Nee | P1 |
| schaatsen sälen prijs / kosten | geen data [DataForSEO 26-09-2026] | Transactioneel | Prijs | Zeer hoog, prijzen staan er al | /schaatsen-salen.html | Nee | P1 |
| schaatsen sälen excursie / dagtocht | geen data [DataForSEO 26-09-2026] | Transactioneel | Excursie | Zeer hoog | /schaatsen-salen.html | Nee | P1 |
| natuurijs sälen | geen data [DataForSEO 26-09-2026] | Informatief | Sälen schaatsen | Hoog | /schaatsen-salen.html | Nee | P1 |
| schaatsen in sälen | geen data [DataForSEO 26-09-2026] | Informatief | Sälen schaatsen | Hoog (let op: het ijs ligt niet in Sälen zelf) | /schaatsen-salen.html | Nee | P2 |
| dagtocht sälen / excursie sälen winter | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Excursie | Hoog | /schaatsen-salen.html | Nee | P2 |
| schaatsen wintersport sälen | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Wintersport + schaatsen | Hoog | /schaatsen-salen.html | Nee | P2 |
| schaatsen vakantie sälen | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Sälen schaatsen | Middel | /schaatsen-salen.html | Nee | P2 |
| schaatsen tandådalen / vanuit tandådalen | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Tandådalen | Hoog qua aanbod, geen vraag | /schaatsen-salen.html | Nee | P2 |
| schaatsen stöten / vanuit stöten | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Stöten | Hoog qua aanbod, geen vraag | /schaatsen-salen.html | Nee | P2 |
| natuurijs tandådalen / natuurijs stöten | geen data [DataForSEO 26-09-2026] | Informatief | Skigebied | Hoog qua aanbod | /schaatsen-salen.html | Nee | P3 |
| schaatsen vakantie tandådalen / stöten | geen data [DataForSEO 26-09-2026] | Commercieel onderzoek | Skigebied | Middel | /schaatsen-salen.html | Nee | P3 |
| schaatsbaan sälen | geen data [DataForSEO 26-09-2026] | Navigatie | Kleine ijsbaan in het dorp | Laag: bedoelt meestal de kleine baan op Sälfjällstorget [externe bron] | /schaatsen-salen.html (hooguit 1 FAQ) | Nee | P3 |
| activiteiten sälen | 10 [DataForSEO 26-09-2026] | Informatief | Activiteiten | Middel | Geen | Nee (hooguit later een blog) | P3 |
| wat te doen in sälen zweden | 10 [DataForSEO 26-09-2026] | Informatief | Activiteiten | Middel | Geen | Nee (hooguit later een blog) | P3 |
| activiteiten sälen winter | geen data [DataForSEO 26-09-2026] | Informatief | Activiteiten | Middel; Google.nl verbetert naar Sölden | Geen | Nee | P3 |
| activiteiten tandådalen / stöten (+ winter) | geen data [DataForSEO 26-09-2026] | Informatief | Activiteiten | Middel | Geen | Nee | P3 |
| lindvallen / högfjället / hundfjället activiteiten | geen data [DataForSEO 26-09-2026] | Informatief | Activiteiten | Middel | Geen | Nee | P3 |
| sälen | 590 [DataForSEO 26-09-2026] | Informatief / navigatie | Plaatsnaam | Laag voor ranken | Geen | Nee | P3 |
| salen | 390 [DataForSEO 26-09-2026] | Navigatie | Plaatsnaam | Laag | Geen | Nee | P3 |
| sälen zweden | 320 [DataForSEO 26-09-2026] | Navigatie | Plaatsnaam | Laag | Geen | Nee | P3 |
| stöten / stoten | 480 (gemengd met werkwoord) [DataForSEO 26-09-2026] | Navigatie | Skigebied | Laag | Geen | Nee | P3 |
| lindvallen | 170 [DataForSEO 26-09-2026] | Navigatie | Skigebied | Laag voor ranken; wel nuttig in tekst als Joey daar echt ophaalt | /schaatsen-salen.html (alleen bij bevestiging) | Nee | P3 |
| hundfjället | 140 [DataForSEO 26-09-2026] | Navigatie | Skigebied | Idem | Idem | Nee | P3 |
| tandådalen | 110 [DataForSEO 26-09-2026] | Navigatie | Skigebied | Laag voor ranken | /schaatsen-salen.html | Nee | P3 |
| högfjället | 30 [DataForSEO 26-09-2026] | Navigatie | Skigebied | Laag | Geen | Nee | P3 |
| wintersport sälen / salen | 10 / 30 [DataForSEO 26-09-2026] | Commercieel onderzoek | Skivakantie | Laag; SERP vol TUI, Sunweb, BBI | Geen | Nee | P3 |
| sälen wintersport tips | geen data [DataForSEO 26-09-2026] | Informatief | Tips | Middel | Geen | Nee | P3 |
| wintersport zweden | 590 [DataForSEO 26-09-2026] | Commercieel onderzoek | Skivakantie | Laag voor ranken, wel de doelgroep | Geen | Nee | P3 |
| wintersport zweden activiteiten | geen data [DataForSEO 26-09-2026] | Informatief | Activiteiten | Middel | Geen | Nee | P3 |
| schaatsen zweden | 170 [DataForSEO 26-09-2026] | Informatief / commercieel | Zweden breed | Hoog | /schaatsreizen-zweden.html | Nee | P1 (bestaand doel) |
| schaatsen in zweden | 170 [DataForSEO 26-09-2026] | Informatief | Zweden breed | Hoog | /schaatsreizen-zweden.html | Nee | P1 (bestaand doel) |
| zweden schaatsen | 140 [DataForSEO 26-09-2026] | Informatief | Zweden breed | Hoog | /schaatsreizen-zweden.html | Nee | P2 |
| schaatsen in zweden 2026 / schaatsen zweden 2026 | 40 / 30 [DataForSEO 26-09-2026] | Informatief | Actualiteit | Middel | /schaatsreizen-zweden.html | Nee | P2 |
| schaatsen in zweden met begeleiding (gemeten als "... met gids") | 40 [DataForSEO 26-09-2026] | Commercieel onderzoek | Begeleiding | Middel, alleen voor Orsa/Falun; nooit op de Sälen-pagina | /schaatsreizen-zweden.html (FAQ bestaat) | Nee | P3 |
| schaatsvakantie zweden | 30 [DataForSEO 26-09-2026] | Commercieel onderzoek | Zweden breed | Hoog | /schaatsreizen-zweden.html, /reizen.html | Nee | P2 |
| schaatsreis zweden | 20 [DataForSEO 26-09-2026] | Commercieel onderzoek | Zweden breed | Hoog; homepage stond op 25 [DataForSEO 08-09-2026] | /schaatsreizen-zweden.html | Nee | P2 |
| natuurijs zweden | 20 [DataForSEO 26-09-2026] | Informatief | Zweden breed | Hoog | /schaatsreizen-zweden.html | Nee | P2 |
| schaatsen zweden natuurijs | 20 [DataForSEO 26-09-2026] | Transactioneel (volgens Labs) | Zweden breed | Hoog | /schaatsreizen-zweden.html | Nee | P2 |
| schaatsen op natuurijs zweden | 10 [DataForSEO 26-09-2026] | Informatief | Zweden breed | Hoog | /schaatsreizen-zweden.html | Nee | P2 |
| natuurijs schaatsen zweden | geen data [DataForSEO 26-09-2026] | Informatief | Zweden breed | Hoog | /schaatsreizen-zweden.html, /blog/schaatsen-zweden.html | Nee | P2 |
| schaatsen dalarna | 10 [DataForSEO 26-09-2026] | Informatief | Regio | Middel | /schaatsreizen-zweden.html | Nee | P3 |
| schaatsen meren zweden / langebaan schaatsen zweden | geen data [DataForSEO 26-09-2026] | Informatief | Zweden breed | Laag tot middel | /blog/schaatsen-zweden.html | Nee | P3 |

---

## 4. Search intent

| Zoeker | Wat hij typt (voorbeelden) | Intent | Wat hij wil zien | Waar Novakse hem opvangt |
|---|---|---|---|---|
| Heeft een skireis naar Sälen geboekt en zoekt iets anders dan skiën | schaatsen sälen, schaatsen vanuit sälen, excursie sälen | Commercieel / transactioneel | Wat is het, wat kost het, wanneer, word ik opgehaald, heb ik schaatsen nodig, kunnen de kinderen mee | /schaatsen-salen.html |
| Is al in Sälen en zoekt vandaag of morgen een activiteit | schaatsen sälen boeken, ice skating Sälen | Transactioneel, mobiel | Prijs en boekknop in het eerste scherm, snelle bevestiging | /schaatsen-salen.html (mobiel eerste scherm) |
| Zoekt "wat te doen in Sälen" | activiteiten sälen, wat te doen in sälen zweden | Informatief | Lijstje activiteiten | Lijsten van TUI Musement, Tripadvisor, verhuurders en bloggers. Novakse komt daar alleen in via vermelding door die sites [analyse] |
| Zoekt een gewone ijsbaan in het dorp | schaatsbaan sälen | Navigatie | Openingstijden kleine baan | Niet het aanbod; hooguit 1 FAQ die het verschil uitlegt |
| Natuurijsliefhebber die Zweden overweegt | schaatsen zweden, natuurijs zweden, schaatsreis zweden | Informatief / commercieel | Overzicht bestemmingen en reizen | /schaatsreizen-zweden.html (moet Sälen noemen) |
| Planner in het najaar | wintersport zweden (piek september) | Commercieel onderzoek | Skireis kiezen | Niet via Google; via reisorganisaties en bloggers [analyse] |

**Conclusie** [analyse]: de Sälen-pagina bedient de transactionele intentie goed, maar pas een paar schermen lager. De oriënterende intentie ("wat kan ik doen in Sälen") wordt vooral op andere sites bediend. Daar moet Novakse genoemd worden, niet zelf ranken.

---

## 5. SERP-analyse

Novakse.com staat in **geen van de 9 gemeten zoekopdrachten** in de top 19-20 [DataForSEO 26-09-2026]. De Sälen-pagina was op de meetdag 1 dag live; indexatie is onbekend omdat Search Console-data niet beschikbaar is [aanname: waarschijnlijk nog niet of pas net geïndexeerd].

### 5a. "schaatsen sälen" (118 resultaten totaal)

| # | Resultaat | Type | Sterk | Zwak | Kans voor Novakse |
|---|---|---|---|---|---|
| 1 | bbi-travel.nl schaatsexcursie | Nederlandse reisorganisatie | Exact onderwerp, prijs zichtbaar, Trip- en Offer-schema, sterk domein | Ongeveer 280 woorden, geen FAQ, geen halve dag, geen kinderregel | Novakse is goedkoper en uitgebreider |
| 2 | tripadvisor.nl, Full Day Ice Skating (Explore Sälen) | Boekingsplatform | Sterren in Google (5,0 uit 1 review) | Alleen Engels, 1 review | Zelf op zo'n platform staan (zakelijke keuze) |
| 3 | facebook.com groep, vraag "waar rond Sälen kun je schaatsen?" | Forum | Bewijst dat Nederlanders dit vragen | Geen antwoord | Deze vraag beantwoorden in de FAQ, zonder plek |
| 4 | wintersportlive.nl Sälen-Transtrand | Wintersportsite | Groot domein | Eén zin over schaatsen | - |
| 5 | natuurijswijzer.nl, natuurijs Zweden | Natuurijsinfo | Autoriteit, noemt Novakse al | Geen Sälen | Vragen of de dagtocht erbij mag |
| 6-9 | scandinaviandreams.nl, wintersport.nl, visitsweden.nl, skiresort.nl | Reis/portaal/toerisme | Sterke domeinen | Geen woord over schaatsen bij Sälen | Partnerkans (Scandinavian Dreams) |

Bron: [DataForSEO 26-09-2026], inhoud via [externe bron].

### 5b. "schaatsen vanuit sälen"

Plek 1-4 gelijk aan hierboven (BBI, Tripadvisor, wintersportlive, Facebook). Plek 5-19: skiresort, scandinaviandreams, sunweb, salengodset, stralendzweden, YouTube, voigt-travel, snowplaza, natuurijswijzer en andere, **allemaal over skiën**. Dit is de beste term om op te mikken: de title van Novakse bevat letterlijk "vanuit Sälen" [DataForSEO 26-09-2026], [analyse].

### 5c. "natuurijs sälen"

Google leest dit als "natuurijs" in het algemeen. Plek 1-4: natuurijswijzer, schaatsen.nl, knsb.nl, visitsweden.nl. Sälen-specifiek pas op 10 (Tripadvisor), 13 en 15. Een YouTube-video uit 2021 over schaatsen in Dalarna staat op 7 [DataForSEO 26-09-2026].

### 5d. "schaatsen tandådalen" en "schaatsen stöten"

| Zoekterm | Wat Google toont | Enige schaatsresultaat | Kan Novakse hierop inspelen? |
|---|---|---|---|
| schaatsen tandådalen | Plek 1-9 over pistes, liften, accommodatie (skiresort, snowplaza, skistar, gezinopreis). Google leest het als "Tandådalen" | Tripadvisor (Explore Sälen) op 11 | Beperkt: de ene Sälen-pagina noemt Tandådalen al in title/H1. Geen aparte pagina |
| schaatsen stöten | BBI-schaatsexcursie op 1; daarna skigebied, reisorganisaties en veel gezinsblogs | BBI op 1 | Ja, via de gezinshoek: kinderprijzen passen bij deze gezinnen. Beter via die gezinsblogs dan via een eigen pagina [analyse] |

### 5e. "natuurijs schaatsen zweden"

Plek 1 ecktiv.nl (kort artikel 2022, sterk domein), 2 een Nederlandse aanbieder van tochten (niet op merknaam richten), 3 thenewjourney.nl, 4 lapland.nl (vraag-koppen als H2), 5 visitsweden.nl, 6-19 mix van platforms, verenigingen en blogs [DataForSEO 26-09-2026]. Deze term hoort bij `/schaatsreizen-zweden.html`, niet bij de Sälen-pagina.

### 5f. "activiteiten sälen winter", "activiteiten sälen", "wintersport sälen"

- **"activiteiten sälen winter"**: Google.nl zegt "Bedoelde je: activiteiten sölden winter" en toont op 1-9 Sölden in Oostenrijk. Sälen pas vanaf 10 (scandinaviandreams, paulinproperties.se, Tripadvisor, stralendzweden, musement, salengodset) [DataForSEO 26-09-2026]. **Geen van die Sälen-lijsten noemt schaatsen** [externe bron].
- **"activiteiten sälen"**: TUI Musement 1, BBI weekprogramma 2, Tripadvisor 3, Visit Dalarna 4, Voigt 5. BBI's excursielijst zet de schaatsexcursie **bovenaan**, vóór sneeuwscooter en husky [externe bron].
- **"wintersport sälen"**: alleen TUI, Scandinavian Dreams, BBI, wintersport.nl, skiresort, Buro Scanbrit, Sunweb, Snowplaza [DataForSEO 26-09-2026].

**Les** [analyse]: schrijf altijd "Sälen, Zweden" (niet alleen "Sälen") in title en tekst, zodat Google niet aan Sölden denkt.

### 5g. SERP-features en of Novakse hierop kan inspelen

| Feature | Waar gezien [DataForSEO 26-09-2026] | Kan Novakse hierop inspelen? [analyse] |
|---|---|---|
| AI-overzicht | Bij alle 9 zoektermen, meestal op positie 1. Inhoud niet gemeten | Deels. Korte, feitelijke zinnen (prijs, duur, wat inbegrepen, periode) en schema helpen. Geen garantie |
| People Also Ask | Bij 6 van de 9; vragen gaan vooral over skiën en sneeuw | Beperkt: alleen "Wat kun je doen in Sälen?" en "Waar kan ik schaatsen in Zweden?" passen |
| Sterren | Tripadvisor (bij Sälen-termen), wintersport.nl, Snowplaza | Alleen met echte reviews over deze dagtocht op een platform of met correct schema. Nu niet mogelijk |
| YouTube-video als resultaat | Bij 8 van de 9 | Ja: er bestaat geen enkele video over schaatsen vanuit Sälen [WebSearch]. Kleine eigen video is een realistische kans |
| Kaartpakket, afbeeldingen, featured snippet, sitelinks | Niet gezien | Nee |

---

## 6. Concurrenten

| Concurrent | Aanbod | Waarom rankt of verkoopt hij? | Wat mist hij? | Bron |
|---|---|---|---|---|
| BBI Travel (NL reisorganisatie, vliegt op Sälen) | Hele dag schaatsen vanuit Sälen/Stöten, vanaf € 296 p.p., ophalen 09:00, dinsdag en woensdag, minimaal 2 personen, transfer, schaatsen, lunch, fika inbegrepen; € 25 administratiekosten bij losse excursie | Sterk reisdomein met veel Sälen-pagina's, eigen excursielijst linkt ernaar, JSON-LD met `Trip`, `Offer`, `BreadcrumbList` | Dunne tekst, geen FAQ, geen halve dag, geen kinderprijs, maar 2 dagen per week | [externe bron], [DataForSEO 26-09-2026] |
| Explore Sälen (Zweeds bedrijf, eigen site en via Tripadvisor, GetYourGuide, Trip.com) | Hele dag schaatsen, ophalen in 5 Sälen-gebieden, 10:00 tot ongeveer 17:00, 12-90 jaar, max 16 personen, materiaal, lunch en fika | Tripadvisor-autoriteit en sterren; exact onderwerp | Alleen Engels/Zweeds, 1 review, geen halve dag, geen kinderen onder 12 | [externe bron: Tripadvisor], [WebSearch] |
| Sälfjällstorget (Lindvallen) | Kleine gratis ijsbaan op het plein met leenschaatsen; was bij bezoek gesloten door het weer | Lokale naam | Geen natuurijs, geen dagtocht | [externe bron] |
| Mountain Lodge Stöten | Ijsbaan bij het hotel, huurschaatsen bij een skiwinkel | Eigen gasten | Eén zin, geen natuurijs | [externe bron] |
| Wintersportportals (wintersport.nl, skiresort.nl, snowplaza.nl, wintersportlive.nl) | Skigebied-informatie | Zeer sterke domeinen, sterren | Niets of één zin over schaatsen | [DataForSEO 26-09-2026] |
| Skireisorganisaties (TUI, Sunweb, Voigt, Scandinavian Dreams, Buro Scanbrit) | Skivakanties Sälen | Grote domeinen | Geen schaatsen, hooguit ijskarten | [externe bron], [WebSearch] |
| Gezinsblogs en NL-verhuurders (kidsindebergen.nl, gezinopreis.nl, stralendzweden.nl, paulinproperties.se, salengodset.se) | Activiteiten in Sälen | Persoonlijk, vers (2025-2026), soms FAQ-schema | Geen schaatsen | [externe bron] |
| Natuurijswijzer, Visit Sweden, Visit Dalarna | Informatie natuurijs Zweden/Dalarna | Autoriteit | Sälen niet genoemd | [externe bron] |

### Prijsvergelijking

| | Novakse | Explore Sälen | BBI Travel |
|---|---|---|---|
| Halve dag | Ja, € 125-155 p.p. | Niet gezien | Niet gezien |
| Hele dag | € 155-199 p.p. | 2995 SEK (volgens zoekresultaat) / $310-318 via platforms | Vanaf € 296 |
| Vervoer | + € 40 per volwassene, optioneel | Inbegrepen | Inbegrepen |
| Schaatsen | Eigen of huren + € 15 | Inbegrepen | Inbegrepen |
| Kinderen | 4-12 jaar € 49 / € 75, 0-3 gratis | Vanaf 12 jaar | "Zolang je kan schaatsen" |
| Voorbeeld 1 volwassene, hele dag, vervoer en huur | € 254 [analyse] | ongeveer € 260-275 [aanname: koers] | € 296 (+ € 25 bij losse boeking) |

**De "concurrent van ongeveer € 265 per dag"** [onzeker]: rapport D noemt dit "vrijwel zeker Explore Sälen" (2995 SEK is ongeveer € 260-275, afhankelijk van de koers) [WebSearch], [aanname]. Rapport C kon dit niet bevestigen; de eigen site van Explore Sälen was niet te openen en de Tripadvisor-prijs was niet zichtbaar. **Waarschijnlijk, maar niet bewezen.** Wel vast staat BBI: vanaf € 296 [externe bron]. Of BBI het product van Explore Sälen doorverkoopt, is niet bekend; de beschrijvingen lijken op elkaar [aanname].

**Sterkste verschillen om uit te dragen** [analyse]: halve dag naast de piste, gezinnen met kinderen onder 12, eigen schaatsen mag, Nederlandstalig, groepskorting, lagere instapprijs, direct online betalen. Niet: begeleiding als verkoopargument (dat gebruikt de concurrent, Novakse niet).

---

## 7. Content gaps

### 7a. Onderwerp per onderwerp

| Onderwerp | Novakse | Concurrenten | Prioriteit |
|---|---|---|---|
| Praktisch: duur, rijtijd, periode | Goed: halve/hele dag, ongeveer 1 uur 10 rijden, 10 jan t/m 20 feb 2027, 12 km baan [website] | BBI: 09:00, di/wo. Explore Sälen: 10-17 uur [externe bron] | P2: tijden toevoegen als Joey ze geeft |
| Prijs | Sterk en volledig [website] | BBI "vanaf € 296"; Tripadvisor verborgen | Al voordeel. Wel in eerste scherm zetten (P1) |
| Kinderen | Prijzen 4-12 en 0-3 [website] | BBI geen kinderregel; Explore Sälen vanaf 12 | P1: FAQ "Kunnen kinderen mee?" met leeftijd op het ijs (Joey) |
| Beginners / niveau | Niets [website] | BBI: "zolang je kan schaatsen" | P1 (Joey) |
| Weer, slecht ijs, annuleren | Niets [website] | Tripadvisor: omboeken of geld terug | P1 (Joey, eerst regels) |
| Ophaalplekken | Sälen, Tandådalen, Stöten [website] | Tripadvisor noemt 5 gebieden bij naam | P1 als Joey ook elders ophaalt (Lindvallen 170, Hundfjället 140 zoekopdrachten) |
| Materiaal / wat inbegrepen | Huur kluunschaatsen € 15, eigen schaatsen mag, ijsprikkers [website] | BBI/Explore Sälen: materiaal inbegrepen | P2: helder wat wel en niet inbegrepen is |
| Kleding / meenemen | Niets [website] | BBI: "zelf meenemen"-lijst | P2: korte regel + link naar blog kledingadvies |
| Combineren met skivakantie | Kort ("van de piste naar het ijs") [website] | Niemand | P2: één alinea |
| Groepsgrootte | Niets zichtbaar [website] | Explore Sälen max 16, BBI min 2 | P2 (Joey) |
| FAQ | 2 vragen [website] | BBI geen; verhuurders met FAQ-schema | P1: naar 8-10 vragen met Joey's antwoorden |
| Reviews | Geen [website] | Tripadvisor 5,0 (1) | P2: na het seizoen verzamelen |
| Video | Geen | Geen enkele Sälen-schaatsvideo [WebSearch] | P3 |
| Plek van het ijs | Bewust niet [website] | BBI noemt het meer bij naam | Geen gat: bewuste keuze |
| Sälen op eigen site | Alleen op /reizen.html [website] | BBI linkt vanuit excursielijst | P1: Zweden-pagina, homepage, blogs |

### 7b. Onderwerpen waar Novakse kansen laat liggen

**Eerlijk: er zijn geen 20 echte onderwerpen.** Ik vond er 15 die door de data gedragen worden. De meeste zijn geen eigen pagina, maar een sectie of FAQ op de ene Sälen-pagina. Opvullen tot 20 zou verzonnen zijn.

| # | Onderwerp | Intent | Concurrent die het wel heeft | Waarom relevant | Aanbevolen pagina | Interne link | Prioriteit |
|---|---|---|---|---|---|---|---|
| 1 | Wat als het ijs of weer niet goed is | Commercieel | Explore Sälen via Tripadvisor | Grootste afhaakreden bij een dure dagactiviteit [analyse] | /schaatsen-salen.html (FAQ) | naar /blog/wat-als-het-ijs-niet-goed-is.html alleen als die tekst op de dagtocht past | P1 (Joey) |
| 2 | Annuleren of verzetten | Transactioneel | Tripadvisor-platformregels | Voorwaarden passen nu niet [website] | /schaatsen-salen.html + voorwaarden | naar /algemene-voorwaarden.html | P1 (Joey) |
| 3 | Kan ik mee als beginner? | Commercieel | BBI | Skiërs zijn vaak geen natuurijsschaatsers [aanname] | /schaatsen-salen.html (FAQ) | naar /blog/eerste-schaatsreis-beginner.html | P1 (Joey) |
| 4 | Kinderen: vanaf welke leeftijd op het ijs, kinderschaatsen | Commercieel | Explore Sälen (vanaf 12) | Stöten-SERP zit vol gezinsblogs [DataForSEO 26-09-2026] | /schaatsen-salen.html (FAQ) | - | P1 (Joey) |
| 5 | Ophalen in welk skigebied | Transactioneel | Explore Sälen (5 gebieden) | Mensen zoeken op hun eigen gebied | /schaatsen-salen.html (sectie vervoer) | - | P1 (Joey) |
| 6 | Sälen en wellness op de Zweden-pagina | Commercieel | - (sitegat) | Hub mist 2 van 5 Zweedse producten [website] | /schaatsreizen-zweden.html | naar /schaatsen-salen.html | P1 |
| 7 | Tijden van de dag | Transactioneel | BBI, Explore Sälen | Nodig om een skidag te plannen | /schaatsen-salen.html | - | P2 (Joey) |
| 8 | Wat is inbegrepen en wat niet | Transactioneel | BBI, Explore Sälen | Vergelijken met BBI | /schaatsen-salen.html | - | P2 |
| 9 | Kleding en meenemen | Informatief | BBI | Skikleding is niet altijd schaatskleding [aanname] | /schaatsen-salen.html (1 regel) | naar /blog/kledingadvies-natuurijs.html | P2 |
| 10 | Schaatsen huren als je geen schaatsen bij je hebt | Transactioneel | - | Skiërs nemen geen schaatsen mee [aanname] | /schaatsen-salen.html | naar /blog/langlaufschaatsen-versus-noren.html | P2 |
| 11 | Halve dag naast de skivakantie | Commercieel | Niemand | Uniek aanbod | /schaatsen-salen.html | - | P2 |
| 12 | Groepsgrootte, alleen of met andere boekers | Commercieel | Explore Sälen, BBI | Eenmansbedrijf: capaciteit per dag onbekend | /schaatsen-salen.html | - | P2 (Joey) |
| 13 | Helm ja of nee | Informatief | - | Tegenstrijdig met reisinformatie [website] | /schaatsen-salen.html + /reisinformatie.html | - | P2 (Joey) |
| 14 | Verschil kleine ijsbaan in het dorp en een natuurijsdag | Navigatie | - | "schaatsbaan sälen" en Facebook-vraag | /schaatsen-salen.html (1 FAQ) | - | P3 |
| 15 | Hoe ziet de dag eruit, in beeld | Informatief | Niemand (geen video) | YouTube in 8 van 9 SERP's | Video op /schaatsen-salen.html | - | P3 |

---

## 8. Keyword cannibalization

**Sälen zelf heeft geen kannibalisatie**: geen andere pagina mikt op Sälen [website]. Het probleem is het omgekeerde: te weinig op de site ondersteunt de Sälen-pagina. De kannibalisatie zit in het Zweden-cluster, waar de Sälen-pagina onder hangt. Canonical is nergens het juiste middel, want geen van deze pagina's is een duplicaat [analyse].

| # | Pagina's | Gedeelde intentie | Wat er nu staat | Advies | Reden |
|---|---|---|---|---|---|
| 1 | /, /reizen.html, /schaatsreizen-zweden.html | schaatsreis(en) Zweden | Titles homepage en reizen noemen allebei "Zweden, Finland en Oostenrijk"; homepage stond op 25 voor "schaatsreis zweden", de hub nergens [DataForSEO 08-09-2026]; hub niet in menu [website] | **Differentiëren** + hub in menu of prominent op homepage | Drie verschillende functies: merk, overzicht, land. Samenvoegen zou er één wegnemen |
| 2 | /schaatsreizen-zweden.html en /blog/schaatsen-zweden.html | natuurijs Zweden | Blog krijgt 11 interne bronnen, hub maar 4 [website] | **Differentiëren**: blog naar de ervaringshoek ("Hoe is een schaatsdag op natuurijs in Zweden?"); link naar hub hoger in het blog | De pagina die moet ranken krijgt nu minder links dan het blog |
| 3 | /schaatsreizen-zweden.html en /wellness.html | schaatsen in Zweden | Lokale (nog niet live) wellness-title begint met "Wellness & schaatsen in Zweden" [website] | **Differentiëren**: title laten beginnen met "Wellnessreis Zweden" | Anders twee pagina's op "schaatsen in Zweden" |
| 4 | /orsa.html, /blog/schaatsen-orsa.html, /blog/orsa-versus-falun.html | schaatsreis Orsa | Blog en reispagina beginnen allebei met "Schaatsreis (naar) Orsa"; blogs 417 en 356 woorden [website] | **Differentiëren** (blog = "Orsa als schaatsbestemming"). Samenvoegen met 301 pas overwegen als Search Console na 2-3 maanden geen vertoningen voor de korte blogs laat zien | Zonder Search Console-data geen reden om nu URL's weg te halen |
| 5 | /falun.html en /blog/schaatsen-falun.html | schaatsen Falun | Het **blog** stond op 18 voor "schaatsen falun", niet de reispagina [DataForSEO 08-09-2026] | **Differentiëren**, zoals 4 | Reispagina moet de koopintentie houden |
| 6 | /lulea.html en /blog/schaatsen-lulea.html | schaatsen Luleå | Reispagina op 21 [DataForSEO 08-09-2026]; blog langer (1.542 tegen 1.069 woorden) [website] | **Differentiëren** (blog = "Luleå als schaatsbestemming") | Voorkomen dat Google het langere blog kiest |
| 7 | /weissensee.html en /blog/schaatsen-weissensee.html | schaatsen Weissensee (1.300/mnd) | Titles en H1's beginnen allebei met "Schaatsen op de Weissensee" [website] | **Differentiëren**: reispagina "Schaatsreis Weissensee" (stond daar op 10), pillar houdt "schaatsen op de Weissensee" | Buiten Sälen, maar het zoekwoord met het meeste volume op de site |
| 8 | /schaatsen-salen.html | schaatsen Sälen | Geen overlap | **Geen actie** | - |

---

## 9. Contentcluster

### 9a. Topic map

```
/schaatsreizen-zweden.html  (hub: schaatsen in Zweden)
├── /orsa.html          (reis)  ← blog/schaatsen-orsa, blog/orsa-versus-falun
├── /falun.html         (reis)  ← blog/schaatsen-falun, blog/orsa-versus-falun
├── /lulea.html         (reis)  ← blog/schaatsen-lulea
├── /wellness.html      (reis, zonder plaatsnamen; niet naar Sälen linken)
└── /schaatsen-salen.html  (dagtocht vanuit Sälen, Stöten, Tandådalen)
        ├── uit → blog/kledingadvies-natuurijs      (wat trek je aan)
        ├── uit → blog/langlaufschaatsen-versus-noren (kluunschaatsen, noren, eigen schaatsen)
        ├── uit → blog/veiligheid-natuurijs          (algemene veiligheid, geen belofte)
        ├── uit → blog/eerste-schaatsreis-beginner   (alleen als Joey's niveau-antwoord past)
        └── in  ← /, /reizen.html, hub, blog/schaatsen-zweden, orsa, falun,
                  blog/beste-periode, blog/langlaufschaatsen-versus-noren,
                  blog/schaatsen-meenemen-vliegtuig
/blog/schaatsen-zweden.html  (ervaring: hoe is een schaatsdag in Zweden) → hub
/reisinformatie.html  (meerdaagse reizen; moet zeggen wat niet voor de dagtocht geldt)
```

Verbetering ten opzichte van een los "Sälen-cluster" [analyse]: Sälen is geen eigen cluster met satellietpagina's, maar één productpagina binnen het bestaande Zweden-cluster. De ondersteunende inhoud bestaat al als blogs; die hoeven alleen verbonden te worden.

### 9b. Clustertabel

| Pagina | URL | Primair keyword | Secundaire keywords | Intent | Link naar |
|---|---|---|---|---|---|
| Schaatsen in Zweden (hub) | /schaatsreizen-zweden.html | schaatsen in zweden | schaatsen zweden, natuurijs zweden, schaatsreis zweden, schaatsvakantie zweden | Commercieel onderzoek | Orsa, Falun, Luleå, wellness, Sälen, Finland, Weissensee |
| Dagtocht vanuit Sälen | /schaatsen-salen.html | schaatsen vanuit sälen | schaatsen sälen, natuurijs sälen, schaatsen tandådalen, schaatsen stöten, dagtocht sälen, excursie sälen | Transactioneel | hub, reizen, kledingadvies, noren-blog, veiligheid, voorwaarden |
| Orsa | /orsa.html | schaatsreis orsa | schaatsen orsameer, dalarna | Transactioneel | hub, Falun, Sälen |
| Falun | /falun.html | schaatsreis falun | runn schaatsen, pakketreis | Transactioneel | hub, Orsa, Sälen |
| Luleå | /lulea.html | schaatsreis luleå | lulea schaatsen | Transactioneel | hub |
| Wellness | /wellness.html | wellnessreis zweden | wellness en schaatsen | Transactioneel | hub (geen plaatsnamen) |
| Schaatsdag in Zweden (blog) | /blog/schaatsen-zweden.html | hoe is schaatsen op natuurijs in zweden | natuurijs zweden ervaring | Informatief | hub, Sälen, Orsa, Falun |
| Beste periode (blog) | /blog/beste-periode-schaatsen-scandinavie.html | beste periode schaatsen scandinavië | wanneer schaatsen zweden | Informatief | hub, Sälen |
| Langlauf vs noren (blog) | /blog/langlaufschaatsen-versus-noren.html | langlaufschaatsen of noren | kluunschaatsen | Informatief | Sälen (huur) |
| Kledingadvies (blog) | /blog/kledingadvies-natuurijs.html | kleding schaatsen natuurijs | - | Informatief | - |
| Veiligheid (blog) | /blog/veiligheid-natuurijs.html | veiligheid natuurijs | - | Informatief | hub |

### 9c. Beoordeling van de 9 voorgestelde pagina's

| Voorgestelde pagina | Besluit | Reden |
|---|---|---|
| Schaatsen Sälen | **Niet nieuw maken; bestaande /schaatsen-salen.html versterken** | Bestaat al en noemt de drie plaatsen in title en H1. Een tweede pagina zou met zichzelf concurreren |
| Tandådalen | **Niet maken** | Geen meetbare vraag; SERP gaat over skiën; zelfde aanbod, prijs, rijtijd en seizoen. Pagina met alleen een andere plaatsnaam = doorway page, risico voor de hele site [DataForSEO 26-09-2026], [analyse] |
| Stöten | **Niet maken** | Idem. De enige echte verschillen (ophaalpunt, route) mogen niet op de site of zijn onbekend |
| Natuurijs schaatsen Zweden | **Samenvoegen in bestaande pagina** | Bestaat als /schaatsreizen-zweden.html (en het ervaringsblog). Wel Sälen-blok toevoegen |
| Schaatsen tijdens wintersport Sälen | **Samenvoegen in /schaatsen-salen.html** | Dezelfde intentie en doelgroep. Eén alinea "naast je skivakantie". Later hooguit een ervaringsblog (zie 9d, voorwaardelijk) |
| Veilig schaatsen op natuurijs | **Niet maken; bestaat al** | /blog/veiligheid-natuurijs.html bestaat. Linken vanaf Sälen zonder veiligheidsbelofte |
| Schaatsen huren | **Samenvoegen in /schaatsen-salen.html** | Huur (€ 15, kluunschaatsen) is een onderdeel van de dagtocht, geen los product. Geen volume gemeten voor een Sälen-variant |
| Dagtocht schaatsen | **Samenvoegen in /schaatsen-salen.html** | Is precies deze pagina; "dagtocht" hoort in title en H1 |
| Schaatsen met kinderen | **Samenvoegen in /schaatsen-salen.html** | Kinderprijzen staan er al; de ontbrekende antwoorden (leeftijd op het ijs, kinderschaatsen) heeft alleen Joey. Bereik gezinnen beter via gezinsblogs (hoofdstuk 14) |

### 9d. Content briefs

Er worden drie briefs gegeven: twee voor bestaande pagina's (de enige die echt werk nodig hebben) en één voorwaardelijke voor later.

#### Brief 1: herziening /schaatsen-salen.html (P1)

| Veld | Inhoud |
|---|---|
| URL | /schaatsen-salen.html (niet wijzigen) |
| Primair keyword | schaatsen vanuit sälen |
| Secundaire keywords | schaatsen sälen, natuurijs sälen, dagtocht sälen, schaatsen tandådalen, schaatsen stöten, schaatsen huren sälen, excursie sälen |
| Zoekintentie | Transactioneel / commercieel onderzoek |
| Doelgroep | Nederlanders (en Vlamingen [aanname]) met een geboekte skivakantie in Sälen, Stöten of Tandådalen; stellen en gezinnen met kinderen 4-12 |
| Gewenste actie | Direct boeken en betalen; tweede keus: bellen of appen met Joey |
| Title | Dagtocht schaatsen op natuurijs vanuit Sälen, Zweden \| Novakse (62) |
| Meta description | Wintersport in Sälen, Stöten of Tandådalen? Schaats een halve of hele dag op 12 km geveegd natuurijs, met fika bij het kampvuur. Direct online te boeken. (153) |
| H1 | Schaatsdagtocht op natuurijs vanuit Sälen, Stöten en Tandådalen |
| Direct onder de hero (geen kop, feitenstrook) | Halve dag (ca. 3 uur op het ijs) of hele dag (ca. 5 uur op het ijs) · vanaf € ... p.p. (keuze Joey: € 125 of € 155) · kinderen 4 t/m 12 vanaf € 49, t/m 3 gratis · schaatsen huren € 15 · ophalen € 40 per volwassene · te boeken van 10 januari t/m 20 februari 2027 |
| H2/H3-structuur | H2 Van de piste naar het ijs (nu alleen voor schermlezers; zichtbaar maken mag) · H2 Een onvergetelijke dag buiten de piste · H2 Pakketten en prijzen (H3 Halve dag, H3 Hele dag) · H2 Ophalen in Sälen, Tandådalen of Stöten en schaatsen huren (hernoemt "Extra's"; H3 Vervoer, H3 Schaatsverhuur) · H2 Goed om te weten voor je boekt (alleen met Joey's antwoorden: niveau, kinderen, kleding, weer en ijs, annuleren) · H2 Veelgestelde vragen over de dagtocht · H2 Boek je dagtocht · kort blok "Meer schaatsen in Zweden" |
| FAQ | Zie 9f. Uitbreiden van 2 naar 8-10 vragen, alleen met antwoorden van Joey |
| Interne links IN | /, /reizen.html (bestaat), /schaatsreizen-zweden.html, /blog/schaatsen-zweden.html, /orsa.html, /falun.html, /blog/beste-periode-schaatsen-scandinavie.html, /blog/langlaufschaatsen-versus-noren.html, /blog/schaatsen-meenemen-vliegtuig.html (zie hoofdstuk 10) |
| Interne links UIT | /schaatsreizen-zweden.html, /reizen.html, /blog/kledingadvies-natuurijs.html, /blog/langlaufschaatsen-versus-noren.html, /blog/veiligheid-natuurijs.html, /algemene-voorwaarden.html (bestaat) |
| Externe bronnen | Hooguit Visit Dalarna Sälen-pagina (https://www.visitdalarna.se/en/salen) als officiële bron over het skigebied [externe bron]. Geen veiligheidssites op deze pagina: de Zweedse bronnen adviseren uitrusting die Novakse hier niet noemt |
| Afbeeldingen | Bestaande 4 foto's houden. Na het seizoen aanvullen (hoofdstuk 9k). Foto van Joey (alleen Joey) bij de contactregel |
| Schema | TouristTrip + AggregateOffer + BreadcrumbList + FAQPage (hoofdstuk 12) |
| CTA | Hero: "Boek je dagtocht" naar #boeken, of "Bekijk pakketten en prijzen" naar #pakketten (tekst en doel gelijk). Vaste boekknop zichtbaar op mobiel. Bij het formulier: "Vragen over de dagtocht? Bel of app Joey: +31 6 17467643" |

#### Brief 2: Sälen- en wellnessblok op /schaatsreizen-zweden.html (P1)

| Veld | Inhoud |
|---|---|
| URL | /schaatsreizen-zweden.html (bestaand) |
| Primair keyword | schaatsen in zweden (ongewijzigd) |
| Secundaire keywords | schaatsen zweden, natuurijs zweden, schaatsreis zweden, dagtocht vanuit sälen |
| Zoekintentie | Commercieel onderzoek |
| Doelgroep | Iedereen die Zweden overweegt, inclusief skiërs die al naar Sälen gaan |
| Gewenste actie | Doorklikken naar de passende reis |
| Title | Ongewijzigd: "Schaatsen in Zweden - schaatsreizen op natuurijs \| Novakse" (58) |
| Meta description | Eerst: "Schaatsen in Zweden op natuurijs: schaatsreizen naar Orsa en Falun in Dalarna en naar Luleå in Zweeds Lapland. Bij Orsa en Falun is begeleiding bij te boeken." (158). Pas als het blok live staat: "Schaatsen in Zweden op natuurijs: schaatsreizen naar Orsa en Falun in Dalarna, Luleå in Zweeds Lapland, een wellnessreis en een dagtocht vanuit Sälen." (150) |
| H1 | Ongewijzigd: "Schaatsen in Zweden" |
| H2/H3 | Nieuw H2 of kaart naast Orsa/Falun/Luleå, bijvoorbeeld "Op wintersport in Sälen? Een dagtocht op natuurijs" en "Wellness en schaatsen" (zonder plaatsnamen bij wellness). Bestaande sectie "Liever een andere bestemming?" linkt ook naar /finland.html en /weissensee.html |
| FAQ | Geen nieuwe; bestaande FAQ over begeleiding blijft hier (niet op de Sälen-pagina) |
| Interne links IN | Menu (voorstel, Joey beslist), homepage, blogs Orsa/Falun/Luleå, blog schaatsen-zweden |
| Interne links UIT | /schaatsen-salen.html, /wellness.html, /finland.html, /weissensee.html |
| Externe bronnen | Visit Sweden, schaatsen in Zweden (https://visitsweden.com/what-to-do/nature-outdoors/winter-activities/ice-skating-sweden/) [externe bron] |
| Afbeeldingen | Sälen-hero (geveegde-baan-schaatsers) als kaartbeeld; niet dezelfde foto als bij wellness |
| Schema | BreadcrumbList en FAQPage bestaan; geen wijziging nodig |
| CTA | "Bekijk de dagtocht vanuit Sälen" |

#### Brief 3 (voorwaardelijk, P3): ervaringsblog na het seizoen

Alleen maken als Joey na seizoen 2027 echte eigen ervaring, foto's (helder weer) en eventueel reacties van deelnemers heeft. Niet eerder: zonder eigen inhoud is het een dunne kopie van de productpagina [analyse].

| Veld | Inhoud |
|---|---|
| URL | /blog/schaatsen-naast-skivakantie-salen.html |
| Primair keyword | schaatsen wintersport sälen (geen data) |
| Secundaire keywords | wat te doen in sälen zweden (10), activiteiten sälen (10), halve dag schaatsen |
| Zoekintentie | Informatief met koopstap |
| Doelgroep | Skiërs die een rustdag of halve dag zoeken |
| Gewenste actie | Doorklikken naar /schaatsen-salen.html |
| Title | Halve dag schaatsen naast je skivakantie in Sälen \| Novakse (59) |
| Meta description | Pas schrijven met de echte ervaring van het seizoen |
| H1 | Schaatsen naast je skivakantie in Sälen: zo gaat een dag op natuurijs |
| H2/H3 | Hoe de dag verliep (eigen verhaal) · Halve of hele dag · Wat skiërs meenamen en wat ze huurden · Met kinderen op het ijs (alleen met Joey's regels) |
| FAQ | Geen; FAQ staat op de productpagina (geen dubbele set) |
| Interne links IN | /schaatsen-salen.html, /blog.html, /blog/schaatsen-zweden.html |
| Interne links UIT | /schaatsen-salen.html, /blog/kledingadvies-natuurijs.html |
| Externe bronnen | Visit Dalarna Sälen-pagina |
| Afbeeldingen | Nieuwe seizoensfoto's zonder herkenbare plek |
| Schema | BlogPosting + BreadcrumbList (zoals de andere blogs) |
| CTA | "Bekijk de dagtocht vanuit Sälen" |

### 9e. Vragen die mensen stellen (PAA en verwant)

Belangrijk: Google gaf **geen** PAA-vragen specifiek over schaatsen bij Sälen; de PAA-vakken gaan over skiën en sneeuw [DataForSEO 26-09-2026]. Daarom staat bij elke vraag de bron. Vragen met "(Joey)" kan Novakse betrouwbaar beantwoorden, maar alleen Joey kent het antwoord.

| # | Vraag | Bron | Zoekintentie | Pagina | FAQ of contentsectie |
|---|---|---|---|---|---|
| 1 | Waar in de omgeving van Sälen kun je schaatsen? | Facebook-vraag in SERP [DataForSEO 26-09-2026] | Informatief | /schaatsen-salen.html | FAQ, zonder plek of route |
| 2 | Waar kan ik schaatsen in Zweden? | PAA [DataForSEO 26-09-2026] | Informatief | /schaatsreizen-zweden.html | Contentsectie |
| 3 | Wat kun je doen in Sälen, Zweden? | PAA [DataForSEO 26-09-2026] | Informatief | /schaatsen-salen.html (kort) | Contentsectie (intro) |
| 4 | Welke skigebieden zijn er in Sälen? | PAA [DataForSEO 26-09-2026] | Informatief | /schaatsen-salen.html | Alleen de ophaalgebieden noemen |
| 5 | Wat zijn leuke activiteiten tijdens de wintersport? | PAA (Sölden-SERP) [DataForSEO 26-09-2026] | Informatief | /schaatsen-salen.html | Intro |
| 6 | Kun je in Zweden begeleid schaatsen? | PAA ("met gids") [DataForSEO 26-09-2026] | Commercieel | /schaatsreizen-zweden.html | Bestaande FAQ (Orsa/Falun). Niet op de Sälen-pagina |
| 7 | Kun je in Sälen schaatsen huren? | [externe bron: salfjallstorget.se] | Informatief | /schaatsen-salen.html | FAQ (huur € 15) |
| 8 | Is er een schaatsbaan in Sälen? | [externe bron], "schaatsbaan sälen" [DataForSEO 26-09-2026] | Navigatie | /schaatsen-salen.html | FAQ, kort; geen openingstijden van anderen |
| 9 | Hoe ver is het natuurijs vanaf Sälen? | [analyse] | Commercieel | /schaatsen-salen.html | Staat er al (ongeveer 1 uur 10) |
| 10 | Kunnen kinderen mee? | [analyse], gezinsblogs in Stöten-SERP | Commercieel | /schaatsen-salen.html | FAQ (Joey: leeftijd op het ijs) |
| 11 | Moet ik goed kunnen schaatsen? | [externe bron: BBI] | Commercieel | /schaatsen-salen.html | FAQ (Joey) |
| 12 | Wat kost schaatsen vanuit Sälen? | [analyse], BBI € 296 [externe bron] | Transactioneel | /schaatsen-salen.html | Prijstabel (bestaat) |
| 13 | Wat is er inbegrepen? | [externe bron: BBI, Tripadvisor] | Transactioneel | /schaatsen-salen.html | Contentsectie (bestaat, verduidelijken) |
| 14 | Word ik opgehaald, en waar? | [externe bron: Tripadvisor] | Transactioneel | /schaatsen-salen.html | FAQ (Joey voor extra gebieden) |
| 15 | Wat gebeurt er als het ijs of weer niet goed is? | [externe bron: Tripadvisor] | Commercieel | /schaatsen-salen.html | FAQ (Joey, eerst regels) |
| 16 | Kan ik annuleren of mijn datum verzetten? | [analyse] | Transactioneel | /schaatsen-salen.html | FAQ (Joey) |
| 17 | In welke periode kan ik boeken? | [analyse] | Informatief | /schaatsen-salen.html | Staat er al; geen ijsgarantie geven |
| 18 | Is het natuurijs veilig? | [analyse], bestaande FAQ [website] | Informatief | /schaatsen-salen.html | Bestaande FAQ, voorzichtig, link naar veiligheidsblog |
| 19 | Wat trek ik aan? | [externe bron: BBI] | Informatief | /blog/kledingadvies-natuurijs.html | Link vanaf Sälen |
| 20 | Kan ik mijn eigen schaatsen meenemen? | bestaande FAQ [website] | Informatief | /schaatsen-salen.html | FAQ (bestaat) |
| 21 | Wat zijn kluunschaatsen? | [analyse] | Informatief | /schaatsen-salen.html + /blog/langlaufschaatsen-versus-noren.html | Korte uitleg + link |
| 22 | Halve dag of hele dag, wat kies ik? | [analyse] | Commercieel | /schaatsen-salen.html | FAQ |
| 23 | Hoe boek en betaal ik? | [analyse] | Transactioneel | /schaatsen-salen.html | FAQ |
| 24 | Kan ik schaatsen combineren met mijn skivakantie? | [analyse] | Commercieel | /schaatsen-salen.html | Contentsectie |
| 25 | Hoe laat vertrekken we en zijn we terug? | [analyse], BBI/Tripadvisor noemen tijden | Transactioneel | /schaatsen-salen.html | FAQ (Joey) |
| 26 | Heb ik een helm nodig? | [website: conflict reisinformatie] | Informatief | /schaatsen-salen.html | FAQ (Joey) |
| 27 | Gaan we met alleen mijn groep? | [analyse], Explore Sälen max 16 | Commercieel | /schaatsen-salen.html | FAQ (Joey) |
| 28 | Kan de lunch rekening houden met dieetwensen? | [analyse] | Transactioneel | /schaatsen-salen.html | FAQ (Joey) |
| 29 | Ik kom met eigen auto: hoe hoor ik waar we afspreken? | [analyse] | Transactioneel | /schaatsen-salen.html | FAQ (Joey; alleen het proces, nooit de plek) |
| 30 | Wat kost een schaatsreis naar Zweden? | [analyse] | Commercieel | /blog/kosten-schaatsreis.html | Bestaat |
| 31 | Wanneer is de beste periode om in Zweden te schaatsen? | [analyse] | Informatief | /blog/beste-periode-schaatsen-scandinavie.html | Bestaat |
| 32 | Hoe is schaatsen op natuurijs in Zweden? | [analyse] | Informatief | /blog/schaatsen-zweden.html | Bestaat |
| 33 | Mogen schaatsen mee in de handbagage? | [analyse] | Informatief | /blog/schaatsen-meenemen-vliegtuig.html | Bestaat; link naar huren bij de dagtocht |
| 34 | Wat is het verschil tussen noren en langlaufschaatsen? | [analyse] | Informatief | /blog/langlaufschaatsen-versus-noren.html | Bestaat |

**Weggelaten, omdat Novakse ze niet betrouwbaar kan of mag beantwoorden:** Is Sälen sneeuwzeker? Hoeveel sneeuw ligt er? Waar kan ik skiën in Sälen? Wat zijn de top 5 skigebieden in Zweden? Wat is de goedkoopste wintersportweek? Is er een schaatstocht van 200 km in Zweden? Hoe koud is het in Sälen? Hoe kom ik in Sälen (vliegveld)? Waar ligt het ijs precies (mag niet)? Kan ik zonder begeleiding schaatsen bij Sälen (geen advies geven).

### 9f. FAQ-strategie per pagina (geen dubbele sets)

Regel [analyse]: elke vraag woont op één pagina. Andere pagina's linken ernaar. FAQ-uitklappers verschijnen sinds 2023 niet meer als extra opmaak in Google voor reissites, dus de FAQ is er voor lezers en AI-zoekmachines, niet voor extra ruimte in Google [analyse].

| Pagina | Vragen die hier horen | Niet hier |
|---|---|---|
| /schaatsen-salen.html | Alles over de dagtocht: eigen schaatsen, veiligheid kort, beginners, kinderen, ophalen, weer en ijs, annuleren, tijden, halve of hele dag, boeken, eigen vervoer, helm (8-10 kiezen) | Begeleiding, algemene veiligheidsregels, kosten van meerdaagse reizen |
| /schaatsreizen-zweden.html | Waar schaats je in Zweden, welke reis past, begeleiding bij Orsa/Falun, wanneer ligt er ijs | Dagtocht-details (link naar Sälen) |
| /reisinformatie.html | Hoe meerdaagse reizen werken, aanmelden, slecht ijs tijdens een reis | Moet zeggen dat de dagtocht vanuit Sälen eigen regels heeft (of die regels noemen) |
| /blog/veiligheid-natuurijs.html | Algemene veiligheid op natuurijs | Dagtocht-specifiek |
| /blog/kledingadvies-natuurijs.html | Kleding | - |
| /blog/wat-als-het-ijs-niet-goed-is.html | Slecht ijs tijdens een meerdaagse reis | De dagtocht-regel (staat op de Sälen-pagina) |

### 9g. Contentproductieplan 6-12 maanden

Eerlijk: er is weinig nieuwe content nodig. Het werk zit in verbeteren, verbinden en in wat er buiten de site gebeurt.

| Wanneer | Titel | URL | Primair keyword | Intent | Doelgroep | CTA | Interne links | Prioriteit |
|---|---|---|---|---|---|---|---|---|
| okt 2026 | Herziening dagtocht-pagina (brief 1) | /schaatsen-salen.html | schaatsen vanuit sälen | Transactioneel | Skiërs Sälen | Boek je dagtocht | zie hoofdstuk 10 | P1 |
| okt 2026 | Sälen- en wellnessblok op Zweden-pagina (brief 2) | /schaatsreizen-zweden.html | schaatsen in zweden | Commercieel | Zweden-oriënteerders | Bekijk de dagtocht | naar Sälen, wellness, Finland, Weissensee | P1 |
| okt 2026 | Correctie "twee regio's" + Sälen-link | /blog/schaatsen-zweden.html | hoe is schaatsen op natuurijs in zweden | Informatief | Oriënteerders | Naar hub | naar hub en Sälen | P1 |
| okt-nov 2026 | FAQ-uitbreiding met Joey's antwoorden | /schaatsen-salen.html | - | Transactioneel | Twijfelaars | Boek | - | P1 |
| nov 2026 | Titles Zweden-blogs differentiëren (hoofdstuk 8) | blogs Orsa, Falun, Luleå, orsa-versus-falun | X als schaatsbestemming | Informatief | Oriënteerders | Naar reispagina | naar hub | P2 |
| jan-feb 2027 | Video 1 en 2 filmen (hoofdstuk 9l) | YouTube + /schaatsen-salen.html | schaatsen vanuit sälen | Transactioneel | Skiërs Sälen | Boek je dagtocht | - | P3 |
| feb-mrt 2027 | Reviews verzamelen (Google-review voor Novakse, eventueel platform) | - | - | Vertrouwen | Alle | - | - | P2 |
| mrt-apr 2027 | Ervaringsblog (brief 3, voorwaardelijk) | /blog/schaatsen-naast-skivakantie-salen.html | schaatsen wintersport sälen | Informatief | Skiërs | Naar dagtocht | naar Sälen, kledingadvies | P3 |
| aug-sep 2027 | Seizoen 2028 bijwerken (data, prijzen alleen als Joey ze geeft) | /schaatsen-salen.html, /reizen.html, llms.txt, schema | - | Transactioneel | - | - | - | P1 |

### 9h. AI-overzichten en modern zoeken

- Er staat een AI-overzicht bij **alle 9** gemeten zoektermen, meestal bovenaan [DataForSEO 26-09-2026]. Welke bronnen erin staan, is niet gemeten.
- Wat wel helpt [analyse]: (1) feiten in gewone zinnen dicht bij elkaar ("Een halve dag kost € 125 tot € 155 per volwassene, afhankelijk van het aantal personen"), (2) dezelfde feiten overal gelijk: Sälen-pagina, `/reizen.html` ("Vanaf €155"), `llms.txt` en schema, (3) TouristTrip-schema met prijs, (4) "Sälen, Zweden" voluit, (5) Novakse en Joey bij naam in de hoofdtekst.
- `llms.txt` noemt de dagtocht al [website]. De lokale versie heeft een extra zin over "samen het ijs op, maar niet verantwoordelijk op het ijs" die nog niet live staat [website].
- robots.txt laat AI-crawlers toe [website]. Goed zo.

### 9i. Entity SEO

| Entiteit | Nu in hoofdtekst (live) | Advies | Bron |
|---|---|---|---|
| Novakse | 0 keer (lokaal 1) | Minstens 1-2 keer, bijvoorbeeld "Je boekt direct bij Joey Novak, eigenaar van Novakse" | [website] |
| Joey Novak | 0 keer (alleen footer) | Naam en foto bij de contactregel | [website] |
| Sälen / Stöten / Tandådalen | 6 / 6 / 6 | Goed. "Zweden" in title toevoegen | [website] |
| Dalarna / Malung-Sälen | 0 | Sälen ligt in de gemeente Malung-Sälen, provincie Dalarna [externe bron: Wikipedia]. Alleen noemen als Joey akkoord is; de zin mag niet suggereren dat het ijs daar ligt | [analyse] |
| Lindvallen, Hundfjället, Högfjället | 0 | Alleen noemen als Joey daar echt ophaalt | [analyse] |
| langlaufschaatsen / tourschaatsen | 0 | Eén zin: eigen noren of langlaufschaatsen mag je meenemen | [website], [analyse] |
| kluunschaatsen, noren, natuurijs, fika, ijsprikkers | aanwezig | Goed | [website] |
| dagtocht | 3 keer, niet in title/H1 | In title en H1 | [website] |
| Schema-verbinding | Geen | `provider` met `@id` https://www.novakse.com/#organization | [website] |

### 9j. Lokale SEO en doorway-beoordeling

- **Geen Google Bedrijfsprofiel voor Sälen.** Novakse heeft geen vast adres of bemand punt in Zweden; dat past niet bij de regels van Google [analyse].
- **Geen aparte pagina's per skigebied** (zie 9c). Risico voor de hele site, en het domein is jong met weinig autoriteit [analyse].
- **Wel op de ene pagina** [analyse]: alle echte ophaalgebieden noemen (na bevestiging), een procesregel zoals "Waar we elkaar treffen, hoor je persoonlijk na je boeking" (alleen als Joey dat zo doet), en de H2 "Extra's" hernoemen naar "Ophalen in Sälen, Tandådalen of Stöten en schaatsen huren".
- **Nooit**: plek, meernaam, route, kaart of `geo`/`itinerary` in schema.

### 9k. Afbeeldingen

Nu op de Sälen-pagina: `geveegde-baan-schaatsers` (hero, og:image), `geveegde-baan-luchtfoto`, `kampvuur-fika-ijs`, `kampvuur-lunch-pan`. Goede alt, geen GPS-gegevens [website].

| Actie | Waarom | Bron |
|---|---|---|
| og:image:width, og:image:height en og:image:alt toevoegen | Ontbreekt; betere weergave bij delen (WhatsApp, Facebook) | [website] |
| Luchtfoto niet meer als hoofdbeeld bij het Elfstedentocht-blog (Weissensee) gebruiken als hij uit Zweden komt | Dezelfde foto staat op Sälen, wellness en als hoofdbeeld van een Weissensee-artikel; Joey weet waar hij gemaakt is | [website] |
| Foto van Joey bij de contactregel: `joey-kampvuur` of `joey-op-het-ijs`, alleen als ze helder zijn en de plek niet verraden | Vertrouwen, alleen Joey | [website], [analyse] |
| Nieuwe foto's in het seizoen: kluunschaatsen onder een wandelschoen, een kind op het ijs (met toestemming), fika-close-up, halve dag in het ochtendlicht | Beantwoordt de twijfels (huur, kinderen) in beeld; alleen heldere foto's, geen herkenbare horizon, borden of parkeerplaats | [analyse] |
| Bestandsnaam met "dagtocht-salen" voor nieuwe foto's | Klein effect in Google Afbeeldingen; naam mag niets over de plek zeggen | [analyse] |
| Logo-bestanden verkleinen (sitebreed) | `logo-mark.png` is 237 KB voor ongeveer 30 px; logo's samen ongeveer 333 KB, bijna de helft van de pagina | [website] |

### 9l. Video

Gerechtvaardigd, maar klein [analyse]: YouTube staat bij 8 van de 9 zoektermen [DataForSEO 26-09-2026] en er bestaat geen enkele video over schaatsen vanuit Sälen [WebSearch]. Filmen in het seizoen, zonder meernaam, borden, kaart, route of herkenbare horizon.

| # | Titel | Lengte | Doel |
|---|---|---|---|
| 1 | Een dag schaatsen op natuurijs vanuit Sälen | 60-90 sec | /schaatsen-salen.html, YouTube |
| 2 | Halve dag schaatsen naast je skivakantie | 30-45 sec | Instagram Reels / Shorts |
| 3 (optioneel) | Kluunschaatsen: zo werkt het | 45-60 sec | Twijfel over huur wegnemen |

Een vierde idee uit rapport D (schaatsen met kinderen) pas als Joey's regels voor kinderen vaststaan.

### 9m. Seizoenskalender (op basis van gemeten maanddata)

Gemeten [DataForSEO 26-09-2026], Nederland:

| Zoekwoord | sep | okt | nov | dec | jan | feb | mrt | apr-aug |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| sälen | 480 | 480 | 720 | 880 | **1000** | 880 | 390 | 320-480 |
| wintersport zweden | **1000** | 880 | 880 | **1000** | **1000** | 720 | 390 | 140-320 |
| schaatsen zweden | 170 | 170 | 320 | 320 | **590** | 390 | 90 | 20-110 |
| tandådalen | 70 | 140 | 170 | 210 | **260** | 210 | 90 | 50-70 |

| Periode | Wat er gebeurt in de data | Wat Novakse doet |
|---|---|---|
| sep-okt 2026 (nu) | Skireizen worden gekozen ("wintersport zweden" op piek) | Pagina en regels op orde; partners en bloggers benaderen |
| nov 2026 | Zoeken naar Sälen en schaatsen stijgt | Alles live; indexatie controleren in Search Console |
| dec 2026 | Tweede piek wintersport | Nog één ronde partners; social posts |
| 10 jan - 20 feb 2027 | Piek (januari hoogste maand), boekperiode | Snel reageren op aanvragen; filmen; foto's; reviews vragen |
| mrt 2027 | Daling | Evalueren: boekingen, bronnen, Search Console |
| apr-aug 2027 | Laag | Ervaringsblog, backlinks, voorwaarden bijwerken |
| aug-sep 2027 | Opbouw nieuw seizoen | Data en prijzen seizoen 2028 bijwerken zodra Joey ze vaststelt |

### 9n. Regels voor content-verversing

1. Na elk seizoen: seizoensdata, prijzen en `availabilityStarts/Ends` in schema alleen aanpassen met Joey's nieuwe cijfers; oude data nooit laten staan na 20 februari 2027 zonder melding van het volgende seizoen [analyse].
2. Prijzen alleen via `data/salen-prijzen.json` wijzigen, en daarna dezelfde getallen in schema, `/reizen.html` en `llms.txt` [website].
3. Als de voorwaarden of de ijsregel veranderen: FAQ op de Sälen-pagina tegelijk bijwerken.
4. `lastmod` in de sitemap alleen bij echte inhoudelijke wijzigingen.
5. Geen jaartal in de title van de Sälen-pagina; het seizoen staat in de tekst.
6. Elk kwartaal controleren of interne links nog kloppen (0 kapotte links nu) [website].

---

## 10. Interne linking

Ankerteksten zijn natuurlijk en gebruiken alleen feiten die al op de Sälen-pagina staan. Elke link betekent een halve zin nieuwe tekst; Joey keurt de exacte zin goed.

| Van | Naar | Anchor | Waarom |
|---|---|---|---|
| / (blok met reizen, toont nu 5 van 7) | /schaatsen-salen.html | dagtocht op natuurijs vanuit Sälen | Sterkste interne signaal op de site [website] |
| /schaatsreizen-zweden.html (nieuw blok) | /schaatsen-salen.html | schaatsen vanuit Sälen, Stöten en Tandådalen | Hub moet alle Zweedse producten tonen |
| /blog/schaatsen-zweden.html (sectie "Waar kun je in Zweden schaatsen?") | /schaatsen-salen.html | een dagtocht op natuurijs vanuit Sälen | Tekst "twee regio's" klopt niet meer. Niet linken vanuit de sectie over begeleiding |
| /orsa.html (sectie "Ook naar Falun of Finland?") | /schaatsen-salen.html | op wintersport in Sälen? Schaats een dag op natuurijs | Zelfde land, ander moment |
| /falun.html (sectie "Ook naar Orsa of Finland?") | /schaatsen-salen.html | dagtocht vanuit Sälen | Idem |
| /blog/beste-periode-schaatsen-scandinavie.html | /schaatsen-salen.html | de dagtocht vanuit Sälen (10 januari tot en met 20 februari 2027) | Artikel gaat over timing |
| /blog/langlaufschaatsen-versus-noren.html | /schaatsen-salen.html | kluunschaatsen huren bij de dagtocht vanuit Sälen | Past precies bij het onderwerp |
| /blog/schaatsen-meenemen-vliegtuig.html | /schaatsen-salen.html | schaatsen huren bij de dagtocht vanuit Sälen | Alternatief voor wie geen schaatsen meeneemt |
| /schaatsen-salen.html | /schaatsreizen-zweden.html | meer schaatsen in Zweden | Nu een doodlopende weg |
| /schaatsen-salen.html | /reizen.html | alle schaatsreizen | Idem |
| /schaatsen-salen.html | /blog/kledingadvies-natuurijs.html | wat trek je aan op natuurijs | Beantwoordt een gat zonder nieuwe claims |
| /schaatsen-salen.html | /blog/langlaufschaatsen-versus-noren.html | verschil tussen noren en langlaufschaatsen | Eigen schaatsen meenemen |
| /schaatsen-salen.html | /blog/veiligheid-natuurijs.html | meer over veiligheid op natuurijs | Achtergrond, geen belofte |
| /schaatsreizen-zweden.html | /wellness.html | wellness en schaatsen | Wellness heeft ook maar 1 bronpagina [website] |
| /blog/schaatsen-orsa, -falun, -lulea, orsa-versus-falun | /schaatsreizen-zweden.html | schaatsen in Zweden | Deze vier Zweden-blogs linken niet naar de hub [website] |

**Niet doen** [analyse]:
- Van `/wellness.html` naar Sälen linken: op de wellnesspagina gelden geen plaatsnamen.
- De door rapport A voorgestelde link vanaf `/blog/veiligheid-natuurijs.html` met de anker "een geveegde baan die dagelijks wordt gecontroleerd" **uitstellen** tot Joey bevestigt dat die zin klopt (rapport B zet vraagtekens bij de combinatie met "niet verantwoordelijk op het ijs").

---

## 11. Technische SEO

### 11a. Titles en meta descriptions

| URL | Huidig | Nieuw | Reden |
|---|---|---|---|
| /schaatsen-salen.html (title) | Schaatsen op natuurijs vanuit Sälen, Stöten en Tandådalen \| Novakse (67) | Dagtocht schaatsen op natuurijs vanuit Sälen, Zweden \| Novakse (62) | "Dagtocht" (productnaam) en "Zweden" (tegen de Sölden-verwarring) erin. Stöten en Tandådalen blijven in H1 en meta. Alternatieven uit de rapporten: "Schaatsen vanuit Sälen: dagtocht op natuurijs \| Novakse" (55) en "Schaatsdagtocht vanuit Sälen, Stöten en Tandådalen \| Novakse" (60) |
| /schaatsen-salen.html (meta) | Verruil je ski's een dagje voor natuurijs: ... (202) | Wintersport in Sälen, Stöten of Tandådalen? Schaats een halve of hele dag op 12 km geveegd natuurijs, met fika bij het kampvuur. Direct online te boeken. (153) | Past; rijtijd eruit (minder informatie over de plek in Google); alles staat al op de pagina |
| /schaatsreizen-zweden.html (meta) | Schaatsen in Zweden op natuurijs: zelfstandige schaatsreizen ... (182) | Stap 1 (158) en stap 2 (150), zie brief 2 | Eerst inkorten; Sälen pas noemen als het blok live staat |
| /reizen.html (meta) | Kleinschalige schaatsreizen ... Punkaharju in Finland en de Weissensee. (162) | Alle schaatsreizen op een rij: Orsa, Falun en Luleå in Zweden, Punkaharju in Finland, de Weissensee, wellness & schaatsen en een dagtocht vanuit Sälen. (151) | Er staan 7 reizen op de pagina, de meta noemt er 5. Let op: "schaatsvakanties" en "Scandinavië" verdwijnen dan hier; Joey kiest |
| /blog/schaatsen-zweden.html (title) | Hoe is schaatsen op natuurijs in Zweden? \| Novakse (50) | Hoe is een schaatsdag op natuurijs in Zweden? \| Novakse (55) | Minder overlap met de hub |
| /wellness.html (title, lokaal) | Wellness & schaatsen in Zweden - ontspanning en natuurijs \| Novakse (67) | Wellnessreis Zweden met schaatsen op natuurijs \| Novakse (56) | Niet concurreren met de hub |
| /wellness.html (meta, lokaal) | ... (231) | Wellnessreis in Zweden: hotel met wellness en ontbijt, vlucht en huurauto, en natuurijsbanen op ongeveer 50 minuten rijden. Vanaf € 1.395 per persoon. (150) | Geen plaatsnamen, prijs zoals op de pagina |
| /orsa.html (meta) | ... (226) | Schaatsreis naar Orsa in Dalarna: zelfstandig schaatsen op een geveegde baan van zo'n 15 km op het Orsameer, met vlucht, vervoer en verblijf. (141) | Ver over de grens |
| /falun.html (meta) | ... (197) | Schaatsreis naar Falun in Dalarna: compleet pakket met vlucht, huurauto en verblijf. Schaatsen op natuurijs op het meer Runn, met Falun op de achtergrond. (154) | Korter, "Runn" blijft |
| /blog/schaatsen-orsa.html, -falun, -lulea, orsa-versus-falun (titles) | "Schaatsreis naar X: ..." (63-82) | "X als schaatsbestemming: voor wie past het? \| Novakse" / "Orsa of Falun: welke schaatsbestemming past? \| Novakse" | Reispagina's houden de koopintentie (hoofdstuk 8) |

Een lange title of meta wordt niet bestraft, alleen afgekapt; Google herschrijft ook vaak zelf [analyse]. Daarom alleen voorstellen waar het belangrijkste stuk nu wegvalt.

### 11b. Overige techniek

| Punt | Bevinding | Advies | Prioriteit |
|---|---|---|---|
| Indexatie Sälen-pagina | Onbekend (Search Console-data niet beschikbaar); 1 dag live | In Search Console de URL inspecteren en indexering aanvragen | HIGH |
| Mobiele boekknop | Verstopt in uitklapmenu [website] | Zichtbare knop in de vaste header of een kleine balk onderin | HIGH |
| Tikdoelen | Link "algemene voorwaarden" bij de knop 145x15 px; hamburger 39x25 px [website] | Groter maken | LOW |
| Woordmerk in hero | Donker "NOVAKSE" op donkerblauwe lucht, slecht leesbaar [website, screenshot] | Sitebreed bekijken | LOW |
| Logo-gewicht | Logo's samen ongeveer 333 KB van 685 KB [website] | Kleiner of moderne formaten (sitebreed) | MEDIUM |
| Cache afbeeldingen | `max-age=0, must-revalidate` [website] | Langere cache in `vercel.json` voor /images | LOW |
| `/schaatsen-salen` zonder .html | 404 [website] | Geen actie zolang er niet zo naar gelinkt wordt | - |
| Betaal-terugkeer | `?betaling=gelukt` op dezelfde URL, canonical vangt dit op [website] | Geen actie | - |
| Boeken op dezelfde dag, geen capaciteitscontrole | Het formulier staat vandaag toe en kent geen "vol" [website] | Zakelijke keuze voor Joey (hoofdstuk 17), geen SEO | - |

---

## 12. Structured data

| Pagina | Nu [website] | Advies [analyse] |
|---|---|---|
| /schaatsen-salen.html | Alleen FAQPage (2 vragen), geldig | TouristTrip met `offers` (AggregateOffer), `provider` naar de organisatie, BreadcrumbList. FAQPage uitbreiden zodra de zichtbare FAQ groeit |
| Orsa, Falun, Luleå, Finland, Weissensee | TouristTrip zonder `offers` | Later `offers` toevoegen met de echte kalenderprijzen (niet voor Sälen, wel sitebreed) |
| Homepage | TravelAgency met AggregateRating 5,0 / 22 | Google toont geen sterren voor reviews die een bedrijf over zichzelf markeert, en de reviewteksten komen via JavaScript. Geen straf, geen sterren. Laten staan of weghalen: Joey's keus |

**Schets voor de Sälen-pagina** (prijzen moeten uit `data/salen-prijzen.json` komen; geen plek, `geo`, `itinerary` of meernaam; geen AggregateRating, want er zijn nog geen reviews over deze dagtocht):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.novakse.com/"},
        {"@type": "ListItem", "position": 2, "name": "Schaatsreizen", "item": "https://www.novakse.com/reizen.html"},
        {"@type": "ListItem", "position": 3, "name": "Zweden", "item": "https://www.novakse.com/schaatsreizen-zweden.html"},
        {"@type": "ListItem", "position": 4, "name": "Dagtocht vanuit Sälen", "item": "https://www.novakse.com/schaatsen-salen.html"}
      ]
    },
    {
      "@type": "TouristTrip",
      "name": "Schaatsdagtocht op natuurijs vanuit Sälen, Stöten en Tandådalen",
      "description": "(bestaande introtekst van de pagina)",
      "touristType": "Wintersporters in Sälen, Stöten en Tandådalen",
      "provider": {"@id": "https://www.novakse.com/#organization"},
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "EUR",
        "lowPrice": "125",
        "highPrice": "199",
        "availabilityStarts": "2027-01-10",
        "availabilityEnds": "2027-02-20",
        "url": "https://www.novakse.com/schaatsen-salen.html#boeken"
      }
    }
  ]
}
```

De BreadcrumbList klopt pas met de site als de Zweden-pagina ook echt naar de Sälen-pagina linkt. TouristTrip geeft geen eigen opmaak in Google, maar maakt het aanbod duidelijk voor Google en AI-zoekmachines. BBI heeft `Trip` + `Offer` met prijs; Novakse nog niet [externe bron]. Lage prijs 125/199 gaat over volwassenen; de kinderprijzen staan in de tabel op de pagina.

---

## 13. Conversion SEO

### Kan iemand die via Google binnenkomt binnen 30 seconden begrijpen wat hij kan boeken?

**Gedeeltelijk** [website], [analyse].
- **Wel duidelijk in het eerste scherm:** schaatsen op natuurijs, voor wie in Sälen, Stöten of Tandådalen is, 12 km geveegde baan, ongeveer 1 uur 10 rijden, direct te boeken.
- **Niet duidelijk:** de prijs (eerste prijs op ongeveer 2.585 px), halve of hele dag, de periode, dat fika en lunch erbij zitten, dat je schaatsen kunt huren (skiërs hebben meestal geen schaatsen bij zich [aanname]), dat je opgehaald kunt worden, dat kinderen mee kunnen, dat je samen het ijs op gaat. Dat staat allemaal 2 tot 4 schermen lager.

### Concrete verbeteringen (alleen bestaande feiten)

1. **Feitenstrook onder de hero** met halve/hele dag, vanaf-prijs, kinderen, huur, ophalen en seizoen (zie brief 1). Joey kiest de vanaf-prijs: € 125 (4+ volwassenen) of € 155 (1 volwassene, zoals nu op `/reizen.html`).
2. **Hero-knop laten kloppen**: tekst en doel gelijk maken.
3. **Zichtbare boekknop op mobiel** tijdens het scrollen.
4. **"Offerte aanvragen" in de header** op deze pagina weghalen of vervangen: de dagtocht is geen offerteproduct.
5. **Contactregel bij het formulier** met telefoon en WhatsApp van Joey, plus zijn naam en foto.
6. **Vertrouwen**: de bestaande Elfsight-reviews (echte reviews, staan nu alleen op de homepage en over-novakse) tonen met een eerlijke kop zoals "Wat schaatsers over Novakse zeggen". Niet doen alsof het reviews van deze dagtocht zijn.
7. **Wat gebeurt er na het betalen** in één zin boven de knop, zodra Joey de termijn noemt. Nu staat er alleen "We nemen contact met je op", zonder termijn [website].

### Tegenstrijdige regels (bevestigd in de code)

| Waar | Wat er staat [website] | Waarom het botst |
|---|---|---|
| /algemene-voorwaarden.html, artikel 1 | "Het minimale aantal deelnemers per reis is 4 en het maximale aantal deelnemers is 12." | De dagtocht is te boeken vanaf 1 volwassene en tot 30 personen in totaal |
| /algemene-voorwaarden.html, artikel 3 | Annuleren in weken "voor vertrek" (50% meer dan 6 weken, daarna 100%) | De dagtocht is tot en met dezelfde dag te boeken; wat is "vertrek"? |
| /algemene-voorwaarden.html | Geen regel voor slecht ijs of weer; "Sälen" en "dagtocht" komen 0 keer voor | Juist dit is de grootste twijfel van een boeker |
| /algemene-voorwaarden.html, artikel 7 | "geen herroepingsrecht ... diensten op maat" | Voor een vrijetijdsactiviteit op een vaste datum geldt mogelijk een andere wettelijke uitzondering; laat dit kort juridisch checken (geen juridisch advies) |
| /reisinformatie.html | "ijsprikkers en een helm zijn verplicht" | Op de Sälen-pagina staan alleen ijsprikkers |
| /reisinformatie.html | "Alle reizen zijn standaard zelfstandig, zonder begeleiding op het ijs"; "je moet zelfstandig een dag kunnen doorrijden"; "zelf kunnen inschatten of het ijs veilig is" | Botst met "samen het ijs op" bij Sälen, en past waarschijnlijk niet bij skiërs die een dagje schaatsen [aanname] |
| Boekknop Sälen | "Door te boeken ga je akkoord met de algemene voorwaarden" | De klant gaat akkoord met regels die niet op de dagtocht passen |

**Oplossing** [analyse]: Joey legt de regels voor de dagtocht vast (hoofdstuk 17). Daarna: een eigen artikel of bijlage in de voorwaarden voor de dagtocht, één zin op `/reisinformatie.html` dat de dagtocht vanuit Sälen eigen regels heeft (met link), en dezelfde regels in de FAQ van de Sälen-pagina.

---

## 14. Backlinks

Geen spam, geen betaalde links, geen linknetwerken. Een link die deel is van een commerciële afspraak (bijvoorbeeld een reisorganisatie die de dagtocht verkoopt) hoort volgens Google als `sponsored` gemarkeerd te zijn; die telt dan niet als redactionele link, maar kan wel boekingen opleveren [analyse].

| Website | URL | Relevantie | Mogelijke content | Linkkans |
|---|---|---|---|---|
| Natuurijswijzer | https://www.natuurijswijzer.nl/links/links/ | Hoog: noemt Novakse al, linkt nog naar het oude novakse.nl; 199 verwijzende domeinen [DataForSEO 08-09-2026]. Gemaild 16-08-2026, op 08-09 nog niet aangepast | Link naar novakse.com herstellen; vragen of de Sälen-dagtocht bij hun Zweden-artikel mag | Hoog (bestaande relatie) |
| Kids in de bergen | https://www.kidsindebergen.nl/naar-skigebied-stoten-met-kinderen-in-zweden/ | Hoog: artikel over Stöten met kinderen, linkt al naar lokale aanbieders, heeft een samenwerkingspagina [externe bron] | Schaatsen met kinderen vanuit Stöten (kinderprijzen, kluunschaatsen) | Hoog |
| Stralend Zweden | https://www.stralendzweden.nl/skistar-salen-skigebied-in-zweden/ | Hoog: Sälen-artikel noemt husky, scooter, ijskarten, geen schaatsen; al perskandidaat in `SEO-BACKLINKS.md` [externe bron] | Schaatsen als ontbrekende activiteit | Hoog |
| Snowrepublic | https://www.snowrepublic.nl/op-wintersport-met-kinderen-waarom-salen-in-zweden-de-perfecte-bestemming-is/ | Middel: Sälen met kinderen, geen schaatsen [externe bron] | Activiteitentip of verhaal | Middel |
| Skigebiedengids.nl | https://skigebiedengids.nl/wintersport-salen-skigebieden/ | Middel: Sälen-overzicht, geen schaatsen [externe bron] | Activiteitentip | Middel |
| Vakantie bij Nederlanders in Zweden | https://www.vakantiebijnederlandersinzweden.nl/ | Middel: Nederlandse eigenaren, o.a. in Malung-Sälen [externe bron] | Tip voor hun gasten (partner) | Middel |
| Voigt Travel (eigenaar lapland.nl) | https://www.voigt-travel.nl/zweden-winter/skigebied-salen | Middel: brengt Nederlanders naar Sälen, noemt geen schaatsen [externe bron] | Schaatsdag als activiteit (partner) | Middel |
| Scandinavian Dreams | https://www.scandinaviandreams.eu/ski-resorts/sweden/salen/ | Middel: excursies bij te boeken [WebSearch] | Schaatsdag als excursie (partner) | Middel |
| BBI Travel | https://www.bbi-travel.nl/zweden/wintersport/salen/excursies | Middel: verkoopt al een hele dag (di/wo), mist halve dag en kinderen [externe bron] | Halve dag of gezinsvariant als extra excursie (commerciële afspraak) | Middel, gevoelig: ze verkopen een concurrent |
| Mountain Lodge Stöten | https://mountainlodge.se/en/aktiviteter-2/ | Middel: "together with our partners we can arrange almost anything" [externe bron] | Natuurijsdag voor hun gasten | Middel |
| Högfjällshotellet | https://www.hogis.se/aktiviteter-i-salen | Middel: activiteitenlijst zonder schaatsen [externe bron] | Schaatsen toevoegen aan hun lijst | Middel |
| Sälengodset | https://salengodset.se/en/about-salen/winter-activities/ | Middel: Engelse kennisbank, ook NL-teksten [WebSearch] | Schaatsen als activiteit | Middel |
| Paulin Properties | https://paulinproperties.se/nl/activiteiten-salen-lindvallen/ | Middel: Nederlandstalige activiteitenpagina (bijgewerkt 21-09-2026), geen schaatsen [externe bron] | Tip toevoegen | Middel |
| Gammelgården Sälen | https://www.gammelgarden.se/aktiviteter-i-salen | Laag tot middel [WebSearch] | Tip voor gasten | Laag tot middel |
| Kaisers Skidbod | https://www.kaisersskidbod.se/ | Laag tot middel: ski- en schaatsverhuur [WebSearch] | Wederzijdse tip | Laag tot middel |
| Tripadvisor / GetYourGuide | https://www.tripadvisor.com/Attractions-g729753-Activities-c61-Salen_Dalarna_County.html | Laag voor SEO [aanname: nofollow], hoog voor zichtbaarheid; de concurrent staat er met 1 review | Eigen productvermelding (zakelijke keuze: commissie, voorwaarden) | n.v.t. (geen linkdoel) |
| Wintersport.nl forum Sälen | https://www.wintersport.nl/skigebieden/salen | Laag voor SEO [aanname: nofollow], wel echte bezoekers | Vragen eerlijk beantwoorden, niet spammen | Laag |

---

## 15. 90-dagenplan (26-09-2026 tot eind december 2026)

Het plan volgt de data: skireizen worden nu gekozen, de zoekpiek komt in december tot februari, de dagtocht loopt van 10 januari tot 20 februari 2027.

| Weken | Periode | Wat | Wie |
|---|---|---|---|
| 1-2 | 26 sep - 10 okt | Regels vastleggen: ijs- en weerregel, annulering/verzetten, helm, niveau, kinderen, ophaalgebieden, tijden, capaciteit, vanaf-prijs (hoofdstuk 17). Voorwaarden en `reisinformatie.html` daarop laten aanpassen | Joey (en eventueel jurist) |
| 1-2 | 26 sep - 10 okt | Zonder nieuwe feiten al te doen: interne links (hoofdstuk 10), title en meta, TouristTrip/Breadcrumb-schema, hero-knop, zichtbare mobiele boekknop, contactregel, H2 "Extra's" hernoemen, og:image-gegevens | Uitvoering, Joey keurt zinnen |
| 2-3 | tot 17 okt | Sälen-blok op de Zweden-pagina; correctie "twee regio's" in het Zweden-blog; Search Console: Sälen-URL inspecteren en indexering aanvragen | Uitvoering + Joey |
| 3-6 | okt | Outreach vóór de bloggers hun winterartikelen bijwerken: Kids in de bergen, Stralend Zweden, Snowrepublic, Skigebiedengids. Natuurijswijzer opnieuw bellen of mailen (oude .nl-link + Sälen) | Joey |
| 3-8 | okt - half nov | Partnergesprekken: accommodaties (Mountain Lodge Stöten, Högfjällshotellet, Sälengodset, Paulin Properties, Vakantie bij Nederlanders in Zweden) en reisorganisaties (Voigt, Scandinavian Dreams, eventueel BBI) | Joey |
| 4-6 | okt - nov | FAQ-uitbreiding en feitenstrook met Joey's antwoorden; "Goed om te weten"-sectie | Uitvoering |
| 7-10 | nov | Controle: is alles live en geïndexeerd? Search Console-toegang regelen zodat vertoningen gemeten kunnen worden; nulmeting noteren. Iedere boeker vragen hoe hij Novakse vond (in het persoonlijke contact na de boeking, geen nieuw formulierveld) | Joey |
| 7-10 | nov | Titles Zweden-blogs differentiëren; Zweden-pagina in het menu (als Joey akkoord geeft) | Uitvoering |
| 11-13 | dec | Tweede ronde partners en bloggers; social posts met de bestaande foto's; draaiboek voor filmen en reviews vragen in januari-februari | Joey |

---

## 16. Prioriteiten

### 16a. Backlog

| Actie | Impact | Inspanning | Prioriteit | Waarom |
|---|---|---|---|---|
| Regels dagtocht vastleggen, voorwaarden en reisinformatie aanpassen | HIGH | MEDIUM | HIGH | Klant gaat nu akkoord met regels die niet passen; grootste afhaakreden (weer/ijs) [website] |
| Partners (accommodaties, reisorganisaties) benaderen | HIGH | HIGH | HIGH | Doelgroep boekt nu hun skireis; niemand noemt schaatsen [externe bron] |
| Bloggers benaderen (Kids in de bergen, Stralend Zweden) | HIGH | MEDIUM | HIGH | Boekingen + echte backlinks tegelijk |
| Interne links naar Sälen + Sälen-blok op hub | HIGH | LOW | HIGH | Nu 1 bronpagina [website] |
| Feitenstrook, hero-knop, mobiele boekknop, contactregel | HIGH | LOW | HIGH | Prijs pas op 2.585 px [website] |
| Title en meta Sälen | MEDIUM | LOW | HIGH | "Zweden" en "dagtocht" ontbreken; meta 202 tekens |
| TouristTrip + AggregateOffer + Breadcrumb | MEDIUM | LOW | HIGH | Alle andere reispagina's hebben het |
| FAQ uitbreiden (Joey's antwoorden) | MEDIUM | LOW | HIGH | Beantwoordt de twijfels, voedt AI-overzichten |
| Natuurijswijzer opvolgen | MEDIUM | LOW | HIGH | Sterkste bestaande relatie, dode .nl-link |
| Search Console-toegang + nulmeting | MEDIUM | LOW | HIGH | Zonder data geen evaluatie mogelijk |
| Zweden-pagina in hoofdmenu | MEDIUM | LOW | MEDIUM | Al in september geadviseerd; raakt elk menu, Joey beslist |
| Titles Zweden-blogs differentiëren | MEDIUM | LOW | MEDIUM | Blogs concurreren met reispagina's [DataForSEO 08-09-2026] |
| Reviews of Elfsight op de Sälen-pagina | MEDIUM | LOW | MEDIUM | Nu geen enkel vertrouwenssignaal behalve Stripe |
| Logo-bestanden verkleinen | LOW | LOW | MEDIUM | Bijna helft van het paginagewicht |
| Video filmen in het seizoen | MEDIUM | MEDIUM | MEDIUM | YouTube in 8 van 9 SERP's, geen Sälen-video |
| Tripadvisor/GetYourGuide-vermelding | MEDIUM | MEDIUM | LOW (zakelijke keuze) | Engelstalige zichtbaarheid; commissie |
| Ervaringsblog na seizoen | LOW | MEDIUM | LOW | Alleen met eigen inhoud; volume 10 |
| Tikdoelen, woordmerk, image-cache | LOW | LOW | LOW | Klein |
| Aparte Tandådalen/Stöten-pagina's | Negatief | - | NIET DOEN | Doorway-risico |
| Engelse of Zweedse Sälen-pagina | LOW | HIGH | NIET NU | Geen gemeten vraag, platforms domineren |

### 16b. Quick wins (klein werk, direct uit de analyse)

1. Link vanaf de homepage naar de Sälen-pagina.
2. Link vanaf `/schaatsreizen-zweden.html` naar Sälen (met kort blok).
3. Correctie "twee regio's" + link in `/blog/schaatsen-zweden.html`.
4. Links vanaf `/orsa.html` en `/falun.html`.
5. Links vanaf de blogs over beste periode, noren en schaatsen in het vliegtuig.
6. Links vanaf de Sälen-pagina naar hub, reizen, kledingadvies, noren-blog, veiligheidsblog.
7. Nieuwe title met "dagtocht" en "Zweden".
8. Meta inkorten tot 153 tekens.
9. BreadcrumbList + TouristTrip/AggregateOffer op de Sälen-pagina.
10. Hero-knop: tekst en doel gelijk.
11. H2 "Extra's" hernoemen naar "Ophalen in Sälen, Tandådalen of Stöten en schaatsen huren".
12. Contactregel met telefoon en WhatsApp bij het formulier.
13. og:image:width/height/alt op de Sälen-pagina.
14. Meta's van Zweden-hub, Orsa, Falun en reizen inkorten.

### 16c. Big wins

1. Voorwaarden en ijsregel voor de dagtocht (vertrouwen en juridische helderheid).
2. Partnerschappen met accommodaties en reisorganisaties in Sälen.
3. Blogger-vermeldingen bij Nederlandstalige Sälen-content (boekingen + autoriteit).
4. Sitebreed: van 11 spamlinks naar 30-40 echte verwijzende domeinen [DataForSEO 08-09-2026]. Sälen-outreach draagt hier direct aan bij.
5. Echte reviews over de dagtocht na het eerste seizoen.

---

## 17. Openstaande informatie (alleen Joey kan dit geven)

1. **Weer- en ijsregel**: wat gebeurt er als het ijs of weer niet goed is (geld terug, andere datum, tegoed)? Wie beslist en wanneer hoort de klant het?
2. **Annuleren en verzetten**: tot wanneer kosteloos of met welk percentage?
3. **Voorwaarden**: hoe worden artikel 1 (minimaal 4) en artikel 3 (weken voor vertrek) voor de dagtocht aangepast? Eventueel kort juridisch laten checken (herroepingsrecht).
4. **Helm**: verplicht, aangeraden of niet nodig bij de dagtocht? (`/reisinformatie.html` zegt nu "verplicht" voor alle reizen.)
5. **Niveau**: kunnen beginners en mensen die nooit op natuurijs stonden mee?
6. **Kinderen**: vanaf welke leeftijd echt op het ijs, zijn er kinderhuurschaatsen en welke maten, wat doen peuters?
7. **Tijden**: ongeveer hoe laat ophalen en terug, voor halve en hele dag? Kan de halve dag ook 's middags?
8. **Ophaalgebieden**: alleen Sälen, Tandådalen en Stöten, of ook Lindvallen, Hundfjället, Högfjället? Mag Dalarna genoemd worden?
9. **Eigen vervoer**: hoe en wanneer hoort de klant het verzamelpunt (alleen het proces op de site)?
10. **Capaciteit**: maximaal aantal personen per dag, en gaan verschillende boekingen samen het ijs op? Wat als twee groepen dezelfde dag boeken?
11. **Tot wanneer boeken**: echt tot en met dezelfde dag (dat staat het systeem nu toe)?
12. **Na betalen**: binnen welke termijn neemt Joey contact op?
13. **"De baan wordt dagelijks gecontroleerd en geveegd"**: klopt dit, en past het naast "Novakse is niet verantwoordelijk op het ijs"?
14. **Lunch**: wat zit erin, zijn dieetwensen mogelijk?
15. **Vanaf-prijs**: € 125 (4+ volwassenen, halve dag) of € 155 (1 volwassene)?
16. **Foto's**: waar is `geveegde-baan-luchtfoto` gemaakt (staat ook bij een Weissensee-artikel)? Zijn `joey-kampvuur` of `joey-op-het-ijs` geschikt (helder, plek niet herkenbaar)?
17. **Search Console**: toegang zodat indexatie en vertoningen gemeten kunnen worden.
18. **Tripadvisor/GetYourGuide**: wil Joey daar staan (commissie, voorwaarden)?

---

## Als we de komende 3 maanden maar 10 dingen mogen doen

1. **Regels voor de dagtocht vastleggen** en voorwaarden plus `reisinformatie.html` daarop aanpassen (helm, "zelfstandig", minimaal 4, annuleren, slecht ijs). Grootste risico en grootste twijfel van boekers.
2. **Kids in de bergen en Stralend Zweden benaderen** met het ontbrekende onderwerp "schaatsen in Sälen". Boekingen en echte backlinks tegelijk, vóór november.
3. **Accommodaties en reisorganisaties in Sälen benaderen** (Mountain Lodge Stöten, Högfjällshotellet, Sälengodset, Paulin Properties, Vakantie bij Nederlanders in Zweden, Voigt, Scandinavian Dreams). Daar zit de doelgroep al.
4. **Interne links naar de Sälen-pagina** vanaf homepage, Zweden-pagina (met blok), Zweden-blog, Orsa, Falun en drie passende blogs; en terug vanaf de Sälen-pagina.
5. **Eerste scherm op mobiel repareren**: feitenstrook met prijs, halve/hele dag, huur, ophalen en seizoen; hero-knop kloppend; zichtbare boekknop.
6. **Title, meta en schema** van de Sälen-pagina (dagtocht, Zweden, TouristTrip met prijs, BreadcrumbList).
7. **FAQ uitbreiden naar 8-10 vragen** met Joey's antwoorden (weer/ijs, annuleren, niveau, kinderen, ophalen, tijden, halve of hele dag, helm).
8. **Natuurijswijzer opvolgen**: dode novakse.nl-link naar .com, en de Sälen-dagtocht erbij.
9. **Joey en vertrouwen zichtbaar maken**: contactregel met naam en foto bij het formulier, bestaande reviews met een eerlijke kop.
10. **Meten regelen**: Search Console-toegang en nulmeting, en iedere boeker vragen hoe hij Novakse vond. Plus draaiboek voor filmen en reviews vragen in januari-februari.

---

## Waar de opdracht niet logisch bleek

| Aanname in de opdracht | Wat de data zegt | Hoe het plan is aangepast |
|---|---|---|
| SEO is het hoofdkanaal voor de Sälen-dagtocht | Alle 40+ schaats-plus-Sälen-varianten: geen meetbaar volume [DataForSEO 26-09-2026]. De doelgroep heeft haar skireis al geboekt via reisorganisaties | Google-werk beperkt tot de ene pagina goed maken; de meeste energie naar partners, bloggers en Natuurijswijzer |
| Aparte pagina's voor Tandådalen en Stöten | Geen vraag, SERP's gaan over skiën, aanbod is identiek. Doorway-risico voor de hele site | Niet maken; de ene pagina noemt alle drie de plaatsen (al 6 keer elk) |
| Een cluster van 9 nieuwe pagina's | 8 van de 9 bestaan al of horen als sectie op de Sälen-pagina; de rest heeft geen volume | Geen nieuwe pagina's nu; hooguit één ervaringsblog na het seizoen, en alleen met eigen inhoud |
| Een Engelse (of Zweedse) pagina | Engelse zoekvraag lijkt nog kleiner en wordt beheerst door Tripadvisor, GetYourGuide en Visit Sweden; Zweden zoeken de gratis dorpsbaan [WebSearch] | Geen vertaling; eventueel een platformvermelding als zakelijke keuze |
| Top-20 content gaps | Er zijn er 15 die door data gedragen worden, bijna allemaal FAQ of secties op één pagina | Lijst van 15, niet opgevuld |
| People Also Ask als basis voor de FAQ | Google gaf geen PAA-vragen over schaatsen bij Sälen; alleen over skiën en sneeuw | PAA-lijst aangevuld met vragen uit concurrentpagina's en analyse, met bronlabel per vraag |
| Inzicht in AI-overzichten | Wel gemeten dát er een AI-overzicht is (9 van 9), niet wat erin staat | Algemeen advies (feiten in gewone zinnen, consistente cijfers, schema), geen claims over bronnen |
| Belgische markt | Niet gemeten (tegoed op) | Geen advies specifiek voor België |
| Lokale SEO met locatie- en routecontent | Mag niet (regel van Joey); geen vast adres in Zweden | Alleen ophaalgebieden en een procesregel; geen Bedrijfsprofiel voor Sälen |
| Meer content helpt ranken | Sitebreed zit het probleem in autoriteit (11 spamlinks, rank 0) [DataForSEO 08-09-2026] | Links en vermeldingen boven nieuwe teksten |
| Sälen als grootste SEO-kans | De Weissensee heeft 1.300 zoekopdrachten per maand en Novakse stond al op 10 voor "schaatsreis weissensee" [DataForSEO 08-09-2026] | Genoemd als belangrijkere SEO-kans buiten deze opdracht; niet uitgewerkt |
| Numerieke SEO-scores per zoekwoord | Bij "geen data" zijn scores schijnprecisie | Alleen P1/P2/P3 en HIGH/MEDIUM/LOW |
| Een concurrent van ongeveer € 265 | Waarschijnlijk Explore Sälen (2995 SEK), niet bewezen | Als onzeker vermeld; vergelijking gebaseerd op het harde BBI-cijfer (€ 296) |
