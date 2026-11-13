/* =============================================================
   SCRIPT.JS – Ein bisschen Interaktivität für die Webseite
   ============================================================= */


/* -------------------------------------------------------------
   1. HELL / DUNKEL-MODUS
   ------------------------------------------------------------- */

// Wir holen uns den Knopf aus dem HTML über seine id
const themeToggle = document.getElementById("theme-toggle");

// Funktion: setzt das Design ("light" oder "dark")
function setTheme(theme) {
  // Schreibt data-theme="dark" bzw. "light" an das <html>-Tag.
  // Das CSS reagiert darauf mit den passenden Farben.
  document.documentElement.setAttribute("data-theme", theme);

  // Wahl im Browser speichern, damit sie nach dem Neuladen erhalten bleibt.
  // try/catch: falls der Browser das Speichern verbietet (z. B. privater Modus),
  // läuft die Seite trotzdem ohne Fehler weiter.
  try {
    localStorage.setItem("theme", theme);
  } catch (fehler) {
    // Nichts tun – Speichern ist nur ein Bonus.
  }
}

// Beim Laden der Seite: Welches Design soll am Anfang gelten?
function getStartTheme() {
  // a) Hat der Besucher schon einmal gewählt? Dann diese Wahl nehmen.
  try {
    const gespeichert = localStorage.getItem("theme");
    if (gespeichert) {
      return gespeichert;
    }
  } catch (fehler) {
    // Ignorieren
  }

  // b) Sonst: Systemeinstellung des Geräts verwenden (hell oder dunkel)
  const systemIstDunkel = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return systemIstDunkel ? "dark" : "light";
}

// Start-Design anwenden
document.documentElement.setAttribute("data-theme", getStartTheme());

// Wenn auf den Knopf geklickt wird: Design umdrehen
themeToggle.addEventListener("click", function () {
  const aktuell = document.documentElement.getAttribute("data-theme");
  const neu = aktuell === "dark" ? "light" : "dark";
  setTheme(neu);
});


/* -------------------------------------------------------------
   2. HANDY-MENÜ (Hamburger ☰)
   ------------------------------------------------------------- */
const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");

// Klick auf ☰: Menü ein- oder ausblenden
menuToggle.addEventListener("click", function () {
  // classList.toggle fügt die Klasse "open" hinzu bzw. entfernt sie.
  // Es gibt true zurück, wenn das Menü jetzt offen ist.
  const istOffen = nav.classList.toggle("open");

  // Für Screenreader mitteilen, ob das Menü offen ist
  menuToggle.setAttribute("aria-expanded", istOffen);

  // Symbol wechseln: ✕ zum Schließen, ☰ zum Öffnen
  menuToggle.textContent = istOffen ? "✕" : "☰";
});

// Wenn ein Link im Menü angeklickt wird: Menü wieder schließen
const navLinks = nav.querySelectorAll("a");
navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});


/* -------------------------------------------------------------
   3. AKTUELLES JAHR IM FOOTER
   So muss man die Jahreszahl nie wieder von Hand ändern.
   ------------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();


/* -------------------------------------------------------------
   4. ABSCHNITTE BEIM SCROLLEN EINBLENDEN
   Der "IntersectionObserver" beobachtet, wann ein Element
   in den sichtbaren Bereich des Bildschirms kommt.
   ------------------------------------------------------------- */
const revealElemente = document.querySelectorAll(".reveal");

const beobachter = new IntersectionObserver(
  function (eintraege) {
    eintraege.forEach(function (eintrag) {
      // isIntersecting = true, wenn das Element sichtbar ist
      if (eintrag.isIntersecting) {
        eintrag.target.classList.add("visible");   // CSS blendet es ein
        beobachter.unobserve(eintrag.target);      // nur einmal animieren
      }
    });
  },
  {
    threshold: 0.15 // Auslösen, sobald 15 % des Elements sichtbar sind
  }
);

// Jedes Element mit der Klasse "reveal" beobachten
revealElemente.forEach(function (element) {
  beobachter.observe(element);
});


/* -------------------------------------------------------------
   5. NEU: SCROLL-FORTSCHRITTSBALKEN
   Berechnet, wie viel Prozent der Seite schon gescrollt wurde,
   und macht den Balken oben entsprechend breit.
   ------------------------------------------------------------- */
const fortschrittsBalken = document.getElementById("scroll-progress");

function aktualisiereFortschritt() {
  // Wie weit wurde schon nach unten gescrollt? (in Pixeln)
  const gescrollt = window.scrollY;

  // Wie weit KANN man insgesamt scrollen?
  // = Höhe der ganzen Seite minus Höhe des sichtbaren Fensters
  const maximal = document.documentElement.scrollHeight - window.innerHeight;

  // Prozent ausrechnen. Wenn die Seite gar nicht scrollbar ist (maximal = 0),
  // nehmen wir 0, sonst würden wir durch 0 teilen.
  const prozent = maximal > 0 ? (gescrollt / maximal) * 100 : 0;

  // Breite des Balkens setzen, z. B. "42.5%"
  fortschrittsBalken.style.width = prozent + "%";
}

// Bei jedem Scrollen und wenn sich die Fenstergröße ändert neu berechnen
window.addEventListener("scroll", aktualisiereFortschritt);
window.addEventListener("resize", aktualisiereFortschritt);
aktualisiereFortschritt(); // einmal direkt beim Laden


/* -------------------------------------------------------------
   6. NEU: LIVE-WETTER
   Holt das aktuelle Wetter vom kostenlosen Dienst "Open-Meteo"
   (open-meteo.com). Man braucht dafür keine Anmeldung und keinen
   Schlüssel.
   ------------------------------------------------------------- */

