/**
 * POST /api/pedidos/importar-pdf
 * Recibe un PDF en formato AW_PEDIDO, lo parsea y retorna los pedidos listos
 * para previsualizar. El frontend llama luego a POST /api/pedidos/importar
 * con el array ya confirmado.
 */

const express  = require('express');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de parseo
// ─────────────────────────────────────────────────────────────────────────────

/** Convierte "28.10.2025" → "2025-10-28" */
function parseFecha(raw) {
  if (!raw) return null;
  const m = raw.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Extrae el primer número que coincide con un regex en el texto */
function extract(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}

/**
 * Parsea el texto extraído del PDF y devuelve:
 *   { header: {...}, items: [{...}] }
 */
function parsePDF(text) {
  // Normalizar saltos de línea Windows
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  const full  = lines.join('\n');

  // ── Header ────────────────────────────────────────────────────────────────
  const numeroPedido   = extract(full, /PEDIDO\s+N[°º]?:?\s*(\d+)/i);
  const fechaEntregaRaw = extract(full, /FECHA\s+ENTREGA:?\s*([\d]{2}\.[\d]{2}\.[\d]{4})/i);
  const fechaPedidoRaw  = extract(full, /FECHA\s+PEDIDO:?\s*([\d]{2}\.[\d]{2}\.[\d]{4})/i);
  const referencia     = extract(full, /REFERENCIA:?\s*(.+?)(?:\n|RUTA)/i);
  const ruta           = extract(full, /RUTA:?\s*([A-Z\s]+?)(?:\n|Nr)/i);
  const clienteNombre  = (() => {
    // Después de "Nr de cliente: NNN" viene el nombre en la línea siguiente
    const m = full.match(/Nr\s+de\s+cliente:?\s*\d+\s*\n(.+)/i);
    return m ? m[1].trim() : extract(full, /Cliente:?\s*(.+)/i);
  })();
  const direccion = (() => {
    // Dirección: línea(s) después del nombre del cliente hasta una línea vacía o keyword
    const m = full.match(/Nr\s+de\s+cliente:?\s*\d+\s*\n.+?\n(.+?)(?:\n\n|\nZONA|\nCALLE|\nAV\b|$)/is);
    return m ? m[1].trim() : null;
  })();

  // ── Line Items ────────────────────────────────────────────────────────────
  // Patrón: "100 001" o "100001" → POS, luego ancho x alto (puede ser mm), cantidad
  // Ejemplo: "100 001 VI VIDRIO INSULADO GLASSCARIBE 600 x 2.700 1 ..."
  // O:       "100 001  600  2700  1  ..."
  // El PDF puede variar. Usamos dos estrategias:

  const items = [];

  // Estrategia principal: buscar líneas con patrón POS (100 \d{3} o 100\d{3})
  // seguidas de dimensiones ANCHO x ALTO y cantidad
  const posRegex = /\b(100\s*\d{3})\b/g;
  let posMatch;
  const posPositions = [];
  while ((posMatch = posRegex.exec(full)) !== null) {
    posPositions.push({ pos: posMatch[1].replace(/\s+/, ' '), index: posMatch.index });
  }

  for (let i = 0; i < posPositions.length; i++) {
    const start = posPositions[i].index;
    const end   = posPositions[i + 1] ? posPositions[i + 1].index : full.length;
    const chunk = full.slice(start, end);

    const posNum = posPositions[i].pos; // e.g. "100 001"

    // Extraer dimensiones: números que representan mm (>100) o m (<10)
    // Buscamos "ANCHO x ALTO" o dos números grandes separados por "x" o espacio
    let ancho = null, alto = null, cantidad = null;

    // Patrón 1: "600 x 2700" o "600x2700" o "0,600 x 2,700"
    const dimMatch = chunk.match(/(\d[\d\s]*(?:[,\.]\d+)?)\s*[xX]\s*(\d[\d\s]*(?:[,\.]\d+)?)/);
    if (dimMatch) {
      const v1 = parseFloat(dimMatch[1].replace(/\s/g, '').replace(',', '.'));
      const v2 = parseFloat(dimMatch[2].replace(/\s/g, '').replace(',', '.'));
      // Si los valores son >100, están en mm → convertir a metros
      ancho = v1 > 100 ? v1 / 1000 : v1;
      alto  = v2 > 100 ? v2 / 1000 : v2;
    }

    // Cantidad: primer entero pequeño (1-999) que aparece después de las dimensiones
    if (dimMatch) {
      const afterDim = chunk.slice(chunk.indexOf(dimMatch[0]) + dimMatch[0].length);
      const cantMatch = afterDim.match(/\b(\d{1,3})\b/);
      if (cantMatch) cantidad = parseInt(cantMatch[1], 10);
    }

    // Especificaciones: líneas con materiales (LAMINADO, SEPARADOR, etc.)
    const specLines = [];
    const specPatterns = [
      /LAMINADO\s+\S+.*/i,
      /SEPARADOR\s+.*/i,
      /CANTO\s+.*/i,
      /FORMA\s+.*/i,
      /VIDRIO\s+.*/i,
      /MONOL.*/i,
      /TEMPLADO.*/i,
      /PVB\s+.*/i,
    ];
    for (const pat of specPatterns) {
      const sm = chunk.match(pat);
      if (sm) specLines.push(sm[0].trim());
    }
    // También incluir la línea "VI VIDRIO INSULADO..." si existe
    const viMatch = chunk.match(/VI\s+VIDRIO\s+INSULADO\s+\S+/i);
    if (viMatch && !specLines.includes(viMatch[0].trim())) {
      specLines.unshift(viMatch[0].trim());
    }

    if (ancho && alto) {
      items.push({
        pos:       posNum,
        ancho:     Math.round(ancho * 1000) / 1000,
        alto:      Math.round(alto  * 1000) / 1000,
        cantidad:  cantidad || 1,
        metros_cuadrados: Math.round(ancho * alto * 1000) / 1000,
        especificaciones: specLines.join(' | ') || null,
      });
    }
  }

  return {
    header: {
      numero_pedido:   numeroPedido,
      fecha_entrega:   parseFecha(fechaEntregaRaw),
      fecha_pedido:    parseFecha(fechaPedidoRaw),
      referencia:      referencia ? referencia.trim() : null,
      ruta:            ruta       ? ruta.trim()       : null,
      cliente_nombre:  clienteNombre,
      direccion_entrega: direccion,
    },
    items,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pedidos/importar-pdf
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', verifyToken, isAdmin, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ningún archivo PDF' });
    }

    const data   = await pdfParse(req.file.buffer);
    const parsed = parsePDF(data.text);

    if (!parsed.items.length) {
      return res.status(422).json({
        success: false,
        message: 'No se encontraron líneas de pedido en el PDF. Verifica que sea un AW_PEDIDO válido.',
        rawText: data.text.slice(0, 2000), // debug
      });
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('[ImportPDF]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
