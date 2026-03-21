// src/pages/POS.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { makeSlugAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
      {!outOfStock && isLowStock && (
        <span className="stock-badge" style={{ background: 'var(--warning)', color: 'var(--espresso)' }}>
          Stock bajo
        </span>
      )}
      <img
        src={product.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'}
        alt={product.name}
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'; }}
        loading="lazy"
      />
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-price">{formatPrice(product.price)}</div>
        <div className={`product-card-stock ${isLowStock && !outOfStock ? 'low' : ''}`}>
          Stock: {product.stock}
        </div>
      </div>
      {!outOfStock && (
        <button
          className="product-add-btn"
          onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          aria-label={`Agregar ${product.name}`}
        >+</button>
      )}
    </div>
  );
}

function CartContent({ onSaleComplete, onClose, slugAPI, deliverySurcharge }) {
  const { items, paymentMethod, setPaymentMethod, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [loading, setLoading] = useState(false);

  const isDelivery = paymentMethod === 'delivery';
  const surchargeAmount = isDelivery ? total * (deliverySurcharge / 100) : 0;
  const finalTotal = total + surchargeAmount;

  const handleSale = async () => {
    if (items.length === 0) { toast.error('El carrito está vacío'); return; }
    if (!paymentMethod) { toast.error('Seleccioná un método de pago'); return; }
    setLoading(true);
    try {
      const res = await slugAPI.sales.create({
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod
      });
      const saleData = res.data;
      if (isDelivery && parseFloat(saleData.delivery_surcharge_amount || 0) > 0) {
        toast.success(
          `✅ Venta ${saleData.sale_number} registrada!\n🛵 Recargo: ${formatPrice(saleData.delivery_surcharge_amount)}`,
          { duration: 4000 }
        );
      } else {
        toast.success(`✅ Venta ${saleData.sale_number} registrada!`);
      }
      clearCart();
      onSaleComplete?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    { key: 'efectivo', icon: '💵', label: 'Efectivo' },
    { key: 'qr', icon: '📱', label: 'QR' },
    { key: 'debito', icon: '💳', label: 'Débito' },
    { key: 'delivery', icon: '🛵', label: 'Delivery' },
  ];

  return (
    <>
      <div className="cart-drawer-handle" />

      <div className="cart-header">
        <div className="cart-header-left">
          <div className="cart-title">🛒 Carrito</div>
          <div className="cart-count">{itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}</div>
        </div>
        {onClose && (
          <button className="cart-close-btn" onClick={onClose} aria-label="Cerrar carrito">✕</button>
        )}
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <p>Agregá productos para comenzar</p>
          </div>
        ) : items.map(item => (
          <div key={item.product_id} className="cart-item">
            <div className="cart-item-info">
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, padding: '4px', flexShrink: 0 }}
              aria-label="Eliminar ítem"
            >✕</button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="separator" />

        {isDelivery && items.length > 0 && (
          <div className="cart-total-row" style={{ marginBottom: 4 }}>
            <span className="cart-total-label" style={{ fontSize: 13 }}>Subtotal productos</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{formatPrice(total)}</span>
          </div>
        )}

        {isDelivery && deliverySurcharge > 0 && items.length > 0 && (
          <div className="cart-total-row" style={{ marginBottom: 8 }}>
            <span className="cart-total-label" style={{ fontSize: 13, color: 'var(--warning)' }}>
              🛵 Recargo delivery ({deliverySurcharge}%)
            </span>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--warning)' }}>
              +{formatPrice(surchargeAmount)}
            </span>
          </div>
        )}

        <div className="cart-total-row" style={{ marginBottom: 12 }}>
          <span className="cart-total-label">Total{isDelivery ? ' final' : ''}</span>
          <span className="cart-total-value">{formatPrice(finalTotal)}</span>
        </div>

        {isDelivery && deliverySurcharge === 0 && (
          <div style={{
            fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, padding: '6px 10px',
            background: 'var(--foam)', borderRadius: 6, textAlign: 'center'
          }}>
            Sin recargo configurado para delivery
          </div>
        )}

        <div className="section-title">Método de pago</div>
        <div className="payment-methods" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {paymentOptions.map(p => (
            <button
              key={p.key}
              className={`payment-btn ${paymentMethod === p.key ? 'selected' : ''}`}
              onClick={() => setPaymentMethod(p.key)}
              style={p.key === 'delivery' && paymentMethod === p.key
                ? { background: '#1a0a00', color: '#f5c680', borderColor: '#1a0a00' }
                : {}}
            >
              <span className="pay-icon">{p.icon}</span>
              {p.label}
              {p.key === 'delivery' && deliverySurcharge > 0 && (
                <span style={{ fontSize: 10, display: 'block', opacity: 0.8, marginTop: 1 }}>
                  +{deliverySurcharge}%
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          className="btn btn-success btn-full btn-lg"
          onClick={handleSale}
          disabled={loading || items.length === 0 || !paymentMethod}
        >
          {loading
            ? <><span className="spinner" /> Procesando...</>
            : `✓ Confirmar Venta${isDelivery && finalTotal !== total ? ` · ${formatPrice(finalTotal)}` : ''}`
          }
        </button>

        {items.length > 0 && (
          <button className="btn btn-ghost btn-full btn-sm mt-2" onClick={clearCart}>
            Vaciar carrito
          </button>
        )}
      </div>
    </>
  );
}

export default function POS() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [deliverySurcharge, setDeliverySurcharge] = useState(0);
  const { addItem, itemCount, total } = useCart();

  const fetchProducts = useCallback(async () => {
    try {
      const params = { active: true };
      if (filterType) params.type = filterType;
      if (filterCategory) params.category_id = filterCategory;
      if (search) params.search = search;
      const res = await slugAPI.products.getAll(params);
      setProducts(res.data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, search]);

  // Solo admin puede leer /tenant/settings
  // Si no es admin o falla (ej: migración no corrida), simplemente no hay recargo
  useEffect(() => {
    if (!isAdmin()) return;
    slugAPI.tenant.getSettings()
      .then(r => {
        const pct = parseFloat(r.data.delivery_surcharge);
        setDeliverySurcharge(isNaN(pct) ? 0 : pct);
      })
      .catch(() => {
        // No bloquear el POS si este endpoint falla
      });
  }, []);

  useEffect(() => {
    slugAPI.categories.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 200);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

  const filteredCategories = filterType
    ? categories.filter(c => c.type === filterType)
    : categories;

  return (
    <>
      <div className="pos-layout">
        <div className="pos-products">
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
              style={{ width: 140, marginLeft: 'auto', flexShrink: 0 }}
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

        <div className="pos-cart">
          <CartContent
            onSaleComplete={fetchProducts}
            slugAPI={slugAPI}
            deliverySurcharge={deliverySurcharge}
          />
        </div>
      </div>

      {itemCount > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          🛒
          <span className="cart-fab-badge">{itemCount}</span>
          {formatPrice(total)}
        </button>
      )}

      <div
        className={`cart-drawer-overlay ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
      />

      <div className={`pos-cart drawer ${cartOpen ? 'open' : ''}`}>
        <CartContent
          onSaleComplete={fetchProducts}
          onClose={() => setCartOpen(false)}
          slugAPI={slugAPI}
          deliverySurcharge={deliverySurcharge}
        />
      </div>
    </>
  );
}
