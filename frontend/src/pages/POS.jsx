// src/pages/POS.jsx
import { useState, useEffect, useCallback } from 'react';
import { productsAPI, categoriesAPI, salesAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const formatPrice = (n) => `$${parseFloat(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

function ProductCard({ product, onAdd }) {
  const isLowStock = product.stock <= product.stock_min;
  const outOfStock = product.stock === 0;

  return (
    <div
      className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}
      onClick={() => !outOfStock && onAdd(product)}
    >
      {outOfStock && <span className="stock-badge">Sin Stock</span>}
      {!outOfStock && isLowStock && <span className="stock-badge" style={{ background: 'var(--warning)', color: 'var(--espresso)' }}>Stock bajo</span>}
      <img
        src={product.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'}
        alt={product.name}
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'; }}
      />
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-price">{formatPrice(product.price)}</div>
        <div className={`product-card-stock ${isLowStock && !outOfStock ? 'low' : ''}`}>
          Stock: {product.stock}
        </div>
      </div>
      {!outOfStock && <button className="product-add-btn" onClick={(e) => { e.stopPropagation(); onAdd(product); }}>+</button>}
    </div>
  );
}

function Cart({ onSaleComplete }) {
  const { items, paymentMethod, setPaymentMethod, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [loading, setLoading] = useState(false);

  const handleSale = async () => {
    if (items.length === 0) { toast.error('El carrito está vacío'); return; }
    if (!paymentMethod) { toast.error('Seleccioná un método de pago'); return; }
    setLoading(true);
    try {
      const res = await salesAPI.create({
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod
      });
      toast.success(`✅ Venta ${res.data.sale_number} registrada!`);
      clearCart();
      onSaleComplete?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-cart">
      <div className="cart-header">
        <div className="cart-title">🛒 Carrito</div>
        <div className="cart-count">{itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}</div>
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <p>Agregá productos para comenzar</p>
          </div>
        ) : items.map(item => (
          <div key={item.product_id} className="cart-item">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">{formatPrice(item.price)} c/u</div>
            </div>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>−</button>
              <span className="qty-value">{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
            </div>
            <div className="cart-item-subtotal">{formatPrice(item.subtotal)}</div>
            <button
              onClick={() => removeItem(item.product_id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16 }}
            >✕</button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="separator" />
        <div className="cart-total-row">
          <span className="cart-total-label">Total</span>
          <span className="cart-total-value">{formatPrice(total)}</span>
        </div>

        <div className="section-title">Método de pago</div>
        <div className="payment-methods">
          {[
            { key: 'efectivo', icon: '💵', label: 'Efectivo' },
            { key: 'qr', icon: '📱', label: 'QR' },
            { key: 'debito', icon: '💳', label: 'Débito' }
          ].map(p => (
            <button
              key={p.key}
              className={`payment-btn ${paymentMethod === p.key ? 'selected' : ''}`}
              onClick={() => setPaymentMethod(p.key)}
            >
              <span className="pay-icon">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn-success btn-full btn-lg"
          onClick={handleSale}
          disabled={loading || items.length === 0 || !paymentMethod}
        >
          {loading ? <><span className="spinner" /> Procesando...</> : '✓ Confirmar Venta'}
        </button>

        {items.length > 0 && (
          <button className="btn btn-ghost btn-full btn-sm mt-2" onClick={clearCart}>
            Vaciar carrito
          </button>
        )}
      </div>
    </div>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();

  const fetchProducts = useCallback(async () => {
    try {
      const params = { active: true };
      if (filterType) params.type = filterType;
      if (filterCategory) params.category_id = filterCategory;
      if (search) params.search = search;
      const res = await productsAPI.getAll(params);
      setProducts(res.data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, search]);

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 200);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const filteredCategories = filterType
    ? categories.filter(c => c.type === filterType)
    : categories;

  return (
    <div className="pos-layout" style={{ height: '100vh' }}>
      {/* Productos */}
      <div className="pos-products">
        {/* Filtros */}
        <div className="filters-bar">
          <button
            className={`filter-chip ${!filterType ? 'active' : ''}`}
            onClick={() => { setFilterType(''); setFilterCategory(''); }}
          >Todo</button>
          <button
            className={`filter-chip ${filterType === 'cafe' ? 'active' : ''}`}
            onClick={() => { setFilterType('cafe'); setFilterCategory(''); }}
          >☕ Café</button>
          <button
            className={`filter-chip ${filterType === 'comida' ? 'active' : ''}`}
            onClick={() => { setFilterType('comida'); setFilterCategory(''); }}
          >🥐 Comida</button>

          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${filterCategory === String(cat.id) ? 'active' : ''}`}
              onClick={() => setFilterCategory(filterCategory === String(cat.id) ? '' : String(cat.id))}
            >
              {cat.icon} {cat.name}
            </button>
          ))}

          <input
            type="text"
            placeholder="Buscar..."
            className="form-control"
            style={{ width: 160, marginLeft: 'auto' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">☕</div>
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addItem} />
            ))}
          </div>
        )}
      </div>

      {/* Carrito */}
      <Cart onSaleComplete={fetchProducts} />
    </div>
  );
}
