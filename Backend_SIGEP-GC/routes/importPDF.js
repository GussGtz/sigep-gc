/**
 * POST /api/pedidos/importar-pdf
 * Recibe un PDF en formato AW_PEDIDO, lo parsea y retorna los pedidos listos
 * para previsualizar. El frontend llama luego a POST /api/pedidos/importar
 * con el array ya confirmado.
 */

const express  = require('express');
const multer   = require('multer');
const { PDFParse } = require('pdf-parse');
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
 * Parsea el texto extraído del PDF AW_PEDIDO y devuelve:
 *   { header: {...}, items: [{...}] }
 *
 * Estructura real del texto (extraído con pdfjs/PDFParse v2):
 *  - Tabs separan los campos de cada línea
 *  - Número de pedido aparece ANTES del label: "122863\tPEDIDO N°:"
 *  - Cada ítem: "VI VIDRIO...\t<importe>\t100\t<seq>\t<precio>\t<cant>\t<ancho>\tx <alto>"
 *  - Dimensiones confirmadas en línea FORMA: "FORMA 000 (0) W: 894 H: 2021"
 *  - Materiales en línea slash-separada: "LAMINADO CLARO 4+4 MM / SEPARADOR NEGRO..."
 */
function parsePDF(text) {
  const full = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Header ────────────────────────────────────────────────────────────────
  // El número de pedido aparece ANTES del label en el texto extraído
  const numeroPedido    = extract(full, /(\d{5,})\s*[\t ]+PEDIDO\s+N[°º]?:/i)
                       || extract(full, /PEDIDO\s+N[°º]?:?\s*[\t ]*(\d+)/i);

  const fechaEntregaRaw = extract(full, /FECHA\s+ENTREGA:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i);
  const fechaPedidoRaw  = extract(full, /FECHA\s+PEDIDO:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i)
                       || extract(full, /(\d{2}\.\d{2}\.\d{4})/); // fallback al primer date

  const referencia      = extract(full, /REFERENCIA:\s*[\t ]*(.+?)[\t\n]/i);
  // RUTA aparece como "SUR\tRUTA:" en el texto extraído
  const ruta            = extract(full, /([A-Z]{2,})\s*[\t ]+RUTA:/i)
                       || extract(full, /RUTA:\s*[\t ]*([A-Z]{2,})/i);

  // Cliente: después de "Nr de cliente: NNN\n<empresa_Glass>\t<cliente>", el cliente es la 2da columna
  const clienteNombre   = (() => {
    const m = full.match(/Nr\s+de\s+cliente:?\s*\d+[\t\n]+[^\t\n]+\t([^\n\t]+)/i);
    if (m) return m[1].trim();
    // fallback: 1ra columna
    const m2 = full.match(/Nr\s+de\s+cliente:?\s*\d+[\t\n]+([^\n\t]+)/i);
    return m2 ? m2[1].trim() : null;
  })();

  // Dirección de entrega: preferir CARRETERA (dirección del cliente, no de Glass Caribe)
  const direccion = (() => {
    const m1 = full.match(/(CARRETERA[^\n\t]+)/i);
    if (m1) return m1[1].trim();
    const m2 = full.match(/((?:CALLE|BLVD|BOULEVARD|AV)[^\n]+)/i);
    if (m2) return m2[1].trim();
    return null;
  })();

  // ── Line Items ────────────────────────────────────────────────────────────
  // Estrategia: localizar cada bloque POS mediante "100\t\d{3}" o "100 \d{3}"
  // Las dimensiones reales vienen de la línea FORMA: W: <ancho> H: <alto>
  // La cantidad viene del campo tabular antes de las dimensiones.

  const items = [];

  // Dividir el texto en chunks por cada POS
  const posRegex = /\b100[\t ](\d{3})\b/g;
  let posMatch;
  const posPositions = [];
  while ((posMatch = posRegex.exec(full)) !== null) {
    posPositions.push({
      pos:   `100 ${posMatch[1]}`,
      index: posMatch.index,
    });
  }

  for (let i = 0; i < posPositions.length; i++) {
    const start = posPositions[i].index;
    const end   = posPositions[i + 1] ? posPositions[i + 1].index : full.length;
    const chunk = full.slice(start, end);

    // Dimensiones desde línea FORMA (más confiable): "FORMA 000 (0) W: 894 H: 2021"
    let ancho = null, alto = null;
    const formaMatch = chunk.match(/W:\s*(\d+)\s+H:\s*(\d+)/i);
    if (formaMatch) {
      ancho = parseInt(formaMatch[1], 10) / 1000; // mm → m
      alto  = parseInt(formaMatch[2], 10) / 1000;
    }

    // Fallback: patrón "(\d+)\tx\s*(\d+)" o "(\d+)\s+x\s+(\d+)" en la línea del POS
    if (!ancho || !alto) {
      const lineMatch = chunk.match(/\t(\d{3,4})\s*\n?\s*x\s+(\d{3,4})/);
      if (lineMatch) {
        ancho = parseInt(lineMatch[1], 10) / 1000;
        alto  = parseInt(lineMatch[2], 10) / 1000;
      }
    }

    // Cantidad: patrón "\t<cant>\t<ancho_mm>" — el entero antes de las dimensiones
    let cantidad = 1;
    if (ancho) {
      const anchomm = Math.round(ancho * 1000);
      const cantMatch = chunk.match(new RegExp(`\\t(\\d{1,3})\\t${anchomm}`));
      if (cantMatch) cantidad = parseInt(cantMatch[1], 10);
    }
    // Fallback: buscar "1.\\d{2}m2" y extraer la cantidad del contexto
    if (cantidad === 1) {
      const altMatch = chunk.match(/\t(\d{1,2})\t\d{3,4}\s*\nx/i);
      if (altMatch) cantidad = parseInt(altMatch[1], 10);
    }

    // Especificaciones: línea con los materiales separados por " / "
    let especificaciones = null;
    const matLine = chunk.match(/([A-Z][^\n]*(?:LAMINADO|SEPARADOR|TEMPLADO|MONOL)[^\n]*)/i);
    if (matLine) especificaciones = matLine[1].trim();
    // También capturar la descripción completa de canto
    const cantoLine = chunk.match(/([\d,.]+ m lin\s+\d+ Canto[^\n]*)/i);
    if (cantoLine && especificaciones) {
      especificaciones += ' | ' + cantoLine[1].trim();
    }

    if (ancho && alto && ancho > 0 && alto > 0) {
      items.push({
        pos:              posPositions[i].pos,
        ancho:            Math.round(ancho * 1000) / 1000,
        alto:             Math.round(alto  * 1000) / 1000,
        cantidad,
        metros_cuadrados: Math.round(ancho * alto * cantidad * 1000) / 1000,
        especificaciones: especificaciones || null,
      });
    }
  }

  return {
    header: {
      numero_pedido:     numeroPedido,
      fecha_entrega:     parseFecha(fechaEntregaRaw),
      fecha_pedido:      parseFecha(fechaPedidoRaw),
      referencia:        referencia ? referencia.trim() : null,
      ruta:              ruta       ? ruta.trim()       : null,
      cliente_nombre:    clienteNombre,
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

    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();
    const parsed = parsePDF(result.text);

    if (!parsed.items.length) {
      return res.status(422).json({
        success: false,
        message: 'No se encontraron líneas de pedido en el PDF. Verifica que sea un AW_PEDIDO válido.',
        rawText: result.text.slice(0, 2000), // debug
      });
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('[ImportPDF] Error:', err.message, err.stack?.split('\n')[1]);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
