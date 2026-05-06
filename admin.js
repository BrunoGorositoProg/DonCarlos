let productosDB = [];
let ventaActual = [];
let ventaTemp = [];
let editandoId = null;
let modoModal = "";

/* =========================
   🚀 INIT
========================= */
cargarProductos();
renderHistorial();
renderMovimientos();

/* =========================
   🟢 PRODUCTOS (ADMIN)
========================= */

async function cargarProductos() {
  productosDB = await DB.getProductos();
  renderAdmin();
}

function renderAdmin() {
  const cont = document.getElementById("admin-productos");
  cont.innerHTML = "";

  productosDB.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("prod-card");

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
    } else {
      div.innerHTML = `
        <img src="${p.imagen}" class="prod-img" />

        <div class="prod-info">
          <h3>${p.nombre}</h3>
          <p>${p.descripcion || ""}</p>
          <p class="prod-precio">$${p.precio}</p>
          ${p.stock !== undefined ? `<p>Stock: ${p.stock}</p>` : `<p>♾ Sin límite</p>`}
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

/* =========================
   💾 GUARDAR EDICIÓN
========================= */

async function guardarEdicion(id) {
  const prod = productosDB.find(p => p.id === id);

  prod.nombre = document.getElementById(`nombre-${id}`).value;
  prod.precio = parseFloat(document.getElementById(`precio-${id}`).value);

  const stockVal = document.getElementById(`stock-${id}`).value;
  if (stockVal !== "") {
    prod.stock = parseInt(stockVal);
  }

  prod.descripcion = document.getElementById(`desc-${id}`).value;

  const { error } = await supabaseClient
    .from("productos")
    .update({
      nombre: prod.nombre,
      precio: prod.precio,
      stock: prod.stock,
      descripcion: prod.descripcion
    })
    .eq("id", prod.id);

  if (error) {
    console.error("ERROR UPDATE:", error);
    return;
  }

  await cargarProductos();
  editandoId = null;
  renderAdmin();
}

/* =========================
   🧠 MODAL CONTROL
========================= */

function abrirModalVenta() {
  modoModal = "venta";
  ventaTemp = [];

  document.getElementById("venta-resumen").innerHTML = "";
  document.getElementById("modal-title").innerText = "Nueva Venta";

  renderModalProductos();

  document.getElementById("modal-venta").classList.remove("hidden");
}

function abrirMovimiento() {
  modoModal = "movimiento";

  document.getElementById("modal-title").innerText = "Nuevo Movimiento";

  document.getElementById("modal-productos").innerHTML = `
    <select id="tipo-mov">
      <option value="ingreso">Ingreso</option>
      <option value="egreso">Egreso</option>
    </select>

    <input id="monto-mov" type="number" placeholder="Monto" />
    <input id="desc-mov" placeholder="Descripción" />
  `;

  document.getElementById("modal-venta").classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("modal-venta").classList.add("hidden");
}

/* =========================
   🛒 MODAL PRODUCTOS
========================= */

function renderModalProductos() {
  const cont = document.getElementById("modal-productos");
  cont.innerHTML = "";

  productosDB.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("prod-card");

    div.innerHTML = `
      <img src="${p.imagen}" class="prod-img" />

      <div class="prod-info">
        <h3>${p.nombre}</h3>
        <p>$${p.precio}</p>
      </div>

      <button onclick="agregarProducto(${p.id})">+</button>
    `;

    cont.appendChild(div);
  });
}

/* =========================
   ➕ AGREGAR PRODUCTO
========================= */

function agregarProducto(id) {
  const prod = productosDB.find(p => p.id === id);
  if (!prod) return;

  const existente = ventaTemp.find(v => v.id === id);

  if (existente) {
    existente.cantidad++;
  } else {
    ventaTemp.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      cantidad: 1
    });
  }

  renderVenta();
}
function renderVenta() {
  const cont = document.getElementById("venta-resumen");
  cont.innerHTML = "";

  let total = 0;

  ventaTemp.forEach(v => {
    total += v.precio * v.cantidad;

    const div = document.createElement("div");
    div.classList.add("venta-item");

    div.innerHTML = `
      <span>${v.nombre} x${v.cantidad}</span>
      <span>$${v.precio * v.cantidad}</span>
    `;

    cont.appendChild(div);
  });

  const totalDiv = document.createElement("div");
  totalDiv.classList.add("venta-total");
  totalDiv.innerText = `Total: $${total}`;

  cont.appendChild(totalDiv);
}
/* =========================
   🧾 ACCIÓN MODAL
========================= */

async function accionModal() {

  if (modoModal === "venta") {

    if (ventaTemp.length === 0) {
      alert("No hay productos");
      return;
    }

    if (!confirm("¿Confirmar factura?")) return;

    let total = 0;

    for (const v of ventaTemp) {
      const prod = productosDB.find(p => p.id === v.id);

      if (prod.stock !== undefined) {
        const newStock = prod.stock - v.cantidad;

        await supabaseClient
          .from("productos")
          .update({ stock: newStock })
          .eq("id", prod.id);
      }

      total += v.precio * v.cantidad;
    }

    const idVenta = Date.now();

    await DB.saveVenta({
      id: idVenta,
      fecha: new Date(),
      items: ventaTemp,
      total
    });

    await DB.saveMovimiento({
      tipo: "ingreso",
      monto: total,
      descripcion: "Venta",
      fecha: new Date(),
      idventa : idVenta,
    });

    await cargarProductos();
    renderHistorial();
    renderMovimientos();

    alert("Factura creada");
  }

  if (modoModal === "movimiento") {

    const tipo = document.getElementById("tipo-mov").value;
    const monto = parseFloat(document.getElementById("monto-mov").value);
    const desc = document.getElementById("desc-mov").value;

    if (!monto || !desc) {
      alert("Completar datos");
      return;
    }

    await DB.saveMovimiento({
      tipo,
      monto,
      descripcion: desc,
      fecha: new Date()
    });

    renderMovimientos();
    alert("Movimiento agregado");
  }

  ventaTemp = [];
  cerrarModal();
}

/* =========================
   📜 HISTORIAL
========================= */

async function renderHistorial() {
  const cont = document.getElementById("historial");
  cont.innerHTML = "";

  const ventas = await DB.getVentas() || [];

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

      <button class="delete-btn" onclick="eliminarVenta(${v.id})">-</button>
    `;

    cont.appendChild(div);
  });
}

