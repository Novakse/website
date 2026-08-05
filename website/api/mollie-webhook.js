/* Vercel serverless function — vangt de statusmeldingen van Mollie op.
   Er is geen database gekoppeld: Mollie stuurt zelf al een e-mail naar
   Joey bij iedere (nieuwe) betaling. Deze functie hoeft alleen 200 terug
   te geven, anders blijft Mollie het opnieuw proberen. */
module.exports = async function handler(req, res) {
  res.status(200).send("OK");
};
