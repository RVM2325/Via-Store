// 📦 Variables globales del sistema
let productos = [];
let carrito = [];
let categoriaSeleccionada = "todos";
let textoBusqueda = "";

// ⚠️ REEMPLAZA ESTO CON TU NÚMERO REAL (Mantén el 51 de Perú adelante, sin espacios ni símbolos)
const NUMERO_WHATSAPP = "51935530397"; 

// 🔥 Ejecutar automáticamente cuando cargue la página web
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    
    // Escuchar en tiempo real lo que el cliente escribe en la barra de búsqueda
    const inputBusqueda = document.getElementById("input-busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", (e) => {
            textoBusqueda = e.target.value.toLowerCase();
            dibujarProductos(); // Volver a pintar los productos filtrados instantáneamente
        });
    }

    // Configurar la acción del botón final del carrito
    document.getElementById("btn-enviar-whatsapp").addEventListener("click", enviarPedidoWhatsApp);
});

// 🌐 Jalar los datos del archivo productos.json
async function cargarProductos() {
    try {
        const respuesta = await fetch("productos.json");
        productos = await respuesta.json();
        dibujarProductos();
    } catch (error) {
        console.error("Error crítico cargando el catálogo de productos:", error);
    }
}

// 🎨 Pintar las tarjetas de los productos aplicando los filtros activos
function dibujarProductos() {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    // 🌟 FILTRADO INTELIGENTE: Combinamos búsqueda por texto y categoría seleccionada
    const productosFiltrados = productos.filter(prod => {
        const coincideCategoria = (categoriaSeleccionada === "todos" || prod.categoria === categoriaSeleccionada);
        const coincideTexto = prod.nombre.toLowerCase().includes(textoBusqueda) || 
                              prod.descripcion.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideTexto;
    });

    // Si no hay ninguna coincidencia, mostrar un aviso amigable
    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center my-5">
                <p class="text-muted fs-5">No encontramos productos o servicios que coincidan con tu búsqueda 🔍</p>
            </div>
        `;
        return;
    }

    // Dibujar en pantalla únicamente los productos que pasaron el filtro
    productosFiltrados.forEach(prod => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "col";
        
        // Deshabilitar botón si el producto no cuenta con stock disponible
        const botonHTML = prod.stock 
            ? `<button class="btn btn-dark w-100 fw-bold shadow-sm" onclick="agregarAlCarrito(${prod.id})">🛒 Agregar al Pedido</button>`
            : `<button class="btn btn-secondary w-100 text-white" disabled>Agotado momentáneamente</button>`;

        tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm border-0 bg-white card-producto">
                <img src="${prod.imagen}" class="card-img-top p-2 rounded" alt="${prod.nombre}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title text-dark fw-bold mb-1">${prod.nombre}</h5>
                        <p class="card-text text-muted small mb-0">${prod.descripcion}</p>
                    </div>
                    <div class="mt-3">
                        <div class="fs-4 fw-bold text-success mb-2">S/ ${prod.precio.toFixed(2)}</div>
                        ${botonHTML}
                    </div>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 🔄 Cambiar de categoría activa y actualizar el diseño de los botones visualmente
function filtrarPorCategoria(categoria) {
    categoriaSeleccionada = categoria;
    
    // Limpiar clases activas de todos los botones de filtro
    const botones = document.querySelectorAll(".btn-filtro");
    botones.forEach(btn => {
        btn.classList.remove("btn-dark", "active");
        btn.classList.add("btn-outline-dark");
    });

    // Resaltar visualmente el botón al que se le hizo clic
    const botonActivo = window.event.target;
    if (botonActivo && botonActivo.classList.contains("btn-filtro")) {
        botonActivo.classList.remove("btn-outline-dark");
        botonActivo.classList.add("btn-dark", "active");
    }

    dibujarProductos(); // Refrescar catálogo con la nueva categoría
}

// 🛒 Añadir un producto al array del carrito de compras
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    const itemEnCarrito = carrito.find(item => item.id === id);
    
    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    
    actualizarInterfazCarrito();
}

// 🔄 Renderizar las filas de productos dentro de la ventana modal del carrito
function actualizarInterfazCarrito() {
    const contador = document.getElementById("contador-carrito");
    const listaItems = document.getElementById("items-carrito");
    const totalSpan = document.getElementById("total-carrito");

    const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (contador) contador.innerText = totalArticulos;

    if (carrito.length === 0) {
        if (listaItems) listaItems.innerHTML = `<p class="text-muted text-center my-3">El carrito está vacío.</p>`;
        if (totalSpan) totalSpan.innerText = "0.00";
        return;
    }

    if (listaItems) listaItems.innerHTML = "";
    let totalPrecio = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalPrecio += subtotal;

        const fila = document.createElement("div");
        fila.className = "d-flex justify-content-between align-items-center mb-2 bg-light p-2 rounded animate__animated animate__fadeInFast";
        fila.innerHTML = `
            <div>
                <span class="fw-bold text-dark text-truncate d-inline-block" style="max-width: 220px;">${item.nombre}</span>
                <br>
                <small class="text-muted">S/ ${item.precio.toFixed(2)} x ${item.cantidad}</small>
            </div>
            <div class="d-flex align-items-center">
                <span class="fw-bold text-success me-3">S/ ${subtotal.toFixed(2)}</span>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarDelCarrito(${item.id})">❌</button>
            </div>
        `;
        if (listaItems) listaItems.appendChild(fila);
    });

    if (totalSpan) totalSpan.innerText = totalPrecio.toFixed(2);
}

// ❌ Disminuir cantidad o remover un artículo por completo del carrito
function eliminarDelCarrito(id) {
    const itemEnCarrito = carrito.find(item => item.id === id);
    if (!itemEnCarrito) return;

    if (itemEnCarrito.cantidad > 1) {
        itemEnCarrito.cantidad--;
    } else {
        carrito = carrito.filter(item => item.id !== id);
    }
    actualizarInterfazCarrito();
}

// 💬 Empaquetar el array de compras en un mensaje cifrado de URL y enviarlo a WhatsApp
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Tu carrito está vacío! Añade productos antes de confirmar tu pedido.");
        return;
    }

    let textoMensaje = "¡Hola *Vía Store & Service*! 👋 Deseo realizar el siguiente pedido:\n\n";
    let totalPrecio = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalPrecio += subtotal;
        textoMensaje += `• *${item.cantidad}x* ${item.nombre} (S/ ${item.precio.toFixed(2)} c/u) → *S/ ${subtotal.toFixed(2)}*\n`;
    });

    textoMensaje += `\n💰 *Total Estimado a Pagar:* S/ ${totalPrecio.toFixed(2)}`;
    
    // Regla de envío gratis dinamizada según montos
    if (totalPrecio >= 100) {
        textoMensaje += `\n🚚 _¡Felicidades! Tu compra califica para Envío Gratis_`;
    } else {
        textoMensaje += `\n📦 _Nota: No incluye costo de entrega (Pedidos menores a S/ 100)_`;
    }

    textoMensaje += "\n\n📌 *Mis Datos de Contacto:*";
    textoMensaje += "\n• Nombre: ";
    textoMensaje += "\n• Distrito de Entrega: ";

    // Codificar caracteres especiales para compatibilidad URL universal
    const mensajeCodificado = encodeURIComponent(textoMensaje);
    const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeCodificado}`;

    // Despachar hacia la aplicación o web de WhatsApp en pestaña nueva
    window.open(urlWhatsApp, "_blank");
}