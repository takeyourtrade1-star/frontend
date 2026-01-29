# Dati da Salvare in Fase di Registrazione

## 📋 Riepilogo Completo

Questo documento elenca tutti i dati che vengono raccolti e inviati durante il processo di registrazione del frontend.

---

## 🔐 Dati Obbligatori (Sempre Richiesti)

### 1. Tipo Account
- **Campo DB**: `account_type`
- **Tipo**: `ENUM('personal', 'private')` 
- **Nota**: Il frontend invia `'business'` che viene convertito in `'private'` per il backend AWS
- **Valori**: 
  - `'personal'` - Account personale
  - `'private'` - Account business/aziendale (backend usa 'private' invece di 'business')

### 2. Dati Geografici
- **Campo DB**: `country`
- **Tipo**: `VARCHAR(2)` (codice ISO paese, es. 'IT', 'FR', 'DE')
- **Esempio**: 'IT', 'FR', 'DE', 'ES', 'GB', 'US', 'CH', 'AT', 'BE', 'NL'

- **Campo DB**: `phone_prefix`
- **Tipo**: `VARCHAR(5)` (prefisso telefonico internazionale)
- **Esempio**: '+39', '+33', '+49', '+34', '+44', '+1', '+41', '+43', '+32', '+31'
- **Nota**: Correlato al paese selezionato

- **Campo DB**: `vat_prefix` (opzionale, solo per business)
- **Tipo**: `VARCHAR(2)` (prefisso IVA del paese)
- **Esempio**: 'IT', 'FR', 'DE', ecc.
- **Nota**: Usato per validare P.IVA per account business

### 3. Dati di Contatto
- **Campo DB**: `email`
- **Tipo**: `VARCHAR(255)` UNIQUE
- **Validazione**: Formato email valido, verifica unicità
- **Nota**: Viene inviata email di verifica dopo la registrazione

- **Campo DB**: `phone` o `telefono`
- **Tipo**: `VARCHAR(20)`
- **Nota**: Il frontend invia `phone`, ma il backend potrebbe accettare anche `telefono` per retrocompatibilità
- **Formato**: Solo numeri, spazi, +, -, parentesi (pulito lato frontend)

### 4. Credenziali di Accesso
- **Campo DB**: `username`
- **Tipo**: `VARCHAR(50)` UNIQUE
- **Validazione**: 
  - Alphanumerico + underscore
  - Lunghezza: 3-20 caratteri
  - Pattern: `/^[a-zA-Z0-9_]{3,20}$/`
  - Verifica unicità

