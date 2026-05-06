let productosDB = [];
let ventaTemp = [];
let editandoId = null;
let modoModal = "";

/* =========================
   🚀 INIT
========================= */
async function init() {
  await cargarProductos();
  await cargarMeses();

  await renderHistorial();
  await renderMovimientos();
  await renderResumen();
  await renderTopProductos();
}

init();

/* =========================
   🧠 HELPERS
========================= */
function obtenerMes(fecha) {
  const f = new Date(fecha);
  return `${f.getFullYear()}-${f.getMonth() + 1}`;
}

/* =========================
   🟢 PRODUCTOS
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
          <input id="stock-${p.id}" type="number" value="${p.stock ?? ""}" />
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

async function guardarEdicion(id) {
  const prod = productosDB.find(p => p.id === id);

  prod.nombre = document.getElementById(`nombre-${id}`).value;
  prod.precio = parseFloat(document.getElementById(`precio-${id}`).value);

  const stockVal = document.getElementById(`stock-${id}`).value;
  prod.stock = stockVal !== "" ? parseInt(stockVal) : null;

  prod.descripcion = document.getElementById(`desc-${id}`).value;

  const { error } = await supabaseClient
    .from("productos")
    .update(prod)
    .eq("id", id);

  if (error) return console.error(error);

  await cargarProductos();
  editandoId = null;
}

/* =========================
   🛒 VENTAS
========================= */
function abrirModalVenta() {
  modoModal = "venta";
  ventaTemp = [];

  document.getElementById("venta-resumen").innerHTML = "";
  document.getElementById("modal-productos").innerHTML = "";

  renderModalProductos();
  document.getElementById("modal-venta").classList.remove("hidden");
}

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

function agregarProducto(id) {
  const prod = productosDB.find(p => p.id === id);

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
   📦 GUARDAR VENTA
========================= */
async function accionModal() {
  if (modoModal === "venta") {
    if (!ventaTemp.length) return alert("No hay productos");

    let total = 0;

    for (const v of ventaTemp) {
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
      idventa: idVenta
    });

    renderHistorial();
    renderMovimientos();
    renderResumen();
    renderTopProductos();
  }

  ventaTemp = [];
  cerrarModal();
}

function cerrarModal() {
  document.getElementById("modal-venta").classList.add("hidden");
}

/* =========================
   📜 HISTORIAL
========================= */
async function renderHistorial(mes = null) {
  const cont = document.getElementById("historial");
  cont.innerHTML = "";

  const ventas = await DB.getVentas();

  const filtradas = mes
    ? ventas.filter(v => obtenerMes(v.fecha) === mes)
    : ventas;

  filtradas.forEach((v, i) => {
    const div = document.createElement("div");
    div.classList.add("prod-card");

    div.innerHTML = `
      <div class="prod-info">
        <h3>Factura #${i + 1}</h3>
        <p>${v.items.map(i => i.nombre).join(", ")}</p>
        <p class="prod-precio">$${v.total}</p>
      </div>
    <button class="delete-btn" onclick="eliminarVenta(${v.id})">-</button>    `;
    cont.appendChild(div);
  });
}
async function eliminarVenta(id) {

  if (!confirm("¿Eliminar esta factura?")) return;

  // 🔁 traer venta para recuperar stock (opcional pero recomendable)
  const { data: venta } = await supabaseClient
    .from("ventas")
    .select("*")
    .eq("id", id)
    .single();

  if (venta && venta.items) {
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

  // 🔴 borrar movimiento
  await supabaseClient
    .from("movimientos")
    .delete()
    .eq("idventa", id);

  // 🔴 borrar venta
  await supabaseClient
    .from("ventas")
    .delete()
    .eq("id", id);

  // 🔄 refrescar
  await cargarProductos();
  renderHistorial();
  renderMovimientos();

  alert("Factura eliminada");
}

/* =========================
   💰 MOVIMIENTOS
========================= */
async function renderMovimientos(mes = null) {
  const cont = document.getElementById("movimientos");
  cont.innerHTML = "";

  const movs = await DB.getMovimientos();

  const filtrados = mes
    ? movs.filter(m => obtenerMes(m.fecha) === mes)
    : movs;

  filtrados.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("prod-card", m.tipo);

    div.innerHTML = `
      <div class="prod-info">
        <h3>${m.tipo}</h3>
        <p>${m.descripcion}</p>
        <p>$${m.monto}</p>
      </div>
    `;

    cont.appendChild(div);
  });
}

/* =========================
   📊 RESUMEN
========================= */
async function renderResumen(mes = null) {
  const movs = await DB.getMovimientos();

  const filtrados = mes
    ? movs.filter(m => obtenerMes(m.fecha) === mes)
    : movs;

  let ingresos = 0;
  let egresos = 0;

  filtrados.forEach(m => {
    if (m.tipo === "ingreso") ingresos += Number(m.monto);
    else egresos += Number(m.monto);
  });

  const balance = ingresos - egresos;

  document.getElementById("resumen-mes").innerHTML = `
    <h3>Resumen</h3>
    <p>Ingresos: $${ingresos}</p>
    <p>Egresos: $${egresos}</p>
    <p class="${balance >= 0 ? 'ganancia' : 'perdida'}">
      ${balance}
    </p>
  `;
}

/* =========================
   🏆 TOP PRODUCTOS
========================= */
async function renderTopProductos(mes = null) {
  const cont = document.getElementById("top-productos");
  cont.innerHTML = "";

  const ventas = await DB.getVentas();

  const filtradas = mes
    ? ventas.filter(v => obtenerMes(v.fecha) === mes)
    : ventas;

  const contador = {};

  filtradas.forEach(v => {
    v.items.forEach(i => {
      contador[i.nombre] = (contador[i.nombre] || 0) + i.cantidad;
    });
  });

  Object.entries(contador)
    .sort((a, b) => b[1] - a[1])
    .forEach(([n, c]) => {
      const div = document.createElement("div");
      div.innerText = `${n}: ${c}`;
      cont.appendChild(div);
    });
}

/* =========================
   📅 FILTRO
========================= */
async function cargarMeses() {
  const ventas = await DB.getVentas();
  const select = document.getElementById("filtro-mes");

  const meses = [...new Set(ventas.map(v => obtenerMes(v.fecha)))];

  select.innerHTML = `<option value="">Todos</option>`;

  meses.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
}

function cambiarMes() {
  const mes = document.getElementById("filtro-mes").value;

  renderHistorial(mes);
  renderMovimientos(mes);
  renderResumen(mes);
  renderTopProductos(mes);
}

/* =========================
   🔙 VOLVER
========================= */
function volver() {
  window.location.href = "index.html";
}