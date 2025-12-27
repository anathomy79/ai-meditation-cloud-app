# KI-gestützte Meditations-App – Architektur & Systembeschreibung
**Option A: Google Cloud (Cloud-only, skalierbar, LLM-flexibel)**

---

## 1. Systembeschreibung

Die KI-gestützte Meditations-App ist als **Cloud-only-System** konzipiert. Die mobile App (Flutter für iOS und Android) fungiert als schlanker Client, während sämtliche rechenintensiven und sicherheitsrelevanten Funktionen in der Cloud ausgeführt werden. Dazu zählen die Generierung personalisierter Meditationsinhalte mittels Large Language Models (LLMs), Sprachsynthese (Text-to-Speech), Sicherheits- und Krisenerkennung, Speicherung von Nutzerfortschritten sowie Personalisierungslogik.

Ziel ist es, Nutzer*innen ohne Content-Suche unmittelbar eine passende Meditation bereitzustellen („One Tap → Meditation“). Die Inhalte entstehen **on demand**, kontextabhängig (Stimmung, Ziel, Tageszeit) und passen sich langfristig an das Nutzungsverhalten an. Die Architektur ist vollständig serverlos, hoch skalierbar, DSGVO-konform und so gestaltet, dass KI-Anbieter flexibel ausgetauscht werden können, ohne Änderungen an der App.

---

## 2. Architekturprinzipien

- **Cloud-only:** Keine KI- oder Geschäftslogik auf dem Endgerät  
- **Serverless-first:** Automatische Skalierung, geringe Fixkosten  
- **Thin Client:** Mobile App = UI + API Calls  
- **LLM-Abstraktion:** Austauschbare KI-Provider im Backend  
- **Privacy by Design:** Datenminimierung, Consent, Verschlüsselung  
- **Safety-first:** Krisenerkennung & Eskalationspfade integriert  

---

## 3. Hauptkomponenten

### 3.1 Mobile App (Flutter)
- Plattformübergreifend (iOS / Android)
- Funktionen:
  - Meditation starten
  - Mood Check-ins
  - Coach-Chat
  - Audio-Playback
- Firebase SDK für Authentifizierung
- Kommunikation ausschließlich via HTTPS mit dem Backend

---

### 3.2 Firebase Authentication
- Nutzer-Login (E-Mail, SSO, später optional)
- Ausgabe von Firebase ID Tokens (JWT)
- Grundlage für:
  - Zugriffskontrolle
  - Entitlements (Free / Premium)
  - DSGVO-konforme Identifikation

---

### 3.3 Backend (Google Cloud Run – ein Service)
- Node.js / TypeScript (z. B. Fastify oder Express)
- Aufgaben:
  - Verifikation der Firebase ID Tokens
  - Safety-Precheck & Output-Filtering
  - Orchestrierung von LLM & TTS
  - Speicherung von Sessions und Metadaten
  - Quota- & Abo-Logik
- Vollständig serverlos:
  - Auto-Scaling (inkl. scale-to-zero)
  - Keine Serverwartung

---

### 3.4 Datenbank (Cloud Firestore)
- NoSQL-Datenbank für:
  - Nutzerprofile & Preferences
  - Sessions
  - Mood-Logs
  - (Optional) Chatverläufe
- Vorteile:
  - Echtzeitfähig
  - Schemaflexibel
  - Offline-Sync für Mobile Apps

**Beispiel-Collections:**
- `users/{uid}`
- `sessions/{sessionId}`
- `moods/{moodId}`
- `chats/{uid}/messages/{msgId}`

---

### 3.5 Storage (Firebase Storage)
- Speicherung generierter Audio-Dateien (MP3/OGG)
- Zugriff:
  - kontrollierte URLs oder Signed URLs
- Skalierbare Auslieferung großer Dateien

---

## 4. KI-Komponenten

### 4.1 Large Language Models (LLM)
- Standard: **Google Gemini**
- Optional: OpenAI oder weitere Anbieter
- Nutzung:
  - Generierung von Meditationsskripten
  - Coach-Chat (dialogorientiert)
  - Optionale Sentiment-/Textanalyse

**Wichtig:**  
Die App kennt **keinen** KI-Anbieter.  
Das Backend entscheidet per Konfiguration oder Feature Flag.

---

### 4.2 LLM-Routing (Backend-intern)
- Einheitliches LLM-Interface
- Routing-Kriterien:
  - Task (Meditation / Chat / Safety)
  - Kosten
  - Qualität
  - A/B-Tests
- Vorteile:
  - Kein Vendor Lock-in
  - Austausch von Modellen ohne App-Update
  - Failover möglich

---

### 4.3 Text-to-Speech (Google Cloud TTS)
- Wandelt Meditationsskripte in Audio
- Auswahl von:
  - Sprache
  - Stimme
  - Sprechtempo
- Sehr geringe Latenz, hohe Skalierbarkeit

---

## 5. Safety-Layer & Ethik

Die App ist **kein Therapieersatz**.  
Ein Safety-Layer ist fester Bestandteil der Architektur.

### Funktionen:
- Precheck von Nutzereingaben (Keywords, Muster)
- Analyse von KI-Ausgaben
- Erkennung von:
  - Suizidgedanken
  - akuten Krisen
  - Selbstverletzungsbezug
- Eskalation:
  - Abbruch normaler KI-Antworten
  - Einfühlsame Krisenhinweise
  - Verweis auf professionelle Hilfe

Die KI gibt **keine Diagnosen** und **keine medizinischen Empfehlungen**.

---

## 6. Haupt-Workflows

### 6.1 Meditation starten
1. App → Backend (`POST /v1/sessions`)
2. Auth-Check (Firebase Token)
3. Safety-Precheck
4. LLM generiert Meditationsskript
5. TTS erzeugt Audio
6. Audio → Storage
7. Metadaten → Firestore
8. Backend → App (Audio-URL + Transcript)

---

### 6.2 Coach-Chat
1. App → Backend (`POST /v1/chat`)
2. Safety-Precheck
3. LLM generiert Antwort
4. Output-Check
5. Antwort → App

---

### 6.3 Mood-Tracking
1. App → Backend (`POST /v1/mood`)
2. Sentiment-/Label-Analyse
3. Speicherung (minimierte Daten)
4. Visualisierung in der App

---

## 7. Skalierbarkeit & Betrieb

- Cloud Run:
  - horizontale Skalierung
  - hohe Peaks problemlos
- Firestore & Storage:
  - managed Scaling
- Kosten:
  - nutzungsbasiert
  - gut geeignet für Freemium
- Monitoring:
  - Cloud Logging
  - Error Reporting

---

## 8. Datenschutz & DSGVO

- HTTPS überall
- Verschlüsselung in Transit & at Rest
- Datenminimierung:
  - Standard: Labels/Scores statt Rohtexte
- Opt-in für sensible Inhalte
- Rechte der Nutzer:
  - Export
  - Löschung
- Secrets:
  - Google Secret Manager
- EU-Regionen für Datenhaltung

---

## 9. Zusammenfassung

Diese Architektur ermöglicht eine **leichtgewichtige, hoch skalierbare und zukunftssichere KI-Meditations-App**. Durch die konsequente Nutzung von Google Cloud Services, eine flexible LLM-Abstraktion und einen integrierten Safety-Layer kann ein kleines Team schnell iterieren, neue KI-Funktionen integrieren und gleichzeitig Datenschutz und ethische Standards einhalten.

Die App bleibt einfach für Nutzer*innen – die Komplexität liegt dort, wo sie hingehört: in einer sicheren, skalierbaren Cloud-Architektur.
