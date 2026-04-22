const contenedor = document.getElementById("productos");
const carritoLista = document.getElementById("lista-carrito");

let carrito = [];

// Render productos
productos.forEach(prod => {
  const div = document.createElement("div");
  div.classList.add("card");

  div.innerHTML = `
    <img src="${prod.imagen}" />
    <h3>${prod.nombre}</h3>
    <p>$${prod.precio}</p>
    <button onclick="agregarAlCarrito(${prod.id})">Agregar</button>
  `;

  contenedor.appendChild(div);
});

// Agregar al carrito
function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  carrito.push(producto);
  renderCarrito();
}

// Render carrito
function renderCarrito() {
  carritoLista.innerHTML = "";

  carrito.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.nombre} - $${p.precio}`;
    carritoLista.appendChild(li);
  });
}

// Enviar a WhatsApp
document.getElementById("enviarPedido").addEventListener("click", () => {
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;

  if (!nombre || !telefono || carrito.length === 0) {
    alert("Completa los datos y agrega productos");
    return;
  }

  let mensaje = `Hola, soy ${nombre}%0A%0APedido:%0A`;

  carrito.forEach(p => {
    mensaje += `- ${p.nombre}%0A`;
  });

  mensaje += `%0ATel: ${telefono}`;

  const numero = "549XXXXXXXXXX"; // TU NUMERO
  const url = `https://wa.me/${numero}?text=${mensaje}`;

  window.open(url, "_blank");
});