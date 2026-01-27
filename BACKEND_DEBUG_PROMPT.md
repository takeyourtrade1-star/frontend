# Prompt per Analisi Problema Registrazione - Errore 500

## Problema
L'endpoint `/api/auth/register` restituisce sempre errore 500 (Internal Server Error) per tutte le richieste di registrazione, indipendentemente dai dati inviati.

## Dati Inviati (Corretti secondo documentazione AWS)
Il frontend invia i seguenti dati in formato JSON:

### Account Personale:
```json
{
  "account_type": "personal",
  "country": "IT",
  "phone_prefix": "+39",
  "phone": "3478812017",
  "email": "test@example.com",
  "username": "testuser123",
  "password": "password123",
  "password_confirmation": "password123",
  "first_name": "Mario",
  "last_name": "Rossi"
}
```

### Account Business/Private:
```json
{
  "account_type": "private",
  "country": "IT",
  "phone_prefix": "+39",
  "phone": "123456789",
  "email": "business@example.com",
  "username": "businessuser",
  "password": "password123",
  "password_confirmation": "password123",
  "ragione_sociale": "Azienda Test SRL",
  "piva": "12345678901"
}
```

## Risposta Errore
```json
{
  "success": false,
  "message": "Errore durante la registrazione",
  "error": null
}
```

**Status Code:** 500 Internal Server Error

## Cosa Controllare nel Backend Laravel/Lumen

### 1. Log Laravel
**File:** `storage/logs/laravel.log` o `storage/logs/production.log`

Cerca:
- Stack trace completo dell'errore
- Messaggi di errore specifici
- Eccezioni non gestite
- Errori di database

**Comando per vedere ultimi errori:**
```bash
tail -n 100 storage/logs/laravel.log | grep -A 20 "ERROR\|Exception\|500"
```

### 2. Controller Registrazione
**File:** Probabilmente `app/Http/Controllers/Auth/RegisterController.php` o simile

Controlla:
- Il metodo `register()` o `store()`
- Gestione delle eccezioni (try-catch)
- Validazione dei dati in ingresso
- Creazione utente e profilo

**Cosa cercare:**
```php
// Verifica se c'è un try-catch che nasconde l'errore reale
try {
    // ... codice registrazione
} catch (\Exception $e) {
    // ⚠️ Se qui c'è solo un log generico, l'errore reale è nascosto
    return response()->json([
        'success' => false,
        'message' => 'Errore durante la registrazione',
        'error' => null  // ⚠️ Questo nasconde l'errore!
    ], 500);
}
```

### 3. Validazione Request
**File:** Probabilmente `app/Http/Requests/RegisterRequest.php` o validazione nel controller

Controlla:
- Regole di validazione per tutti i campi
- Se `account_type` accetta `'private'` (non solo `'business'`)
- Se `phone` e `phone_prefix` sono validati correttamente
- Se `first_name`/`last_name` sono accettati (o solo `nome`/`cognome`)

### 4. Database e Migrazioni
**Comandi:**
```bash
php artisan migrate:status
php artisan db:show
```

Controlla:
- Se la tabella `users` esiste e ha tutte le colonne necessarie
- Se la tabella `user_profiles` esiste
- Se ci sono vincoli di foreign key che potrebbero fallire
- Se ci sono colonne NOT NULL senza default che potrebbero causare errori

**Query SQL per verificare struttura:**
```sql
DESCRIBE users;
DESCRIBE user_profiles;
SHOW CREATE TABLE users;
SHOW CREATE TABLE user_profiles;
```

### 5. Configurazione Email SMTP
**File:** `.env`

Nei log precedenti c'era un errore: `"SMTP configuration incomplete"` con mancanti: `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`

**Controlla:**
```env
MAIL_HOST=email-smtp.eu-west-1.amazonaws.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=your-ses-smtp-username
MAIL_PASSWORD=your-ses-smtp-password
MAIL_FROM_ADDRESS=noreply@anticipo.takeyourtrade.com
MAIL_FROM_NAME=Take Your Trade
```

**Se l'invio email fallisce durante la registrazione:**
- Verifica se il codice continua comunque o se blocca la registrazione
- Controlla se c'è un try-catch che gestisce l'errore email

### 6. Creazione Profilo Utente
**File:** Probabilmente in un Service o nel Controller

