# Flyer voor ijsbanen

Een poster om op te hangen op prikborden bij ijsbanen. Staand, enkelzijdig, in A4 en A5. Er staan bewust geen prijzen op, omdat de flyer maandenlang blijft hangen. Op A5 staan alleen de namen van de reizen, zonder korte uitleg, zodat alle tekst groot genoeg blijft (ongeveer 10 pt).

## Welk bestand gebruik je?

| Bestand | Formaat | Waarvoor |
| --- | --- | --- |
| `flyer-a4-drukker.pdf` | 216 x 303 mm (A4 + 3 mm afloop) | Naar de drukker sturen voor A4 |
| `flyer-a5-drukker.pdf` | 154 x 216 mm (A5 + 3 mm afloop) | Naar de drukker sturen voor A5 |
| `flyer-a4.pdf` | 210 x 297 mm (precies A4) | Zelf thuis of op kantoor printen |
| `flyer-a5.pdf` | 148 x 210 mm (precies A5) | Zelf printen |
| `flyer-a4-voorbeeld.png`, `flyer-a5-voorbeeld.png` | 150 dpi | Om te bekijken of te delen, niet om te drukken |

**Drukker = de bestanden met "drukker" in de naam.** Daar loopt de foto en de donkere achtergrond 3 mm door buiten de snijlijn. Die rand snijdt de drukker eraf, zodat er geen wit randje overblijft.

## Bij de drukker

- Formaat A4 of A5, staand, enkelzijdig (4/0).
- Papier: 170 grams mat of silk (gesatineerd). Mat geeft de minste spiegeling onder de lampen van een ijshal of achter plexiglas. Wil je hem steviger, dan kan 250 grams ook.
- Afloop van 3 mm zit er al in. Snijtekens zijn niet nodig.
- De kleuren staan in RGB. De drukker zet ze om naar CMYK. Het blauw van de lucht kan op papier iets minder fel worden, dat is normaal.
- Bij offsetdruk: vraag de drukker om de totale inktdekking van het grote donkere vlak te controleren, en om de QR-code het liefst in puur zwart (K100) te drukken.

## Zelf printen

- Gebruik `flyer-a4.pdf` of `flyer-a5.pdf`.
- Kies bij het printen "Werkelijke grootte" of 100%.
- De meeste printers kunnen niet tot de rand printen. Je krijgt dan een smalle witte rand. Tekst en QR-code staan ver genoeg van de rand, dus er valt niets weg.
- Neem zo stevig papier als je printer aankan, bijvoorbeeld 160 tot 200 grams.

## QR-code

De code gaat naar:
`https://novakse.com/reizen.html?utm_source=flyer&utm_medium=print&utm_campaign=ijsbanen`

Het stuk na het vraagteken laat in bezoekersstatistieken zien dat iemand via de flyer kwam. De code is getest: gescand vanuit de PDF's geeft hij precies dit adres. Hij is 42 mm groot op A4 en 36 mm op A5.

Het bestand is `assets/qr-reizen.svg`. Alleen opnieuw maken als het adres verandert (gemaakt met segno, foutcorrectie M, witte rand van 4 blokjes).

## Foto en lettertypes

- Foto: eigen foto van de geveegde baan op de Weissensee (`brand_assets/Foto's/Weisensee/Weissensee schaatsen.jpg`, 2662 x 3549 pixels). Op A4 is dat ongeveer 270 dpi, op A5 ongeveer 380 dpi.
- Letters: Space Grotesk en Work Sans, dezelfde als op de website. Ze zitten ingesloten in de PDF's.
- Logo: het woordmerk van de website. De kleine beschadiging in de laatste E zit in het originele logobestand.

## Opnieuw maken

Tekst of opmaak aanpassen doe je in `flyer.html`. Daarna:

```
pip install playwright pypdf
python -m playwright install chromium
python3 drukwerk/flyer-ijsbanen/build.py
```

Het script maakt alle vier de PDF's en de twee voorbeeldplaatjes opnieuw. Je kunt `flyer.html` ook gewoon in de browser openen; met `?size=a5` erachter zie je de A5-versie.
