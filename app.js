const contenedor = document.getElementById("productos");
const contenedorEspecial = document.getElementById("productos-especiales");

const cartBtn = document.getElementById("cart-btn");
const cartPanel = document.getElementById("cart-panel");
const closeCart = document.getElementById("close-cart");
const cartItems = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");

cartBtn.onclick = () => cartPanel.classList.add("active");
closeCart.onclick = () => cartPanel.classList.remove("active");

let carrito = [];

// 🔥 USAR DB
let productosDB = DB.getProductos();

function renderProductos() {
  productosDB = DB.getProductos(); // 🔥 siempre actualizado

  contenedor.innerHTML = "";
  contenedorEspecial.innerHTML = "";

  productosDB.forEach(prod => {
    const div = document.createElement("div");
    div.classList.add("card");

    div.innerHTML = `
      <img src="${prod.imagen}" />
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

// 🛒 Agregar al carrito
function agregarAlCarrito(id) {
  const producto = productosDB.find(p => p.id === id);

  const existe = carrito.find(p => p.id === id);

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();

  cartBtn.classList.add("shake");
  setTimeout(() => cartBtn.classList.remove("shake"), 300);
  cartPanel.classList.add("active");
}

window.agregarAlCarrito = agregarAlCarrito;

// 🔥 INIT
window.onload = () => {
  const data = localStorage.getItem("carrito");

  if (data) {
    carrito = JSON.parse(data);
  }

  renderCarrito();
  renderProductos(); // 🔥 clave
};

// 🛒 Render carrito
function renderCarrito() {
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
        <span onclick="eliminar(${index})">❌</span>
      </div>
    `;

    cartItems.appendChild(div);
  });

  subtotalEl.textContent = "Total: $" + total;
  document.getElementById("cart-count").textContent = totalItems;

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

// 📲 WhatsApp
document.getElementById("enviarPedido").onclick = () => {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  let mensaje = "*Don Carlos*\n\n🛒 Pedido:\n";

  carrito.forEach(p => {
    mensaje += `• ${p.nombre} x${p.cantidad}\n`;
  });

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  mensaje += `\n💰 Total: $${total}`;

  const url = `https://wa.me/5493492642222?text=${encodeURIComponent(mensaje)}`;
  window.open(url);

  carrito = [];
  localStorage.removeItem("carrito");

  renderCarrito();
  cartPanel.classList.remove("active");
};

// 🔐 Login (igual que antes)
const adminBtn = document.getElementById("admin-btn");
const loginModal = document.getElementById("login-modal");

adminBtn.onclick = () => loginModal.classList.add("active");

function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === "admin" && pass === "a3min$") {
    window.location.href = "admin.html";
  } else {
    alert("Datos incorrectos");
  }
}

const closeLogin = document.getElementById("close-login");

closeLogin.onclick = () => loginModal.classList.remove("active");

loginModal.onclick = (e) => {
  if (e.target === loginModal) {
    loginModal.classList.remove("active");
  }
};

function volver() {
  window.location.href = "index.html";
}