# ✅ Checklist Test Frontend - API Collegate

## 🎯 Cosa Testare nel Frontend

### 📍 **1. LINGUA PREFERITA**

#### Test 1.1: Recupero Lingua Preferita
**Dove:** Dashboard (`/dashboard`) o qualsiasi pagina dopo login

**Cosa verificare:**
1. Fai login
2. Apri la console del browser (F12)
3. Cerca i log che iniziano con `🔍 LanguageContext`
4. Verifica che venga chiamato: `GET /api/profile/language`
5. Verifica che la lingua venga caricata correttamente
6. La lingua dovrebbe essere quella salvata nel profilo (o 'en' di default)

**Log attesi:**
```
🔍 LanguageContext - Chiamata API GET /profile/language
✅ LanguageContext - Lingua preferita caricata: it
```

#### Test 1.2: Cambio Lingua
**Dove:** Selettore lingua (probabilmente nell'header o nelle impostazioni)

**Cosa verificare:**
1. Cambia la lingua (es. da Italiano a English)
2. Apri la console del browser
3. Verifica che venga chiamato: `PUT /api/profile/language` con body `{ "language": "en" }`
4. Verifica che la lingua cambi immediatamente nell'interfaccia
5. Ricarica la pagina - la lingua dovrebbe essere persistita

**Log attesi:**
```
🔍 LanguageContext - Chiamata API PUT /profile/language con language: en
✅ LanguageContext - Lingua preferita aggiornata sul backend: en
```

**Endpoint testato:** `PUT /api/profile/language`

---

### 📍 **2. INDIRIZZI**

#### Test 2.1: Visualizzazione Indirizzi
**Dove:** Pagina Account → Indirizzi (`/account/addresses`)

**Cosa verificare:**
1. Vai su `/account/addresses`
2. Apri la console del browser (F12) → Network tab
3. Verifica che venga chiamato: `GET /api/addresses`
4. Verifica che vengano mostrati:
   - Indirizzo principale (se presente)
   - Indirizzi secondari (se presenti)

**Risposta attesa:**
```json
{
  "success": true,
  "data": {
    "main_address": { ... },
    "secondary_addresses": [ ... ],
    "total_addresses": 1
  }
}
```

**Endpoint testato:** `GET /api/addresses`

---

#### Test 2.2: Aggiornamento Indirizzo Principale
**Dove:** Pagina Account → Indirizzi (`/account/addresses`)

**Cosa verificare:**
1. Vai su `/account/addresses`
2. Clicca su "Modifica" sull'indirizzo principale
3. Modifica i campi (indirizzo, città, CAP, provincia, paese)
4. Clicca su "Salva"
5. Apri la console → Network tab
6. Verifica che venga chiamato: `PUT /api/addresses/main`
7. Verifica che l'indirizzo venga aggiornato nell'interfaccia

**Body atteso:**
```json
{
  "address": "Via Roma 1",
  "street": "Appartamento 5", // opzionale
  "city": "Milano",
  "postal_code": "20100",
  "province": "MI",
  "country": "Italia"
}
```

**Endpoint testato:** `PUT /api/addresses/main`

---

#### Test 2.3: Creazione Indirizzo Secondario
**Dove:** Pagina Account → Indirizzi (`/account/addresses`)

**Cosa verificare:**
1. Vai su `/account/addresses`
2. Clicca su "Aggiungi Indirizzo" o pulsante "+"
3. Compila il form:
   - Label (opzionale): "Ufficio"
   - Indirizzo: "Via Verdi 10" (OBBLIGATORIO)
   - Città: "Roma" (OBBLIGATORIO)
   - CAP: "00100" (OBBLIGATORIO)
   - Provincia: "RM" (OBBLIGATORIO)
   - Paese: "Italia" (OBBLIGATORIO)
   - Tipo: "shipping", "billing" o "other" (opzionale)
   - Note: "Consegna solo al mattino" (opzionale)
4. Clicca su "Salva"
5. Apri la console → Network tab
6. Verifica che venga chiamato: `POST /api/addresses`
7. Verifica che il nuovo indirizzo appaia nella lista

**Body atteso:**
```json
{
  "label": "Ufficio",
  "street_address": "Via Verdi 10",
  "street_address_2": "Piano 2", // opzionale
  "city": "Roma",
  "postal_code": "00100",
  "province": "RM",
  "country": "Italia",
  "is_default": false, // opzionale
  "address_type": "shipping", // opzionale
  "notes": "Consegna solo al mattino" // opzionale
}
```

**Endpoint testato:** `POST /api/addresses`

---

#### Test 2.4: Modifica Indirizzo Secondario
**Dove:** Pagina Account → Indirizzi (`/account/addresses`)

**Cosa verificare:**
1. Vai su `/account/addresses`
2. Trova un indirizzo secondario esistente
3. Clicca su "Modifica" (icona matita)
4. Modifica uno o più campi
5. Clicca su "Salva"
6. Apri la console → Network tab
7. Verifica che venga chiamato: `PUT /api/addresses/{id}` (dove {id} è l'ID dell'indirizzo)
8. Verifica che le modifiche vengano salvate

**Body atteso:**
```json
{
  "label": "Ufficio Nuovo",
  "street_address": "Via Verdi 20",
  "city": "Roma",
  // ... altri campi da aggiornare
}
```

**Endpoint testato:** `PUT /api/addresses/{id}`

---

#### Test 2.5: Eliminazione Indirizzo Secondario
**Dove:** Pagina Account → Indirizzi (`/account/addresses`)

**Cosa verificare:**
1. Vai su `/account/addresses`
2. Trova un indirizzo secondario esistente
3. Clicca su "Elimina" (icona cestino)
4. Conferma l'eliminazione
5. Apri la console → Network tab
6. Verifica che venga chiamato: `DELETE /api/addresses/{id}`
7. Verifica che l'indirizzo venga rimosso dalla lista

**Endpoint testato:** `DELETE /api/addresses/{id}`

---

### 👤 **3. PROFILO UTENTE**

#### Test 3.1: Visualizzazione Profilo
**Dove:** Pagina Account → Profilo (`/account/profile`)

**Cosa verificare:**
1. Vai su `/account/profile`
2. Apri la console → Network tab
3. Verifica che venga chiamato: `GET /api/profile`
4. Verifica che vengano mostrati tutti i dati del profilo:
   - Dati utente (email, username, account_type, ecc.)
   - Dati profilo (nome, cognome, città, indirizzo, ecc.)

**Risposta attesa:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "profile": { ... },
    "is_complete": true
  }
}
```

**Endpoint testato:** `GET /api/profile`

---

#### Test 3.2: Aggiornamento Profilo
**Dove:** Pagina Account → Profilo (`/account/profile`) o tab Profilo

**Cosa verificare:**
1. Vai su `/account/profile` o tab "Profilo"
2. Clicca su "Modifica" o entra in modalità modifica
3. Modifica uno o più campi:
   - Nome (first_name)
   - Cognome (last_name)
   - Città (city)
   - Bio (bio)
   - Data di nascita (birth_date)
   - Genere (gender)
   - Telefono (phone)
   - Prefisso telefono (phone_prefix)
4. Clicca su "Salva"
5. Apri la console → Network tab
6. Verifica che venga chiamato: `PUT /api/profile`
7. Verifica che le modifiche vengano salvate e mostrate

**Body atteso:**
```json
{
  "first_name": "Mario",
  "last_name": "Rossi",
  "city": "Roma",
  "bio": "Descrizione...",
  "birth_date": "1990-01-15",
  "gender": "M",
  "phone": "123456789",
  "phone_prefix": "+39"
}
```

**Endpoint testato:** `PUT /api/profile`

---

#### Test 3.3: Completamento Profilo (Prima Volta)
**Dove:** Banner "Completa il tuo profilo" (se visibile)

**Cosa verificare:**
1. Se vedi il banner "Completa il tuo profilo", clicca su di esso
2. Compila il form con:
   - Data di nascita
   - Città
   - Indirizzo
   - Via/Numero civico (opzionale)
   - CAP
   - Provincia
   - Paese
3. Clicca su "Salva"
4. Apri la console → Network tab
5. Verifica che venga chiamato: `POST /api/profile/complete`
6. Verifica che il banner scompaia dopo il salvataggio

**Body atteso:**
```json
{
  "birth_date": "1990-01-15",
  "city": "Milano",
  "address": "Via Roma 1",
  "street": "Appartamento 5", // opzionale
  "postal_code": "20100",
  "province": "MI",
  "country": "Italia"
}
```

**Endpoint testato:** `POST /api/profile/complete`

---

#### Test 3.4: Cambio Password
**Dove:** Pagina Account → Sicurezza (`/account/security`) o tab Sicurezza

**Cosa verificare:**
1. Vai su `/account/security` o tab "Sicurezza"
2. Compila il form cambio password:
   - Password attuale
   - Nuova password
   - Conferma nuova password
3. Clicca su "Salva" o "Cambia Password"
4. Apri la console → Network tab
5. Verifica che venga chiamato: `PUT /api/profile/password`
6. Verifica che venga mostrato un messaggio di successo

**Body atteso:**
```json
{
  "current_password": "vecchia123",
  "password": "nuova123",
  "password_confirmation": "nuova123"
}
```

**Endpoint testato:** `PUT /api/profile/password`

---

#### Test 3.5: Aggiornamento Stato Attività (Disponibile/Vacanza)
**Dove:** Pagina Account → Profilo (`/account/profile`)

**Cosa verificare:**
1. Vai su `/account/profile`
2. Trova il toggle o pulsante per lo stato attività
3. Cambia da "Disponibile" a "In Vacanza" (o viceversa)
4. Apri la console → Network tab
5. Verifica che venga chiamato: `PUT /api/profile/activity-status`
6. Verifica che lo stato venga aggiornato nell'interfaccia

**Body atteso:**
```json
{
  "activity_status": "vacanza" // o "disponibile"
}
```

**Endpoint testato:** `PUT /api/profile/activity-status`

---

## 🔍 **COME VERIFICARE GLI ENDPOINT**

### Metodo 1: Console Browser (Network Tab)
1. Apri DevTools (F12)
2. Vai su tab "Network"
3. Filtra per "XHR" o "Fetch"
4. Esegui l'azione nel frontend
5. Clicca sulla richiesta nella lista
6. Verifica:
   - **Request URL:** deve essere `https://api.buysellcard.it/api/...` (senza doppio `/api`)
   - **Request Method:** GET, POST, PUT, DELETE
   - **Request Headers:** deve contenere `Authorization: Bearer {token}`
   - **Request Payload:** verifica i dati inviati
   - **Response:** verifica la risposta del server

