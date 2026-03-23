/**
 * POST /api/pedidos/importar-pdf
 *
 * Parser de PDFs formato AW_PEDIDO / Glass Caribe.
 *
 * Arquitectura modular con múltiples estrategias de extracción y fallbacks:
 *   1. normalize   – limpieza y normalización del texto crudo
 *   2. extractHeader      – número de pedido, fechas, cliente, dirección
 *   3. extractSummaryTotals  – totales del resumen (m², piezas, subtotal)
 *   4. extractPositions   – posiciones individuales con dimensiones, qty, precio
 *   5. validateAndBuild   – validación cruzada + warnings + resultado final
 *
 * Formatos probados y soportados:
 *   • Art. 100 (VI VIDRIO INSULADO)  – dimensiones via "FORMA W:X H:Y"
 *   • Art. 110 (CLARO FLOTADO)        – dimensiones inline
 *   • Art. 140 (ESPEJO)               – dimensiones inline
 *   • Art. 210 (TEMPLADO CLARO)       – dimensiones inline
 *   … y cualquier art. 100–299 con el mismo patrón tabulado
 */

'use strict';

const express  = require('express');
const multer   = require('multer');
const { PDFParse } = require('pdf-parse');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20 MB máx.
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. UTILIDADES PURAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsea números en formato europeo "1.234,56" o americano "1,234.56" o plano.
 * Devuelve null si el valor no es numérico.
 */
function parseMoney(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/\s/g, '');
  if (!s) return null;
  // Formato europeo: termina en ,XX con puntos como separadores de miles
  if (/^[\d.]+,\d{1,2}$/.test(s))
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  // Americano o plano: comas como separadores de miles
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

