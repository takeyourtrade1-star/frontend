# Guida: Autocomplete Multilingua - Backend Python

## 🎯 Obiettivo

Far funzionare l'autocomplete multilingua esattamente come nel PHP vecchio:
- **Inglese**: Cerca direttamente nel database con FULLTEXT
- **Altre lingue**: Cerca nei JSON locali (frontend) → trova `oracle_id` → chiama backend con IDs → restituisce carte

---

## 📋 Come Funzionava nel PHP Vecchio

### Flusso Autocomplete Multilingua (PHP):

1. **Frontend (JavaScript)**:
   - Utente digita "mare" (italiano)
   - Cerca nei JSON locali (`it.json`) con Fuse.js
   - Trova: `{id: "abc123", name: "Underground Sea", preferred: "Mare Sotterraneo"}`
   - Estrae `oracle_id`: `"abc123"`

2. **Chiamata API PHP**:
   ```
   GET /api/search/by-oracle-ids-paginated?ids=abc123,def456&page=1&sort=relevance
   ```

3. **Backend PHP**:
   - Riceve array di `oracle_id`
   - Query SQL: `SELECT * FROM printings WHERE card_oracle_id IN (?, ?, ...)`
   - Restituisce array di `Printing` con tutti i dati (immagini, set, etc.)

4. **Frontend**:
   - Riceve le carte dal backend
   - Sostituisce il nome inglese con la traduzione dal JSON
   - Mostra "Mare Sotterraneo" invece di "Underground Sea"

---

## 🔧 Cosa Deve Fare il Backend Python

### 1. Endpoint `/api/search/by-oracle-ids-paginated`

**File:** `py_app/routers/search.py`

**Endpoint deve:**
- Accettare parametro `ids` (stringa separata da virgola o array)
- Accettare `page`, `sort`, `per_page` (opzionali)
- Restituire `SearchResultsResponse` con struttura identica a `/api/search/results`

**Struttura Risposta:**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_results": 10,
      "per_page": 10
    },
    "data": [
      {
        "printing_id": "uuid-printing-1",
        "oracle_id": "uuid-oracle-1",
        "name": "Underground Sea",
        "printed_name": "Underground Sea",
        "set_name": "Revised Edition",
        "set_code": "3ED",
        "collector_number": "287",
        "image_uri_small": "https://cdn.../small.jpg",
        "image_uri_normal": "https://cdn.../normal.jpg",
        "rarity": "rare",
        "type": "card"
      },
      // ... altre carte
    ]
  }
}
```

**IMPORTANTE:** La struttura deve essere **IDENTICA** a `/api/search/results` perché il frontend usa lo stesso tipo `SearchResultsResponse`.

---

### 2. Query SQL nel Service

**File:** `py_app/services/search_service.py`

**Metodo:** `get_paginated_printings_by_oracle_ids()`

**Query SQL deve:**
```sql
SELECT 
    p.id AS printing_id,
    p.card_oracle_id AS oracle_id,
    p.printed_name AS name,
    p.printed_name,  -- Per compatibilità
    s.name AS set_name,
    s.code AS set_code,
    p.collector_number,
    p.image_uri_small,
    p.image_uri_normal,
    p.rarity,
    -- Altri campi necessari
FROM printings p
INNER JOIN sets s ON p.set_code = s.code
WHERE p.card_oracle_id IN (:oracle_id1, :oracle_id2, ...)
  AND p.lang = 'en'  -- IMPORTANTE: Solo inglese per autocomplete
ORDER BY 
    CASE 
        WHEN p.card_oracle_id = :oracle_id1 THEN 1
        WHEN p.card_oracle_id = :oracle_id2 THEN 2
        -- Mantieni ordine degli IDs passati
    END
