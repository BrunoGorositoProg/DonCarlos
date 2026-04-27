const DB = {
  getProductos: () => {
    return JSON.parse(localStorage.getItem("productos")) || productos;
  },

  saveProductos: (data) => {
    localStorage.setItem("productos", JSON.stringify(data));
  },

  getVentas: () => {
    return JSON.parse(localStorage.getItem("ventas")) || [];
  },

  saveVenta: (venta) => {
    const ventas = DB.getVentas();
    ventas.push(venta);
    localStorage.setItem("ventas", JSON.stringify(ventas));
  }
};