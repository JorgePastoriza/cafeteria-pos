-- ============================================================
-- CAFETERÍA POS - Script de Base de Datos MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS cafeteria_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cafeteria_pos;

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);

-- ============================================================
-- TABLA: categories
-- ============================================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('cafe', 'comida') NOT NULL,
  icon VARCHAR(10) DEFAULT '☕',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_type ON categories(type);

-- ============================================================
-- TABLA: products
-- ============================================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT chk_price CHECK (price >= 0),
  CONSTRAINT chk_stock CHECK (stock >= 0)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_active ON products(active);

-- ============================================================
-- TABLA: daily_closures
-- ============================================================
CREATE TABLE daily_closures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  closed_by INT NOT NULL,
  closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_cash DECIMAL(10, 2) DEFAULT 0,
  total_qr DECIMAL(10, 2) DEFAULT 0,
  total_debit DECIMAL(10, 2) DEFAULT 0,
  total_sales INT DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (closed_by) REFERENCES users(id)
);

CREATE INDEX idx_closures_date ON daily_closures(date);

-- ============================================================
-- TABLA: sales
-- ============================================================
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_number VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  payment_method ENUM('efectivo', 'qr', 'debito') NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('completed', 'cancelled') DEFAULT 'completed',
  closure_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (closure_id) REFERENCES daily_closures(id) ON DELETE SET NULL
);

CREATE INDEX idx_sales_number ON sales(sale_number);
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
-- TABLA: stock_movements
-- ============================================================
CREATE TABLE stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('sale', 'adjustment', 'return') NOT NULL,
  quantity INT NOT NULL COMMENT 'Negativo = salida, Positivo = entrada',
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason VARCHAR(255),
  user_id INT NOT NULL,
  sale_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

CREATE INDEX idx_stock_product ON stock_movements(product_id);
CREATE INDEX idx_stock_type ON stock_movements(type);
CREATE INDEX idx_stock_created ON stock_movements(created_at);

-- ============================================================
-- DATOS INICIALES (SEED)
-- ============================================================

-- Roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrador con acceso completo'),
('cajero', 'Cajero con acceso al módulo de ventas');

-- Usuario admin (password: admin123)
INSERT INTO users (name, email, password, role_id) VALUES
('Administrador', 'admin@cafeteria.com', '$2b$10$YMjJJm6NkJBpGEpLdT/HtOl4Ux7Q9Bm.6Q1Xk7sSfHVvJHxsGsJS', 1),
('Cajero Demo', 'cajero@cafeteria.com', '$2b$10$YMjJJm6NkJBpGEpLdT/HtOl4Ux7Q9Bm.6Q1Xk7sSfHVvJHxsGsJS', 2);

-- Categorías
INSERT INTO categories (name, type, icon) VALUES
('Espresso', 'cafe', '☕'),
('Latte', 'cafe', '🥛'),
('Frío', 'cafe', '🧊'),
('Infusiones', 'cafe', '🍵'),
('Pastelería', 'comida', '🥐'),
('Sandwich', 'comida', '🥪'),
('Snacks', 'comida', '🍪');

-- Productos
INSERT INTO products (name, description, price, stock, stock_min, category_id, type, image_url) VALUES
('Espresso Simple', 'Shot de espresso puro y concentrado', 1500.00, 50, 10, 1, 'cafe', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400'),
('Espresso Doble', 'Doble shot de espresso', 2000.00, 50, 10, 1, 'cafe', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
('Cortado', 'Espresso con un toque de leche', 2200.00, 40, 8, 1, 'cafe', 'https://images.unsplash.com/photo-1485808191679-5f86510bd9d2?w=400'),
('Cappuccino', 'Espresso con leche vaporizada y espuma', 3000.00, 40, 8, 2, 'cafe', 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400'),
('Latte', 'Espresso con abundante leche vaporizada', 3200.00, 35, 8, 2, 'cafe', 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400'),
('Flat White', 'Doble espresso con leche sedosa', 3500.00, 30, 5, 2, 'cafe', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400'),
('Cold Brew', 'Café infusionado en frío 24hs', 3800.00, 20, 5, 3, 'cafe', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
('Frappé de Café', 'Café helado con leche y hielo', 4000.00, 15, 5, 3, 'cafe', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400'),
('Té Verde', 'Té verde japonés matcha', 2000.00, 30, 5, 4, 'cafe', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'),
('Medialuna', 'Medialuna de manteca artesanal', 1200.00, 25, 5, 5, 'comida', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
('Croissant de Jamón y Queso', 'Croissant relleno caliente', 2800.00, 20, 5, 5, 'comida', 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400'),
('Muffin de Arándanos', 'Muffin esponjoso con arándanos', 1800.00, 15, 5, 5, 'comida', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400'),
('Sandwich Caprese', 'Tomate, mozzarella y albahaca', 3500.00, 12, 3, 6, 'comida', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400'),
('Tostado de Jamón', 'Tostado clásico con jamón y queso', 3000.00, 15, 3, 6, 'comida', 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=400'),
('Cookie de Chocolate', 'Cookie artesanal con chips de chocolate', 1500.00, 20, 5, 7, 'comida', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400');