LIMIT :per_page OFFSET :offset
```

**Punti Chiave:**
1. ✅ Filtra per `lang = 'en'` (solo carte inglesi)
2. ✅ Mantieni l'ordine degli IDs passati (importante per rilevanza)
3. ✅ Restituisci `printing_id`, `oracle_id`, `name`, `set_name`, `image_uri_small`
4. ✅ Supporta paginazione con `LIMIT` e `OFFSET`

---

### 3. Validazione e Sanitizzazione

**File:** `py_app/routers/search.py`

**Validazione:**
```python
@router.get("/search/by-oracle-ids-paginated", response_model=FullSearchResponse)
@limiter.limit("60/minute")
async def search_by_oracle_ids_paginated(
    request: Request,
    ids: str = Query(..., alias='ids'),  # Stringa separata da virgola
    page: int = Query(1, ge=1),
    sort: str = Query('relevance', regex='^(relevance|name|price_asc|price_desc)$'),
    per_page: int = Query(20, ge=1, le=100)
):
    # Parsing degli ID separati da virgola
    oracle_ids = [sanitize_uuid(id.strip()) for id in ids.split(',')]
    oracle_ids = [id for id in oracle_ids if id]  # Rimuovi vuoti
    
    if not oracle_ids:
        raise HTTPException(status_code=400, detail="At least one valid Oracle ID is required")
    
    # Limite massimo (es. 100 IDs)
    if len(oracle_ids) > 100:
        raise HTTPException(status_code=400, detail="Too many IDs (max 100)")
    
    # ... resto della logica
```

**Sanitizzazione UUID:**
```python
def sanitize_uuid(uuid_str: str) -> str:
    """Sanitizza UUID rimuovendo caratteri non validi"""
    import re
    # Rimuovi tutto tranne lettere, numeri e trattini
    sanitized = re.sub(r'[^a-zA-Z0-9\-]', '', uuid_str.strip())
    # Verifica formato UUID (36 caratteri con trattini)
    if len(sanitized) == 36 and sanitized.count('-') == 4:
        return sanitized
    return ''
```

---

### 4. Gestione Cache

**File:** `py_app/routers/search.py`

**Cache Key:**
```python
# Genera cache key univoca basata su IDs, page, sort, per_page
ids_string = ','.join(sorted(oracle_ids))  # Ordina per cache consistente
cache_key = cache_manager.generate_key('results', 'ids', ids_string, page, sort, per_page)
ttl = 14400  # 4 ore
```

**Nota:** Ordina gli IDs per avere cache key consistente (stessi IDs = stessa cache).

---

### 5. Mapping Risultati

**File:** `py_app/services/search_service.py`

**Mapping da DB a Response:**
```python
def _map_printing_to_card_result(self, row: Dict[str, Any]) -> Dict[str, Any]:
    """Mappa una riga del DB a un CardResult per la risposta"""
    return {
        'printing_id': row['printing_id'],
        'oracle_id': row['oracle_id'],
        'name': row['name'] or row.get('printed_name', ''),
        'printed_name': row.get('printed_name', ''),
        'set_name': row['set_name'],
        'set_code': row.get('set_code', ''),
        'collector_number': row.get('collector_number', ''),
        'image_uri_small': self._build_image_url(row.get('image_uri_small')),
        'image_uri_normal': self._build_image_url(row.get('image_uri_normal')),
        'rarity': row.get('rarity', ''),
        'type': 'card',  # IMPORTANTE: per distinguere da Set
        # Altri campi necessari
    }
```

---

## 🐛 Problemi Comuni e Soluzioni

### Problema 1: Risultati Vuoti

**Causa:** Query SQL non trova le carte
**Soluzione:**
- Verifica che gli `oracle_id` siano corretti (formato UUID)
- Verifica che `lang = 'en'` sia corretto
- Verifica che gli IDs esistano nel database

**Debug:**
```python
logger.debug(f"Searching for {len(oracle_ids)} oracle IDs: {oracle_ids[:5]}...")
logger.debug(f"Query returned {len(results)} results")
```

---

### Problema 2: Ordine Sbagliato

**Causa:** SQL non mantiene l'ordine degli IDs passati
**Soluzione:**
```python
# Usa CASE WHEN per mantenere ordine
order_by_clause = "CASE p.card_oracle_id"
for idx, oracle_id in enumerate(oracle_ids, 1):
    order_by_clause += f" WHEN '{oracle_id}' THEN {idx}"
