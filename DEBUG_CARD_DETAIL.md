# Debug: Card Detail "Carta non trovata"

## 🔍 Problema

Quando si accede a:
```
https://buysellcard.it/card/c5229c17-b7be-4b05-b683-f2277edc4849?printing_id=1c9675fb-1a89-420f-aea8-50e0642f549c
```

Viene mostrato: **"Errore - Carta non trovata"**

---

## 📋 Verifica Frontend

### 1. Chiamata API

Il frontend chiama:
```typescript
searchApi.getCardDetail(
  'c5229c17-b7be-4b05-b683-f2277edc4849',
  '1c9675fb-1a89-420f-aea8-50e0642f549c'
)
```

Che fa una richiesta:
```
GET /api/card/c5229c17-b7be-4b05-b683-f2277edc4849?printing_id=1c9675fb-1a89-420f-aea8-50e0642f549c
```

### 2. Logging Aggiunto

Ho aggiunto logging dettagliato in:
- `src/lib/searchApi.ts` - Log della chiamata e risposta
- `src/hooks/useCardDetail.ts` - Log degli errori dettagliati

**Apri la console del browser** e verifica:
```
🔍 getCardDetail chiamato: { oracleId: "...", printingId: "...", url: "...", params: {...} }
✅ getCardDetail risposta: { success: true/false, ... }
❌ getCardDetail errore: { status: 404/500, data: {...} }
```

---

## 🐛 Possibili Cause

### Causa 1: Endpoint Backend Non Esiste o Non Funziona

**Sintomi:**
- Console mostra errore 404 o 500
- Status code diverso da 200

**Verifica:**
```bash
# Test diretto endpoint
curl "https://api.buysellcard.it/api/card/c5229c17-b7be-4b05-b683-f2277edc4849?printing_id=1c9675fb-1a89-420f-aea8-50e0642f549c"
```

**Risposta Attesa:**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "card_info": {...},
    "selected_printing": {...},
    "printings": [...]
  }
}
```

**Se restituisce 404:**
- L'endpoint non esiste nel backend
- L'oracle_id non esiste nel database

**Se restituisce 500:**
- Errore nel backend (vedi log backend)

---

### Causa 2: Oracle ID Non Esiste nel Database

**Sintomi:**
- Backend restituisce 404
- Messaggio: "Card not found"

**Verifica:**
- Controlla che l'oracle_id esista nel database
- Verifica che il formato UUID sia corretto

---

### Causa 3: Printing ID Non Corrisponde

**Sintomi:**
- Backend restituisce 200 ma `selected_printing` è null
- `printings` array è vuoto o non contiene il printing_id richiesto

**Verifica:**
- Controlla che il `printing_id` appartenga all'`oracle_id`
- Verifica che il printing esista nel database

---

### Causa 4: Parametro `printing_id` Non Viene Passato Correttamente

**Sintomi:**
- Backend non riceve il parametro `printing_id`
- Backend restituisce la prima printing invece di quella richiesta

**Verifica:**
- Controlla la console browser per vedere l'URL completo della richiesta
- Verifica che il parametro sia nella query string

---

## 🔧 Fix Backend (Se Necessario)

### Endpoint Deve Essere:

**File:** `py_app/routers/search.py`

```python
@router.get("/card/{oracle_id}", response_model=CardDetailResponse)
@limiter.limit("60/minute")
async def get_card_detail(
    request: Request,
    oracle_id: str,
    printing_id: Optional[str] = Query(None, alias='printing_id')
):
    """
    Endpoint dettaglio carta con ristampa opzionale
    
    Args:
        oracle_id: Oracle ID della carta (UUID)
        printing_id: ID della ristampa specifica (opzionale, UUID)
    """
    logger.info(f"get_card_detail called: oracle_id={oracle_id}, printing_id={printing_id}")
    
    # Sanitizza oracle_id
    sanitized_oracle_id = sanitize_uuid(oracle_id)
    if not sanitized_oracle_id:
        raise HTTPException(status_code=400, detail="Invalid oracle_id format")
    
    # Sanitizza printing_id se presente
    sanitized_printing_id = None
    if printing_id:
        sanitized_printing_id = sanitize_uuid(printing_id)
        if not sanitized_printing_id:
            raise HTTPException(status_code=400, detail="Invalid printing_id format")
    
    # Cache key
    cache_key = cache_manager.generate_key('card', sanitized_oracle_id, sanitized_printing_id or 'default')
    ttl = 14400  # 4 ore
    
    # Prova cache
    cache_result = await cache_manager.get(cache_key, None, allow_stale=True)
    
    if cache_result['value'] is not None:
        is_stale = cache_result.get('stale', False)
        return {
            'success': True,
            'cached': True,
            'stale': is_stale,
            'layer': cache_result.get('layer'),
            'data': cache_result['value']
        }
    
    # Cache MISS - Query database
    async with get_db_session() as db:
        search_service = SearchService(db)
        result = await search_service.get_card_detail(
            sanitized_oracle_id,
            sanitized_printing_id
        )
        
        if not result or not result.get('card_info'):
            raise HTTPException(status_code=404, detail="Card not found")
        
        # Salva in cache
        await cache_manager.set(cache_key, result, ttl)
        
        return {
            'success': True,
            'cached': False,
            'data': result
        }
```

---

## ✅ Checklist Debug

1. **Apri Console Browser**
   - Vai su `https://buysellcard.it/card/c5229c17-b7be-4b05-b683-f2277edc4849?printing_id=1c9675fb-1a89-420f-aea8-50e0642f549c`
   - Apri DevTools (F12) → Console
   - Cerca log che iniziano con `🔍`, `✅`, `❌`

2. **Verifica Chiamata API**
   - Vai su DevTools → Network
   - Cerca richiesta a `/api/card/...`
   - Verifica:
     - Status code (200, 404, 500?)
     - URL completo (include `printing_id`?)
     - Response body

3. **Test Endpoint Backend Diretto**
   ```bash
   curl "https://api.buysellcard.it/api/card/c5229c17-b7be-4b05-b683-f2277edc4849?printing_id=1c9675fb-1a89-420f-aea8-50e0642f549c"
   ```

4. **Verifica Database**
   - Controlla che l'oracle_id esista in `cards` table
   - Controlla che il printing_id esista in `printings` table
   - Verifica che `printings.card_oracle_id` corrisponda all'oracle_id

---

## 🎯 Soluzione Rapida

### Se l'endpoint non esiste nel backend:

1. **Implementa l'endpoint** seguendo la guida sopra
2. **Verifica che il metodo `get_card_detail()` nel service funzioni**
3. **Testa con curl** prima di testare dal frontend

### Se l'endpoint esiste ma restituisce 404:

1. **Verifica che l'oracle_id esista nel database**
2. **Controlla i log del backend** per vedere l'errore esatto
3. **Verifica che la query SQL sia corretta**

---

**Dopo aver aggiunto il logging, apri la console del browser e condividi i log per capire esattamente cosa succede!** 🔍