/* =========================
   🗑 ELIMINAR VENTA
========================= */

async function eliminarVenta(id) {
  id = Number(id);
  if (!confirm("¿Eliminar esta factura?")) return;

  // 🔴 borrar movimiento asociado
  const { error: errorMov } = await supabaseClient
    .from("movimientos")
    .delete()
    .eq("idventa", id);

  if (errorMov) {
    console.error("Error borrando movimiento:", errorMov);
  }

    // 🔁 recuperar stock
  const { data: venta } = await supabaseClient
    .from("ventas")
    .select("*")
    .eq("id", id)
    .single();

  if (venta) {
    for (const item of venta.items) {
      const prod = productosDB.find(p => p.id === item.id);

      if (prod && prod.stock !== undefined) {
        await supabaseClient
          .from("productos")
          .update({ stock: prod.stock + item.cantidad })
          .eq("id", prod.id);
      }
    }
  }

  // 🔴 borrar venta
  const { error: errorVenta } = await supabaseClient
    .from("ventas")
    .delete()
    .eq("id", id);

    if (errorVenta) {
      console.error("Error borrando venta:", errorVenta);
      alert("Error al eliminar en DB");
      return;
    }

  // 🔄 refrescar todo
  await cargarProductos();
  renderHistorial();
  renderMovimientos();

  alert("Factura eliminada");
}

/* =========================
   💰 MOVIMIENTOS
========================= */

async function renderMovimientos() {
  const cont = document.getElementById("movimientos");
  cont.innerHTML = "";

  const movs = await DB.getMovimientos() || [];

  movs.forEach((m) => {
    const div = document.createElement("div");
    div.classList.add("prod-card");
    div.classList.add(m.tipo === "ingreso" ? "ingreso" : "egreso");

    div.innerHTML = `
      <div class="prod-info">
        <h3>${m.tipo === "ingreso" ? "Ingreso" : "Egreso"}</h3>
        <p>${m.descripcion}</p>
        <p class="prod-precio">$${m.monto}</p>
      </div>
    `;

    cont.appendChild(div);
  });
}

/* =========================
   🔙 VOLVER
========================= */

function volver() {
  window.location.href = "index.html";
}