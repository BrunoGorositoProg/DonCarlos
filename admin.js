let productosDB = [];
let ventaActual = [];
let ventaTemp = [];
let editandoId = null;
let modoModal = "";

/* =========================
    🚀 INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  renderHistorial();
  renderMovimientos();
});

/* =========================
    🟢 PRODUCTOS (ADMIN)
========================= */
async function cargarProductos() {
  productosDB = await DB.getProductos();
  renderAdmin();
}

function renderAdmin() {
  const cont = document.getElementById("admin-productos");
  if(!cont) return;
  cont.innerHTML = "";

  productosDB.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.style.marginBottom = "15px";

    if (editandoId === p.id) {
      div.innerHTML = `
        <div class="prod-info" style="display:flex; flex-direction:column; gap:8px;">
          <label>Nombre:</label>
          <input id="nombre-${p.id}" class="login-card input" style="padding:5px;" value="${p.nombre}" />
          <label>Precio ($):</label>
          <input id="precio-${p.id}" type="number" style="padding:5px;" value="${p.precio}" />
          <label>Stock:</label>
          <input id="stock-${p.id}" type="number" style="padding:5px;" value="${p.stock ?? ""}" placeholder="Sin límite"/>
          <label>Descripción:</label>
          <input id="desc-${p.id}" style="padding:5px;" value="${p.descripcion || ""}" />
        </div>
        <div style="margin-top:10px;">
          <button class="add-btn" onclick="guardarEdicion(${p.id})">Guardar</button>
          <button class="edit-btn" onclick="cancelarEdicion()" style="background:#444;">Cancelar</button>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="prod-info">
          <h3>${p.nombre}</h3>
          <p>${p.descripcion || ""}</p>
          <p class="precio" style="color:#8B0000;">$${p.precio}</p>
          ${p.stock !== undefined && p.stock !== null ? `<p>Stock: ${p.stock}</p>` : `<p>♾ Sin límite</p>`}
        </div>
        <button class="edit-btn" style="margin-top:10px;" onclick="activarEdicion(${p.id})">
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
  if(!prod) return;

  prod.nombre = document.getElementById(`nombre-${id}`).value;
  prod.precio = parseFloat(document.getElementById(`precio-${id}`).value);

  const stockVal = document.getElementById(`stock-${id}`).value;
  prod.stock = stockVal !== "" ? parseInt(stockVal) : null;
  prod.descripcion = document.getElementById(`desc-${id}`).value;

  try {
    // Usamos la estructura limpia de db.js
    await DB.saveProductos(prod);
    editandoId = null;
    await cargarProductos();
  } catch (error) {
    alert("Error al actualizar producto");
  }
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
  document.getElementById("modal-venta").style.display = "flex";
}

function abrirMovimiento() {
  modoModal = "movimiento";
  document.getElementById("modal-title").innerText = "Nuevo Movimiento";
  document.getElementById("modal-productos").innerHTML = `
    <select id="tipo-mov" style="padding:10px; width:100%; border-radius:8px; margin-bottom:10px;">
      <option value="ingreso">Ingreso</option>
      <option value="egreso">Egreso</option>
    </select>
    <input id="monto-mov" type="number" placeholder="Monto" style="padding:10px; width:100%; border-radius:8px; margin-bottom:10px; border:1px solid #ccc;"/>
    <input id="desc-mov" placeholder="Descripción" style="padding:10px; width:100%; border-radius:8px; margin-bottom:10px; border:1px solid #ccc;"/>
  `;
  document.getElementById("venta-resumen").innerHTML = "";
  document.getElementById("modal-venta").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal-venta").style.display = "none";
}

/* =========================
    🛒 MODAL PRODUCTOS
========================= */
function renderModalProductos() {
  const cont = document.getElementById("modal-productos");
  if(!cont) return;
  cont.innerHTML = "";

  productosDB.forEach(p => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "between";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <div style="flex:1;">
        <strong>${p.nombre}</strong> - $${p.precio}
      </div>
      <button onclick="agregarProducto(${p.id})" style="padding:2px 10px;">+</button>
    `;
    cont.appendChild(div);
  });
}

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
  if(!cont) return;
  cont.innerHTML = "";

  let total = 0;
  ventaTemp.forEach(v => {
    total += v.precio * v.cantidad;
    const div = document.createElement("div");
    div.innerHTML = `<span>${v.nombre} x${v.cantidad}</span> - <span>$${v.precio * v.cantidad}</span>`;
    cont.appendChild(div);
  });

  const totalDiv = document.createElement("div");
  totalDiv.style.fontWeight = "bold";
  totalDiv.style.marginTop = "10px";
  totalDiv.innerText = `Total: $${total}`;
  cont.appendChild(totalDiv);
}

