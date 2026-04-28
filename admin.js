let productosDB = DB.getProductos();
let ventaActual = [];
let ventaTemp = [];
let editandoId = null;
let modoModal = "";

/* =========================
   🟢 PRODUCTOS (ADMIN)
========================= */

function renderAdmin() {
  const cont = document.getElementById("admin-productos");
  cont.innerHTML = "";

  productosDB.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("prod-card");

    // ✏️ MODO EDICIÓN INLINE
    if (editandoId === p.id) {
      div.innerHTML = `
        <img src="${p.imagen}" class="prod-img" />

        <div class="prod-info">
          <input id="nombre-${p.id}" value="${p.nombre}" />
          <input id="precio-${p.id}" type="number" value="${p.precio}" />
          <input id="stock-${p.id}" type="number" value="${p.stock ?? ""}" placeholder="Sin límite"/>
          <input id="desc-${p.id}" value="${p.descripcion || ""}" />
        </div>

        <button class="add-btn" onclick="guardarEdicion(${p.id})">Guardar</button>
        <button class="edit-btn" onclick="cancelarEdicion()">Cancelar</button>
      `;
    }

    // 👀 VISTA NORMAL
    else {
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

        <button class="edit-btn" onclick="activarEdicion(${p.id})">
          Modificar
        </button>
      `;
    }

    cont.appendChild(div);
  });
}

function activarEdicion(id) {
  editandoId = id;
  renderAdmin();
}

function cancelarEdicion() {
  editandoId = null;
  renderAdmin();
}

function guardarEdicion(id) {
  const prod = productosDB.find(p => p.id === id);

  prod.nombre = document.getElementById(`nombre-${id}`).value;
  prod.precio = parseFloat(document.getElementById(`precio-${id}`).value);

  const stockVal = document.getElementById(`stock-${id}`).value;
  prod.stock = stockVal ? parseInt(stockVal) : undefined;

  prod.descripcion = document.getElementById(`desc-${id}`).value;

  DB.saveProductos(productosDB);

  editandoId = null;
  renderAdmin();
}
function abrirMovimiento() {
  modoModal = "movimiento";

  const modal = document.getElementById("modal-venta");
  const cont = document.getElementById("modal-productos");

  modal.classList.remove("hidden");
  document.getElementById("modal-title").textContent = "Nuevo Movimiento";

  cont.innerHTML = `
    <select id="tipo-mov">
      <option value="ingreso">Ingreso</option>
      <option value="egreso">Egreso</option>
    </select>

    <input id="monto-mov" type="number" placeholder="Monto" />
    <input id="desc-mov" placeholder="Descripción" />
  `;
}

/* =========================
   🧾 VENTA (MODAL)
========================= */

function abrirVenta() {
  modoModal = "venta";
  ventaTemp = [];

  const modal = document.getElementById("modal-venta");
  const cont = document.getElementById("modal-productos");

  modal.classList.remove("hidden");
  document.getElementById("modal-title").textContent = "Nueva Venta";

  cont.innerHTML = `
    <div id="lista-venta"></div>
    <div id="resumen-venta"></div>
    <hr/>
  `;

  productosDB.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("prod-card");

    div.innerHTML = `
      <img src="${p.imagen}" class="prod-img"/>

      <div class="prod-info">
        <strong>${p.nombre}</strong>
        <p>$${p.precio}</p>
      </div>

      <button class="add-btn" onclick="agregarProducto(${p.id})">+</button>
    `;

    cont.appendChild(div);
  });

  renderVentaModal();
}
function renderVentaModal() {
  const lista = document.getElementById("lista-venta");
  const resumen = document.getElementById("resumen-venta");

  lista.innerHTML = "";
  let total = 0;

  ventaTemp.forEach(p => {
    const subtotal = p.precio * p.cantidad;
    total += subtotal;

    const div = document.createElement("div");
    div.classList.add("venta-item");

    div.innerHTML = `
      <span>${p.nombre} x${p.cantidad}</span>
      <strong>$${subtotal}</strong>
    `;

    lista.appendChild(div);
  });

  resumen.innerHTML = `
    <div class="venta-total">
      Total: $${total}
    </div>
  `;
}

function cerrarVenta() {
  document.getElementById("modal-venta").classList.add("hidden");
}

/* ➕ Agregar producto a venta */
function agregarProducto(id) {
  const prod = productosDB.find(p => p.id === id);

  const existe = ventaTemp.find(p => p.id === id);

  if (existe) {
    existe.cantidad++;
  } else {
    ventaTemp.push({ ...prod, cantidad: 1 });
  }

  renderVentaModal(); // 🔥 clave
}

/* ✅ Confirmar venta */
function accionModal() {

  /* =========================
     🧾 VENTA (FACTURA)
  ========================= */
  if (modoModal === "venta") {

    if (ventaTemp.length === 0) {
      alert("No hay productos");
      return;
    }

    if (!confirm("¿Confirmar factura?")) return;

    let total = 0;

    ventaTemp.forEach(v => {
      const prod = productosDB.find(p => p.id === v.id);

      if (prod.stock !== undefined) {
        prod.stock -= v.cantidad;
      }

      total += v.precio * v.cantidad;
    });

    DB.saveProductos(productosDB);

    // 🧾 guardar factura
    const idVenta = Date.now();

    DB.saveVenta({
      id: idVenta,
      fecha: new Date(),
      items: ventaTemp,
      total
    });

    // 💰 guardar ingreso automático
    DB.saveMovimiento({
      tipo: "ingreso",
      monto: total,
      descripcion: "Venta",
      fecha: new Date(),
      idVenta: idVenta // 🔥 clave
});

    renderHistorial();
    renderMovimientos(); // 🔥 IMPORTANTE (te faltaba)
    renderAdmin();

    alert("Factura creada");
  }

  /* =========================
     💰 MOVIMIENTO MANUAL
  ========================= */
  if (modoModal === "movimiento") {

    const tipo = document.getElementById("tipo-mov").value;
    const monto = parseFloat(document.getElementById("monto-mov").value);
    const desc = document.getElementById("desc-mov").value;

    if (!monto || !desc) {
      alert("Completar datos");
      return;
    }

    if (!confirm("¿Confirmar movimiento?")) return;

    DB.saveMovimiento({
      tipo,
      monto,
      descripcion: desc,
      fecha: new Date()
    });

    renderMovimientos();

    alert("Movimiento agregado");
  }

  cerrarVenta();
}

/* =========================
   📜 HISTORIAL
========================= */

function renderHistorial() {
  const cont = document.getElementById("historial");
  cont.innerHTML = "";

  const ventas = DB.getVentas();

  ventas.forEach((v, i) => {
    const div = document.createElement("div");
    div.classList.add("prod-card");

    let items = v.items.map(p => `${p.nombre} x${p.cantidad}`).join(", ");

    div.innerHTML = `
      <div class="prod-info">
        <h3>Factura #${i + 1}</h3>
        <p>${items}</p>
        <p class="prod-precio">Total: $${v.total}</p>
      </div>

      <!-- 🔥 BOTÓN ELIMINAR -->
      <button class="delete-btn" onclick="eliminarVenta(${i})">-</button>
    `;

    cont.appendChild(div);
  });
}
function eliminarVenta(index) {
  if (!confirm("¿Eliminar esta factura?")) return;

  let ventas = DB.getVentas();
  let movs = DB.getMovimientos();

  const venta = ventas[index];

  // 🔥 eliminar ingreso asociado (si existe)
  movs = movs.filter(m => {
    // si tiene idVenta lo usa
    if (m.idVenta) return m.idVenta !== venta.id;

    // fallback (ventas viejas sin id)
    if (m.descripcion === "Venta" && m.monto === venta.total) {
      return false;
    }

    return true;
  });

  // 🔥 guardar movimientos
  localStorage.setItem("movimientos", JSON.stringify(movs));

  // 🔥 eliminar venta
  ventas.splice(index, 1);
  localStorage.setItem("ventas", JSON.stringify(ventas));

  renderHistorial();
  renderMovimientos();
  renderAdmin();
} 
function renderMovimientos() {
  const cont = document.getElementById("movimientos");
  cont.innerHTML = "";

  const movs = DB.getMovimientos();

  movs.forEach((m, i) => {
    const div = document.createElement("div");
    div.classList.add("prod-card");

    // 🎨 color según tipo
    div.classList.add(m.tipo === "ingreso" ? "ingreso" : "egreso");

    div.innerHTML = `
      <div class="prod-info">
        <h3>${m.tipo === "ingreso" ? "Ingreso" : "Egreso"}</h3>
        <p>${m.descripcion}</p>
        <p class="prod-precio">$${m.monto}</p>
      </div>

      <!-- 🔥 BOTÓN ELIMINAR -->
      <button class="delete-btn" onclick="eliminarMovimiento(${i})">-</button>
    `;

    cont.appendChild(div);
  });
}
function eliminarMovimiento(index) {
  if (!confirm("¿Eliminar este movimiento?")) return;

  let movs = DB.getMovimientos();

  movs.splice(index, 1);

  // 🔥 guardar directo (seguro)
  localStorage.setItem("movimientos", JSON.stringify(movs));

  renderMovimientos();
}
function volver() {
  window.location.href = "index.html";
}

/* =========================
   🚀 INIT
========================= */

renderAdmin();
renderHistorial();