order_by_clause += " END ASC"
```

---

### Problema 3: Struttura Risposta Diversa

**Causa:** Backend restituisce struttura diversa da `/api/search/results`
**Soluzione:**
- Usa **ESATTAMENTE** la stessa struttura di `FullSearchResponse`
- Usa lo stesso metodo `_map_printing_to_card_result()` usato in `get_full_search_results()`

---

### Problema 4: Immagini Mancanti

**Causa:** `image_uri_small` non viene costruito correttamente
**Soluzione:**
```python
def _build_image_url(self, image_path: Optional[str]) -> Optional[str]:
    """Costruisce URL completo immagine usando CDN"""
    if not image_path:
        return None
    CDN_URL = os.getenv('CDN_URL', 'https://cdn.buysellcard.it/cards')
    return f"{CDN_URL.rstrip('/')}/{image_path.lstrip('/')}"
```

---

## ✅ Checklist Implementazione

- [ ] Endpoint `/api/search/by-oracle-ids-paginated` esiste e funziona
- [ ] Accetta parametro `ids` (stringa separata da virgola)
- [ ] Valida e sanitizza gli UUID
- [ ] Query SQL filtra per `lang = 'en'`
- [ ] Query SQL mantiene ordine degli IDs passati
- [ ] Supporta paginazione (`page`, `per_page`)
- [ ] Supporta ordinamento (`sort`)
- [ ] Restituisce struttura `FullSearchResponse` identica a `/api/search/results`
- [ ] Costruisce URL immagini correttamente (`image_uri_small`, `image_uri_normal`)
- [ ] Gestisce cache correttamente
- [ ] Logging per debug

---

## 🧪 Test

### Test 1: Chiamata Base
```bash
curl "https://api.buysellcard.it/api/search/by-oracle-ids-paginated?ids=abc123,def456&page=1&per_page=10"
```

**Risposta Attesa:**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_results": 2,
      "per_page": 10
    },
    "data": [
      {
        "printing_id": "...",
        "oracle_id": "abc123",
        "name": "Underground Sea",
        "set_name": "Revised Edition",
        "image_uri_small": "https://cdn.../small.jpg",
        "type": "card"
      }
    ]
  }
}
```

### Test 2: Paginazione
```bash
curl "https://api.buysellcard.it/api/search/by-oracle-ids-paginated?ids=id1,id2,id3&page=1&per_page=2"
```

**Verifica:**
- Restituisce solo 2 risultati
- `total_results` = 3
- `total_pages` = 2

### Test 3: Ordinamento
```bash
curl "https://api.buysellcard.it/api/search/by-oracle-ids-paginated?ids=id1,id2,id3&sort=name"
```

**Verifica:**
- Risultati ordinati per nome alfabetico

---

## 📝 Note Finali

1. **Struttura Risposta:** Deve essere **IDENTICA** a `/api/search/results` perché il frontend usa `SearchResultsResponse` per entrambi.

2. **Performance:** 
   - Usa `IN (...)` con parametri preparati (sicuro)
   - Limita a max 100 IDs per richiesta
   - Usa cache per risultati frequenti

3. **Compatibilità:**
   - Il frontend già chiama questo endpoint correttamente
   - Basta che il backend restituisca la struttura corretta

4. **Debug:**
   - Aggiungi logging dettagliato per vedere cosa riceve e cosa restituisce
   - Verifica che gli `oracle_id` dal frontend corrispondano a quelli nel database

---

**Una volta implementato correttamente, l'autocomplete multilingua funzionerà esattamente come nel PHP vecchio!** 🎉

