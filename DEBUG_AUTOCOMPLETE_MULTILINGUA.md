# Debug Autocomplete Multilingua - Checklist

## 🔍 Come Verificare se Funziona

### 1. Verifica Frontend (Console Browser)

Apri la console del browser e verifica:

#### Step 1: Cerca nei JSON Locali
```javascript
// Dovresti vedere nei log:
✅ Dizionario it caricato: 35960 traduzioni
```

#### Step 2: Ricerca con Fuse.js
```javascript
// Quando digiti "mare" in italiano:
// Dovresti vedere risultati Fuse.js con oracle_id
```

#### Step 3: Chiamata API
```javascript
// Dovresti vedere la chiamata:
GET /api/search/by-oracle-ids-paginated?ids=abc123,def456&page=1&per_page=10
```

#### Step 4: Risposta Backend
```javascript
// Dovresti vedere la risposta:
{
  success: true,
  data: {
    data: [
      {
        printing_id: "...",
        oracle_id: "abc123",
        name: "Underground Sea",
        image_uri_small: "https://..."
      }
    ]
  }
}
```

---

## 🐛 Problemi Comuni

### Problema 1: "Nessun risultato" anche se il termine esiste

**Sintomi:**
- Digiti "mare" in italiano
- Fuse.js trova risultati (vedi console)
- Ma l'autocomplete è vuoto

**Possibili Cause:**
1. ❌ Backend non restituisce dati
2. ❌ Struttura risposta diversa da attesa
3. ❌ Mappatura dati fallisce

**Debug:**
```javascript
// Aggiungi in useHybridAutocomplete.ts, linea ~284:
console.log('🔍 Oracle IDs trovati:', oracleIds)
console.log('📡 Chiamata API con:', { ids: limitedIds, page: 1, per_page: 10 })
console.log('📥 Risposta backend:', data)
console.log('🔄 Risultati mappati:', mappedResults)
```

---

### Problema 2: Errore 400 o 422

**Sintomi:**
- Console mostra errore 400/422
- Nessun risultato

**Possibili Cause:**
1. ❌ Formato IDs non valido
2. ❌ Troppi IDs (max 100)
3. ❌ Parametri mancanti

**Debug:**
```javascript
// Verifica formato IDs:
console.log('IDs prima di inviare:', oracleIds)
// Dovrebbero essere UUID validi: "abc123-def456-..."
```

---

### Problema 3: Risultati senza immagini

**Sintomi:**
- Carte trovate ma senza `image_uri_small`
- Immagini non caricate

**Possibili Cause:**
1. ❌ Backend non costruisce URL immagini
2. ❌ Campo `image_uri_small` mancante nel DB

**Debug:**
```javascript
// Verifica struttura risposta:
console.log('Prima carta:', data.data.data[0])
// Dovrebbe avere: image_uri_small, image_uri_normal
```

---

### Problema 4: Nomi non tradotti

**Sintomi:**
- Carte trovate ma mostrano nome inglese
- Non usa traduzione dal JSON

**Possibili Cause:**
1. ❌ Mappa `idToPreferredMap` vuota
2. ❌ `oracle_id` non corrisponde a `id` nel JSON

**Debug:**
```javascript
// Verifica mappatura:
console.log('Mappa traduzioni:', idToPreferredMap)
console.log('Oracle ID carta:', printing.oracle_id)
console.log('Nome tradotto:', idToPreferredMap[printing.oracle_id])
```

---

## 🔧 Fix Rapidi Frontend

### Fix 1: Aggiungi Logging Dettagliato

**File:** `src/hooks/useHybridAutocomplete.ts`

Aggiungi dopo linea 284:
```typescript
// CASO 2b: Trovati risultati nel dizionario - traduzione riuscita!
const oracleIds = [...new Set(fuseResults.map(result => result.item.id))]

// 🔍 DEBUG: Log dettagliato
console.log('🔍 Fuse.js risultati:', fuseResults.length)
console.log('🔍 Oracle IDs estratti:', oracleIds)
console.log('🔍 Primi 5 IDs:', oracleIds.slice(0, 5))

// Crea mappa id -> preferredName
const idToPreferredMap: Record<string, string> = {}
fuseResults.forEach(result => {
  idToPreferredMap[result.item.id] = result.item.preferred
})
console.log('🔍 Mappa traduzioni (prime 5):', Object.entries(idToPreferredMap).slice(0, 5))

// Chiama API
console.log('📡 Chiamando API con', oracleIds.length, 'IDs')
const data = await fetchByOracleIds(oracleIds)
console.log('📥 Risposta backend:', data)

if (!controller.signal.aborted) {
  if (data.success && Array.isArray(data.data)) {
    console.log('✅ Risultati ricevuti:', data.data.length)
    console.log('✅ Prima carta:', data.data[0])
    
    // ... resto del codice
  }
}
```

