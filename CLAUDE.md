## Frontend workflow

- Werk zelfstandig op de gevraagde pagina of sectie. Maak alle redelijke aannames zelf en stel alleen vragen als je er echt niet uitkomt.
- Begin direct met implementeren zodra de opdracht duidelijk is; wacht niet op tussentijdse bevestiging tenzij een keuze onomkeerbaar is.
- Start zoveel mogelijk agents parallel zodat onafhankelijke onderdelen tegelijk ontwikkeld worden.
- Gebruik de `frontend-design` skill voor grotere frontendwijzigingen of wanneer de richting niet duidelijk is.
- Gebruik Claude Design alleen als extra visuele ondersteuning voor richting, compositie, typografie en sfeer. Het helpt met ontwerp, niet met de volledige implementatie.
- Claude Design mag inspiratie geven en conceptuele richting bieden, maar Claude Code is verantwoordelijk voor de daadwerkelijke implementatie, structuur en functionaliteit.
- Als een wijziging grote invloed heeft op richting, scope of content, geef eerst kort aan wat je gaat doen.
- Start vanuit de bestaande structuur en behoud bevestigde inhoud, tekst en assets tenzij de opdracht dat expliciet verandert.
- Werk in kleine, heldere stappen. Bouw niet direct een volledige herbouw zonder duidelijke opdracht.
- Houd prompts kort en concreet. Geef alleen de relevante context en bestanden mee.
- Gebruik één duidelijke taak per stap en split grote opdrachten op.

## Referenties en context

- Lees vóór het ontwerpen altijd de relevante projectdocumenten:
  - `DESIGN-DIRECTION.md`
  - `SITEMAP.md`
  - `website_content/CONTENT-INVENTORY.md`
  - relevante bestanden in `reference_images/`
  - relevante bestanden in `brand_assets/`
- Gebruik de docs als leidraad; lees ze niet allemaal opnieuw als dezelfde context al bekend is.

## Visuele richting

- Maak geen standaard AI- of templatewebsite. Laat het ontwerp persoonlijk, avontuurlijk, professioneel en ordelijk voelen.
- Gebruik fotografie als belangrijk ontwerpelement, niet alleen als decoratie.
- Gebruik de geveegde ijsbaanlijn als herkenbaar terugkerend grafisch element.
- Gebruik winterse kleuren met een warme accentkleur uit de eigen fotografie.
- Gebruik uitsluitend eigen bedrijfsbeelden uit `brand_assets/`. Gebruik referentiebeelden alleen voor inspiratie op compositie en sfeer.
- Vermijd identieke kaarten, standaard schaduwen en te veel rechte scheidingen. Variatie in schaal, ritme, compositie en beeldverhouding is belangrijk.

## Implementatie

- Bouw mobile-first en volledig responsive.
- Houd de website snel, licht en toegankelijk.
- Gebruik semantische HTML, duidelijke structuur, toetsenbordbediening en goede kleurcontrast.
- Gebruik subtiele beweging met `transform` en `opacity`. Vermijd `transition-all` en zware parallax-effecten.
- Laat alle belangrijke informatie ook zonder hover begrijpelijk zijn.
- Gebruik alleen bestaande, echte content. Verzin geen prijzen, reisdata, diensten, voorwaarden, claims of teksten.
- Als iets ontbreekt of onduidelijk is, maak een kleine technische keuze die de inhoud of bedrijfsinformatie niet verandert. Noteer die kort.

## Harde regels

- Bouw alleen de pagina of sectie die expliciet is gevraagd.
- Voeg geen extra pagina's, functies of inhoud toe zonder duidelijke opdracht.
- Verander geen content, prijzen, teksten, bedrijfsinformatie of belangrijke structuur zonder expliciete opdracht.
- Overschrijf geen bestaande goedgekeurde versie zonder een duidelijke reden.
- Communiceer in eenvoudig Nederlands.
- Schrijf code, bestandsnamen, variabelen en commentaar in het Engels.
