# API Lingua Preferita – Cosa si aspetta il Frontend

Il frontend chiama l’**API Auth** (base URL: `VITE_AWS_AUTH_URL`, es. `http://35.152.141.53:8000`) per leggere e salvare la **lingua preferita** dell’utente.

Se il backend **non espone** questi endpoint, ricevi **404** e l’errore "Request failed with status code 404".  
Di seguito cosa deve implementare il backend per far funzionare la funzione Lingua.

---

## Base URL

Tutte le richieste partono da:

- **Base URL**: valore di `VITE_AWS_AUTH_URL` (es. `http://35.152.141.53:8000`)
- Le chiamate usano **Bearer token** (header `Authorization: Bearer <access_token>`) se l’utente è loggato.

---

## 1. GET – Leggere la lingua preferita

**Quando viene usata:**  
All’avvio (se l’utente è loggato) e dopo aver cambiato lingua, per verificare cosa ha salvato il backend.

| Campo   | Valore                    |
|--------|---------------------------|
| Metodo | `GET`                     |
| URL    | `/profile/language`       |
| Header | `Authorization: Bearer <token>` (se autenticato) |

**Risposta attesa (200):**

Il frontend si aspetta un JSON con la lingua dell’utente. Sono supportati due formati.

**Formato A – Con wrapper `success` / `data` (stile Laravel):**

```json
{
  "success": true,
  "data": {
    "language": "it",
    "language_name": "Italiano",
    "language_code": "it",
    "locale": "it_IT",
    "is_default": false
  }
}
```

**Formato B – Oggetto diretto (stile FastAPI):**

```json
{
  "language": "it",
  "language_name": "Italiano",
  "language_code": "it",
  "locale": "it_IT",
  "is_default": false
}
```

**Campi usati dal frontend:**

- **`language`** (obbligatorio): codice lingua preferita, es. `"it"`, `"en"`, `"de"`, `"fr"`, `"es"`, `"pt"`, `"ja"`.
- Gli altri (`language_name`, `language_code`, `locale`, `is_default`) sono opzionali; il frontend usa soprattutto `language`.

---

## 2. PUT – Salvare la lingua preferita

**Quando viene usata:**  
Quando l’utente cambia lingua (es. dal selettore in header o da Impostazioni → Lingua).

| Campo   | Valore                    |
|--------|---------------------------|
| Metodo | `PUT`                     |
| URL    | `/profile/language`       |
| Header | `Authorization: Bearer <token>` |
| Body   | `application/json`        |

**Body richiesto:**

```json
{
  "language": "it"
}
```

- **`language`**: codice lingua da salvare (es. `"it"`, `"en"`, `"de"`, `"fr"`, `"es"`, `"pt"`, `"ja"`).

**Risposta attesa (200):**

Stesso formato della GET (con o senza wrapper `success`/`data`), ad esempio:

```json
{
  "success": true,
  "data": {
    "language": "it",
    "language_name": "Italiano",
    "language_code": "it",
    "locale": "it_IT",
    "is_default": false
  }
}
```

oppure, in formato diretto:

```json
{
  "language": "it",
  "language_name": "Italiano",
  "language_code": "it",
  "locale": "it_IT",
  "is_default": false
}
```

---

## Riepilogo endpoint

| Metodo | Endpoint           | Scopo                          |
|--------|--------------------|---------------------------------|
| GET    | `/profile/language` | Leggere lingua preferita utente |
| PUT    | `/profile/language` | Salvare lingua preferita (body: `{ "language": "it" }`) |

**URL completo di esempio** (con base `http://35.152.141.53:8000`):

- GET: `http://35.152.141.53:8000/profile/language`
- PUT: `http://35.152.141.53:8000/profile/language`

Se questi endpoint **non esistono** (404), il frontend continua a usare la lingua salvata in **localStorage** e non blocca l’app; in Dashboard l’errore 404 per la lingua viene gestito e non mostrato come messaggio generico.

---

## Codici lingua supportati dal frontend

Il frontend considera valide le lingue: `en`, `it`, `de`, `fr`, `es`, `pt`, `ja` (definite in `LanguageContext` come `AVAILABLE_LANGS`).
