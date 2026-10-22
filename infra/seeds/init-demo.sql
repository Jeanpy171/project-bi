-- Demo Schema: Retail & Financial Analytics
-- Designed for testing visual queries, metrics, and hierarchical charts

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Hierarchical Chart of Accounts (Plan de Cuentas)
CREATE TABLE IF NOT EXISTS financial_accounts (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(30) NOT NULL, -- Activo, Pasivo, Patrimonio, Ingresos, Gastos
    level INTEGER NOT NULL,
    parent_code VARCHAR(20) REFERENCES financial_accounts(code),
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD'
);

-- 2. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES product_categories(id),
    cost NUMERIC(10, 2) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'Standard', -- Standard, Silver, Gold, Platinum
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    status VARCHAR(20) NOT NULL, -- completed, pending, cancelled, refunded
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_country VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Seed Data: Financial Accounts (Hierarchical)
INSERT INTO financial_accounts (code, name, account_type, level, parent_code, balance) VALUES
('1', 'ACTIVO', 'Activo', 1, NULL, 485000.00),
('11', 'Activo Corriente', 'Activo', 2, '1', 310000.00),
('111', 'Disponible', 'Activo', 3, '11', 145000.00),
('11101', 'Caja General', 'Activo', 4, '111', 25000.00),
('11102', 'Bancos Nacionales', 'Activo', 4, '111', 120000.00),
('112', 'Exigible (Cuentas por Cobrar)', 'Activo', 3, '11', 95000.00),
('113', 'Realizable (Inventarios)', 'Activo', 3, '11', 70000.00),
('12', 'Activo No Corriente', 'Activo', 2, '1', 175000.00),
('121', 'Propiedad, Planta y Equipo', 'Activo', 3, '12', 175000.00),
('2', 'PASIVO', 'Pasivo', 1, NULL, 195000.00),
('21', 'Pasivo Corriente', 'Pasivo', 2, '2', 115000.00),
('211', 'Proveedores por Pagar', 'Pasivo', 3, '21', 85000.00),
('212', 'Obligaciones Laborales', 'Pasivo', 3, '21', 30000.00),
('3', 'PATRIMONIO', 'Patrimonio', 1, NULL, 290000.00),
('31', 'Capital Social', 'Patrimonio', 2, '3', 200000.00),
('32', 'Resultados Acumulados', 'Patrimonio', 2, '3', 90000.00);

-- Seed Data: Product Categories
INSERT INTO product_categories (id, name, description) VALUES
(1, 'Tecnología', 'Dispositivos electrónicos, accesorios y computación'),
(2, 'Oficina', 'Mobiliario ergonómico, suministros y papelería'),
(3, 'Servicios', 'Consultoría de datos, soporte y licencias de software');

-- Seed Data: Products
INSERT INTO products (sku, name, category_id, cost, price, stock) VALUES
('TECH-001', 'Monitor Ultrawide 34"', 1, 310.00, 499.00, 45),
('TECH-002', 'Teclado Mecánico RGB', 1, 45.00, 89.00, 120),
('TECH-003', 'Mouse Inalámbrico Ergonómico', 1, 25.00, 59.00, 180),
('TECH-004', 'Auriculares Cancelación de Ruido', 1, 95.00, 179.00, 60),
('OFF-001', 'Silla de Oficina Ergonómica', 2, 140.00, 280.00, 35),
('OFF-002', 'Escritorio Elevable Standing Desk', 2, 220.00, 420.00, 20),
('OFF-003', 'Lámpara LED con Temperatura Regulable', 2, 18.00, 39.00, 85),
('SRV-001', 'Auditoría Inicial de Datos (Bolsa 10h)', 3, 400.00, 950.00, 999),
('SRV-002', 'Mantenimiento Mensual de Pipelines', 3, 600.00, 1400.00, 999);

-- Seed Data: Customers
INSERT INTO customers (name, email, city, country, tier) VALUES
('Jean Fuentes', 'jean@example.com', 'Quito', 'Ecuador', 'Platinum'),
('Camila Rodríguez', 'camila.r@empresa.com', 'Buenos Aires', 'Argentina', 'Gold'),
('Mateo Fernández', 'mateo@logistica.cl', 'Santiago', 'Chile', 'Silver'),
('Valentina Gómez', 'valen.gomez@bogota.co', 'Bogotá', 'Colombia', 'Platinum'),
('Lucas Silva', 'lucas@saopaulo.br', 'São Paulo', 'Brasil', 'Standard'),
('Andrea Morales', 'andrea@techperu.pe', 'Lima', 'Perú', 'Gold'),
('Carlos Mendoza', 'carlos@mexicobi.mx', 'Ciudad de México', 'México', 'Standard');

-- Seed Data: Orders
INSERT INTO orders (customer_id, status, total_amount, shipping_country, created_at) VALUES
(1, 'completed', 1057.00, 'Ecuador', NOW() - INTERVAL '25 days'),
(2, 'completed', 420.00, 'Argentina', NOW() - INTERVAL '22 days'),
(3, 'completed', 678.00, 'Chile', NOW() - INTERVAL '18 days'),
(4, 'completed', 2350.00, 'Colombia', NOW() - INTERVAL '14 days'),
(5, 'completed', 148.00, 'Brasil', NOW() - INTERVAL '10 days'),
(1, 'completed', 899.00, 'Ecuador', NOW() - INTERVAL '7 days'),
(6, 'completed', 760.00, 'Perú', NOW() - INTERVAL '4 days'),
(7, 'pending', 499.00, 'México', NOW() - INTERVAL '1 day'),
(2, 'completed', 1400.00, 'Argentina', NOW() - INTERVAL '12 hours');

-- Seed Data: Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 499.00),
(1, 2, 2, 89.00),
(1, 4, 2, 179.00),
(2, 6, 1, 420.00),
(3, 2, 2, 89.00),
(3, 1, 1, 499.00),
(4, 8, 1, 950.00),
(4, 9, 1, 1400.00),
(5, 2, 1, 89.00),
(5, 3, 1, 59.00),
(6, 1, 1, 499.00),
(6, 5, 1, 280.00),
(7, 5, 2, 280.00),
(7, 7, 2, 39.00),
(7, 3, 1, 59.00),
(8, 1, 1, 499.00),
(9, 9, 1, 1400.00);

-- 7. Security: Dedicated Read-Only User for BI Customer Safety
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bi_readonly') THEN
        CREATE ROLE bi_readonly WITH LOGIN PASSWORD 'readonly_safe_123';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE retail_demo TO bi_readonly;
GRANT USAGE ON SCHEMA public TO bi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO bi_readonly;
