import * as dns from 'node:dns/promises';
import * as net from 'node:net';
import pg from 'pg';
import type { ConnectionConfig, DiagnosticReport, DiagnosticStep } from '@bi/contracts';

const { Client } = pg;

export const runPostgresDiagnostic = async (config: ConnectionConfig): Promise<DiagnosticReport> => {
  const steps: DiagnosticStep[] = [];
  const startTime = Date.now();
  let isHealthy = true;

  // 1. Step: DNS Resolution & Docker Check
  try {
    const isLocalhost = config.host === 'localhost' || config.host === '127.0.0.1';
    await dns.lookup(config.host);

    if (isLocalhost) {
      steps.push({
        code: 'DOCKER_LOCALHOST_CHECK',
        label: 'Verificación de host localhost / Docker',
        status: 'warning',
        message: 'Has especificado "localhost". Si la aplicación corre dentro de un contenedor Docker, "localhost" se refiere al propio contenedor y no a tu máquina.',
        suggestedFix: 'Si tu base de datos corre en la máquina anfitriona, prueba con "host.docker.internal" o la IP de tu interfaz de red.',
      });
    }

    steps.push({
      code: 'DNS_RESOLUTION',
      label: 'Resolución de nombre de host (DNS)',
      status: 'passed',
      message: `El host "${config.host}" se resolvió correctamente.`,
    });
  } catch (error: unknown) {
    isHealthy = false;
    const msg = error instanceof Error ? error.message : 'Error desconocido al resolver DNS';
    steps.push({
      code: 'DNS_RESOLUTION',
      label: 'Resolución de nombre de host (DNS)',
      status: 'failed',
      message: `No se pudo resolver el host "${config.host}": ${msg}`,
      suggestedFix: 'Verifica que el nombre del host o dominio esté bien escrito y accesible.',
    });
    return {
      isHealthy: false,
      latencyMs: Date.now() - startTime,
      steps,
    };
  }

  // 2. Step: TCP Port Reachability
  const isPortReachable = await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(config.port, config.host);
  });

  if (!isPortReachable) {
    isHealthy = false;
    steps.push({
      code: 'TCP_PORT_REACHABILITY',
      label: 'Alcanzabilidad del puerto TCP',
      status: 'failed',
      message: `No se pudo conectar al puerto ${config.port} en el host "${config.host}".`,
      suggestedFix: `Asegúrate de que PostgreSQL esté corriendo y escuchando en el puerto ${config.port}, y que las reglas de firewall o pg_hba.conf permitan conexiones entrantes.`,
    });
    return {
      isHealthy: false,
      latencyMs: Date.now() - startTime,
      steps,
    };
  }

  steps.push({
    code: 'TCP_PORT_REACHABILITY',
    label: 'Alcanzabilidad del puerto TCP',
    status: 'passed',
    message: `El puerto ${config.port} respondió y está abierto.`,
  });

  // 3. Step: Authentication & SSL Handshake
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    steps.push({
      code: 'AUTHENTICATION',
      label: 'Autenticación y conexión de base de datos',
      status: 'passed',
      message: `Conectado exitosamente a la base de datos "${config.database}" con el usuario "${config.user}".`,
    });

    // 4. Step: Read-Only and Permission Check
    try {
      const pingRes = await client.query('SELECT 1 as ping;');
      if (pingRes.rowCount === 1) {
        steps.push({
          code: 'READONLY_PERMISSION_CHECK',
          label: 'Permisos de lectura',
          status: 'passed',
          message: 'Permiso SELECT verificado con éxito en la base de datos.',
        });
      }
    } catch (permError: unknown) {
      steps.push({
        code: 'READONLY_PERMISSION_CHECK',
        label: 'Permisos de lectura',
        status: 'warning',
        message: 'No se pudo verificar el permiso SELECT básico.',
        suggestedFix: 'Revisa que el usuario tenga privilegios CONNECT y USAGE en el esquema public.',
      });
    }

    await client.end();
  } catch (authError: unknown) {
    isHealthy = false;
    const msg = authError instanceof Error ? authError.message : 'Fallo de autenticación';
    steps.push({
      code: 'AUTHENTICATION',
      label: 'Autenticación y conexión de base de datos',
      status: 'failed',
      message: `Fallo al autenticar contra PostgreSQL: ${msg}`,
      suggestedFix: 'Verifica que el usuario, contraseña y nombre de la base de datos coincidan con las credenciales de PostgreSQL.',
    });
  }

  return {
    isHealthy,
    latencyMs: Date.now() - startTime,
    steps,
  };
};
