# Proyecto BI Personalizable sobre Metabase: Análisis, Requisitos y Arquitectura

Oct 21, 2026 · @Jean Fuentes

## 1. Análisis del proyecto

La oportunidad es una capa de experiencia sobre bases de datos propias: dashboards personalizables, enlaces compartibles en vivo y consultas asistidas por IA, sin la curva de aprendizaje de Metabase. Lo que sigue sale de las capturas que adjuntaste.

**Lo que Metabase hace bien (y conviene no reinventar).** El asistente de instalación es claro: 4 pasos (perfil, para qué lo usarás, tus datos, preferencias de uso) y permite seguir con una base de ejemplo. Ofrece 15 motores en el asistente (MySQL, PostgreSQL, SQL Server, Redshift, BigQuery, Snowflake, Athena, ClickHouse, Databricks, Druid, MongoDB, Presto, Spark SQL, SQLite, Starburst/Trino) y subida de CSV. Incluye colecciones, modelos, métricas, papelera, personas, grupos, permisos y una lista de primeros pasos ("Cómo usar Metabase"), así que nuestro tutorial debe ir más allá: contextual e interactivo. Sus visualizaciones son de buen nivel: donut, KPI, gauge, barra de meta, mapa por estado, barras apiladas, áreas, líneas con doble eje, embudo y tabla pivote (ver el dashboard "Overall business health" de la penúltima imagen).

**Fricciones observadas en las capturas (el "por qué" del proyecto):**

| Fricción | Evidencia en las capturas | Oportunidad |
| --- | --- | --- |
| Conexión a la BDD difícil para un no técnico | Con host `localhost` aparece "Mmm, no pudimos conectarnos a la base de datos. Asegúrate de que la configuración de Host y Port sea correcta"; solo funcionó con la IP `172.22.112.1` (típico de Docker/WSL). El mensaje es genérico y no nombra la causa | Asistente de diagnóstico guiado (DNS, puerto, credenciales, SSL) con mensajes que expliquen la causa probable |
| Flujo largo para crear un dashboard | Nuevo > Dashboard > nombre y colección > "Añadir una pregunta" > nueva pregunta SQL > "Guardar nueva pregunta" > elegir colección o dashboard > recién entonces aparece la tarjeta | Crear y editar gráficos dentro del propio dashboard con un solo constructor |
| Configuración de gráficos poco guiada | El editor de la tarjeta pregunta "¿Qué campos quieres usar para los ejes X e Y?" sin sugerir campos; en la prueba con "reviews per products", casi todo el donut quedó agrupado en "Otros" y el embudo mostró decenas de etapas | Recomendador de gráfico según el tipo de dato, con vista previa y advertencias claras |
| Personalización y funciones avanzadas en planes de pago | Avisos "Metabase Pro" en Incrustación (métodos más potentes), Autenticación (gestión de personas y grupos) y Rendimiento (control de caché); el menú de Ajustes marca con ícono de pago Apariencia y Visualizaciones personalizadas | Temas, marca y visualizaciones propias incluidos desde el inicio |
| IA limitada y separada | El generador de SQL dice "Para usar Generación de SQL, por favor conéctate a un modelo"; la IA se configura aparte (Administración > IA > "Añadir un proveedor" y "Configurar IA" al final del asistente) | IA integrada y opcional, con guía de conexión y el esquema ya indexado |
| Compartir e incrustar con restricciones | "Habilitar incrustaciones de invitado" viene desactivado, hay una clave secreta de incrustación aparte y la caché por defecto es "No almacenar resultados en caché" | Enlaces firmados con expiración y refresco en vivo, con frescura visible |

**Sobre las dos últimas imágenes.** La penúltima es el dashboard de ejemplo "Overall business health" de Metabase: marca el nivel de variedad visual que debemos igualar (donut, KPI, gauge, barra de meta, mapa, barras apiladas, líneas con doble eje, áreas y tabla pivote en un solo tablero). La última es un *Plan de cuentas* de Contabilidad Básica (Universidad Católica Boliviana "San Pablo"): códigos jerárquicos (1 > 11 > 111 > 11101 > 1110101) con niveles irregulares y cuentas en moneda nacional y extranjera. Ambas son **ejemplos de informes que el producto debe poder construir**, no un vertical contable: el producto es genérico (contable, ventas, operaciones, académico) sobre bases propias o externas de prueba. Por eso la capa semántica debe soportar jerarquías por prefijo de código y métricas en general, e importar CSV/Excel resulta útil para casos como este. Esta sección se verificó contra las 25 páginas del PDF el 22 de octubre de 2026.

**Decisión confirmada:** ¿construyen *encima* de Metabase (usando su API como motor y un frontend propio) o un producto independiente que solo se inspira en él? Este documento asume **producto independiente con conectores propios**, porque la API de Metabase no cubre la personalización visual buscada y la licencia AGPL condiciona la redistribución.

## 1.1 Panorama de alternativas y cómo nos diferenciamos

Metabase es el punto de partida de la experiencia (simple, visual), no el modelo a copiar. Las herramientas cercanas resuelven cada una solo una parte del problema; nuestra oportunidad está en juntar esas partes y quitar la fricción para el cliente.

