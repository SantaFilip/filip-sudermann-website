# Operator-HQ

Das ist das Hauptquartier eines Growth Operators aus dem Growth Operator
Accelerator. Jede Claude-Session in diesem Ordner liest zuerst diese Datei.

## Wer hier arbeitet

Alles über den Operator steht in `profil.md` (Name, Story, Nische, Proof).
Lies sie zu Beginn jeder Session.

**Wenn `profil.md` noch unausgefüllt ist, starte das Onboarding:** Stelle die
folgenden Fragen EINZELN nacheinander (nicht alle auf einmal) und trage die
Antworten direkt in `profil.md` ein:
1. Wie heißt du und was hast du bisher gemacht (Job, Ausbildung, Projekte)?
2. In welchen Themen kennst du dich richtig gut aus oder brennst dafür?
3. Welche Menschen verstehst du besonders gut (weil du selbst mal da warst)?
4. Sprichst du außer Deutsch weitere Sprachen fließend?
5. Wie viele Stunden pro Woche kannst du investieren?

Leite danach **3 konkrete Nischen-Vorschläge** ab (je 1 Satz Begründung: warum
sie zu Hintergrund und Zielgruppen-Verständnis passt und wo es dort
unter-monetarisierte Creator gibt). Lass den Operator wählen oder kombinieren
und trage die finale Nische in `profil.md` ein.

## Ordnerstruktur

```
profil.md            wer der Operator ist (Nische, Story, Proof, Kontakt)
creator-liste.md     die Creator-Liste mit Status, dein Tracker (/creator-finder)
creators/<name>/     ein Ordner pro Creator: voice.md, avatar.md, offer.md
outreach/            Nachrichten-Entwürfe pro Creator
analysen/            die Loom-Boards pro Creator (/creator-analyse)
launches/            Steckbrief, Wartelisten-Seite, Stories, E-Mails, WhatsApp, VSL, Verkaufsseite
```

Neue Creator-Ordner immer aus `creators/_vorlage/` kopieren.

## Die Skills (Slash-Befehle)

Outreach, in dieser Reihenfolge:
- `/creator-finder` findet Creator in der Nische über vidIQ, mit Score
- `/creator-analyse` baut das Loom-Board für einen konkreten Creator
- `/outreach-writer` schreibt Nachrichten, Follow-ups und Call-Preps

Launch, sobald ein Creator gewonnen ist, in dieser Reihenfolge:
- `/wartelisten-funnel` baut den Wartelisten-Funnel: Opt-in mit GHL-Formular,
  Umfrage-Seite mit dem Market-Research-Typeform, WhatsApp-Seite
- `/stories-vor-launch`, `/emails-vor-launch`, `/whatsapp-vor-launch` schreiben
  die drei Kanäle für die 21 Tage bis zum Launch (Whisper, Tease, Shout)
- `/vsl-script` schreibt das Verkaufsvideo-Skript
- `/sales-funnel` baut die Verkaufsseite plus Danke-Seite, fragt zuerst Low-Ticket oder Hochpreis
- `/stories-launch`, `/emails-launch`, `/whatsapp-launch` schreiben die drei
  Kanäle für die Launch-Woche (Tag 0 bis Schluss)
- Alle sechs Launch-Skills lesen und pflegen denselben Launch-Steckbrief:
  `creators/<name>/launches/launch-steckbrief.md`

Immer:
- `/frag` findet jede Antwort im Kursmaterial, mit Video-Link und Minute

Werkzeuge (MCPs): vidIQ liefert echte YouTube-Daten. Ohne verbundenes vidIQ
keine Creator-Recherche mit Zahlen.

## Spielregeln (nicht verhandelbar)

1. **Entwerfen statt senden.** Claude schreibt Nachrichten, Mails und Posts nur
   als Entwurf. Gesendet wird ausschließlich vom Operator selbst.
2. **Echte Daten only.** Zahlen kommen aus vidIQ oder vom Operator. Niemals
   Reichweiten, Umsätze oder Ergebnisse erfinden. Fehlt ein Wert: "k.A."
3. **Keine Gedankenstriche** (— oder –) in Outreach-Texten. Punkt, Komma,
   Doppelpunkt oder " - ".
4. **Keine Termine/Daten in Copy**, die wiederverwendet wird.
5. **Fremder Proof ist fremder Proof.** Ergebnisse aus der Community dürfen als
   "das Team, mit dem ich arbeite" erwähnt werden, nie als eigene.
6. Dateien und Reports sind `YYYY-MM-DD_<thema>` benannt, damit alles sortiert.

## Arbeitsweise

Antworte auf Deutsch, per Du, direkt und praktisch. Kurze Absätze. Wenn eine
Aufgabe zu einem Skill passt, nutze den Skill statt zu improvisieren.

## Einrichtung beim ersten Start

Wenn der Operator "Richte mein Operator-HQ ein" sagt (oder eine ähnliche Bitte),
mach der Reihe nach:

1. **Skills installieren.** Im Unterordner `skills/` liegen fertige Skill-Ordner.
   Kopiere jeden davon nach `~/.claude/skills/` (Ordner anlegen, falls er fehlt).
   Danach `skills/` im HQ liegen lassen, das ist die Sicherungskopie.
2. **Profil ausfüllen.** Geh `profil.md` durch und frag die leeren Punkte einzeln
   ab, nicht alle auf einmal. Trag die Antworten direkt ein. Ist das Profil schon
   gefüllt (Update-Fall), überspring diesen Schritt und sag nur, was neu dazukam.
3. **Abschluss.** Sag dem Operator, dass er Claude Code einmal neu starten soll,
   damit die Werkzeuge geladen werden. Nenne ihm die Befehle, die er jetzt hat
   (Outreach zuerst, Launch kommt, wenn er einen Creator gewonnen hat) und seinen
   nächsten Schritt: `/creator-finder [seine Nische] deutschland 50k-500k`

Beim Update auf eine neue Version: dieselben Schritte, nur neue Werkzeuge
dazukopieren, nichts von seinen eigenen Dateien anfassen.

Sprache im ganzen HQ: Deutsch mit korrekten Umlauten (ä, ö, ü, ß), keine
Gedankenstriche.

## Der Ablauf im Outreach

Immer diese Reihenfolge, sie entspricht dem Kurs:

1. **Creator finden** mit `/creator-finder`. Ergebnis ist `creator-liste.md`,
   die gepflegte Liste des Operators. Sie ist der Tracker, es gibt kein
   separates Board. Wer Notion nutzt, pflegt es dort und gibt Claude die Liste.
2. **Loom-Board bauen** mit `/creator-analyse`, für die besten Kandidaten aus
   der Liste. Darauf nimmt der Operator sein Loom auf.
3. **Nachricht schreiben** mit `/outreach-writer`, mit dem Loom-Link darin.
4. Später: **Follow-ups** und **Call-Vorbereitung**, ebenfalls
   `/outreach-writer`. Der Status wird in `creator-liste.md` fortgeschrieben.
