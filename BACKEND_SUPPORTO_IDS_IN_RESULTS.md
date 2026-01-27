# Backend: Supporto `ids` in `/api/search/results` come Fallback

## 🎯 Obiettivo

Aggiungere supporto per il parametro `ids` anche nell'endpoint `/api/search/results` come fallback, così funziona anche se il frontend chiama quello invece di `/api/search/by-oracle-ids-paginated`.

---

## 📋 Modifiche Backend Python

### File: `py_app/routers/search.py`

#### Endpoint `/api/search/results` - Aggiungi Supporto `ids`

**Prima:**
```python
@router.get("/search/results", response_model=FullSearchResponse)
@limiter.limit("60/minute")
async def full_search(
    request: Request,
    term: str = Query(..., min_length=2, max_length=150),
    page: int = Query(1, ge=1),
    sort: str = Query('relevance', regex='^(relevance|name|price_asc|price_desc)$'),
    per_page: int = Query(20, ge=1, le=100)
):
```

**Dopo:**
```python
@router.get("/search/results", response_model=FullSearchResponse)
@limiter.limit("60/minute")
async def full_search(
    request: Request,
    term: Optional[str] = Query(None, min_length=2, max_length=150),  # Opzionale se c'è ids
    ids: Optional[str] = Query(None, alias='ids'),  # Nuovo parametro opzionale
    page: int = Query(1, ge=1),
    sort: str = Query('relevance', regex='^(relevance|name|price_asc|price_desc)$'),
    per_page: int = Query(20, ge=1, le=100)
):
    """
    Endpoint ricerca completa con paginazione
    Supporta sia ricerca per term che per ids (fallback)
    
    Args:
        term: Termine di ricerca (min 2 caratteri, max 150) - obbligatorio se ids non presente
        ids: Lista di Oracle IDs separati da virgola - obbligatorio se term non presente
        page: Numero di pagina (min 1)
        sort: Ordinamento (relevance, name, price_asc, price_desc)
        per_page: Risultati per pagina (min 1, max 100, default 20)
    """
    logger.info(f"full_search endpoint called: term='{term}', ids='{ids}', page={page}, sort='{sort}', per_page={per_page}")
    
    # Validazione: deve esserci almeno term o ids
    if not term and not ids:
        raise HTTPException(
            status_code=400,
            detail="Either 'term' or 'ids' parameter is required"
        )
    
    # Se c'è ids ma non term, usa la logica di ricerca per IDs
    if ids and not term:
        # Parsing degli ID separati da virgola
        oracle_ids = [sanitize_uuid(id.strip()) for id in ids.split(',')]
        oracle_ids = [id for id in oracle_ids if id]  # Rimuovi vuoti
        
        if not oracle_ids:
            raise HTTPException(
                status_code=400,
                detail="At least one valid Oracle ID is required"
            )
        
        # Limite massimo (es. 100 IDs)
        if len(oracle_ids) > 100:
            raise HTTPException(
                status_code=400,
                detail="Too many IDs (max 100)"
            )
        
        # Valida sort
        allowed_sorts = ['relevance', 'name', 'price_asc', 'price_desc']
        if sort not in allowed_sorts:
            sort = 'relevance'
        
        # Genera cache key
        ids_string = ','.join(sorted(oracle_ids))  # Ordina per cache consistente
        cache_key = cache_manager.generate_key('results', 'ids', ids_string, page, sort, per_page)
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
        logger.debug(f"Cache MISS for key: {cache_key}, querying database")
        async with get_db_session() as db:
            search_service = SearchService(db)
            results = await search_service.get_paginated_printings_by_oracle_ids(
                oracle_ids, page, sort, per_page
            )
            
            # Salva in cache
            await cache_manager.set(cache_key, results, ttl)
            
            logger.info(f"Search by IDs completed: {results.get('pagination', {}).get('total_results', 0)} results found")
            return {
                'success': True,
                'cached': False,
                'data': results
            }
    
    # Altrimenti, usa la logica normale di ricerca per term
    # ... resto del codice esistente per ricerca per term ...
```

---

## 🔄 Logica Completa

### Flusso Decisionale:

```
1. Riceve richiesta con term e/o ids
2. Se solo ids → usa get_paginated_printings_by_oracle_ids()
3. Se solo term → usa get_full_search_results() (logica esistente)
4. Se entrambi → usa term (priorità a term)
5. Se nessuno → errore 400
```

---

## ✅ Vantaggi

1. **Compatibilità**: Il frontend può chiamare `/api/search/results?ids=...` e funziona
2. **Fallback**: Se il frontend chiama l'endpoint sbagliato, funziona comunque
3. **Flessibilità**: Supporta sia ricerca per term che per ids nello stesso endpoint
4. **Cache**: Usa la stessa logica di cache per entrambi i casi

---

## 🧪 Test

### Test 1: Ricerca per IDs
```bash
curl "https://api.buysellcard.it/api/search/results?ids=abc123,def456&page=1&per_page=10"
```

**Risposta Attesa:**
- Status 200
- JSON con struttura `FullSearchResponse`
- Array di carte corrispondenti agli IDs

### Test 2: Ricerca per Term (esistente)
```bash
curl "https://api.buysellcard.it/api/search/results?term=lightning&page=1"
```

**Risposta Attesa:**
- Status 200
- JSON con struttura `FullSearchResponse`
- Array di carte trovate con FULLTEXT search

### Test 3: Entrambi (priorità a term)
```bash
curl "https://api.buysellcard.it/api/search/results?term=lightning&ids=abc123&page=1"
```

**Risposta Attesa:**
- Status 200
- Usa ricerca per `term` (ignora `ids`)

### Test 4: Nessuno (errore)
```bash
curl "https://api.buysellcard.it/api/search/results?page=1"
```

**Risposta Attesa:**
- Status 400
- Errore: "Either 'term' or 'ids' parameter is required"

---

## 📝 Note

1. **Backward Compatibility**: La ricerca per `term` continua a funzionare esattamente come prima
2. **Validazione**: `term` diventa opzionale solo se c'è `ids`, altrimenti rimane obbligatorio
3. **Cache**: Usa chiavi cache diverse per `term` e `ids` (evita conflitti)
4. **Performance**: Nessun impatto negativo, anzi migliora la flessibilità

---

**Una volta implementato, il frontend può chiamare `/api/search/results?ids=...` e funzionerà perfettamente!** 🎉

