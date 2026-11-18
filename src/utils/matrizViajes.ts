import type { ConductorItem, ViajeAsignacion } from '../pages/viajes/AsignacionConductores';

const escapeHtml = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Genera el documento HTML completo y estilizado para imprimir o exportar a PDF
 * la Matriz Operativa de Viajes Seleccionados.
 */
export function generarHtmlMatrizViajes(
  viajesSeleccionados: ViajeAsignacion[],
  conductores: ConductorItem[]
): string {
  const totalSel = viajesSeleccionados.length;
  const conConductorSel = viajesSeleccionados.filter((v) => v.conductorId).length;
  const sinConductorSel = totalSel - conConductorSel;
  const clientesUnicosSel =
    new Set(viajesSeleccionados.map((v) => v.clienteNombre).filter(Boolean)).size || 1;
  const conFisicoSel = viajesSeleccionados.filter((v) => v.fisico).length;
  const fechaGeneracion = new Date().toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const filasHtml = viajesSeleccionados
    .map((v, idx) => {
      const ch = conductores.find((c) => c.id === v.conductorId);
      const clienteHtml = v.clienteNombre
        ? `<div class="cliente-sub">${escapeHtml(v.clienteNombre.toLowerCase())}</div>`
        : '';
      const conductorHtml = ch
        ? `<div class="conductor-wrap"><span class="avatar">${escapeHtml(ch.iniciales)}</span><span class="conductor-name">${escapeHtml(ch.nombre)}</span></div>`
        : `<span class="badge-unassigned">Sin asignar</span>`;
      const unidadHtml = ch
        ? `<span class="unidad-txt"><strong>${escapeHtml(ch.placa)}</strong></span>`
        : `<span class="muted">&mdash;</span>`;

      return `
        <tr>
          <td class="col-num">${idx + 1}</td>
          <td class="col-fecha">${escapeHtml(v.fecha)}</td>
          <td class="col-tr">${escapeHtml(v.nroTransporte)}</td>
          <td>
            <div class="loc-main">${escapeHtml(v.origenNombre)}</div>
            ${clienteHtml}
          </td>
          <td>
            <div class="loc-sub">${escapeHtml(v.destinoNombre)}</div>
          </td>
          <td>${conductorHtml}</td>
          <td class="nowrap">${unidadHtml}</td>
        </tr>
      `;
    })
    .join('');

  const estadoConductorBadge =
    sinConductorSel > 0
      ? `<span class="kpi-pill amber">${sinConductorSel} Pend.</span>`
      : `<span class="kpi-pill emerald">100% Listo</span>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Matriz Operativa de Viajes Seleccionados</title>
  <style>
    @page { size: landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .sheet {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: #f97316;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      flex-shrink: 0;
    }
    .header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .sync-pill {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(249, 115, 22, 0.2);
      color: #fdba74;
      border: 1px solid rgba(249, 115, 22, 0.35);
    }
    .count-meta {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
    }
    .header h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: -0.01em;
    }
    .header-right {
      text-align: right;
      font-size: 10px;
      color: #cbd5e1;
      font-weight: 600;
    }
    .header-right strong {
      display: block;
      color: #ffffff;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      padding: 12px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kpi-label {
      display: block;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .kpi-val.emerald { color: #047857; }
    .kpi-val.teal { color: #0f766e; }
    .kpi-sub {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }
    .kpi-pill {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .kpi-pill.orange { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
    .kpi-pill.emerald { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .kpi-pill.amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .kpi-pill.slate { background: #f1f5f9; color: #475569; }
    .kpi-pill.teal { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
    .table-wrap {
      padding: 14px 20px;
      background: #f8fafc;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    thead tr {
      background: #fff9f4;
      border-bottom: 1px solid #fed7aa;
    }
    th {
      padding: 9px 10px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    th.col-fisico { text-align: center; }
    tbody tr {
      border-bottom: 1px solid #f1f5f9;
      page-break-inside: avoid;
    }
    tbody tr:last-child { border-bottom: none; }
    td {
      padding: 8px 10px;
      vertical-align: middle;
    }
    .col-num { font-weight: 700; color: #94a3b8; width: 28px; }
    .col-fecha { font-weight: 700; color: #334155; white-space: nowrap; }
    .col-tr { font-weight: 900; color: #0f172a; white-space: nowrap; }
    .loc-main { font-weight: 700; color: #1e293b; }
    .loc-sub { font-weight: 600; color: #334155; }
    .code-ori { color: #047857; font-weight: 800; margin-right: 3px; }
    .code-des { color: #0f766e; font-weight: 800; margin-right: 3px; }
    .cliente-sub {
      font-size: 9.5px;
      font-weight: 600;
      color: #f97316;
      text-transform: capitalize;
      margin-top: 1px;
    }
    .conductor-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .avatar {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #d1fae5;
      color: #065f46;
      font-size: 9px;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .conductor-name { font-weight: 700; color: #0f172a; }
    .badge-unassigned {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 700;
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .unidad-txt { font-weight: 600; color: #334155; }
    .unidad-txt strong { color: #0f172a; }
    .muted { color: #94a3b8; }
    .nowrap { white-space: nowrap; }
    .col-fisico { text-align: center; white-space: nowrap; }
    .badge-fisico {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .badge-fisico.ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-fisico.pend { background: #f1f5f9; color: #64748b; }
    .footer {
      padding: 10px 20px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="header-left">
        <div class="header-icon">&#9638;</div>
        <div>
          <div class="header-meta">
            <span class="sync-pill">Sincronizado en Tiempo Real</span>
            <span class="count-meta">&bull; ${totalSel} ${totalSel === 1 ? 'viaje incluido' : 'viajes incluidos'}</span>
          </div>
          <h1>Matriz Operativa de Viajes Seleccionados</h1>
        </div>
      </div>
      <div class="header-right">
        <strong>Matriz General</strong>
        Generado: ${escapeHtml(fechaGeneracion)}
      </div>
    </div>

    <div class="kpis">
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Viajes en Matriz</span>
          <span class="kpi-val">${totalSel}</span>
        </div>
        <span class="kpi-pill orange">Seleccionados</span>
      </div>
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Con Conductor</span>
          <span class="kpi-val emerald">${conConductorSel} <span class="kpi-sub">/ ${totalSel}</span></span>
        </div>
        ${estadoConductorBadge}
      </div>
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Clientes Activos</span>
          <span class="kpi-val">${clientesUnicosSel}</span>
        </div>
        <span class="kpi-pill slate">En ruta</span>
      </div>
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Gu&iacute;as F&iacute;sicas</span>
          <span class="kpi-val teal">${conFisicoSel} <span class="kpi-sub">/ ${totalSel}</span></span>
        </div>
        <span class="kpi-pill teal">Recibidos</span>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>FECHA</th>
              <th>N&deg; TRANSPORTE</th>
              <th>ORIGEN / CLIENTE</th>
              <th>DESTINO</th>
              <th>CONDUCTOR ASIGNADO</th>
              <th>UNIDAD / PLACA</th>
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      <span>Matriz generada en tiempo real a partir de la selecci&oacute;n activa en consola</span>
      <span>FlotaControl &bull; Ordenado por d&iacute;a, conductor y kilometraje</span>
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
}
