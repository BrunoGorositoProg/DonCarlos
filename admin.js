let productosDB = DB.getProductos();
let ventaActual = [];

// mostrar productos
function renderAdmin() {
  const cont = document.getElementById("admin-productos");
  cont.innerHTML = "";

  productosDB.forEach(p => {
   const div = document.createElement("div");
div.classList.add("prod-card");

div.innerHTML = `
  <img src="${p.imagen}" class="prod-img" />

  <div class="prod-info">
    <h3>${p.nombre}</h3>
    <p>${p.descripcion || ""}</p>

    <p class="prod-precio">$${p.precio}</p>

    ${
      p.stock !== undefined
        ? `<p>Stock: ${p.stock}</p>`
        : `<p>♾ Sin límite</p>`
    }
  </div>

  <button class="add-btn" onclick="agregarVenta(${p.id})">
    Agregar
  </button>
`;

cont.appendChild(div);
    cont.appendChild(div);
  });
}

// agregar a venta
function agregarVenta(id) {
  const prod = productosDB.find(p => p.id === id);

  if (prod.stock <= 0) {
    alert("Sin stock");
    return;
  }

  const existe = ventaActual.find(p => p.id === id);

  if (existe) {
    existe.cantidad++;
  } else {
    ventaActual.push({ ...prod, cantidad: 1 });
  }

  renderVenta();
}

// mostrar venta actual
function renderVenta() {
  const cont = document.getElementById("venta-form");
  cont.innerHTML = "";

  let total = 0;

  ventaActual.forEach(p => {
    total += p.precio * p.cantidad;

    const div = document.createElement("div");
    div.textContent = `${p.nombre} x${p.cantidad}`;
    cont.appendChild(div);
  });

  cont.innerHTML += `<strong>Total: $${total}</strong>`;
}

// generar ticket
function crearVenta() {
  if (ventaActual.length === 0) return;

  let total = 0;

  ventaActual.forEach(v => {
    const prod = productosDB.find(p => p.id === v.id);

    prod.stock -= v.cantidad; //  RESTA STOCK
    total += v.precio * v.cantidad;
  });

  DB.saveProductos(productosDB);

  DB.saveVenta({
    fecha: new Date(),
    items: ventaActual,
    total
  });

  alert("Venta registrada");

  ventaActual = [];
  renderAdmin();
  renderVenta();
}

renderAdmin();