/** "28.10.2025" → "2025-10-28" (ISO). Retorna null si no parsea. */
function parseFecha(raw) {
  if (!raw) return null;
  const m = raw.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Primer match de un regex en text, retorna el grupo 1 trimmeado o null. */
function firstMatch(text, ...patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** Redondea a n decimales y elimina imprecisión flotante. */
function round(n, decimals = 4) {
  return parseFloat(n.toFixed(decimals));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. NORMALIZACIÓN DEL TEXTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normaliza el texto extraído del PDF:
 *   - Unifica saltos de línea
 *   - Colapsa secuencias de espacios >2 dentro de líneas (excepto tabs)
 *   - Elimina caracteres de control excepto \t y \n
 */
function normalize(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\t\n\x20-\x7E\xA0-\uFFFF]/g, '') // quitar ctrl chars
    .replace(/\t +/g, '\t')  // espacio(s) después de tab → limpio
    .replace(/ +\t/g, '\t'); // espacio(s) antes de tab  → limpio
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXTRACCIÓN DEL ENCABEZADO
// ─────────────────────────────────────────────────────────────────────────────

function extractHeader(text) {
  // ── Número de pedido ──
  // El número precede al label "PEDIDO N°:" en el PDF extraído
  const numeroPedido = firstMatch(text,
    /(\d{5,})\s*[\t ]+PEDIDO\s+N[°º o]?:/i,   // "122863\tPEDIDO N°:"
    /PEDIDO\s+N[°º o]?:?\s*[\t ]*(\d{5,})/i,  // fallback: label primero
    /^(\d{6,})\s*$/m,                          // última instancia: número solo en línea
  );

  // ── Fechas ──
  const fechaEntregaRaw = firstMatch(text,
    /FECHA\s+ENTREGA:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i,
  );
  const fechaPedidoRaw = firstMatch(text,
    /FECHA\s+PEDIDO:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i,
    /(\d{2}\.\d{2}\.\d{4})/,  // primera fecha que aparezca
  );

  // ── Referencia y ruta ──
  const referencia = firstMatch(text,
    /REFERENCIA:\s*[\t ]*([^\n\t]{3,60})/i,
  );
  const ruta = firstMatch(text,
    /([A-Z]{2,20})\s*[\t ]+RUTA:/i,
    /RUTA:\s*[\t ]*([A-Z]{2,20})/i,
  );

  // ── Cliente ──
  // Formato: "Nr de cliente: NNN\n<vendedor>\t<cliente>"
  const clienteNombre = (() => {
    // Patrón 1: dos columnas en la línea siguiente al número de cliente
    let m = text.match(/Nr\s+de\s+cliente:?\s*\d+\s*[\n\t][^\t\n]+\t([^\n\t]+)/i);
    if (m) return m[1].trim();
    // Patrón 2: una sola columna
    m = text.match(/Nr\s+de\s+cliente:?\s*\d+\s*[\n\t]([^\n\t]{3,})/i);
    return m ? m[1].trim() : null;
  })();

  // ── Dirección de entrega ──
  const direccionEntrega = firstMatch(text,
    /(CARRETERA\s[^\n\t]{5,80})/i,
    /((?:CALLE|BLVD\.?|BOULEVARD|AV\.?|AVENIDA)\s[^\n\t]{5,80})/i,
  );

  return {
    numeroPedido,
    fechaEntrega: parseFecha(fechaEntregaRaw),
    fechaPedido:  parseFecha(fechaPedidoRaw),
    referencia,
    ruta,
    clienteNombre,
    direccionEntrega,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXTRACCIÓN DE TOTALES DEL RESUMEN
// ─────────────────────────────────────────────────────────────────────────────

function extractSummaryTotals(text) {
  const m2Raw     = firstMatch(text, /Total\s+m2:\s*([\d.,]+)/i);
  const piezasRaw = firstMatch(text, /Total\s+Piezas:\s*(\d+)/i);

  // Subtotal: primer número grande en la fila de totales (SUBTOTAL / IVA / TOTAL)
  // Patrón: número, espacio(s), porcentaje IVA, espacio(s), importe neto, espacio(s), 3 dígitos (IVA code)
  const subtotalRaw = firstMatch(text,
    /(\d[\d.,]{3,})\s+\d+[.,]\d{2}\s+\d[\d.,]+\s+\d{3}/,
  );

  return {
    m2:      m2Raw     ? parseMoney(m2Raw)       : null,
    piezas:  piezasRaw ? parseInt(piezasRaw, 10) : null,
    precio:  subtotalRaw ? parseMoney(subtotalRaw) : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EXTRACCIÓN DE POSICIONES
// ─────────────────────────────────────────────────────────────────────────────

/** Líneas que nunca son una posición de pedido. */
const SKIP_LINE_RE = /DESC\s*%|POS\.\s|DESCRIPCI[OÓ]N|^[-─]+$|Total\s+m2:|Total\s+Piezas:|SUBTOTAL|APROBADO/i;

/**
 * Rango válido para dimensiones de vidrio en mm.
 * Fuera de este rango, el match de dimensiones probablemente sea un falso positivo.
 */
const DIM_MIN_MM = 20;
const DIM_MAX_MM = 6000;

/** Devuelve true si las dimensiones parecen válidas para un panel de vidrio. */
function validDim(w, h) {
  return w >= DIM_MIN_MM && w <= DIM_MAX_MM && h >= DIM_MIN_MM && h <= DIM_MAX_MM;
}

/**
 * Encuentra el primer par artículo+secuencia válido en una línea.
 * Requiere que el artículo esté precedido por TAB para evitar falsos positivos
 * en valores decimales (ej. "4,920.650\t100" → no se confunde ".650" con artículo).
 *
 * Soporta artículos de 2–4 dígitos y secuencias de 3 dígitos.
 * Retorna el objeto Match de RegExp, o null si no hay coincidencia válida.
 */
function findArtSeqInLine(line) {
  // Patrón: \t{art}\t{seq} seguido de tab o espacio
  const re = /\t(\d{2,4})\t(\d{3})[\t ]/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    // Descartar "000" (aparece en "FORMA 000 (0)")
    if (m[1] === '000') continue;
    return m;
  }
  return null;
}

/**
 * Extrae dimensiones para una posición.
 * Estrategias en orden de fiabilidad:
 *   A) Línea FORMA "W: X  H: Y"          – más autoritativa
 *   B) Inline con tab como separador      – "894 \tx 2021"
 *   C) Inline con espacio como separador  – "1205 x 600"
 *
 * Valida que las dimensiones estén en el rango esperado para vidrio.
 * Devuelve { w, h } en mm, o null si no puede extraer.
 */
function extractDimensions(line, nextLines) {
  // A) FORMA en las siguientes líneas (típicamente i+1 o i+2)
  for (const nl of nextLines) {
    const m = nl.match(/W:\s*(\d+)\s+H:\s*(\d+)/i);
    if (m) {
      const w = parseInt(m[1], 10), h = parseInt(m[2], 10);
      if (validDim(w, h)) return { w, h };
    }
  }

  // B) Inline: {2-4 dígitos}  ±tabs  x  ±tabs  {2-4 dígitos}
  // Cubre: "894 \tx 2021", "1205 x \t600", "966 \tx 1150", "210 \tx 2390"
  const dimRe = /\b(\d{2,4})[ \t]+x[ \t]+(\d{2,4})\b/gi;
  let dm;
  // Buscar todos los candidatos y quedarse con el primero válido
  while ((dm = dimRe.exec(line)) !== null) {
    const w = parseInt(dm[1], 10), h = parseInt(dm[2], 10);
    if (validDim(w, h)) return { w, h };
  }

  return null;
}

/**
 * Extrae la cantidad de piezas para una posición.
 * El qty es el último entero de 1–3 dígitos que aparece justo antes del
 * valor anchoMm en el substring que sigue al art+seq.
 *
 * Estrategias:
 *   1) Buscar "\t{qty}\t" justo antes de anchoMm  ← más confiable
 *   2) Buscar el último "\t{1-3 dígitos}[\t ]" antes de anchoMm
 *   3) Fallback: 1
 */
function extractQuantity(afterArtSeq, anchoMm) {
  const anchoStr = String(anchoMm);
  const idx = afterArtSeq.lastIndexOf(anchoStr);
  if (idx <= 0) return 1;

  const before = afterArtSeq.slice(0, idx);

  // Estrategia 1: tab + dígitos + tab inmediatamente antes del ancho
  // Nota: NO usar || 1 aquí — qty=0 es válido (posiciones ya entregadas)
  let m = before.match(/\t(\d{1,3})\t\s*$/);
  if (m) {
    const q = parseInt(m[1], 10);
    if (q >= 0 && q < 1000) return q;
  }

  // Estrategia 2: tab + dígitos + cualquier whitespace al final
  m = before.match(/\t(\d{1,3})[\t ]*$/);
  if (m) {
    const q = parseInt(m[1], 10);
    // Sanity check: qty > 0 y < 1000
    if (q >= 0 && q < 1000) return q;
  }

  return 1;
}

/**
 * Extrae el importe (precio total) de la posición desde el texto
 * que sigue al par art+seq.
 * El primer valor monetario tabulado es el importe.
 * Retorna { importe, precioUnit } o { importe: null, precioUnit: null }.
 */
function extractImporte(afterArtSeq, cantidad) {
  // El importe viene justo después: "\t4920.65\t" o " 4920.65\t"
  const m = afterArtSeq.match(/^\s*([\d,]+\.?\d*)\t/);
  if (!m) return { importe: null, precioUnit: null };

  const importe   = parseMoney(m[1]);
  const precioUnit = (importe != null && cantidad > 0)
    ? round(importe / cantidad, 2)
    : null;
  return { importe, precioUnit };
}

/**
 * Extrae el nombre del material para la posición.
 * Estrategias en orden de fiabilidad:
 *   1) Texto antes del art+seq en la misma línea  (limpiando ruido numérico)
 *   2) Primera línea posterior que mencione un material de vidrio conocido
 *   3) Segunda estrategia: línea siguiente con FLOTADO/CLARO/ESPEJO/etc.
 */
const MATERIAL_KEYWORDS = /LAMINADO|SEPARADOR|TEMPLADO|INSULADO|ESPEJO|FLOTADO|CLARO|MONOL|OPACO|SATINADO/i;
const NOISE_TOKEN_RE    = /^[\d.,]+$|^m2$|^m\.lin$|^kg$|^mm$/i;

function extractMaterial(beforeArtSeq, nextLines) {
  // Estrategia 1: tokens de texto antes del art+seq en la misma línea
  const tokens = beforeArtSeq
    .split('\t')
    .map(s => s.trim())
    .filter(s => s.length >= 3 && /[A-Z]/i.test(s) && !NOISE_TOKEN_RE.test(s));

  if (tokens.length) {
    const raw = tokens.join(' ').trim();
    // Normalizar: eliminar repeticiones consecutivas de la misma palabra
    // (el PDF a veces duplica: "TEMPLADO CLARO TEMPLADO CLARO 6 MM" → "TEMPLADO CLARO 6 MM")
    const cleaned = raw.replace(/\b(\w+(?:\s+\w+){0,3})\s+\1\b/gi, '$1').trim();
    if (cleaned.length >= 4) return cleaned;
  }

  // Estrategia 2: siguiente línea con keyword de vidrio
  for (const nl of nextLines) {
    if (MATERIAL_KEYWORDS.test(nl)) {
      // Tomar solo la primera parte (antes de una barra "/") si hay varias capas
      const part = nl.split('/')[0].trim();
      if (part.length >= 4) return part;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ORQUESTADOR PRINCIPAL DE POSICIONES
// ─────────────────────────────────────────────────────────────────────────────

function extractPositions(lines) {
  const posiciones = [];
  const seen       = new Set(); // deduplicar art+seq en PDFs multipágina

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (SKIP_LINE_RE.test(line)) continue;

    const artSeqMatch = findArtSeqInLine(line);
    if (!artSeqMatch) continue;

    const artNo = artSeqMatch[1];
    const seqNo = artSeqMatch[2];
    const key   = `${artNo}_${seqNo}`;
    if (seen.has(key)) continue; // posición repetida en página siguiente

    // Ventana de contexto: hasta 4 líneas hacia adelante
    const nextLines = lines.slice(i + 1, i + 5);

    const dims = extractDimensions(line, nextLines);
    if (!dims) continue; // sin dimensiones no podemos registrar la posición

    // Substrings relativos al match
    const afterArtSeq  = line.slice(artSeqMatch.index + artSeqMatch[0].length);
    const beforeArtSeq = line.slice(0, artSeqMatch.index);

    const cantidad = extractQuantity(afterArtSeq, dims.w);
    const { importe, precioUnit } = extractImporte(afterArtSeq, cantidad);
    const materiales = extractMaterial(beforeArtSeq, nextLines);
    const m2 = round((dims.w / 1000) * (dims.h / 1000) * cantidad);

    seen.add(key);
    posiciones.push({
      pos:         `${artNo} ${seqNo}`,
      ancho_mm:    dims.w,
      alto_mm:     dims.h,
      ancho:       round(dims.w / 1000, 4),
      alto:        round(dims.h / 1000, 4),
      cantidad,
      m2,
      precio_unit: precioUnit,
      importe,
      materiales,
    });
  }

  return posiciones;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. VALIDACIÓN CRUZADA Y CONSTRUCCIÓN DEL RESULTADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compara el total de m² del PDF con la suma calculada de posiciones.
 * Retorna el porcentaje de diferencia (0 si alguno es nulo).
 */
function m2Discrepancy(pdfTotal, calcTotal) {
  if (!pdfTotal || !calcTotal) return 0;
  return Math.abs((pdfTotal - calcTotal) / pdfTotal) * 100;
}

function validateAndBuild(header, summary, posiciones) {
  const warnings = [];

  // ── Campos obligatorios del encabezado ──
  if (!header.numeroPedido)  warnings.push('No se pudo detectar el número de pedido.');
  if (!header.fechaEntrega)  warnings.push('No se pudo detectar la fecha de entrega.');
  if (!header.clienteNombre) warnings.push('No se pudo detectar el nombre del cliente.');

  // ── Totales calculados a partir de posiciones ──
  const m2Calc     = round(posiciones.reduce((s, p) => s + p.m2, 0));
  const piezasCalc = posiciones.reduce((s, p) => s + p.cantidad, 0);
  const precioCalc = round(posiciones.reduce((s, p) => s + (p.importe ?? 0), 0), 2);

  // ── Validación cruzada de m² ──
  const discrepPct = m2Discrepancy(summary.m2, m2Calc);
  if (discrepPct > 5) {
    warnings.push(
      `Discrepancia de m² > 5%: PDF indica ${summary.m2} m², calculado ${m2Calc} m² (${discrepPct.toFixed(1)}%).`
    );
  }

  // ── Posiciones sin material ──
  const sinMaterial = posiciones.filter(p => !p.materiales).length;
  if (sinMaterial > 0) {
    warnings.push(`${sinMaterial} posición(es) sin material detectado.`);
  }

  // ── Posiciones con cantidad 0 (entregadas previamente) ──
  const entregadas = posiciones.filter(p => p.cantidad === 0).length;
  if (entregadas > 0) {
    warnings.push(`${entregadas} posición(es) con cantidad 0 (ya entregadas previamente).`);
  }

  // ── Construir pedido ──
  const pedido = {
    numero_pedido:     header.numeroPedido,
    fecha_entrega:     header.fechaEntrega,
    fecha_pedido:      header.fechaPedido,
    referencia:        header.referencia,
    ruta:              header.ruta,
    cliente_nombre:    header.clienteNombre,
    direccion_entrega: header.direccionEntrega,
    metros_cuadrados:  summary.m2    ?? m2Calc,
    total_piezas:      summary.piezas ?? piezasCalc,
    precio:            summary.precio ?? precioCalc,
    especificaciones:  posiciones.length
      ? 'posiciones:' + JSON.stringify(posiciones.map(p => ({
          pos:         p.pos,
          ancho_mm:    p.ancho_mm,
          alto_mm:     p.alto_mm,
          cantidad:    p.cantidad,
          m2:          p.m2,
          precio_unit: p.precio_unit,
          importe:     p.importe,
          materiales:  p.materiales,
        })))
      : null,
    prioridad: 'bajo',
  };

  const totales = {
    m2:       pedido.metros_cuadrados,
    piezas:   pedido.total_piezas,
    subtotal: pedido.precio,
    iva:      pedido.precio ? round(pedido.precio * 0.16, 2) : null,
    total:    pedido.precio ? round(pedido.precio * 1.16, 2) : null,
  };

  return { pedido, posiciones, totales, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

function parsePDF(rawText) {
  const text      = normalize(rawText);
  const lines     = text.split('\n');
  const header    = extractHeader(text);
  const summary   = extractSummaryTotals(text);
  const positions = extractPositions(lines);
  return validateAndBuild(header, summary, positions);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', verifyToken, isAdmin, upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se recibió ningún archivo PDF.' });
  }

  let parser;
  try {
    parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();

    const parsed = parsePDF(result.text);

    if (!parsed.posiciones.length) {
      return res.status(422).json({
        success: false,
        message: 'No se encontraron posiciones en el PDF. Verifica que sea un pedido Glass Caribe válido.',
        warnings: parsed.warnings,
        // Muestra el texto crudo (limitado) para diagnóstico desde el frontend si se necesita
        debug: result.text.slice(0, 4000),
      });
    }

    return res.json({ success: true, ...parsed });

  } catch (err) {
    console.error('[ImportPDF]', err.message, err.stack?.split('\n').slice(0, 3).join(' | '));
    return res.status(500).json({ success: false, message: `Error al procesar el PDF: ${err.message}` });

  } finally {
    if (parser) parser.destroy().catch(() => {});
  }
});

module.exports = router;
