# Proyecto BI

> **Plataforma de Business Intelligence, Analítica Visual y Reportes Ejecutivos en Tiempo Real.**  
> Arquitectura Hexagonal (Ports & Adapters) • Modular Monolith • TypeScript Strict • Metabase & Stripe-Grade Aesthetics.

---

## 🏛️ Arquitectura del Sistema

Proyecto BI está construido siguiendo estrictamente los principios de **Arquitectura Hexagonal (Ports and Adapters)** y **Modular Monolith**, garantizando desacoplamiento total entre lógica de negocio y controladores de infraestructura.

```text
       ┌────────────────────────┐         ┌────────────────────────┐
       │   apps/web (Next.js)   │         │    apps/api (Hono)     │
       └───────────┬────────────┘         └───────────┬────────────┘
                   │                                  │
                   ▼                                  ▼
       ┌───────────────────────────────────────────────────────────┐
       │                   packages/contracts                      │
       │     (Pure Ports, DTOs, Zod Schemas, Domain Interfaces)    │
       └───────────────────────────▲───────────────────────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
       ┌───────────┴────────────┐     ┌────────────┴───────────┐
       │   packages/query-ir    │     │ plugins/connector-*    │
       │ (AST Read-Only Parser) │     │ (Postgres, Mock, etc.) │
       └────────────────────────┘     └────────────────────────┘
                   │                               │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                      ┌────────────────────────┐
                      │    packages/kernel     │
                      │  (Result<T, E> Pattern)│
                      └────────────────────────┘
```

### Límites de Dependencia Invertida
1. **`packages/contracts`**: Define puertos, esquemas Zod y contratos puros sin dependencias de infraestructura.
2. **`packages/kernel`**: Implementa el patrón funcional `Result<T, E>` para manejo de errores sin excepciones imprevistas.
3. **`packages/query-ir`**: Validador AST que garantiza que **solo** se ejecuten consultas `SELECT` de solo lectura, bloqueando DDL/DML, inyecciones y consultas apiladas.
4. **`plugins/*`**: Implementan los puertos de `contracts` y nunca dependen de otros plugins ni de las aplicaciones.
5. **`apps/*`**: Consumen contratos y módulos, orquestando la experiencia del usuario y la API REST/OpenAPI.

---

## ✨ Características Principales

### 1. Tablero Ejecutivo en Tiempo Real (`DashboardCanvas`)
- **Lienzo Adaptativo:** Sistema de grid de 12 columnas con reordenamiento mediante drag-and-drop con placeholders visuales.
- **Redimensionamiento Físico Directo:** Arrastre de esquinas y bordes con límites inteligentes según el tipo de visualización.
- **Micro-animaciones FLIP:** Transiciones suaves a 60 FPS sin saltos de layout.
- **Vista Expandida Fullscreen (`CardExpandModal`):** Inspección de métricas en alta definición con exportación a PNG y JSON.

### 2. Exportador Ejecutivo en PDF (`ExportPdfModal`)
- **Previsualización Interactiva A4:** Vista en vivo que refleja exactamente cómo quedará el documento impreso antes de descargarlo.
- **Estimación y Control de Hojas:**
  - *Ajustar a 1 Hoja (Recomendado):* Escala y acopla todo el tablero proporcionalmente sin cortes.
  - *2 Hojas A4 (Paginado por Secciones):* Divide el reporte en bloques lógicos (KPIs en Hoja 1, detalle contable y tablas en Hoja 2).
- **Temas de Contraste:** *Blanco Puro* (impresión económica), *Gris Ejecutivo* (contraste con relieve) y *Pizarra Dark* (presentaciones digitales).
- **Resolución Vectorial:** Renderizado Retina 2x sin duplicación de cabeceras ni cortes de texto.

### 3. Estudio Visual de Preguntas (`VisualBuilderView`)
- **Diseño de 3 Columnas:** Configuración de dimensiones y agregaciones a la izquierda, lienzo en vivo al centro y catálogo de visualizaciones a la derecha.
- **Catálogo de Visualizaciones (`ChartCatalogDrawer`):** Selección ágil entre Barras Agrupadas, Barras de Ranking, Líneas, Áreas, Donas, Tacómetros (Radial Gauge) y Embudos (Funnel).

### 4. Estética de Alto Nivel (Modo Claro y Oscuro)
- **Modo Claro (Inspiración Stripe & Linear):** Fondo de escritorio en pizarra suave (`#f1f5f9`), tarjetas en relieve con sombras multicapa, pestañas superiores de color en KPIs y grillas analíticas punteadas.
- **Curvas Volumétricas (`chart-theme.ts`):** Sombras proyectadas de color (`shadowBlur: 12`, `shadowOffsetY: 6`), degradés enriquecidos de 3 paradas y puntos luminosos que eliminan la sensación de gráficos lavados.
- **Modo Oscuro:** Contraste profundo estilo Bloomberg/Metabase con líneas de neón y brillos sutiles.

### 5. Explorador de Datos y Carga en Memoria
- **Explorador de Datos (`DataBrowserView`):** Cuadrícula completa con filtros en vivo y generación instantánea de gráficos.
- **Carga de Excel y CSV (`ExcelUploadModal`):** Análisis inmediato en memoria sin necesidad de configurar bases de datos.

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** & **Docker Compose** (opcional, para base de datos demo)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Jeanpy171/project-bi.git
cd project-bi

# Instalar dependencias
pnpm install
```

### Levantar Base de Datos Demo (Docker)

```bash
# Iniciar Postgres 16 con datos de retail y finanzas
docker compose -f infra/docker-compose.yml up -d
```

### Ejecutar en Desarrollo

```bash
# Iniciar backend (Hono) y frontend (Next.js) concurrentemente
pnpm dev
```

- **Frontend (Web):** [http://localhost:3000](http://localhost:3000)
- **Backend (API):** [http://localhost:3001](http://localhost:3001)
- **Documentación OpenAPI:** [http://localhost:3001/doc](http://localhost:3001/doc)

### Pruebas y Validación de Tipos

```bash
# Ejecutar suite de pruebas con Vitest
pnpm test

# Verificación estricta de TypeScript
pnpm typecheck
```

---

## 🌿 Flujo de Ramas y Versiones

Este repositorio sigue el modelo **Git Flow** y **Conventional Commits**:

- **`main`**: Rama de producción estable. Cada commit representa una versión liberada.
- **`develop`**: Rama principal de integración activa.
- **Conventional Commits:** Formato obligatorio (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- **SemVer:** Versionado semántico documentado en [`CHANGELOG.md`](./CHANGELOG.md).

---

## 📄 Licencia

Proyecto BI es un desarrollo privado e independiente. Todos los derechos reservados.
