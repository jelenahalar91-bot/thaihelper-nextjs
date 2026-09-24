# Auto-Antwort auf Agentur-Anfragen (Gmail)

Beantwortet automatisch Mails, in denen jemand ThaiHelper für eine
Vermittlungsagentur hält — und Bewerbungen, die per Mail statt über die
Registrierung kommen. Läuft als Google Apps Script im Konto
jelenahalar91@gmail.com, unabhängig davon ob der Laptop an ist.

Code: `scripts/gmail-auto-reply.gs`

## Einrichten (einmalig, ca. 10 Minuten)

1. https://script.google.com öffnen → **Neues Projekt**
2. Projekt oben umbenennen in `ThaiHelper Auto-Reply`
3. Den kompletten Inhalt von `scripts/gmail-auto-reply.gs` in den Editor
   kopieren (den vorhandenen `function myFunction()`-Rumpf vorher löschen)
4. Speichern (Diskettensymbol)
5. Oben in der Funktionsauswahl `installTrigger` wählen → **Ausführen**
6. Google fragt nach Berechtigung für Gmail → Konto wählen →
   „Erweitert" → „Zu ThaiHelper Auto-Reply wechseln (unsicher)" → **Zulassen**.
   Die Warnung erscheint, weil es ein eigenes, nicht von Google geprüftes
   Skript ist — das ist bei selbst geschriebenen Skripten normal.
7. Fertig. Das Skript läuft ab jetzt alle 10 Minuten.

## Erst beobachten, dann scharfstellen

`DRY_RUN` steht oben im Skript auf `true`. In diesem Zustand wird **keine
einzige Mail versendet**. Treffer bekommen nur das Label
`ThaiHelper/auto-kandidat`.

Nach ein paar Tagen in Gmail dieses Label durchsehen:

- Sind dort nur Agentur-Anfragen und Blind-Bewerbungen gelandet? → im Skript
  `var DRY_RUN = true;` auf `false` ändern, speichern. Ab dann wird gesendet.
- Ist etwas dabei, das eine persönliche Antwort gebraucht hätte? → Erst die
  Wortlisten anpassen, dann scharfstellen.

## Labels

| Label | Bedeutung |
|---|---|
| `ThaiHelper/auto-kandidat` | im DRY_RUN erkannt, nichts gesendet |
| `ThaiHelper/auto-beantwortet` | Auto-Antwort ist rausgegangen |

Die Mails bleiben **ungelesen im Posteingang**. Das Skript markiert nichts als
gelesen und archiviert nichts — es soll dir die Arbeit abnehmen, nicht die
Übersicht.

## Was das Skript nie tut

- Nie antworten, wenn im Thread schon eine Antwort steht (echtes Gespräch)
- Nie zweimal an dieselbe Adresse innerhalb von 30 Tagen (`COOLDOWN_DAYS`)
- Nie auf Newsletter, Bounces, `no-reply`-Adressen oder automatische Mails
  (Header-Prüfung auf `Auto-Submitted`, `List-Unsubscribe`, `Precedence: bulk`)
- Nie auf Vercel, Supabase, Resend, Trustpilot, Twilio, Stripe, Facebook
- Nie mehr als 10 Antworten pro Tag (`MAX_REPLIES_PER_DAY`, Notbremse gegen
  Mail-Schleifen)
- Nie antworten, wenn zwar eine Rolle („nanny", „housekeeper") vorkommt, aber
  keine klare Absicht erkennbar ist — z. B. Presseanfragen

## Notaus

Bei Problemen: script.google.com → das Projekt → links **Trigger** (Wecker-
symbol) → den Trigger löschen. Damit läuft sofort nichts mehr.

## Texte ändern

Die Antworttexte stehen in den Funktionen `familyReply_()` und
`helperReply_()`. Beide senden Text- und HTML-Teil, damit sie nicht als Spam
eingestuft werden.

## Prüfen, was passiert ist

script.google.com → Projekt → links **Ausführungen**. Dort steht pro Lauf, was
gesendet, übersprungen oder nur gelabelt wurde.
