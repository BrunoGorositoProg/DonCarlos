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
   💾 GUARDAR EDICIÓN (FIX REAL)
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

  console.log("PRODUCTO A GUARDAR:", prod);

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
   🧾 VENTAS (GLOBAL FIX STOCK)
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
      idVenta
    });

    renderHistorial();
    renderMovimientos();
    renderAdmin();

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

  cerrarVenta();
}

/* =========================
   📜 HISTORIAL (SUPABASE FIX)
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

      <button class="delete-btn" onclick="eliminarVenta('${v.id}')">-</button>
    `;

    cont.appendChild(div);
  });
}

/* =========================
   🗑 ELIMINAR VENTA (SUPABASE)
========================= */

async function eliminarVenta(id) {

  if (!confirm("¿Eliminar esta factura?")) return;

  await supabaseClient
    .from("ventas")
    .delete()
    .eq("id", id);

  renderHistorial();
  renderMovimientos();
  renderAdmin();
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