### Metodo 2: Console Browser (Console Tab)
1. Apri DevTools (F12)
2. Vai su tab "Console"
3. Cerca i log che iniziano con:
   - `🔍` per le chiamate API
   - `✅` per i successi
   - `❌` per gli errori

### Metodo 3: Verifica Errori
Se qualcosa non funziona:
1. Controlla la console per errori JavaScript
2. Controlla la tab Network per errori HTTP (status 400, 401, 422, 500)
3. Verifica che il token sia presente e valido
4. Verifica che l'URL sia corretto (senza doppio `/api`)

---

## ✅ **CHECKLIST RAPIDA**

- [ ] **Lingua:** Cambio lingua funziona e viene salvata
- [ ] **Indirizzi:** Visualizzazione indirizzi funziona
- [ ] **Indirizzi:** Modifica indirizzo principale funziona
- [ ] **Indirizzi:** Creazione indirizzo secondario funziona
- [ ] **Indirizzi:** Modifica indirizzo secondario funziona
- [ ] **Indirizzi:** Eliminazione indirizzo secondario funziona
- [ ] **Profilo:** Visualizzazione profilo funziona
- [ ] **Profilo:** Modifica profilo funziona
- [ ] **Profilo:** Completamento profilo funziona
- [ ] **Profilo:** Cambio password funziona
- [ ] **Profilo:** Cambio stato attività funziona

---

## 🚨 **ERRORI COMUNI DA VERIFICARE**

1. **401 Unauthorized:** Token mancante o scaduto → fai logout e login
2. **404 Not Found:** Endpoint non trovato → verifica che l'URL sia corretto
3. **422 Validation Error:** Dati non validi → verifica i campi obbligatori
4. **500 Server Error:** Errore backend → controlla i log del backend
5. **Doppio /api:** Se vedi `https://api.buysellcard.it/api/api/...` → c'è un errore nell'URL

---

## 📝 **NOTE**

- Tutte le API richiedono autenticazione (tranne login/register)
- Il token viene aggiunto automaticamente da `authApi`
- Gli URL sono corretti: `https://api.buysellcard.it/api/...` (senza doppio `/api`)
- Le risposte seguono il formato: `{ "success": true, "data": {...} }`



