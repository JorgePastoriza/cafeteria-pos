-- ============================================================
-- CAFETERÍA POS - Schema Multi-Tenant
-- ============================================================

CREATE DATABASE IF NOT EXISTS cafeteria_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cafeteria_pos;

-- ============================================================
-- TABLA: super_admins (plataforma maestra)
-- ============================================================
CREATE TABLE super_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: tenants (comercios)
-- ============================================================
CREATE TABLE tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE COMMENT 'URL: tuapp.com/[slug]',
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#e8a045' COMMENT 'Color hex del tema',
  active BOOLEAN DEFAULT TRUE,
  created_by INT COMMENT 'super_admin que lo creó',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(active);

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: users (con tenant_id)
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenant_email (tenant_id, email),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLA: categories (con tenant_id)
-- ============================================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('cafe', 'comida') NOT NULL,
  icon VARCHAR(10) DEFAULT '☕',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenant_category (tenant_id, name),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);

-- ============================================================
-- TABLA: products (con tenant_id)
-- ============================================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_min INT NOT NULL DEFAULT 5,
  category_id INT NOT NULL,
  type ENUM('cafe', 'comida') NOT NULL,
  image_url VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT chk_price CHECK (price >= 0),
  CONSTRAINT chk_stock CHECK (stock >= 0)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

-- ============================================================
-- TABLA: daily_closures (con tenant_id)
-- ============================================================
CREATE TABLE daily_closures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  date DATE NOT NULL,
  closed_by INT NOT NULL,
  closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_cash DECIMAL(10, 2) DEFAULT 0,
  total_qr DECIMAL(10, 2) DEFAULT 0,
  total_debit DECIMAL(10, 2) DEFAULT 0,
  total_sales INT DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  UNIQUE KEY uq_tenant_date (tenant_id, date),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (closed_by) REFERENCES users(id)
);

CREATE INDEX idx_closures_tenant ON daily_closures(tenant_id);
CREATE INDEX idx_closures_date ON daily_closures(date);

-- ============================================================
-- TABLA: sales (con tenant_id)
-- ============================================================
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  sale_number VARCHAR(30) NOT NULL,
  user_id INT NOT NULL,
  payment_method ENUM('efectivo', 'qr', 'debito') NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('completed', 'cancelled') DEFAULT 'completed',
  closure_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenant_sale_number (tenant_id, sale_number),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (closure_id) REFERENCES daily_closures(id) ON DELETE SET NULL
);

CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_payment ON sales(payment_method);

-- ============================================================
-- TABLA: sale_items
-- ============================================================
CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ============================================================
-- TABLA: stock_movements (con tenant_id)
-- ============================================================
CREATE TABLE stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  product_id INT NOT NULL,
  type ENUM('sale', 'adjustment', 'return') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason VARCHAR(255),
  user_id INT NOT NULL,
  sale_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

CREATE INDEX idx_stock_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_stock_product ON stock_movements(product_id);

-- ============================================================
-- SEED: datos iniciales
-- ============================================================

-- Roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrador del comercio'),
('cajero', 'Cajero con acceso al módulo de ventas');

-- Super Admin maestro (password: SuperAdmin123)
INSERT INTO super_admins (name, email, password) VALUES
('Super Administrador', 'superadmin@cafepos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm5j43.');

-- Tenant demo
INSERT INTO tenants (name, slug, primary_color, created_by) VALUES
('Café Demo', 'demo', '#e8a045', 1);

-- Usuario admin del tenant demo (password: Admin1234)
INSERT INTO users (tenant_id, name, email, password, role_id) VALUES
(1, 'Admin Demo', 'admin@demo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm5j43.', 1),
(1, 'Cajero Demo', 'cajero@demo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm5j43.', 2);

-- Categorías del tenant demo
INSERT INTO categories (tenant_id, name, type, icon) VALUES
(1, 'Espresso', 'cafe', '☕'),
(1, 'Latte', 'cafe', '🥛'),
(1, 'Frío', 'cafe', '🧊'),
(1, 'Pastelería', 'comida', '🥐'),
(1, 'Sandwich', 'comida', '🥪');

-- Productos del tenant demo
INSERT INTO products (tenant_id, name, description, price, stock, stock_min, category_id, type, image_url) VALUES
(1, 'Espresso Simple', 'Shot de espresso puro', 1500.00, 50, 10, 1, 'cafe', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400'),
(1, 'Cappuccino', 'Espresso con leche vaporizada y espuma', 3000.00, 40, 8, 2, 'cafe', 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400'),
(1, 'Latte', 'Espresso con abundante leche', 3200.00, 35, 8, 2, 'cafe', 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400'),
(1, 'Cold Brew', 'Café infusionado en frío 24hs', 3800.00, 20, 5, 3, 'cafe', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
(1, 'Medialuna', 'Medialuna de manteca artesanal', 1200.00, 25, 5, 4, 'comida', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
(1, 'Croissant Jamón y Queso', 'Croissant relleno caliente', 2800.00, 20, 5, 4, 'comida', 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400'),
(1, 'Sandwich Caprese', 'Tomate, mozzarella y albahaca', 3500.00, 12, 3, 5, 'comida', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400');
