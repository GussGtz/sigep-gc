/**
 * Fuzzy matching sin dependencias — O(n×m)
 * Verifica si todos los caracteres de `query` aparecen en orden en `str`
 */
export function fuzzyMatch(str, query) {
  if (!query?.trim()) return true
  str   = str.toLowerCase()
  query = query.toLowerCase().trim()
  let si = 0
  for (const ch of query) {
    while (si < str.length && str[si] !== ch) si++
    if (si >= str.length) return false
    si++
  }
  return true
}

/**
 * Puntaje de relevancia (mayor = más relevante)
 * 1.0 → startsWith  |  0.9 → includes  |  0.5 → fuzzy match  |  0 → no match
 */
export function fuzzyScore(str, query) {
  if (!query?.trim()) return 1
  const s = str.toLowerCase()
  const q = query.toLowerCase().trim()
  if (s.startsWith(q))  return 1
  if (s.includes(q))    return 0.9
  if (fuzzyMatch(s, q)) return 0.5
  return 0
}

/**
 * Filtra y ordena un array por relevancia fuzzy
 * @param {Array}  items     — array de objetos
 * @param {string} query     — texto de búsqueda
 * @param {Array}  fields    — campos del objeto a evaluar (ej: ['nombre', 'email'])
 * @returns {Array} items filtrados y ordenados por score descendente
 */
export function fuzzyFilter(items, query, fields = ['nombre']) {
  if (!query?.trim()) return items
  return items
    .map(item => {
      const score = Math.max(
        ...fields.map(f => fuzzyScore(String(item[f] || ''), query))
      )
      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}
