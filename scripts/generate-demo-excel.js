const fs = require('fs');
const path = require('path');
const XLSX = require('../apps/web/node_modules/xlsx');

// 1. Sheet 1: Ventas por Canal y Categoría (Dataset transaccional / dimensional)
const channels = ['E-Commerce', 'Tienda Física Norte', 'Tienda Física Sur', 'Mayoristas', 'App Móvil'];
const regions = ['Pichincha', 'Guayas', 'Azuay', 'Manabí', 'Tungurahua', 'Loja'];
const categories = ['Tecnología', 'Mobiliario y Oficina', 'Moda y Calzado', 'Salud y Cuidado', 'Alimentos Gourmet'];
const salespeople = ['Carlos Mendoza', 'Valeria Ortiz', 'Mateo Salazar', 'Camila Benítez', 'Andrés Paredes'];

const ventasData = [];
const startDate = new Date(2026, 0, 1);

for (let i = 1; i <= 120; i++) {
  const date = new Date(startDate.getTime() + Math.floor(Math.random() * 90) * 86400000);
  const channel = channels[Math.floor(Math.random() * channels.length)];
  const region = regions[Math.floor(Math.random() * regions.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const salesperson = salespeople[Math.floor(Math.random() * salespeople.length)];
  
  const units = Math.floor(Math.random() * 40) + 5;
  const unitPrice = Math.floor(Math.random() * 250) + 30;
  const unitCost = Math.round(unitPrice * (0.45 + Math.random() * 0.25));
  
  const ventasUSD = units * unitPrice;
  const costoUSD = units * unitCost;
  const margenUSD = ventasUSD - costoUSD;
  const margenPct = Math.round((margenUSD / ventasUSD) * 100);

  ventasData.push({
    ID_Orden: `ORD-${1000 + i}`,
    Fecha: date.toISOString().split('T')[0],
    Canal: channel,
    Region: region,
    Categoria: category,
    Vendedor: salesperson,
    Unidades: units,
    Venta_USD: ventasUSD,
    Costo_USD: costoUSD,
    Margen_USD: margenUSD,
    Margen_Pct: `${margenPct}%`,
    Calificacion_Cliente: Math.floor(Math.random() * 3) + 3,
  });
}

// 2. Sheet 2: Evolución Mensual (Serie temporal para gráficos de líneas / tendencias)
const meses = [
  '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10',
  '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'
];

const evolucionData = meses.map((mes, idx) => {
  const baseRevenue = 45000 + idx * 3800 + Math.floor(Math.random() * 4000);
  const marketing = Math.round(baseRevenue * 0.18);
  const payroll = 18500 + idx * 400;
  const operational = Math.round(baseRevenue * 0.22);
  const totalCost = marketing + payroll + operational;
  const ebitda = baseRevenue - totalCost;
  const subscribers = 1200 + idx * 95 + Math.floor(Math.random() * 30);
  const churnRate = (2.8 - (idx * 0.1) + (Math.random() * 0.4)).toFixed(1);

  return {
    Periodo: mes,
    Ingresos_Totales: baseRevenue,
    Gasto_Marketing: marketing,
    Nomina: payroll,
    Costo_Operativo: operational,
    EBITDA: ebitda,
    Suscriptores_Activos: subscribers,
    Tasa_Churn_Pct: `${churnRate}%`,
    Ticket_Promedio: Math.round(baseRevenue / (subscribers * 0.4)),
  };
});

// 3. Sheet 3: Plan de Cuentas Financiero (Reporte jerárquico contable con sangría)
const planCuentasData = [
  { Codigo: '1', Cuenta: 'ACTIVO TOTAL', Nivel: 1, Tipo: 'Activo', Saldo_Actual: 625000, Presupuesto: 600000, Variacion_Pct: '+4.1%' },
  { Codigo: '11', Cuenta: 'Activo Corriente', Nivel: 2, Tipo: 'Activo', Saldo_Actual: 385000, Presupuesto: 370000, Variacion_Pct: '+4.0%' },
  { Codigo: '111', Cuenta: 'Disponible en Caja y Bancos', Nivel: 3, Tipo: 'Activo', Saldo_Actual: 165000, Presupuesto: 150000, Variacion_Pct: '+10.0%' },
  { Codigo: '11101', Cuenta: 'Caja General', Nivel: 4, Tipo: 'Activo', Saldo_Actual: 25000, Presupuesto: 20000, Variacion_Pct: '+25.0%' },
  { Codigo: '11102', Cuenta: 'Bancos Nacionales (Pichincha/Guayaquil)', Nivel: 4, Tipo: 'Activo', Saldo_Actual: 140000, Presupuesto: 130000, Variacion_Pct: '+7.6%' },
  { Codigo: '112', Cuenta: 'Cuentas y Documentos por Cobrar', Nivel: 3, Tipo: 'Activo', Saldo_Actual: 110000, Presupuesto: 115000, Variacion_Pct: '-4.3%' },
  { Codigo: '11201', Cuenta: 'Clientes Locales Retail', Nivel: 4, Tipo: 'Activo', Saldo_Actual: 82000, Presupuesto: 85000, Variacion_Pct: '-3.5%' },
  { Codigo: '11202', Cuenta: 'Clientes Corporativos Mayoristas', Nivel: 4, Tipo: 'Activo', Saldo_Actual: 28000, Presupuesto: 30000, Variacion_Pct: '-6.6%' },
  { Codigo: '113', Cuenta: 'Inventarios de Mercaderías', Nivel: 3, Tipo: 'Activo', Saldo_Actual: 110000, Presupuesto: 105000, Variacion_Pct: '+4.7%' },
  { Codigo: '12', Cuenta: 'Activo No Corriente / Fijo', Nivel: 2, Tipo: 'Activo', Saldo_Actual: 240000, Presupuesto: 230000, Variacion_Pct: '+4.3%' },
  { Codigo: '121', Cuenta: 'Equipos de Computo y Servidores', Nivel: 3, Tipo: 'Activo', Saldo_Actual: 95000, Presupuesto: 90000, Variacion_Pct: '+5.5%' },
  { Codigo: '122', Cuenta: 'Instalaciones y Mobiliario', Nivel: 3, Tipo: 'Activo', Saldo_Actual: 145000, Presupuesto: 140000, Variacion_Pct: '+3.5%' },
  { Codigo: '2', Cuenta: 'PASIVO TOTAL', Nivel: 1, Tipo: 'Pasivo', Saldo_Actual: 215000, Presupuesto: 220000, Variacion_Pct: '-2.2%' },
  { Codigo: '21', Cuenta: 'Pasivo Corriente', Nivel: 2, Tipo: 'Pasivo', Saldo_Actual: 125000, Presupuesto: 130000, Variacion_Pct: '-3.8%' },
  { Codigo: '211', Cuenta: 'Proveedores Nacionales', Nivel: 3, Tipo: 'Pasivo', Saldo_Actual: 78000, Presupuesto: 80000, Variacion_Pct: '-2.5%' },
  { Codigo: '212', Cuenta: 'Obligaciones Laborales e IESS', Nivel: 3, Tipo: 'Pasivo', Saldo_Actual: 47000, Presupuesto: 50000, Variacion_Pct: '-6.0%' },
  { Codigo: '22', Cuenta: 'Pasivo a Largo Plazo', Nivel: 2, Tipo: 'Pasivo', Saldo_Actual: 90000, Presupuesto: 90000, Variacion_Pct: '0.0%' },
  { Codigo: '3', Cuenta: 'PATRIMONIO NETO', Nivel: 1, Tipo: 'Patrimonio', Saldo_Actual: 410000, Presupuesto: 380000, Variacion_Pct: '+7.8%' },
  { Codigo: '31', Cuenta: 'Capital Social Suscrito', Nivel: 2, Tipo: 'Patrimonio', Saldo_Actual: 250000, Presupuesto: 250000, Variacion_Pct: '0.0%' },
  { Codigo: '32', Cuenta: 'Utilidades Acumuladas Ejercicios Anteriores', Nivel: 2, Tipo: 'Patrimonio', Saldo_Actual: 160000, Presupuesto: 130000, Variacion_Pct: '+23.0%' },
];

// Crear Workbook
const wb = XLSX.utils.book_new();

const wsVentas = XLSX.utils.json_to_sheet(ventasData);
const wsEvolucion = XLSX.utils.json_to_sheet(evolucionData);
const wsPlanCuentas = XLSX.utils.json_to_sheet(planCuentasData);

XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas_Retail');
XLSX.utils.book_append_sheet(wb, wsEvolucion, 'Evolucion_Financiera');
XLSX.utils.book_append_sheet(wb, wsPlanCuentas, 'Plan_de_Cuentas');

const outputDir = path.resolve(__dirname, '../demo-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'metricas_bi_ejemplo.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Archivo Excel generado con éxito en:', outputPath);
console.log('   Hojas creadas:');
console.log('   - Ventas_Retail (120 registros)');
console.log('   - Evolucion_Financiera (12 registros)');
console.log('   - Plan_de_Cuentas (20 cuentas jerárquicas)');