/* =========================
    🧾 ACCIÓN MODAL
========================= */
async function accionModal() {
  const client = DB.client();

  if (modoModal === "venta") {
    if (ventaTemp.length === 0) {
      alert("No hay productos seleccionados");
      return;
    }
    if (!confirm("¿Confirmar factura?")) return;

    let total = 0;
    try {
      for (const v of ventaTemp) {
        const prod = productosDB.find(p => p.id === v.id);
        if (prod && prod.stock !== undefined && prod.stock !== null) {
          const newStock = prod.stock - v.cantidad;
          await client.from("productos").update({ stock: newStock }).eq("id", prod.id);
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
        descripcion: "Venta registrada",
        fecha: new Date(),
        idventa: idVenta
      });

      await cargarProductos();
      await renderHistorial();
      await renderMovimientos();
      alert("Factura creada con éxito");
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al procesar la venta");
    }
  }

  if (modoModal === "movimiento") {
    const tipo = document.getElementById("tipo-mov").value;
    const monto = parseFloat(document.getElementById("monto-mov").value);
    const desc = document.getElementById("desc-mov").value;

    if (!monto || !desc) {
      alert("Completar datos obligatorios");
      return;
    }

    try {
      await DB.saveMovimiento({
        tipo,
        monto,
        descripcion: desc,
        fecha: new Date()
      });
      await renderMovimientos();
      alert("Movimiento agregado");
    } catch(e) {
      alert("Error al guardar movimiento");
    }
  }

  ventaTemp = [];
  cerrarModal();
}

/* =========================
    📜 HISTORIAL
========================= */
async function renderHistorial() {
  const cont = document.getElementById("historial");
  if(!cont) return;
  cont.innerHTML = "";

  const ventas = await DB.getVentas();

  ventas.forEach((v, i) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.style.marginBottom = "10px";

    let items = v.items ? v.items.map(p => `${p.nombre} x${p.cantidad}`).join(", ") : "Sin productos";

    div.innerHTML = `
      <div class="prod-info">
        <h3>Factura #${v.id}</h3>
        <p>${items}</p>
        <p class="precio">Total: $${v.total}</p>
      </div>
      <button onclick="eliminarVenta('${v.id}')" style="background:black; margin-top:10px;">Eliminar Factura</button>
    `;
    cont.appendChild(div);
  });
}

/* =========================
    🗑 ELIMINAR VENTA
========================= */
async function eliminarVenta(id) {
  if (!confirm("¿Eliminar esta factura? Se restaurará el stock.")) return;
  const client = DB.client();

  try {
    // 🔴 Borrar movimiento asociado
    await client.from("movimientos").delete().eq("idventa", id);

    // 🔁 Recuperar stock
    const { data: venta } = await client.from("ventas").select("*").eq("id", id).single();

    if (venta && venta.items) {
      for (const item of venta.items) {
        const prod = productosDB.find(p => p.id === item.id);
        if (prod && prod.stock !== undefined && prod.stock !== null) {
          await client.from("productos").update({ stock: prod.stock + item.cantidad }).eq("id", prod.id);
        }
      }
    }

    // 🔴 Borrar venta
    await client.from("ventas").delete().eq("id", id);

    await cargarProductos();
    await renderHistorial();
    await renderMovimientos();
    alert("Factura eliminada");
  } catch(e) {
    console.error(e);
  }
}

/* =========================
    💰 MOVIMIENTOS
========================= */
async function renderMovimientos() {
  const cont = document.getElementById("movimientos");
  if(!cont) return;
  cont.innerHTML = "";

  const movs = await DB.getMovimientos();

  movs.forEach((m) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.style.marginBottom = "10px";
    div.style.borderLeft = m.tipo === "ingreso" ? "5px solid green" : "5px solid red";

    div.innerHTML = `
      <div class="prod-info">
        <h3>${m.tipo.toUpperCase()}</h3>
        <p>${m.descripcion}</p>
        <p class="precio">$${m.monto}</p>
      </div>
    `;
    cont.appendChild(div);
  });
}

function volver() {
  window.location.href = "index.html";
}