| Herramienta | Enfoque | Qué aprender | Hueco que deja |
| --- | --- | --- | --- |
| Metabase | BI visual y simple, núcleo AGPL con niveles de pago | Onboarding sencillo, constructor de preguntas, colecciones | Personalización y temas limitados; IA y funciones avanzadas en planes de pago; flujo fragmentado para crear tarjetas |
| Apache Superset | BI potente a escala, Apache 2.0 | Catálogo amplio de gráficos, motor de permisos | Curva de aprendizaje alta; pesado de instalar y operar; interfaz sobrecargada |
| Redash | Paneles ligeros centrados en SQL | Consultas guardadas y parámetros | Orientado a quien sabe SQL; interfaz anticuada y constructor visual casi nulo |
| Lightdash | BI sobre dbt, métricas como código | Capa semántica versionada | Exige dbt; no sirve a quien tiene solo una base de datos transaccional |
| Evidence | Informes "BI como código" (markdown + SQL) | Dashboards versionables, publicación estática | Requiere flujo de desarrollador, no apto para analistas no técnicos |
| Rill | Dashboards declarativos (YAML) sobre OLAP (DuckDB) | Interacción ultrarrápida, modelado ágil | Enfoque de ingeniería de datos; sin constructor visual accesible |
| Cube.js | Capa semántica headless (API SQL/REST/GraphQL) | Modelado semántico robusto, pre-agregaciones y caché | Es solo backend headless; no provee frontend ni visualización lista para usuario final |
| Grafana | Paneles y observabilidad en tiempo real | Streaming en vivo, excelente ecosistema de plugins | Pensado para métricas de sistemas y series temporales, no para analítica de negocio multidimensional |
| DuckDB-Wasm / Perspective | Analítica en memoria en el navegador | Procesamiento cliente a latencia cero sobre datasets medianos/CSV | Falta capa de permisos, persistencia compartida y gobernanza |
| Omni | BI moderno fundado por creadores de Looker | Unifica en una sola vista: hoja de cálculo, SQL libre y constructor visual con modelo semántico vivo | SaaS propietario de alto costo; no es autoalojable ni de código abierto |
| Wren AI | Capa semántica + texto a SQL + gráficos con IA | Reducción de alucinaciones en SQL mediante semántica | Enfoque casi exclusivo en IA; descuida el modo manual y la personalización visual profunda |
| Vanna AI | Texto a SQL por recuperación sobre DDL y ejemplos | Aprendizaje de pares pregunta-SQL aprobados | Repositorio abierto archivado en marzo de 2026: no depender de él |

**Dónde nos diferenciamos (todo en pro del cliente):**

1. **Manual y IA con paridad real:** Ninguna de las anteriores ofrece a la vez un constructor visual, SQL libre, tutorial guiado y IA opcional que producen exactamente el mismo objeto editable y reutilizable.
2. **Autoría in-situ (estilo Notion/Canvas):** En Metabase, crear un gráfico obliga a salir del tablero, armar una "pregunta", guardarla en una colección y volver al dashboard para añadirla. Nuestro flujo permite crear, editar y probar visualizaciones directamente dentro del lienzo del dashboard sin perder contexto ni romper la concentración.
3. **Dashboard como documento versionable con editor visual:** Une lo mejor de Evidence y Rill (JSON/YAML versionable, importar/exportar, plantillas en git) con la facilidad drag-and-drop de un editor visual moderno.
4. **Reportes jerárquicos y exportación con formato real (Pixel-Perfect):** Capacidad nativa para estructurar informes complejos (como estados financieros, balances o planes de cuentas con niveles `1 > 11 > 111`) y exportarlos a PDF/Excel con formato ejecutivo limpio, resolviendo la histórica queja de Metabase sobre exportaciones planas y rotas.
5. **Personalización sin muros de pago (White-Labeling real):** Temas de marca, tipografía, paletas corporativas, formato condicional y un SDK de tipos de gráficos (basado en ECharts) totalmente abierto desde el inicio, sin licencias restrictivas ni marcas de agua forzadas.
6. **Analítica Híbrida y Portátil (Motor BDD + DuckDB local/Wasm):** Posibilidad de analizar bases de datos remotas en solo lectura y, al mismo tiempo, soltar un CSV/Excel para explorarlo al instante en el navegador o en un DuckDB embebido sin saturar servidores ni bases de datos de producción.
7. **IA privada y auditable por diseño:** Soporte de Ollama local sin salida a internet, enmascarado automático de PII antes de consultar proveedores externos (Gemini) y generación basada en metadatos/esquema, nunca sobre datos crudos de clientes.
8. **Capa semántica ligera y asistida:** La IA propone definiciones iniciales de métricas, sinónimos y jerarquías que el usuario aprueba o refina con un clic; sin obligar a dominar herramientas complejas como dbt.
9. **Conexión y diagnóstico sin frustración:** Asistente guiado que identifica la causa real de un fallo de red (como resolver `host.docker.internal` en Docker/WSL, validar SSL o sugerir IPs permitidas) con mensajes humanos y soluciones sugeridas.
10. **Compartir en vivo con frescura visible:** Enlaces públicos o firmados con revocación, control fino de expiración, refresco en tiempo real mediante Server-Sent Events (SSE) y etiqueta de frescura ("actualizado hace 8 s").

**Cuidado legal y de producto:** no copiar código ni diseño de Metabase (su núcleo es AGPL); inspirarse en la experiencia, no en la implementación. Verifica la licencia de cada librería que adoptes. La comparación es un resumen de fuentes públicas y de proveedores con intereses propios, así que conviene probar cada herramienta antes de decidir qué copiar de su experiencia.

