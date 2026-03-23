/**
 * POST /api/pedidos/importar-pdf
 * Recibe un PDF en formato AW_PEDIDO y devuelve UN solo pedido.
 *
 * Soporta dos variantes del formato Glass Caribe:
 *  • Formato A (INSULADO, art. 100): dimensiones en línea FORMA W:X H:Y
 *  • Formato B (TEMPLADO/CLARO/ESPEJO, art. 110/140/210+): dimensiones inline
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
  const s = raw.trim().replace(/\s/g, '');
  const euro = s.match(/^[\d.]+,(\d{2})$/);
  if (euro) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return parseFloat(s.replace(/,/g, ''));
}

// ─────────────────────────────────────────────────────────────────────────────
// Parseo principal del texto AW_PEDIDO
// Soporta art. 100 (con FORMA) y art. 110/140/210+ (dimensiones inline)
// ─────────────────────────────────────────────────────────────────────────────
function parsePDF(text) {
  const full = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Header ────────────────────────────────────────────────────────────────
  const numeroPedido    = extract(full, /(\d{5,})\s*[\t ]+PEDIDO\s+N[°º]?:/i)
                       || extract(full, /PEDIDO\s+N[°º]?:?\s*[\t ]*(\d+)/i);

  const fechaEntregaRaw = extract(full, /FECHA\s+ENTREGA:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i);
  const fechaPedidoRaw  = extract(full, /FECHA\s+PEDIDO:\s*[\t ]*(\d{2}\.\d{2}\.\d{4})/i)
                       || extract(full, /(\d{2}\.\d{2}\.\d{4})/);

  const referencia = extract(full, /REFERENCIA:\s*[\t ]*(.+?)[\t\n]/i);
  const ruta       = extract(full, /([A-Z]{2,})\s*[\t ]+RUTA:/i)
                  || extract(full, /RUTA:\s*[\t ]*([A-Z]{2,})/i);

  const clienteNombre = (() => {
    const m = full.match(/Nr\s+de\s+cliente:?\s*\d+[\t\n]+[^\t\n]+\t([^\n\t]+)/i);
    if (m) return m[1].trim();
    const m2 = full.match(/Nr\s+de\s+cliente:?\s*\d+[\t\n]+([^\n\t]+)/i);
    return m2 ? m2[1].trim() : null;
  })();

  const direccion = (() => {
    const m1 = full.match(/(CARRETERA[^\n\t]+)/i);
    if (m1) return m1[1].trim();
    const m2 = full.match(/((?:CALLE|BLVD|BOULEVARD|AV|AVENIDA)[^\n]+)/i);
    return m2 ? m2[1].trim() : null;
  })();

  // ── Totales del resumen ───────────────────────────────────────────────────
  const totalM2Str     = extract(full, /Total\s+m2:\s*([\d.,]+)/i);
  const totalPiezasStr = extract(full, /Total\s+Piezas:\s*(\d+)/i);
  const subtotalStr    = extract(full, /(\d[\d.,]+)\s*[\t ]+\d+[\.,]\d{2}\s*[\t ]+\d[\d.,]+\s*[\t ]+\d{3}/);

  const totalM2     = totalM2Str    ? parseMoney(totalM2Str)    : null;
  const totalPiezas = totalPiezasStr ? parseInt(totalPiezasStr, 10) : null;
  const precioBase  = subtotalStr   ? parseMoney(subtotalStr)   : null;

  // ── Detección de posiciones (ambos formatos) ──────────────────────────────
  // Estrategia: recorrer línea a línea buscando el patrón art_no\tseq_no
  // (3 dígitos + tab + 3 dígitos) que identifica cada posición.
  // Las dimensiones pueden estar:
  //   • En la línea FORMA W:X H:Y (siguiente dentro de 3 líneas) — Formato A
  //   • Inline como "{ancho}[ \t]+x[ \t]+{alto}" — Formato B
  const posiciones = [];
  const foundSeqs  = new Set();
  const lines      = full.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignorar cabeceras de tabla
    if (/DESC\s*%|POS\.|DESCRIPCI[ÓO]N/i.test(line)) continue;

    // Buscar art_no\tseq_no precedido por tab (evita falsos positivos en decimales
    // como "4,920.650\t100" donde ".650\t100" activaría un \b incorrecto).
    // Usamos loop para saltar el "000" del separador "FORMA 000 (0)".
    const artSeqRe = /\t(\d{3})\t(\d{3})[\t ]/g;
    let artSeqMatch = null, mm;
    while ((mm = artSeqRe.exec(line)) !== null) {
      if (mm[1] !== '000') { artSeqMatch = mm; break; }
    }
    if (!artSeqMatch) continue;

    const artNo = artSeqMatch[1];
    const seqNo = artSeqMatch[2];
    const key   = `${artNo}_${seqNo}`;
    if (foundSeqs.has(key)) continue; // deduplicar en PDFs multipágina

    // ── Dimensiones ──────────────────────────────────────────────────────
    let anchoMm = null, altoMm = null;

    // Formato A: FORMA ... W: X H: Y en las siguientes 3 líneas
    for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
      const fm = lines[j].match(/W:\s*(\d+)\s+H:\s*(\d+)/i);
      if (fm) {
        anchoMm = parseInt(fm[1], 10);
        altoMm  = parseInt(fm[2], 10);
        break;
      }
    }

    // Formato B: dimensiones inline "{3-4 dígitos}[ \t]+x[ \t]+{3-4 dígitos}"
    if (!anchoMm) {
      const dm = line.match(/\b(\d{3,4})[ \t]+x[ \t]+(\d{3,4})\b/i);
      if (dm) {
        anchoMm = parseInt(dm[1], 10);
        altoMm  = parseInt(dm[2], 10);
      }
    }

    if (!anchoMm || !altoMm) continue;

    // ── Cantidad ─────────────────────────────────────────────────────────
    // afterArtSeq: todo lo que va DESPUÉS del match completo "\tART\tSEQ[\t ]"
    // beforeArtSeq: todo lo que va ANTES del "\t" que precede al art_no
    const afterArtSeq  = line.slice(artSeqMatch.index + artSeqMatch[0].length);
    const beforeArtSeq = line.slice(0, artSeqMatch.index);

    let cantidad = 1;
    const anchoIdx = afterArtSeq.lastIndexOf(String(anchoMm));
    if (anchoIdx > 0) {
      const beforeAncho = afterArtSeq.slice(0, anchoIdx);
      const qm = beforeAncho.match(/\t(\d{1,3})[\t ]*$/);
      if (qm) cantidad = parseInt(qm[1], 10) || 1;
    }

    // ── Precio / Importe ─────────────────────────────────────────────────
    let importe = null;
    const impMatch = afterArtSeq.match(/^\s*([\d,]+\.?\d*)\t/);
    if (impMatch) importe = parseMoney(impMatch[1]);
    const precioUnit = (importe && cantidad > 0)
      ? parseFloat((importe / cantidad).toFixed(2))
      : null;

    // ── Material ──────────────────────────────────────────────────────────
    const matTokens = beforeArtSeq
      .split('\t')
      .map(s => s.trim())
      .filter(s => s.length > 2 && /[A-Z]{2,}/i.test(s)
                && !/^[\d.,]+$/.test(s)
                && s.toLowerCase() !== 'm2'
                && !/^[\d.]+m2/i.test(s));
    let materiales = matTokens.join(' ').trim() || null;

    // Si no hay material en esta línea, buscar en las siguientes líneas
    if (!materiales) {
      for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
        const ml = lines[j].match(
          /([A-Z][^\n]*(?:LAMINADO|SEPARADOR|TEMPLADO|ESPEJO|INSULADO|CLARO|FLOTADO)[^\n]*)/i
        );
        if (ml) { materiales = ml[1].trim(); break; }
      }
    }

    const m2 = parseFloat(((anchoMm / 1000) * (altoMm / 1000) * cantidad).toFixed(4));

    foundSeqs.add(key);
    posiciones.push({
      pos:         `${artNo} ${seqNo}`,
      ancho_mm:    anchoMm,
      alto_mm:     altoMm,
      ancho:       anchoMm / 1000,
      alto:        altoMm  / 1000,
      cantidad,
      m2,
      precio_unit: precioUnit,
      importe,
      materiales,
    });
  }

  // ── Especificaciones JSON ──────────────────────────────────────────────────
  const especificaciones = posiciones.length
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
    : null;

  // ── Pedido resultante ──────────────────────────────────────────────────────
  const totalM2Calc    = parseFloat(posiciones.reduce((s, p) => s + p.m2, 0).toFixed(4));
  const totalPiezCalc  = posiciones.reduce((s, p) => s + p.cantidad, 0);
  const totalPrecCalc  = parseFloat(posiciones.reduce((s, p) => s + (p.importe || 0), 0).toFixed(2));

  const pedido = {
    numero_pedido:     numeroPedido,
    fecha_entrega:     parseFecha(fechaEntregaRaw),
    fecha_pedido:      parseFecha(fechaPedidoRaw),
    referencia,
    ruta,
    cliente_nombre:    clienteNombre,
    direccion_entrega: direccion,
    metros_cuadrados:  totalM2    ?? totalM2Calc,
    total_piezas:      totalPiezas ?? totalPiezCalc,
    precio:            precioBase  ?? totalPrecCalc,
    especificaciones:  especificaciones || null,
    prioridad:         'bajo',
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
        message: 'No se encontraron posiciones en el PDF. Verifica que sea un pedido Glass Caribe válido.',
        rawText: result.text.slice(0, 3000),
      });
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('[ImportPDF] Error:', err.message, err.stack?.split('\n')[1]);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
