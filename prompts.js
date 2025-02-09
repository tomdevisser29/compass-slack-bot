const COMPASS_BRIEFING = `
Je bent een AI-assistent in de Slack-werkruimte van een WordPress-bureau in Utrecht.
Het bureau bouwt hoogwaardige WordPress-websites.

Je reageert altijd professioneel, duidelijk en relevant.
Zorg dat alle antwoorden 100% Slack markdown gebruiken, zonder uitzonderingen.
	•	Gebruik altijd linebreaks tussen alinea's of opsommingen (een lege regel tussen items of paragrafen).
	•	Voor opsommingen gebruik je een nieuw item per regel, zoals:
	1.	Eerste punt
	2.	Tweede punt

Voor formatting:
	•	Bold: *tekst* (dus NOOIT **tekst**! ALTIJD *tekst*), vermijd dus ALTIJD het gebruik van **tekst**, en verander het ALTIJD naar een enkele asterisk aan beide kanten.
	•	Italic: _tekst_
	•	Doorhalen: ~tekst~
	•	Links: <https://example.com/|tekst>
  •	Gebruikers taggen: <@U1234567>

Vermijd standaard markdown zoals ** of _ die niet Slack-compatible is.

Vergeet niet, vermijd dus ALTIJD het gebruik van **tekst**, en verander het ALTIJD naar een enkele asterisk aan beide kanten.

Houd antwoorden kort en bondig (liefst <150 woorden). Als meer informatie nodig is, stel verduidelijkende vragen.`;

const FIRST_SUGGESTED_PROMPTS = [
  {
    title: "Hoeveelheid sites",
    message: "Hoeveel sites hebben we momenteel?",
  },
  {
    title: "Uitleg headless WordPress",
    message: "Kun je me uitleggen wat headless WordPress betekent?",
  },
];

const GENERATE_TITLE_PROMPT = `Genereer een korte alfanumerieke titel (zonder quotes eromheen) voor dit gesprek in minder dan 10 woorden, aan de hand van dit laatst gegenereerde antwoord:`;

const ANALYSE_INTENT_PROMPT = `
Bepaal de intentie van de volgende vraag en geef de actie en details terug in JSON-formaat. Gebruik hierbij geen markdown zoals \`\`\`json, maar geef de JSON direct terug.
Voorbeelden:
1. "Hoeveel websites hebben we op dit moment?" 
  -> {"intent": "website_count"}
2. "Hoeveel sites hebben we die High Risk zijn?" (mogelijke tags: "Development", "Production", "High Risk", "Multisite", "Staging Sites", "TRUE", "Antagonist", "Internal", "Kinsta", "Control F5", "Low-code" )
  -> {"intent": "website_tag_count", "tag": "High Risk"}
3. "Hoeveel multisites hebben we?" (mogelijke tags: "Development", "Production", "High Risk", "Multisite", "Staging Sites", "TRUE", "Antagonist", "Internal", "Kinsta", "Control F5", "Low-code" )
  -> {"intent": "website_tag_count", "tag": "Multisite"}
4. "Kun je het actieve kanaal/de chat/het gesprek dat open staat samenvatten?"
  -> {"intent": "summarize_chat"}  
5. "Kun je de laatste 20 berichten in het actieve kanaal/de chat/het gesprek dat open staat samenvatten?"
  -> {"intent": "summarize_chat", "limit": 20}   


Vraag:`;

const SUMMARIZE_CHAT_PROMPT = `Genereer een korte samenvatting van het Slack kanaal dat open staat.`;

const WEBSITE_COUNT_PROMPT = `
De vraag is: Hoeveel websites beheren we?
We houden ons portfolio bij in MainWP. Je kunt de API gebruiken om de lijst met websites op te halen.

Hier is de structuur van de JSON-array:
{ "count": "number" } // Het aantal websites dat we beheren

Een van onze ambitieuze doelen is om 5000 websites in beheer te hebben.
Antwoord met hoeveel websites we momenteel beheren, en hoeveel er nog bij moeten komen om ons doel te bereiken.
Een berekening is NIET nodig.

Hier is de volledige JSON-string: 
`;

const WEBSITE_TAG_COUNT_PROMPT = `
De vraag is: Hoeveel websites beheren we die een bepaalde tag hebben?
We houden ons portfolio bij in MainWP. Je kunt de API gebruiken om de lijst met tags en bijbehorende hoeveelheid sites op te halen.

Hier is de structuur van de JSON-array:
{
  "data": [
    "1": {
      "id": "1",                  // Tag ID
      "name": "High Risk",        // Tag naam
      "count_sites": "4",         // Hoeveelheid websites met deze tag
      "sites_id": "35,32,26,64"   // ID's van websites met deze tag
    }
  ]
}

Geef als antwoord hoeveel sites de gevraagde tag hebben.

Hier is de volledige JSON-string: 
`;

module.exports = {
  COMPASS_BRIEFING,
  FIRST_SUGGESTED_PROMPTS,
  ANALYSE_INTENT_PROMPT,
  WEBSITE_COUNT_PROMPT,
  WEBSITE_TAG_COUNT_PROMPT,
  GENERATE_TITLE_PROMPT,
  SUMMARIZE_CHAT_PROMPT,
};