- **Campo DB**: `password` (hash)
- **Tipo**: `VARCHAR(255)` (hash bcrypt/argon2)
- **Validazione Frontend**:
  - Minimo 8 caratteri
  - Almeno 1 maiuscola
  - Almeno 1 minuscola
  - Almeno 1 numero
  - Pattern: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/`
- **Nota**: NON salvare mai la password in chiaro, solo hash

- **Campo Frontend**: `password_confirmation`
- **Tipo**: Non salvato nel DB
- **Validazione**: Deve corrispondere a `password`
- **Nota**: Usato solo per validazione lato frontend/backend

---

## 👤 Dati Account Personale (account_type = 'personal')

### Dati Identità
- **Campo DB**: `first_name` o `nome`
- **Tipo**: `VARCHAR(100)`
- **Nota**: Il backend AWS accetta sia `first_name` che `nome` come varianti
- **Frontend**: Raccolto come `nome`, inviato come `first_name`

- **Campo DB**: `last_name` o `cognome`
- **Tipo**: `VARCHAR(100)`
- **Nota**: Il backend AWS accetta sia `last_name` che `cognome` come varianti
- **Frontend**: Raccolto come `cognome`, inviato come `last_name`

---

## 🏢 Dati Account Business/Private (account_type = 'private')

### Dati Aziendali
- **Campo DB**: `ragione_sociale`
- **Tipo**: `VARCHAR(255)`
- **Descrizione**: Nome ufficiale dell'azienda
- **Esempio**: "Azienda Test SRL", "Mario Rossi & Co."

- **Campo DB**: `piva` o `partita_iva`
- **Tipo**: `VARCHAR(20)`
- **Validazione**: 
  - Deve essere valida per il paese selezionato
  - Prefisso IVA (`vat_prefix`) viene aggiunto automaticamente dal frontend
- **Esempio**: "12345678901" (per IT), "FR12345678901" (per FR)
- **Nota**: Il frontend mostra il prefisso ma invia solo il numero

---

## 🛡️ Campi di Sicurezza e Anti-Spam

### Honeypot Field
- **Campo Frontend**: `website_url`
- **Tipo**: Stringa vuota `''`
- **Obbligatorio**: Sì (sempre inviato)
- **Validazione Backend**: Deve essere stringa vuota, altrimenti rifiuta la richiesta
- **Scopo**: Protezione anti-bot/spam
- **Nota**: Non viene salvato nel database

---

## ✅ Termini e Condizioni (Solo Frontend)

**IMPORTANTE**: Questi dati vengono raccolti lato frontend ma NON vengono inviati al backend durante la registrazione. Devono essere salvati separatamente per compliance legale.

### Checkbox Accettazione
- **Campo Frontend**: `termsAccepted`
- **Tipo**: `BOOLEAN`
- **Descrizione**: Accettazione Termini di Servizio
- **Link**: `/legal/terms`

- **Campo Frontend**: `privacyAccepted`
- **Tipo**: `BOOLEAN`
- **Descrizione**: Accettazione Privacy Policy
- **Link**: `/legal/privacy`

- **Campo Frontend**: `cancellationAccepted`
- **Tipo**: `BOOLEAN`
- **Descrizione**: Accettazione Politica di Cancellazione
- **Link**: `/legal/cancellation`

- **Campo Frontend**: `adultConfirmed`
- **Tipo**: `BOOLEAN`
- **Descrizione**: Conferma di essere maggiorenne (18+ anni)

**Raccomandazione DB**: Creare una tabella separata `user_consents` o aggiungere campi alla tabella `users`:
```sql
terms_accepted_at TIMESTAMP NULL,
privacy_accepted_at TIMESTAMP NULL,
cancellation_accepted_at TIMESTAMP NULL,
adult_confirmed_at TIMESTAMP NULL,
```

---

## 📤 Payload Completo Invio API

### Account Personale
```json
{
  "account_type": "personal",
  "country": "IT",
  "phone_prefix": "+39",
  "phone": "3331234567",
  "email": "mario.rossi@example.com",
  "username": "mario_rossi",
  "password": "Password123",
  "password_confirmation": "Password123",
  "first_name": "Mario",
  "last_name": "Rossi",
  "website_url": ""
}
```

### Account Business/Private
```json
{
  "account_type": "private",
  "country": "IT",
  "phone_prefix": "+39",
  "phone": "3331234567",
  "email": "info@azienda.it",
  "username": "azienda_test",
  "password": "Password123",
  "password_confirmation": "Password123",
  "ragione_sociale": "Azienda Test SRL",
  "piva": "12345678901",
  "website_url": ""
}
```

---

## 🗄️ Struttura Database Consigliata

### Tabella `users`
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  
  -- Credenziali
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Tipo Account
  account_type ENUM('personal', 'private') NOT NULL,
  
  -- Dati Geografici
  country VARCHAR(2) NOT NULL,
  phone_prefix VARCHAR(5) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  vat_prefix VARCHAR(2) NULL, -- Solo per business
  
  -- Dati Personali (se account_type = 'personal')
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  
  -- Dati Aziendali (se account_type = 'private')
  ragione_sociale VARCHAR(255) NULL,
  piva VARCHAR(20) NULL,
  
  -- Verifica Email
  email_verified_at TIMESTAMP NULL,
  email_verification_code VARCHAR(10) NULL,
  email_verification_expires_at TIMESTAMP NULL,
  
  -- MFA (Multi-Factor Authentication)
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255) NULL,
  
  -- Status Account
  is_active BOOLEAN DEFAULT TRUE,
  account_status VARCHAR(50) DEFAULT 'pending_verification',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indici
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_account_type (account_type),
  INDEX idx_country (country),
  INDEX idx_created_at (created_at)
);
```