**Datos verificados sobre Metabase:** según su [página oficial de licencia](https://metabase.com/license), la edición abierta es AGPL y, para incrustar con iframes, hay que cumplir la AGPL, mantener el logo "Powered by Metabase" o comprar una licencia comercial. Según un [artículo de precios de terceros](https://coefficient.io/metabase-pricing) (confirma en la web oficial), la edición abierta no incluye marca blanca, seguridad por filas ni incrustación interactiva; justo ahí está el hueco que el cliente nota.

Fuentes: [5 alternativas open source a Metabase (Sliplane)](https://sliplane.io/blog/5-open-source-metabase-alternatives) · [BI autoalojado comparado (Definite, proveedor comercial)](https://definite.app/blog/best-self-hosted-bi-tools) · [Wren AI vs Vanna AI (Querio)](https://querio.ai/articles/wren-ai-vs-vanna-ai-open-source-text-to-sql-compared) · [Wren AI vs Vanna (Wren AI)](https://getwren.ai/post/wren-ai-vs-vanna-the-enterprise-guide-to-choosing-a-text-to-sql-solution) · [Reglas y flujos de Antigravity](https://www.antigravity.google/docs/rules-workflows)

## 2. Visión, alcance y principios

**Visión:** una plataforma web donde cualquier persona conecte una base de datos y obtenga dashboards bonitos, personalizables, compartibles y en vivo, en minutos. Se puede trabajar **a mano** (constructor visual, SQL, tutorial guiado) o **con IA** (Gemini o un modelo local con Ollama), y ambas vías llevan al mismo resultado.

**Personas objetivo**

| Persona | Necesidad | Qué le damos |
| --- | --- | --- |
| Analista de negocio (no técnico) | Respuestas sin SQL | Constructor visual + chat con IA |
| Gerente / decisor | Ver métricas y compartirlas | Dashboards con enlace en vivo |
| Administrador de datos | Controlar acceso y costos | Conectores, permisos, límites, auditoría |
| Desarrollador / integrador | Embeber y automatizar | API pública, SDK y webhooks |

**Alcance de la Fase 1 (MVP), decidido:** autoalojado (self-hosted) con Docker Compose; interfaz solo en español; TypeScript de extremo a extremo; conector PostgreSQL; proveedores de IA Gemini y Ollama local; **modo manual completo con tutorial guiado**; dashboards con 6 a 8 tipos de gráfico; compartir por enlace firmado y actualización en vivo. **Fuera de alcance inicial:** SaaS multi-organización con facturación (el diseño lo deja preparado), edición colaborativa simultánea, conectores NoSQL, otros idiomas.

**Equipo y herramientas:** 2 personas desarrollando con herramientas de IA (por ejemplo Antigravity). Esto obliga a recortar alcance, apoyarse en plantillas y generadores, y mantener especificaciones claras para que los agentes de código no se desvíen.

**Principios de diseño**

1. **Manual primero, IA opcional:** todo lo que puede hacer la IA se puede hacer a mano desde la interfaz; la IA solo acelera.
2. **Contrato primero:** todo comportamiento nace como especificación (OpenAPI, esquemas Zod y escenarios Gherkin) antes del código.
3. **Todo es un plugin:** conectores de BDD, proveedores de IA y tipos de gráfico se registran contra interfaces estables.
4. **Solo lectura por defecto:** la plataforma nunca escribe en la BDD del cliente.
5. **La IA propone, el humano confirma:** el SQL generado se valida, se muestra y se puede editar.
6. **Aprender haciendo:** cada función importante tiene ejemplo y guía integrados.
7. **Observable desde el día uno:** trazas, métricas y registro de cada consulta y llamada a IA.

## 3. Requisitos funcionales

Prioridad: **M** = MVP, **F2** = fase 2, **F3** = fase 3. Cada requisito debe tener un ID trazable a su especificación y a sus pruebas.

**Épica A: Conexiones y proveedores de datos**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-A1 | Registrar una conexión PostgreSQL (campos o cadena de conexión), con SSL y túnel SSH opcional | M |
| RF-A2 | Asistente de diagnóstico: probar DNS, puerto, credenciales y SSL con mensajes accionables (caso `localhost` en Docker) | M |
| RF-A3 | Introspección del esquema (tablas, columnas, tipos, claves, relaciones) y sincronización programada | M |
| RF-A4 | Interfaz común de conector para añadir MySQL, SQL Server, BigQuery, Snowflake, etc. sin tocar el núcleo | M (diseño) / F2 (más motores) |
| RF-A5 | Credenciales cifradas; usuario de solo lectura recomendado y verificado | M |
| RF-A6 | Límite de filas, tiempo y costo por consulta, configurable por conexión | M |
| RF-A7 | Importar CSV y Excel como fuente de datos (tabla almacenada en un motor interno), útil para listas como el plan de cuentas y para demostraciones sin base de datos | F2 |

**Épica B: Capa semántica y modelos**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-B1 | Definir métricas, dimensiones y relaciones reutilizables (ej. "Ingresos", "Cuentas por cobrar") | F2 |
| RF-B2 | Soporte de jerarquías (ej. plan de cuentas 1 > 11 > 111 > 11101) con agregación por nivel | F2 |
| RF-B3 | Descripciones y sinónimos por tabla y columna, editables y generables con IA | M |

**Épica C: Consultas e IA**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-C1 | Configurar proveedores de IA mediante una interfaz común (Gemini y Ollama local en el MVP; luego OpenAI, Anthropic y otros) | M |
| RF-C2 | Chat en lenguaje natural que genera SQL usando el esquema indexado, lo valida y lo ejecuta en solo lectura | M |
| RF-C3 | Mostrar el SQL generado, explicarlo en lenguaje llano y permitir editarlo | M |
| RF-C4 | Sugerir el gráfico más adecuado para el resultado | M |
| RF-C5 | Agente que crea un dashboard completo a partir de una descripción ("ventas por mes y por región") | F2 |
| RF-C6 | Detección de anomalías y resúmenes narrativos automáticos de un dashboard | F3 |
| RF-C7 | Registro de consumo de tokens y costo por usuario y proveedor | F2 |

**Épica D: Dashboards y visualización**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-D1 | Lienzo de cuadrícula arrastrable y redimensionable, con varias pestañas | M |
| RF-D2 | Tipos de gráfico del MVP: línea, área, barras (agrupadas y apiladas), donut/pastel, KPI, tabla, mapa de calor | M |
| RF-D3 | Tipos adicionales: embudo, gauge, mapa coroplético, pivote, dispersión, cascada, combinado de doble eje | F2 |
| RF-D4 | Personalización completa: colores, tipografía, etiquetas, ejes, leyendas, formato condicional, temas de marca | M (básico) / F2 (avanzado) |
| RF-D5 | Filtros globales y por tarjeta, con interacción cruzada (clic en un gráfico filtra los demás) | F2 |
| RF-D6 | Plantillas de dashboard por industria (finanzas, ventas, operaciones) | F2 |
| RF-D7 | SDK de tipos de gráfico propios (plugin con esquema de configuración y renderizador) | F3 |

**Épica E: Compartir y tiempo real**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-E1 | Enlace compartible firmado, con expiración, revocable, de solo lectura | M |
| RF-E2 | Actualización en vivo: refresco por intervalo (SSE) y, cuando el motor lo permita, por eventos (LISTEN/NOTIFY) | M |
| RF-E3 | Caché por tarjeta con TTL configurable y control de frescura visible ("actualizado hace 12 s") | M |
| RF-E4 | Incrustación en otros sitios (iframe y componentes web) con tema heredado | F2 |
| RF-E5 | Exportar a PDF, PNG y CSV; envío programado por correo | F2 |
| RF-E6 | Alertas por umbral con notificación (correo, webhook, Slack) | F3 |

**Épica F: Identidad, permisos y administración**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-F1 | Registro, inicio de sesión y organización (espacio de trabajo) | M |
| RF-F2 | Roles: administrador, editor, lector; permisos por conexión, colección y dashboard | M |
| RF-F3 | SSO (Google, OIDC) y SCIM | F3 |
| RF-F4 | Registro de auditoría de consultas, cambios y accesos por enlace | M |
| RF-F5 | API pública con claves y webhooks | F2 |

**Épica G: Modo manual y aprendizaje guiado (sin IA)**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-G1 | Constructor visual de consultas sin SQL: elegir tabla, columnas, filtros, agrupación, orden y uniones sugeridas por las relaciones detectadas | M |
| RF-G2 | Editor SQL con autocompletado del esquema, historial y consultas guardadas | M |
| RF-G3 | Constructor manual de gráficos: elegir tipo, asignar campos a ejes, series y valores, con vista previa en vivo y mensajes claros ("falta un campo numérico para el eje Y") | M |
| RF-G4 | Base de datos de demostración incluida, con dashboards y consultas de ejemplo para explorar sin conectar nada propio | M |
| RF-G5 | Tutorial guiado interactivo con progreso: conectar la BDD, primera consulta, primer gráfico, primer dashboard, compartir | M |
| RF-G6 | Ayuda contextual y recetas "cómo hago…" con ejemplos copiables (plantillas de consulta por tipo de análisis: tendencia, comparación, ranking, embudo, jerarquía contable) | M |
| RF-G7 | Guía paso a paso para conectar una IA (clave de Gemini; instalar Ollama y descargar un modelo) con botón "probar conexión" | M |
| RF-G8 | Paridad: toda acción que pueda hacer la IA debe existir en la interfaz manual | M |
| RF-G9 | Lo creado por la IA se abre en el mismo constructor manual para ajustarlo | M |

**Épica H: IA mediante herramientas y MCP**

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-H1 | Registro único de herramientas (`list_tables`, `describe_table`, `run_readonly_sql`, `suggest_chart`, `create_chart_draft`, `create_dashboard_draft`) con esquema Zod, usado por la interfaz, la IA interna y MCP | M |
| RF-H2 | Chat de IA interno que usa el *tool calling* del proveedor (Gemini, Ollama) sobre ese registro | M |
| RF-H3 | Modo determinista para modelos locales pequeños: esquema en el prompt, generar SQL, validar, sin bucle de agente | M |
| RF-H4 | Todas las acciones de la IA producen borradores que la persona aprueba antes de guardar o publicar | M |
| RF-H5 | Servidor MCP propio (HTTP y stdio) que expone las mismas herramientas a clientes externos (Antigravity, Claude Desktop, IDEs), con token y solo lectura | F2 |
| RF-H6 | Cliente MCP para conectar servidores externos como fuentes de contexto | F3 |

## 4. Requisitos no funcionales

| ID | Categoría | Requisito medible |
| --- | --- | --- |
| RNF-01 | Rendimiento | Dashboard de 10 tarjetas visible en menos de 3 s con caché caliente; primer byte de la API menos de 300 ms (p95) |
| RNF-02 | Tiempo real | Latencia de actualización menor a 5 s desde el cambio hasta la pantalla con SSE; reconexión automática |
| RNF-03 | Escalabilidad | API sin estado, escalable en horizontal; trabajos largos en cola; 500 usuarios concurrentes por nodo en el MVP |
| RNF-04 | Seguridad de datos | Cifrado en reposo de credenciales (cifrado de sobre con clave maestra/KMS) y TLS en tránsito |
| RNF-05 | Seguridad de consultas | Todo SQL (incluido el de la IA) pasa por análisis sintáctico (AST): solo `SELECT`, lista blanca de tablas, `LIMIT` forzado, `statement_timeout`, transacción de solo lectura |
| RNF-06 | Seguridad de IA | Defensa contra inyección de prompts desde datos; el modelo recibe esquema y metadatos, nunca filas completas salvo muestra explícita y enmascarada |
| RNF-07 | Privacidad | Opción de modelo local (Ollama) y enmascarado de columnas sensibles (PII) antes de enviarlas a un proveedor externo |
| RNF-08 | Aislamiento | Separación lógica por organización (RLS en la BDD de metadatos); enlaces compartidos con alcance mínimo |
| RNF-09 | Extensibilidad | Añadir un conector o proveedor de IA requiere solo un paquete nuevo y su registro, sin modificar el núcleo; pruebas de contrato obligatorias |
| RNF-10 | Observabilidad | Trazas distribuidas (OpenTelemetry), métricas RED, registro estructurado, ID de correlación por consulta |
| RNF-11 | Disponibilidad | 99,5 % en el MVP; todo funciona sin IA configurada (modo manual) y hay degradación elegante si la IA o un conector falla |
| RNF-12 | Usabilidad | Una persona sin conocimientos conecta una BDD y crea su primer gráfico en menos de 5 minutos; WCAG 2.2 AA; español en el MVP, con textos externalizados para añadir idiomas después |
| RNF-13 | Portabilidad | Autoalojado primero: Docker Compose en un comando (app, worker, Postgres, Redis y Ollama opcional); diseño sin estado y con organizaciones desde el inicio para poder evolucionar a SaaS |
| RNF-14 | Mantenibilidad | Cobertura mínima 80 % en dominio; TypeScript estricto; límites entre módulos verificados automáticamente |
| RNF-15 | Costos de IA | Presupuesto y cuota por organización; caché semántica de consultas repetidas; elección de modelo por tarea (barato para clasificar, potente para generar SQL) |
| RNF-16 | Cumplimiento | Registro de auditoría inmutable; retención configurable; cumplimiento de la normativa de protección de datos del país de despliegue (por definir) |

## 5. Arquitectura recomendada

**Decisión central: monolito modular con arquitectura hexagonal (puertos y adaptadores), preparado para extraer servicios.** Un solo despliegue al inicio (menos costo operativo), con límites estrictos entre módulos para separar después los trabajos pesados (ejecución de consultas, agentes de IA) sin reescribir.

```text
┌──────────────────────── Cliente (Next.js / React) ────────────────────────┐
│ Constructor visual · Lienzo de dashboard · Chat IA · Vista pública       │
└───────────────┬───────────────────────────────────────┬──────────────────┘
                │ REST/tRPC + OpenAPI                   │ SSE (tiempo real)
┌───────────────▼───────────────────────────────────────▼──────────────────┐
│                        API Gateway / BFF (Hono o Fastify)               │
│   Auth · RBAC · Rate limit · Validación Zod · Trazas OpenTelemetry       │
└──┬─────────────┬─────────────┬──────────────┬──────────────┬─────────────┘
   │             │             │              │              │
┌──▼─────┐ ┌─────▼────┐ ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼──────┐
│Conexio-│ │ Capa     │ │ Dashboards │ │ IA / Agen- │ │ Compartir y │
│nes     │ │ semántica│ │ y gráficos │ │ tes        │ │ tiempo real │
└──┬─────┘ └─────┬────┘ └──────┬─────┘ └──────┬─────┘ └──────┬──────┘
   │  PUERTOS (interfaces estables en packages/contracts)             │
┌──▼─────────────▼─────────────▼──────────────▼──────────────▼─────────────┐
│ ADAPTADORES (plugins): conectores BDD · proveedores LLM · tipos de gráfico│
│ postgres, mysql, bigquery… │ gemini, openai, anthropic, ollama… │ line…  │
└──┬──────────────────────────────────────────────┬────────────────────────┘
   │                                              │
 BDD del cliente (solo lectura)      BDD de metadatos (Postgres) + Redis (caché, colas, pub/sub)
```

**Decisiones clave**

| Decisión | Elección | Razón |
| --- | --- | --- |
| Estilo | Monolito modular + hexagonal | Evolución a servicios sin reescritura |
| Extensibilidad | Registro de plugins con interfaz `DataSourceConnector`, `LLMProvider`, `ChartType` | Cumple RNF-09 |
| Capa semántica | Modelo propio en JSON/YAML versionado (métricas, dimensiones, jerarquías) | La IA genera SQL contra el modelo semántico, no contra tablas crudas: más precisión y seguridad |
| Consultas | Representación intermedia (AST/Query IR) independiente del dialecto, compilada por cada conector | Permite varios motores con un solo editor visual |
| Tiempo real | SSE + invalidación de caché por TTL y, si el motor lo soporta, LISTEN/NOTIFY | Más simple y barato que WebSocket para flujo de servidor a cliente |
| IA | Capa de abstracción de proveedores con enrutado por tarea y salida estructurada | Cambiar de Gemini a otro sin tocar el dominio |
| Datos de la app | Postgres propio (metadatos) separado de la BDD del cliente | Aislamiento y seguridad |
| Configuración de dashboards | Documento JSON versionado con esquema Zod ("dashboard como código") | Permite diff, plantillas, importar/exportar y que la IA lo genere de forma fiable |

**Flujo de una pregunta con IA:** el usuario escribe > se recupera el contexto relevante del esquema y de la capa semántica (RAG sobre metadatos, no sobre datos) > el agente genera la consulta > validación AST y de políticas > ejecución en solo lectura con límites > recomendación de gráfico > el usuario confirma y lo fija al dashboard.

**¿La IA necesita MCP para crear consultas y gráficos? No es obligatorio.** Hay tres caminos, y conviene combinarlos con un solo registro de herramientas:

| Camino | Cómo funciona | Cuándo usarlo | Prio |
| --- | --- | --- | --- |
| Herramientas internas (*tool calling*) | La app llama a Gemini u Ollama pasando la lista de herramientas (`run_readonly_sql`, `create_chart_draft`…) y ejecuta las que el modelo pida | Chat dentro de la app; es el camino principal y no requiere MCP | M |
| Flujo determinista | Se envía el esquema en el prompt y se pide solo el SQL o la configuración del gráfico en JSON validado con Zod; sin bucle de agente | Modelos locales pequeños de Ollama, que fallan más con herramientas | M |
| Servidor MCP propio | Las mismas herramientas se publican por el protocolo MCP | Cuando una IA externa (Antigravity, Claude Desktop, un IDE) deba consultar tus dashboards; no es necesario para el chat interno | F2 |

La clave es el paquete `tool-registry`: cada herramienta se define **una vez** (nombre, descripción, esquema de entrada y salida con Zod, política de seguridad) y tres consumidores la reutilizan: la interfaz manual, el chat interno y el servidor MCP. Así la IA nunca puede hacer algo que la interfaz manual no permita (RF-G8), y no hay lógica duplicada.

**Modo manual y modo IA convergen en el mismo objeto:** ambos producen un *borrador* (consulta + configuración de gráfico en el esquema de dashboard). La persona lo abre en el mismo constructor, lo ajusta y lo guarda.

## 6. Estructura de carpetas (monorepo)

Monorepo con pnpm + Turborepo. Regla de dependencias: `apps` depende de `modules`; `modules` dependen de `contracts`; los `plugins` implementan `contracts`; nadie importa de `apps`. Se hace cumplir con dependency-cruiser o Nx Enforce Module Boundaries.

```text
proyecto-bi/
├── AGENTS.md                      # contexto raíz para agentes de código (Antigravity, Claude Code, etc.)
├── specs/                         # FUENTE DE VERDAD (spec-driven)
│   ├── constitution.md            # principios, stack, reglas no negociables
│   ├── features/
│   │   └── 001-conexion-postgres/
│   │       ├── spec.md            # qué y por qué (RF, criterios)
│   │       ├── plan.md            # cómo (diseño técnico)
│   │       ├── tasks.md           # tareas atómicas verificables
│   │       └── scenarios.feature  # Gherkin = pruebas de aceptación
│   ├── adr/                       # decisiones de arquitectura (0001-...md)
│   └── api/openapi.yaml           # contrato HTTP generado desde Zod
├── .agents/                       # skills, comandos y subagentes (ver sección 8)
├── apps/
│   ├── web/                       # Next.js (App Router): UI, tutorial, vista pública
│   ├── api/                       # Hono/Fastify: composición de módulos
│   ├── worker/                    # BullMQ: sincronización, refresco, exportes
│   └── mcp/                       # servidor MCP (fase 2), reutiliza tool-registry
├── packages/
│   ├── contracts/                 # PUERTOS: interfaces + esquemas Zod (sin lógica)
│   │   └── connector.ts  llm-provider.ts  chart-type.ts  dashboard-schema.ts  tool.ts
│   ├── kernel/                    # Result, errores, eventos de dominio, DI, config
│   ├── query-ir/                  # representación intermedia + validador AST de SQL
│   ├── semantic-layer/            # métricas, dimensiones, jerarquías
│   ├── tool-registry/             # herramientas definidas una vez: UI, chat IA y MCP
│   ├── ui/                        # sistema de diseño (shadcn/ui + tokens)
│   ├── chart-engine/              # render de gráficos (ECharts) + registro
│   ├── guides/                    # tutorial guiado, recetas y ejemplos (contenido en español)
│   ├── sdk/                       # cliente tipado generado desde OpenAPI
│   └── testing/                   # fixtures, contract tests, BDD de demostración
├── modules/                       # NÚCLEO DE DOMINIO (hexagonal por módulo)
│   ├── connections/  {domain, application, infrastructure, http}
│   ├── query/                     # constructor visual + SQL manual
│   ├── semantic/
│   ├── dashboards/
│   ├── ai/                        # chat, flujo determinista, orquestación
│   ├── sharing/
│   └── identity/
├── plugins/                       # ADAPTADORES: un paquete por proveedor
│   ├── connector-postgres/        # MVP
│   ├── connector-mysql/           # futuro
│   ├── llm-gemini/  llm-ollama/   # MVP
│   ├── llm-openai/  llm-anthropic/   # futuro
│   └── chart-funnel/  chart-gauge/  ...
├── infra/                         # docker-compose (app, worker, postgres, redis, ollama opcional)
├── evals/                         # evaluación de IA: text-to-SQL, golden sets
└── tools/                         # generadores (plop/hygen) de plugin, módulo, spec
```

**Por qué así:** `contracts` es el único punto de acoplamiento, así que un conector nuevo es una carpeta nueva en `plugins/`. `specs/` y `.agents/` viven en el repo para que humanos e IA compartan el mismo contexto. `evals/` convierte la calidad de la IA en algo medible y no subjetivo.

## 7. Patrones y stack moderno recomendado

Las versiones y librerías cambian rápido: verifica la última versión estable de cada una antes de fijarla en la constitución del proyecto.

**Patrones de diseño que marcan diferencia**

| Patrón | Dónde se aplica | Beneficio |
| --- | --- | --- |
| Puertos y adaptadores | Conectores, proveedores de IA | Intercambiables sin tocar el dominio |
| Registro de plugins + fábrica | Tipos de gráfico, conectores | Extender sin modificar (abierto/cerrado) |
| Query IR + compilador por dialecto | Constructor visual y SQL generado | Un editor, muchos motores |
| CQRS ligero | Escritura de dashboards vs. lectura/ejecución de tarjetas | Escala la lectura con caché sin complicar la escritura |
| Eventos de dominio + outbox | Conexión sincronizada, dashboard publicado | Trabajos asíncronos fiables y auditoría |
| Dashboard como documento (JSON + Zod) | Persistencia, plantillas, generación por IA | Versionable y validable; la IA produce estructuras seguras |
| Result/Either en lugar de excepciones | Dominio y aplicación | Errores explícitos y componibles |
| Contract testing | Todo plugin pasa la misma suite | Garantiza que un conector nuevo cumple la interfaz |
| Stale-while-revalidate + singleflight | Caché de tarjetas | Muestra datos al instante y evita consultas duplicadas |
| Feature flags | Funciones de IA, tipos de gráfico beta | Lanzamientos graduales |
| Circuit breaker + reintentos con retroceso | Llamadas a IA y a BDD de clientes | Resiliencia ante fallos externos |

**Stack sugerido (TypeScript de extremo a extremo para compartir contratos)**

| Capa | Opción | Nota |
| --- | --- | --- |
| Frontend | Next.js (App Router), React, TanStack Query, TanStack Table, shadcn/ui + Tailwind, Zustand | Server Components para la vista pública y rápida |
| Lienzo de dashboard | react-grid-layout o dnd-kit | Cuadrícula arrastrable |
| Gráficos | Apache ECharts (amplio, cubre embudo, gauge, mapas) con Visx/Observable Plot para casos finos | Todo detrás de `ChartType` para poder cambiar |
| API | Hono o Fastify + Zod + OpenAPI generado (zod-openapi) | Contrato único; SDK generado |
| IA | Vercel AI SDK (abstracción multi-proveedor, salida estructurada, herramientas) con `@ai-sdk/google` para Gemini; MCP para exponer herramientas | Cambiar proveedor es cambiar un adaptador |
| BDD de metadatos | PostgreSQL + Drizzle ORM (o Kysely) + pgvector | pgvector para búsqueda semántica del esquema |
| Colas y caché | Redis + BullMQ | Refresco, sincronización, exportes |
| Análisis SQL | `pgsql-parser` / `node-sql-parser` | Validación AST |
| Autenticación | Better Auth o Auth.js; OIDC después | Con RBAC propio |
| Pruebas | Vitest, Playwright, Testcontainers (Postgres real), Cucumber para Gherkin, evals de IA | Pirámide con foco en contrato y evals |
| Observabilidad | OpenTelemetry + Grafana/Tempo o Langfuse para trazas de LLM | Ver costo y calidad de cada llamada de IA |
| Despliegue | Docker Compose, luego Kubernetes o Fly/Railway; GitHub Actions | Un comando para arrancar |

**Decisiones tomadas para la Fase 1:** TypeScript de extremo a extremo (confirmado). IA con Vercel AI SDK y dos adaptadores: Gemini (`@ai-sdk/google`) y Ollama local (proveedor de la comunidad para Ollama o su API compatible con OpenAI). MCP con el SDK oficial de TypeScript, en Fase 2. Español como único idioma, pero con las cadenas externalizadas (por ejemplo next-intl). Tutorial guiado con una librería de recorridos (Driver.js o Shepherd) y contenido en `packages/guides`. Verifica versiones y compatibilidad de cada paquete antes de fijarlas en la constitución.

## 8. Desarrollo guiado por especificaciones (SDD) y skills

**Patrón recomendado: Spec-Driven Development.** La especificación es el artefacto principal; el código es su resultado verificable. Es el enfoque más adecuado para trabajar con IA porque reduce la ambigüedad que hace que los agentes inventen.

1. **Constitución** (`specs/constitution.md`): stack, límites entre módulos, reglas de seguridad y estilo. Los agentes la leen siempre.
2. **Especificar** (`/spec`): el *qué* y el *por qué*, requisitos con ID y criterios de aceptación en Gherkin. Sin decisiones técnicas.
3. **Planificar** (`/plan`): el *cómo*: modelo de datos, contratos, riesgos, ADR. Un agente revisor contrasta el plan con la constitución.
4. **Tareas** (`/tasks`): tareas pequeñas, ordenadas y verificables, cada una enlazada a un RF.
5. **Implementar** (`/implement`): un agente por tarea, con pruebas primero (TDD) y contratos como guía.
6. **Verificar** (`/verify`): pruebas de contrato, aceptación, evals de IA y revisión de seguridad. El resultado actualiza la especificación (ciclo cerrado).

Herramientas de referencia: GitHub Spec Kit, OpenSpec o Kiro; también puedes usar la estructura de la sección 6 con comandos propios en `.agents/commands/`.

**Skills y agentes de apoyo útiles (no genéricos) para este proyecto**

| Skill / agente | Qué codifica | Cuándo se usa |
| --- | --- | --- |
| `add-connector` | Pasos exactos para crear un plugin de conector, plantilla y suite de contrato | Cada nuevo motor de BDD |
| `add-llm-provider` | Adaptador de proveedor, mapeo de herramientas y evals mínimos | Cada nuevo proveedor de IA |
| `add-chart-type` | Esquema de opciones, renderizador, pruebas visuales y ejemplo en la galería | Cada nuevo gráfico |
| `sql-safety-review` | Reglas de validación de SQL, casos de ataque conocidos | Antes de fusionar cualquier cambio en consultas |
| `text-to-sql-evals` | Cómo construir y ejecutar el conjunto de oro y leer métricas | Al cambiar prompts o modelos |
| `openapi-first` | Flujo: esquema Zod, OpenAPI, SDK, pruebas de contrato | Todo endpoint nuevo |
| `dashboard-schema-migrations` | Versionado y migración del JSON de dashboards | Al cambiar el esquema del documento |
| `ui-accessibility` | Lista WCAG, patrones de teclado para el lienzo | Todo componente interactivo |
| `observability-instrumentation` | Convención de spans, métricas y registro | Todo módulo nuevo |
| `frontend-design` (ya disponible) | Criterios de diseño distintivo, no plantillas genéricas | Pantallas de marca y plantillas de dashboard |

**Hooks y automatizaciones:** hook previo a cada commit que ejecuta lint, tipos, límites de módulo y pruebas de contrato; CI que falla si un RF no tiene escenario Gherkin asociado; comando `/trace` que muestra RF > spec > tarea > código > prueba.

**Cómo leen el contexto Antigravity y otras IA.** Verificado en la [documentación oficial de Antigravity](https://www.antigravity.google/docs/rules): `AGENTS.md` y `GEMINI.md` en la raíz (sin frontmatter) están siempre activos; las reglas modulares viven en `.agents/rules/*.md` (solo los archivos directos de esa carpeta) y **cada una debe empezar con frontmatter YAML con `trigger`** (`always_on`, `model_decision`, `glob` o `manual`), o se descarta en silencio; un archivo de reglas se trunca desde 24.000 bytes. Las skills van en `.agents/skills/<nombre>/SKILL.md` según el [codelab de Google](https://codelabs.developers.google.com/getting-started-with-antigravity-skills). Para otras herramientas, de memoria y por confirmar: Claude Code lee `CLAUDE.md` y `.claude/skills/`, Cursor `.cursor/rules/`, GitHub Copilot `.github/copilot-instructions.md`, y Codex y otros leen `AGENTS.md`. Por eso el repo usa `AGENTS.md` como fuente única y deja archivos mínimos que apuntan a él. Usa generadores (`tools/`) para crear conectores, módulos y especificaciones con la estructura correcta, y una instancia de Postgres de pruebas para que el agente verifique su trabajo. Servidores MCP útiles en desarrollo: uno que exponga el esquema de la BDD de pruebas al agente y el de Playwright para comprobar la UI en un navegador real.

## 9. Patrones de agentes y casos de aplicación

**Regla general:** empieza con flujos deterministas (workflows) y usa agentes autónomos solo donde la tarea es abierta. Cada agente tiene herramientas mínimas, permisos de solo lectura y un límite de pasos y costo.

| Patrón | Cómo funciona | Caso en este producto |
| --- | --- | --- |
| Encadenamiento de prompts (workflow) | Pasos fijos: entender > recuperar esquema > generar SQL > validar | Pregunta simple en lenguaje natural (RF-C2) |
| Enrutador | Un modelo barato clasifica la intención y deriva al flujo adecuado | Distinguir "consulta", "crear gráfico", "explicar dashboard" |
| Agente con herramientas (ReAct) | El modelo decide llamar `list_tables`, `describe_table`, `run_sql`, `sample_rows` | Preguntas exploratorias que requieren descubrir el esquema |
| Evaluador-optimizador | Un segundo paso critica y corrige el SQL o el gráfico | Auto-reparar un SQL que falla o devuelve vacío |
| Orquestador y subagentes | Un coordinador reparte subtareas en paralelo | Generar un dashboard completo: un subagente por tarjeta |
| Planificador y ejecutor | Primero un plan revisable, luego ejecución | RF-C5: "crea un dashboard de ventas" con vista previa del plan antes de crear |
| Humano en el circuito | Pausa para aprobación antes de acciones con efecto | Confirmar SQL costoso, publicar, enviar por correo |
| RAG sobre metadatos | Búsqueda vectorial sobre descripciones de tablas y métricas | Esquemas grandes (cientos de tablas) |
| Memoria con alcance | Guardar preferencias y definiciones aprobadas por la organización | "Ventas netas" siempre significa X |
| Guardrails y juez | Validadores deterministas (AST) más un modelo que revisa | Bloquear SQL peligroso y fugas de datos sensibles |
| Agente programado | Tarea periódica con herramientas limitadas | Resumen semanal por correo; detección de anomalías (RF-C6) |

**Herramientas que se exponen a los agentes:** `list_tables`, `describe_table`, `search_semantic`, `run_readonly_sql`, `suggest_chart`, `create_chart_draft`, `create_dashboard_draft`, `explain_result`. Se definen una sola vez en `tool-registry` y se sirven por *tool calling* interno y, en Fase 2, por MCP. Ninguna escribe en la BDD del cliente.

**Modelos locales (Ollama):** los modelos pequeños siguen peor las herramientas y los planes largos. Para ellos usa el flujo determinista (esquema en el prompt, SQL, validación, un reintento de reparación) y reserva los agentes con bucle para Gemini u otros modelos más capaces. El enrutador elige el flujo según el modelo configurado.

**Evaluación continua:** conjunto de oro de preguntas con SQL esperado por esquema (exactitud de ejecución, no de texto), pruebas de inyección de prompts, y seguimiento de costo y latencia por agente. Sin esto, cambiar de Gemini a otro modelo es una apuesta.

## 10. Roadmap, riesgos y preguntas abiertas

| Fase | Objetivo | Entregables | Criterio de salida |
| --- | --- | --- | --- |
| 0. Fundaciones (2 semanas aprox.) | Base del repositorio y del flujo con agentes | Monorepo, `constitution.md`, `AGENTS.md`, CI, `contracts`, Docker Compose, generador de plugin, BDD de demostración | Un plugin de ejemplo pasa la suite de contrato en CI |
| 1A. MVP manual (6 a 8 semanas aprox.) | Conectar, consultar, graficar y compartir sin IA | Conector Postgres con diagnóstico, introspección, constructor visual y editor SQL, 6 a 8 gráficos, constructor manual de gráficos, dashboard con lienzo, enlace firmado, SSE, tutorial guiado y ejemplos | Una persona nueva crea y comparte un dashboard en menos de 5 min siguiendo el tutorial |
| 1B. IA integrada (3 a 4 semanas aprox.) | IA opcional sobre lo mismo | `tool-registry`, adaptadores Gemini y Ollama, chat con borradores, flujo determinista, guía de conexión de IA, evals de SQL | Exactitud de SQL acordada en el conjunto de oro con Gemini y con un modelo local |
| 2. Crecimiento | Más motores, semántica y personalización | MySQL y BigQuery, métricas y jerarquías, temas, filtros cruzados, incrustación, exportes, API pública, servidor MCP, agente que crea dashboards | Segundo y tercer conector añadidos sin cambiar el núcleo |
| 3. Plataforma | Ecosistema y posible SaaS | SDK de gráficos propios, alertas, SSO, multi-organización con facturación, otros idiomas, plantillas | Un tercero publica un plugin sin ayuda del equipo |

Los plazos son estimaciones para 2 personas con apoyo de IA; ajústalos tras la Fase 0, cuando se mida la velocidad real.

**Riesgos principales**

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| SQL generado incorrecto o peligroso | Decisiones erróneas, fuga de datos | Validación AST, solo lectura, capa semántica, evals, confirmación humana |
| Fuga de datos hacia el proveedor de IA | Privacidad y cumplimiento | Enviar solo metadatos, enmascarar PII, modelo local opcional |
| Costos de IA y de consultas | Facturas imprevistas | Cuotas, caché semántica, enrutado de modelos, límites por consulta |
| Tiempo real caro para la BDD del cliente | Sobrecarga de su producción | Caché con TTL, singleflight, límites de frecuencia por conexión |
| Alcance excesivo (competir con Metabase en todo) | Retraso | Enfocarse en personalización, simplicidad e IA; conectores y gráficos como plugins |
| Licencia (AGPL de Metabase) | Restricciones legales | No copiar código; producto independiente, o revisar la licencia con un abogado |
|  |  |  |

**Decisiones confirmadas**

- **Producto independiente** de Metabase, con conectores propios.
- **Sin vertical único:** el producto es genérico; los informes contables y de negocio de las imágenes son ejemplos de lo que debe poder construirse, tanto sobre bases propias como externas de prueba.
- **Despliegue:** autoalojado primero; si el producto funciona, evolucionar a SaaS.
- **Idioma:** español por ahora.
- **Equipo:** 2 personas con herramientas de IA (Antigravity u otras); IA del producto: Gemini y Ollama local.
- **Lenguaje:** TypeScript de extremo a extremo.
- **IA y MCP:** el chat interno usa *tool calling*; MCP se añade como servidor en Fase 2 para IA externas. El modo manual es de primera clase.

## 11. Arranque inmediato (Fase 0)

Orden recomendado para empezar el proyecto; cada punto es una tarea que un agente de código puede ejecutar con su especificación.

- [ ] Crear el monorepo (pnpm + Turborepo, TypeScript estricto, ESLint, Prettier, Vitest) con la estructura de la sección 6.
- [ ] Redactar `specs/constitution.md` y `AGENTS.md` con el stack, la regla de dependencias y las reglas de seguridad de SQL.
- [ ] Definir en `packages/contracts` las interfaces `DataSourceConnector`, `LLMProvider`, `ChartType`, `Tool` y el esquema Zod del dashboard.
- [ ] Levantar `infra/docker-compose.yml` con Postgres de metadatos, Redis y una Postgres de demostración con datos de ejemplo.
- [ ] Configurar CI en GitHub Actions: tipos, lint, límites entre módulos y pruebas de contrato.
- [ ] Crear el generador `tools/new-plugin` y la suite de contrato compartida (`packages/testing`).
- [ ] Especificar y construir la feature 001: conexión a PostgreSQL con diagnóstico guiado (incluye el caso `localhost` desde Docker).
- [ ] Especificar la feature 002: introspección del esquema y explorador de tablas.
- [ ] Especificar las features 003 a 005: constructor de consultas, constructor manual de gráficos y dashboard con lienzo.
- [ ] Especificar el tutorial guiado (006) junto con cada feature, no al final.
