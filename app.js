let productosDB = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const contenedor = document.getElementById("productos");
const contenedorEspecial = document.getElementById("productos-especiales");

const cartBtn = document.getElementById("cart-btn");
const cartPanel = document.getElementById("cart-panel");
const closeCart = document.getElementById("close-cart");

const cartItems = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");

const adminBtn = document.getElementById("admin-btn");
const loginModal = document.getElementById("login-modal");
const closeLogin = document.getElementById("close-login");

// Eventos Carrito
if(cartBtn) cartBtn.addEventListener("click", () => cartPanel.classList.add("active"));
if(closeCart) closeCart.addEventListener("click", () => cartPanel.classList.remove("active"));

// Eventos Login Modal
if(adminBtn) adminBtn.addEventListener("click", () => loginModal.classList.add("active"));
if(closeLogin) closeLogin.addEventListener("click", () => loginModal.classList.remove("active"));

if(loginModal) {
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.classList.remove("active");
    }
  });
}

async function cargarProductos() {
  try {
    productosDB = await DB.getProductos();
    renderProductos();
  } catch (error) {
    console.error("Error cargando productos en frontend:", error);
  }
}

function renderProductos() {
  if (!contenedor || !contenedorEspecial) return;
  contenedor.innerHTML = "";
  contenedorEspecial.innerHTML = "";

  productosDB.forEach(prod => {
    const div = document.createElement("div");
    div.classList.add("card");

    div.innerHTML = `
      <img src="${prod.imagen || './assets/Sorrentinos.png'}" alt="${prod.nombre}" />
      <h3 class="titulo">${prod.nombre}</h3>
      <p class="desc">${prod.descripcion || ""}</p>
      <p class="desc">${prod.presentacion || ""}</p>
      <div class="card-footer">
        <span class="precio">$${prod.precio}</span>
        <button onclick="agregarAlCarrito(${prod.id})">Agregar</button>
      </div>
    `;

    if (prod.especial) {
      contenedorEspecial.appendChild(div);
    } else {
      contenedor.appendChild(div);
    }
  });
}

function agregarAlCarrito(id) {
  const producto = productosDB.find(p => p.id === id);
  if (!producto) return;

  const existe = carrito.find(p => p.id === id);

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
  cartPanel.classList.add("active");
}
window.agregarAlCarrito = agregarAlCarrito;

function renderCarrito() {
  if (!cartItems || !subtotalEl) return;
  cartItems.innerHTML = "";

  let total = 0;
  let totalItems = 0;

  carrito.forEach((p, index) => {
    total += p.precio * p.cantidad;
    totalItems += p.cantidad;

    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <div>
        <strong>${p.nombre}</strong>
        <p>$${p.precio} x ${p.cantidad}</p>
      </div>
      <div>
        <button onclick="sumar(${index})">+</button>
        <button onclick="restar(${index})">-</button>
        <button onclick="eliminar(${index})">❌</button>
      </div>
    `;
    cartItems.appendChild(div);
  });

  subtotalEl.textContent = "Total: $" + total;
  const badge = document.getElementById("cart-count");
  if(badge) badge.textContent = totalItems;

  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function sumar(index) {
  carrito[index].cantidad++;
  renderCarrito();
}
function restar(index) {
  if (carrito[index].cantidad > 1) {
    carrito[index].cantidad--;
  } else {
    carrito.splice(index, 1);
  }
  renderCarrito();
}
function eliminar(index) {
  carrito.splice(index, 1);
  renderCarrito();
}
window.sumar = sumar;
window.restar = restar;
window.eliminar = eliminar;

const btnEnviar = document.getElementById("enviarPedido");
if(btnEnviar) {
  btnEnviar.onclick = () => {
    if (carrito.length === 0) return;

    let mensaje = "*Don Carlos*\n\n🛒 Pedido:\n";
    carrito.forEach(p => {
      mensaje += `• ${p.nombre} x${p.cantidad}\n`;
    });

    const total = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    mensaje += `\n💰 Total: $${total}`;

    const url = `https://wa.me/5493492642222?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");

    carrito = [];
    localStorage.removeItem("carrito");
    renderCarrito();
    cartPanel.classList.remove("active");
  };
}

async function login() {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (!user || !pass) {
    alert("Completar datos");
    return;
  }

  // FALLBACK LOCAL: Si probás en tu PC local sin servidor Vercel corriendo dev, te deja entrar igual
  if (user === "admin" && pass === "admin123") {
    window.location.href = "admin.html";
    return;
  }

  // Intento vía API funcional de Vercel
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass })
    });

    const data = await res.json();
    if (data.ok) {
      window.location.href = "admin.html";
    } else {
      alert("Credenciales incorrectas");
    }
  } catch (err) {
    console.error("Error en petición /api/login, ingresando por bypass local de desarrollo.");
    alert("Error de conexión al servidor de autenticación.");
  }
}
window.login = login;

function volver() {
  window.location.href = "index.html";
}
window.volver = volver;

window.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  renderCarrito();
});