### Tabella `user_consents` (per compliance legale)
```sql
CREATE TABLE user_consents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  
  -- Consensi
  terms_accepted_at TIMESTAMP NULL,
  privacy_accepted_at TIMESTAMP NULL,
  cancellation_accepted_at TIMESTAMP NULL,
  adult_confirmed_at TIMESTAMP NULL,
  
  -- IP e User Agent (per audit)
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

---

## ✅ Validazioni Backend Richieste

### Validazioni Obbligatorie

1. **Email**:
   - Formato valido
   - Unicità (non deve esistere già)
   - Verifica dominio (opzionale ma consigliato)

2. **Username**:
   - Pattern: alphanumerico + underscore, 3-20 caratteri
   - Unicità (non deve esistere già)
   - Non deve contenere parole riservate

3. **Password**:
   - Minimo 8 caratteri
   - Almeno 1 maiuscola, 1 minuscola, 1 numero
   - Hash sicuro (bcrypt/argon2)

4. **Phone**:
   - Formato valido per il paese
   - Verifica con prefisso telefonico

5. **P.IVA** (solo per business):
   - Validazione formale per il paese selezionato
   - Unicità (opzionale, dipende dalla policy)

6. **Honeypot**:
   - `website_url` deve essere stringa vuota
   - Se contiene dati, rifiutare la richiesta (probabile bot)

---

## 🔄 Flusso Post-Registrazione

Dopo la registrazione, il backend deve:

1. **Creare l'utente** nel database con tutti i dati
2. **Generare hash password** (mai salvare in chiaro)
3. **Generare codice verifica email** (6-10 caratteri alfanumerici)
4. **Inviare email di verifica** con link/codice
5. **Salvare consensi** nella tabella `user_consents` (se implementata)
6. **Impostare status** a `pending_verification`
7. **Rispondere al frontend** con:
   - `access_token` (opzionale, se si vuole auto-login)
   - `user` object (senza dati sensibili)
   - Messaggio di successo

---

## 📝 Note Importanti

1. **Account Type**: Il frontend invia `'business'` ma il backend AWS si aspetta `'private'`. Convertire durante la validazione.

2. **Nomi Campi**: Il backend AWS accetta varianti:
   - `first_name` o `nome` per nome
   - `last_name` o `cognome` per cognome
   - `phone` o `telefono` per telefono

3. **Password**: Mai loggare o salvare in chiaro. Usare sempre hash sicuro.

4. **Email Verification**: Implementare sistema di verifica email con codice temporaneo (scadenza 24-48h).

5. **MFA**: Campo presente ma non implementato nella registrazione iniziale. Può essere abilitato successivamente.

6. **Consensi**: I checkbox dei termini NON vengono inviati al backend ma devono essere salvati per compliance GDPR/legale.

7. **Honeypot**: Campo `website_url` sempre vuoto, usato per anti-spam.

---

## 🚀 Endpoint API Backend

**POST** `/api/auth/register`

**Request Body**: Vedi payload sopra

**Response Success (200/201)**:
```json
{
  "success": true,
  "message": "Registrazione completata. Verifica la tua email.",
  "data": {
    "user": {
      "id": 1,
      "username": "mario_rossi",
      "email": "mario.rossi@example.com",
      "account_type": "personal",
      "verified": false,
      "email_verified_at": null,
      "created_at": "2026-01-27T10:00:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Opzionale
    "refresh_token": "..." // Opzionale
  }
}
```

**Response Error (422 - Validation)**:
```json
{
  "success": false,
  "message": "Errori di validazione",
  "errors": {
    "email": ["L'email è già registrata"],
    "username": ["Lo username è già in uso"],
    "password": ["La password deve contenere almeno 8 caratteri"]
  }
}
```

**Response Error (429 - Rate Limit)**:
```json
{
  "success": false,
  "message": "Troppi tentativi, riprova più tardi"
}
```

---

## 📌 Checklist Implementazione Backend

- [ ] Creare tabella `users` con tutti i campi
- [ ] Creare tabella `user_consents` per compliance
- [ ] Implementare validazione email (formato + unicità)
- [ ] Implementare validazione username (formato + unicità)
- [ ] Implementare validazione password (forza + hash sicuro)
- [ ] Implementare validazione telefono (formato + prefisso)
- [ ] Implementare validazione P.IVA per business (formato paese)
- [ ] Implementare honeypot check (`website_url` vuoto)
- [ ] Generare codice verifica email
- [ ] Inviare email di verifica
- [ ] Salvare consensi utente
- [ ] Gestire errori di validazione (422)
- [ ] Implementare rate limiting (429)
- [ ] Logging eventi registrazione (per audit)
- [ ] Test con dati validi
- [ ] Test con dati invalidi
- [ ] Test honeypot (rifiutare se `website_url` non vuoto)

---

**Ultima modifica**: 27 Gennaio 2026
**Versione**: 1.0