---

### Fix 2: Verifica Mappatura Dati

**File:** `src/hooks/useHybridAutocomplete.ts`

Aggiungi dopo linea 110 (in `fetchByOracleIds`):
```typescript
// Converte SearchResultsResponse in AutocompleteResponse
if (data.success && data.data?.data) {
  console.log('🔄 Conversione dati:')
  console.log('  - Totale risultati backend:', data.data.data.length)
  console.log('  - Prima carta raw:', data.data.data[0])
  
  const printings: Printing[] = data.data.data
    .filter((item): item is Card => {
      const isCard = ('oracle_id' in item || 'printing_id' in item) && !('code' in item)
      if (!isCard) {
        console.log('⚠️ Item filtrato (non è Card):', item)
      }
      return isCard
    })
    .map((item: Card) => {
      const printing: Printing = {
        printing_id: item.printing_id || item.id || '',
        oracle_id: item.oracle_id || '',
        name: item.name || item.printed_name || '',
        set_name: item.set_name || item.set_code || '',
        collector_number: item.collector_number || '',
        image_uri_small: item.image_uri_small || item.image_uri || null,
      }
      console.log('  - Mappato:', printing.oracle_id, '->', printing.name)
      return printing
    })
  
  console.log('✅ Printings mappati:', printings.length)
  return {
    success: true,
    cached: data.cached || false,
    data: printings,
  }
}
```

---

## 📊 Test Completo

### Test Manuale:

1. **Apri browser console**
2. **Vai su buysellcard.it**
3. **Cambia lingua a Italiano**
4. **Digita "mare" nella search bar**
5. **Verifica log:**

```
✅ Dizionario it caricato: 35960 traduzioni
🔍 Fuse.js risultati: 5
🔍 Oracle IDs estratti: ["abc123", "def456", ...]
📡 Chiamando API con 5 IDs
GET /api/search/by-oracle-ids-paginated?ids=abc123,def456,...&page=1&per_page=10
📥 Risposta backend: {success: true, data: {...}}
✅ Risultati ricevuti: 5
✅ Prima carta: {oracle_id: "abc123", name: "Underground Sea", ...}
🔄 Risultati mappati: 5
```

---

## 🎯 Cosa Controllare nel Backend

### 1. Verifica Endpoint Esiste

```bash
curl "https://api.buysellcard.it/api/search/by-oracle-ids-paginated?ids=test-id-1,test-id-2"
```

**Risposta Attesa:**
- Status 200 (non 404!)
- JSON con struttura `FullSearchResponse`

---

### 2. Verifica Query SQL

**Nel backend, aggiungi logging:**
```python
logger.info(f"Searching for {len(oracle_ids)} oracle IDs")
logger.debug(f"Oracle IDs: {oracle_ids[:5]}...")
logger.info(f"Query returned {len(results)} results")
```

**Verifica:**
- Query trova le carte?
- `lang = 'en'` è corretto?
- Ordine degli IDs è mantenuto?

---

### 3. Verifica Struttura Risposta

**Nel backend, verifica che restituisca:**
```python
{
    'success': True,
    'cached': False,
    'data': {
        'pagination': {...},
        'data': [
            {
                'printing_id': '...',
                'oracle_id': '...',
                'name': '...',
                'image_uri_small': '...',  # IMPORTANTE!
                'type': 'card'  # IMPORTANTE!
            }
        ]
    }
}
```

**Campi Obbligatori:**
- ✅ `printing_id` o `id`
- ✅ `oracle_id`
- ✅ `name` o `printed_name`
- ✅ `image_uri_small` (per le immagini!)
- ✅ `type: 'card'` (per distinguere da Set)

---

## ✅ Checklist Debug

- [ ] Frontend carica dizionario JSON correttamente
- [ ] Fuse.js trova risultati quando cerchi
- [ ] Oracle IDs vengono estratti correttamente
- [ ] Chiamata API viene fatta con IDs corretti
- [ ] Backend risponde con status 200
- [ ] Backend restituisce struttura corretta
- [ ] Mappatura dati funziona
- [ ] Nomi vengono tradotti correttamente
- [ ] Immagini vengono caricate

---

**Una volta verificati tutti questi punti, l'autocomplete multilingua dovrebbe funzionare perfettamente!** 🎉