Controlla:
- Se il profilo viene creato dopo l'utente
- Se ci sono campi obbligatori nel profilo che non vengono passati
- Se `first_name` e `last_name` vengono mappati correttamente a `nome` e `cognome` (o viceversa)

**Cerca nel codice:**
```php
// Cerca dove viene creato il profilo
UserProfile::create([...]);
// o
$user->profile()->create([...]);
```

### 7. Transazioni Database
Controlla se la registrazione usa transazioni:
```php
DB::beginTransaction();
try {
    // crea utente
    // crea profilo
    // invia email
    DB::commit();
} catch (\Exception $e) {
    DB::rollBack();
    // ⚠️ Verifica cosa viene loggato qui
}
```

### 8. Eventi e Listener
**File:** `app/Events/` e `app/Listeners/`

Controlla se ci sono eventi che vengono triggerati durante la registrazione:
- `UserRegistered`
- `ProfileCreated`
- Altri eventi che potrebbero fallire

### 9. Middleware
**File:** `app/Http/Middleware/`

Controlla se ci sono middleware che potrebbero interferire:
- Rate limiting
- CORS
- Autenticazione (non dovrebbe essere necessario per /register)

### 10. Configurazione App
**File:** `.env` e `config/app.php`

Controlla:
- `APP_DEBUG=true` (temporaneamente per vedere errori dettagliati)
- `APP_ENV=production` vs `local`
- Timezone e locale

## Azioni Immediate da Fare

### 1. Abilita Debug Temporaneamente
Nel file `.env`:
```env
APP_DEBUG=true
APP_ENV=local
```

Questo mostrerà l'errore completo invece di un messaggio generico.

### 2. Aggiungi Log Dettagliato nel Controller
Nel metodo di registrazione, aggiungi:
```php
try {
    \Log::info('Registration attempt', ['data' => $request->all()]);
    
    // ... codice registrazione ...
    
} catch (\Exception $e) {
    \Log::error('Registration failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'data' => $request->all()
    ]);
    
    // ⚠️ NON nascondere l'errore! Mostra almeno il messaggio
    return response()->json([
        'success' => false,
        'message' => 'Errore durante la registrazione',
        'error' => config('app.debug') ? $e->getMessage() : null
    ], 500);
}
```

### 3. Testa Endpoint Direttamente
Usa Postman o cURL per testare:
```bash
curl -X POST https://api.buysellcard.it/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "account_type": "personal",
    "country": "IT",
    "phone_prefix": "+39",
    "phone": "123456789",
    "email": "test-direct@example.com",
    "username": "testdirect",
    "password": "password123",
    "password_confirmation": "password123",
    "first_name": "Test",
    "last_name": "Direct"
  }'
```

### 4. Verifica Route
**File:** `routes/web.php` o `routes/api.php`

Controlla che la route esista:
```php
Route::post('/auth/register', [RegisterController::class, 'register']);
```

## Possibili Cause Comuni

1. **Email SMTP non configurata** - Se l'invio email fallisce e blocca la registrazione
2. **Tabella user_profiles mancante o struttura errata** - Se il profilo non può essere creato
3. **Vincoli database** - Foreign key, unique constraints, NOT NULL senza default
4. **Mapping campi errato** - Il backend si aspetta `nome`/`cognome` invece di `first_name`/`last_name`
5. **Validazione fallita silenziosamente** - Validazione che fallisce ma non restituisce 422
6. **Transazione che fallisce** - Rollback che nasconde l'errore reale
7. **Evento/Listener che fallisce** - Evento che viene triggerato e causa errore
8. **Configurazione mancante** - Variabili d'ambiente non settate

## Output Atteso

Dopo l'analisi, fornisci:
1. **Stack trace completo** dell'errore dal log
2. **File e riga** dove avviene l'errore
3. **Messaggio errore specifico** (non generico)
4. **Causa root** del problema
5. **Fix proposto** con codice

## Note Importanti

- Il frontend invia i dati correttamente secondo la documentazione AWS
- L'endpoint `/api/auth/register` esiste e risponde (non è 404)
- Il problema è un errore 500 interno del server
- L'errore viene nascosto (error: null nella risposta)
- Tutti i test falliscono con lo stesso errore, indipendentemente dai dati



