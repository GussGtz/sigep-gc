/**
 * POST /api/pedidos/importar-pdf
 * Recibe un PDF en formato AW_PEDIDO y devuelve UN solo pedido
 * con los totales del documento (m², piezas, subtotal/precio)
 * y la lista de posiciones para previsualización.
 *
 * El frontend llama luego a POST /api/pedidos/importar con { pedidos: [pedido] }
 */

const express  = require('express');
const multer   = require('multer');
const { PDFParse } = require('pdf-parse');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** "28.10.2025" → "2025-10-28" */
function parseFecha(raw) {
  if (!raw) return null;
  const m = raw.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Primer grupo del primer match del regex */
function extract(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}

/** Parsea "1.234,56" o "1,234.56" o "1234.56" → float */
function parseMoney(raw) {
  if (!raw) return null;
  // Detectar si usa coma como separador de miles (europeo) o punto
  const s = raw.trim().replace(/\s/g, '');
  // Si termina en ,XX (2 decimales con coma)
  const euro = s.match(/^[\d.]+,(\d{2})$/);
  if (euro) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  // Si tiene punto decimal normal
  return parseFloat(s.replace(/,/g, ''));
}

// ─────────────────────────────────────────────────────────────────────────────
// Parseo principal del texto AW_PEDIDO
// ─────────────────────────────────────────────────────────────────────────────
function parsePDF(text) {
  const full = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Header ────────────────────────────────────────────────────────────────
  // En el texto extraído el número aparece ANTES del label: "122863\tPEDIDO N°:"
  const numeroPedido    = extract(full, /(\d{5,})\s*[\t ]+PEDIDO\s+N[°º]?:/i)
                       || extract(full, /PEDIDO\s+N[°º]?:?\s*[\t ]*(\d+)/i);

  const fechaEntregaRaw = extract(full, /FECHA\s+ENTREGA:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i);
  const fechaPedidoRaw  = extract(full, /FECHA\s+PEDIDO:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i)
                       || extract(full, /(\d{2}\.\d{2}\.\d{4})/);

  const referencia      = extract(full, /REFERENCIA:\s*[\t ]*(.+?)[\t\n]/i);
  const ruta            = extract(full, /([A-Z]{2,})\s*[\t ]+RUTA:/i)
                       || extract(full, /RUTA:\s*[\t ]*([A-Z]{2,})/i);

  // Cliente: después de "Nr de cliente: NNN\n<Glass Caribe>\t<cliente>", el cliente es la 2da col
  const clienteNombre   = (() => {
    const m = full.match(/Nr\s+de\s+cliente:?\s*\d+[\t\n]+[^\t\n]+\t([^\n\t]+)/i);
    if (m) return m[1].trim();
    const m2 = full.match(/Nr\s+de\s+cliente:?\s*\d+[\t\n]+([^\n\t]+)/i);
    return m2 ? m2[1].trim() : null;
  })();

  // Dirección: preferir CARRETERA (dirección del cliente), luego CALLE/BLVD/AV
  const direccion = (() => {
    const m1 = full.match(/(CARRETERA[^\n\t]+)/i);
    if (m1) return m1[1].trim();
    const m2 = full.match(/((?:CALLE|BLVD|BOULEVARD|AV)[^\n]+)/i);
    return m2 ? m2[1].trim() : null;
  })();

  // ── Totales del resumen (última página) ──────────────────────────────────
  // "Total m2: 84.79\tTotal Piezas: 45\tTotal Kg.: 3390.94"
  const totalM2Str     = extract(full, /Total\s+m2:\s*([\d.,]+)/i);
  const totalPiezasStr = extract(full, /Total\s+Piezas:\s*(\d+)/i);
  const subtotalStr    = extract(full, /(\d[\d.,]+)\s*[\t ]+\d+[\.,]\d{2}\s*[\t ]+\d[\d.,]+\s*[\t ]+\d{3}/);

  const totalM2    = totalM2Str    ? parseMoney(totalM2Str)    : null;
  const totalPiezas = totalPiezasStr ? parseInt(totalPiezasStr, 10) : null;
  // SUBTOTAL: primer número grande en la fila de totales
  const precioBase  = subtotalStr  ? parseMoney(subtotalStr)   : null;

  // ── Line Items (posiciones individuales) para previsualización ───────────
  const posiciones = [];
  const posRegex   = /\b100[\t ](\d{3})\b/g;
  let posMatch;
  const posPositions = [];
  while ((posMatch = posRegex.exec(full)) !== null) {
    posPositions.push({ pos: `100 ${posMatch[1]}`, index: posMatch.index });
  }

  for (let i = 0; i < posPositions.length; i++) {
    const start = posPositions[i].index;
    const end   = posPositions[i + 1] ? posPositions[i + 1].index : full.length;
    const chunk = full.slice(start, end);

    // Dimensiones desde línea FORMA: "FORMA 000 (0) W: 894 H: 2021" (mm)
    let anchoMm = null, altoMm = null;
    const formaMatch = chunk.match(/W:\s*(\d+)\s+H:\s*(\d+)/i);
    if (formaMatch) {
      anchoMm = parseInt(formaMatch[1], 10);
      altoMm  = parseInt(formaMatch[2], 10);
    }

    // Cantidad: patrón "\t<cant>\t<ancho_mm>" en la línea del POS
    let cantidad = 1;
    if (anchoMm) {
      const cantMatch = chunk.match(new RegExp(`\\t(\\d{1,2})\\t${anchoMm}`));
      if (cantMatch) cantidad = parseInt(cantMatch[1], 10);
    }

    // Precio unitario: está después del POS en tabs: "100\t001 \t4,920.65\t1\t..."
    let precioUnit = null;
    const precioMatch = chunk.match(/100[\t ]\d{3}\s*[\t ]([\d,]+\.?\d*)\t/);
    if (precioMatch) precioUnit = parseMoney(precioMatch[1]);

    // Materiales desde la línea con "/" separadores
    const matMatch = chunk.match(/([A-Z][^\n]*(?:LAMINADO|SEPARADOR|TEMPLADO|MONOL)[^\n]*\/[^\n]*)/i)
                  || chunk.match(/([A-Z][^\n]*(?:LAMINADO|SEPARADOR|TEMPLADO|MONOL)[^\n]*)/i);
    const materiales = matMatch ? matMatch[1].trim() : null;

    if (anchoMm && altoMm) {
      const m2 = parseFloat(((anchoMm / 1000) * (altoMm / 1000) * cantidad).toFixed(4));
      posiciones.push({
        pos:       posPositions[i].pos,
        ancho_mm:  anchoMm,
        alto_mm:   altoMm,
        ancho:     anchoMm / 1000,
        alto:      altoMm  / 1000,
        cantidad,
        m2,
        precio_unit: precioUnit,
        importe:     precioUnit ? parseFloat((precioUnit * cantidad).toFixed(2)) : null,
        materiales,
      });
    }
  }

  // ── Especificaciones: lista compacta de posiciones ───────────────────────
  const especificaciones = posiciones
    .map(p =>
      `POS ${p.pos}: ${p.ancho_mm}×${p.alto_mm}mm` +
      ` · ${p.cantidad}pza` +
      ` · ${p.m2}m²` +
      (p.precio_unit ? ` · $${p.precio_unit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '') +
      (p.materiales ? ` · ${p.materiales}` : '')
    )
    .join('\n');

  // ── Pedido único resultante ───────────────────────────────────────────────
  const pedido = {
    numero_pedido:     numeroPedido,
    fecha_entrega:     parseFecha(fechaEntregaRaw),
    fecha_pedido:      parseFecha(fechaPedidoRaw),
    referencia,
    ruta,
    cliente_nombre:    clienteNombre,
    direccion_entrega: direccion,
    metros_cuadrados:  totalM2   ?? posiciones.reduce((s, p) => s + p.m2, 0).toFixed(4),
    total_piezas:      totalPiezas ?? posiciones.reduce((s, p) => s + p.cantidad, 0),
    precio:            precioBase ?? posiciones.reduce((s, p) => s + (p.importe || 0), 0).toFixed(2),
    especificaciones:  especificaciones || null,
    prioridad:         'bajo', // el admin puede cambiarla antes de importar
  };

  return {
    pedido,
    posiciones,
    totales: {
      m2:       pedido.metros_cuadrados,
      piezas:   pedido.total_piezas,
      subtotal: pedido.precio,
      iva:      pedido.precio ? parseFloat((pedido.precio * 0.16).toFixed(2)) : null,
      total:    pedido.precio ? parseFloat((pedido.precio * 1.16).toFixed(2)) : null,
    },
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

    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();

    const parsed = parsePDF(result.text);

    if (!parsed.posiciones.length) {
      return res.status(422).json({
        success: false,
        message: 'No se encontraron posiciones en el PDF. Verifica que sea un AW_PEDIDO válido.',
        rawText: result.text.slice(0, 2000),
      });
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('[ImportPDF] Error:', err.message, err.stack?.split('\n')[1]);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