// HIER ANPASSEN: deine Stadt und ihre Koordinaten.
// Koordinaten findest du z. B., wenn du bei Google Maps einen Rechtsklick
// auf deinen Ort machst – die erste Zahl ist der Breitengrad, die zweite
// der Längengrad.
const STADT = "Hamburg-Barmbek";
const BREITENGRAD = 53.604;   // Barmbek-Nord
const LAENGENGRAD = 10.040;

// Open-Meteo liefert das Wetter als Zahlencode (z. B. 3 = bewölkt).
// Diese Funktion übersetzt den Code in ein Emoji und einen deutschen Text.
function wetterBeschreibung(code, istTag) {
  if (code === 0) return istTag ? ["☀️", "sonnig"] : ["🌙", "klar"];
  if (code <= 2) return istTag ? ["🌤️", "leicht bewölkt"] : ["☁️", "leicht bewölkt"];
  if (code === 3) return ["☁️", "bewölkt"];
  if (code <= 48) return ["🌫️", "neblig"];
  if (code <= 57) return ["🌦️", "Nieselregen"];
  if (code <= 67) return ["🌧️", "Regen"];
  if (code <= 77) return ["❄️", "Schnee"];
  if (code <= 82) return ["🌧️", "Regenschauer"];
  if (code <= 86) return ["🌨️", "Schneeschauer"];
  return ["⛈️", "Gewitter"]; // Codes 95–99
}

// "async" bedeutet: Diese Funktion darf auf Antworten aus dem Internet warten.
async function ladeWetter() {
  const wetterIcon = document.getElementById("weather-icon");
  const wetterText = document.getElementById("weather-text");

  // Die Internetadresse, bei der wir das Wetter abfragen.
  // Hinter dem "?" stehen unsere Wünsche: Ort und welche Werte wir wollen.
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + BREITENGRAD +
    "&longitude=" + LAENGENGRAD +
    "&current=temperature_2m,weather_code,is_day" +
    "&timezone=auto";

  try {
    // fetch() schickt die Anfrage los, "await" wartet auf die Antwort
    const antwort = await fetch(url);

    // Hat der Server einen Fehler gemeldet? Dann zum "catch"-Teil springen.
    if (!antwort.ok) {
      throw new Error("Serverfehler " + antwort.status);
    }

    // Die Antwort ist im JSON-Format → in ein JavaScript-Objekt umwandeln
    const daten = await antwort.json();

    // Die benötigten Werte herausholen
    const temperatur = Math.round(daten.current.temperature_2m); // runden: 12.4 → 12
    const code = daten.current.weather_code;
    const istTag = daten.current.is_day === 1;

    // Code in Emoji + Text übersetzen
    const [emoji, beschreibung] = wetterBeschreibung(code, istTag);

    // Ergebnis auf der Seite anzeigen
    wetterIcon.textContent = emoji;
    wetterText.textContent = "In " + STADT + " ist es gerade " + temperatur + " °C und " + beschreibung + ".";
  } catch (fehler) {
    // Falls etwas schiefgeht (z. B. kein Internet), freundliche Meldung zeigen
    wetterIcon.textContent = "🤷";
    wetterText.textContent = "Das Wetter konnte gerade nicht geladen werden.";
    console.error("Wetter-Fehler:", fehler); // Details für dich in der Browser-Konsole
  }
}

ladeWetter();


/* -------------------------------------------------------------
   7. NEU: INTERAKTIVE KARTE VON HAMBURG
   Benutzt die Bibliothek "Leaflet" (in index.html eingebunden)
   und Kartenbilder von OpenStreetMap.
   ------------------------------------------------------------- */
function zeigeKarte() {
  // Sicherheitsprüfung: Falls Leaflet nicht geladen werden konnte
  // (z. B. kein Internet), brechen wir ab, statt einen Fehler zu werfen.
  // "L" ist der Name, unter dem Leaflet sich im Browser anmeldet.
  if (typeof L === "undefined") {
    document.getElementById("map").textContent = "Die Karte konnte nicht geladen werden.";
    return;
  }

  // Karte im <div id="map"> erstellen.
  // setView([Breitengrad, Längengrad], Zoomstufe): 1 = ganze Welt, 18 = einzelne Häuser
  const karte = L.map("map", {
    scrollWheelZoom: false // Mausrad zoomt NICHT – sonst bleibt man beim Scrollen der Seite in der Karte hängen
  }).setView([53.575, 10.015], 12);

  // Die eigentlichen Kartenbilder ("Kacheln") von OpenStreetMap laden.
  // Die Quellenangabe (attribution) ist bei OpenStreetMap Pflicht.
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(karte);

  // Stecknadel 1: mein Viertel. bindPopup = Text, der beim Anklicken erscheint.
  // openPopup() öffnet ihn gleich beim Laden.
  L.marker([BREITENGRAD, LAENGENGRAD]) // nutzt die Koordinaten aus dem Wetter-Teil
    .addTo(karte)
    .bindPopup("<strong>🏠 Barmbek-Nord</strong><br>Hier wohne ich.")
    .openPopup();

  // Stecknadel 2: der Ort, an dem das Foto entstanden ist
  L.marker([53.5444, 9.9927])
    .addTo(karte)
    .bindPopup("<strong>📷 Speicherstadt</strong><br>Hier entstand das Foto.");

  // HIER ANPASSEN: Weitere Lieblingsorte kannst du genauso hinzufügen, z. B.:
  // L.marker([53.5413, 9.9841]).addTo(karte).bindPopup("Elbphilharmonie");
}

zeigeKarte();
