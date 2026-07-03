// Variables globales
let productos = [];
let carrito = [];

// Tu número de WhatsApp Business (Usa el código de país de Perú: 51)
const NUMERO_WHATSAPP = "51999999999"; // ⚠️ REEMPLAZA ESTO CON TU NÚMERO REAL LUEGO

// Ejecutar cuando cargue la página
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    
    // Configurar el botón de enviar pedido
    document.getElementById("btn-enviar-whatsapp").addEventListener("click", enviarPedidoWhatsApp);
});

// Función para jalar los productos del JSON
async function cargarProductos() {
    try {
        const respuesta = await fetch("productos.json");
        productos = await respuesta.json();
        dibujarProductos();
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
    }
}

// Función para pintar las tarjetas de los productos en el HTML
function dibujarProductos() {
    const contenedor = document.getElementById("contenedor-productos");
    contenedor.innerHTML = "";

    productos.forEach(prod => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "col";
        
        // Validar si hay stock disponible
        const botonHTML = prod.stock 
            ? `<button class="btn btn-dark w-100 fw-bold" onclick="agregarAlCarrito(${prod.id})">🛒 Agregar al Pedido</button>`
            : `<button class="btn btn-secondary w-100" disabled>Agotado momentáneamente</button>`;

        tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm border-0 bg-white">
                <img src="${prod.imagen}" class="card-img-top p-2 rounded" alt="${prod.nombre}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title text-dark fw-bold">${prod.nombre}</h5>
                        <p class="card-text text-muted small">${prod.descripcion}</p>
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

// Función para añadir productos al array del carrito
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    
    // Si ya existe en el carrito, aumentamos su cantidad
    const itemEnCarrito = carrito.find(item => item.id === id);
    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    
    actualizarInterfazCarrito();
}

// Función para actualizar los contadores y la ventana del carrito
function actualizarInterfazCarrito() {
    const contador = document.getElementById("contador-carrito");
    const listaItems = document.getElementById("items-carrito");
    const totalSpan = document.getElementById("total-carrito");

    // Calcular el total de productos añadidos
    const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contador.innerText = totalArticulos;

    if (carrito.length === 0) {
        listaItems.innerHTML = `<p class="text-muted text-center my-3">El carrito está vacío.</p>`;
        totalSpan.innerText = "0.00";
        return;
    }

    listaItems.innerHTML = "";
    let totalPrecio = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalPrecio += subtotal;

        const fila = document.createElement("div");
        fila.className = "d-flex justify-content-between align-items-center mb-2 bg-light p-2 rounded";
        fila.innerHTML = `
            <div>
                <span class="fw-bold text-dark">${item.nombre}</span>
                <br>
                <small class="text-muted">S/ ${item.precio.toFixed(2)} x ${item.cantidad}</small>
            </div>
            <div class="d-flex align-items-center">
                <span class="fw-bold text-success me-3">S/ ${subtotal.toFixed(2)}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarDelCarrito(${item.id})">❌</button>
            </div>
        `;
        listaItems.appendChild(fila);
    });

    totalSpan.innerText = totalPrecio.toFixed(2);
}

// Función para quitar una unidad o eliminar el producto del carrito
function eliminarDelCarrito(id) {
    const itemEnCarrito = carrito.find(item => item.id === id);
    if (itemEnCarrito.cantidad > 1) {
        itemEnCarrito.cantidad--;
    } else {
        carrito = carrito.filter(item => item.id !== id);
    }
    actualizarInterfazCarrito();
}

// Función para empaquetar el string del mensaje y redirigir a la API de WhatsApp
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Tu carrito está vacío! Añade productos antes de confirmar.");
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
    
    // Aplicar regla comercial dinámica: Envío gratis si supera los S/ 100
    if (totalPrecio >= 100) {
        textoMensaje += `\n🚚 _¡Felicidades! Aplica para Envío Gratis a tu distrito_`;
    } else {
        textoMensaje += `\n📦 _Nota: No incluye costo de entrega (Menor a S/ 100)_`;
    }

    textoMensaje += "\n\n📌 *Mis Datos de Contacto:*";
    textoMensaje += "\n• Nombre: ";
    textoMensaje += "\n• Distrito de Entrega: ";

    // Codificar el texto para que sea compatible con una URL de internet
    const mensajeCodificado = encodeURIComponent(textoMensaje);
    const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeCodificado}`;

    // Abrir el chat de WhatsApp en una pestaña nueva
    window.open(urlWhatsApp, "_blank");
}