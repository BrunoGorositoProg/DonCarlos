const SUPABASE_URL = "https://jlvjnllbmbqmoszujwru.supabase.co";
const SUPABASE_KEY = "sb_publishable_GzlfVP-TFDjD2EBOy3wX-A_0y-fFeN2"; //correcta

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const DB = {

  /* =========================
     PRODUCTOS
  ========================= */

  async getProductos() {
    const { data, error } = await supabaseClient
      .from("productos")
      .select("*");

    if (error) {
      console.error("Error productos:", error);
      return [];
    }

    return data;
  },

  async saveProductos(productos) {
    const { error } = await supabaseClient
      .from("productos")
      .upsert(productos);

    if (error) {
      console.error("Error guardando productos:", error);
    }
  },

  /* =========================
     VENTAS
  ========================= */

  async getVentas() {
    const { data, error } = await supabaseClient
      .from("ventas")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error ventas:", error);
      return [];
    }

    return data;
  },

  async saveVenta(venta) {
    const { error } = await supabaseClient
      .from("ventas")
      .insert([venta]);

    if (error) {
      console.error("Error guardando venta:", error);
    }
  },

  /* =========================
     MOVIMIENTOS
  ========================= */

  async getMovimientos() {
    const { data, error } = await supabaseClient
      .from("movimientos")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error movimientos:", error);
      return [];
    }

    return data;
  },

  async saveMovimiento(mov) {
    const { error } = await supabaseClient
      .from("movimientos")
      .insert([mov]);

    if (error) {
      console.error("Error guardando movimiento:", error);
    }
  }
};