// 📦 Variables globales del sistema
let productos = [];
let carrito = [];
let categoriaSeleccionada = "todos";
let textoBusqueda = "";

// ⚠️ REEMPLAZA ESTO CON TU NÚMERO REAL (Mantén el 51 de Perú adelante, sin espacios ni símbolos)
const NUMERO_WHATSAPP = "51999999999"; 

// 🔥 Ejecutar automáticamente cuando cargue la página web
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    inicializarModoOscuro();
    
    // Escuchar la barra de búsqueda
    const inputBusqueda = document.getElementById("input-busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", (e) => {
            textoBusqueda = e.target.value.toLowerCase();
            dibujarProductos();
        });
    }

    // Configurar el botón final de WhatsApp
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

    const productosFiltrados = productos.filter(prod => {
        const coincideCategoria = (categoriaSeleccionada === "todos" || prod.categoria === categoriaSeleccionada);
        const coincideTexto = prod.nombre.toLowerCase().includes(textoBusqueda) || 
                              prod.descripcion.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideTexto;
    });

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center my-5">
                <p class="text-muted fs-5">No encontramos productos o servicios que coincidan con tu búsqueda 🔍</p>
            </div>
        `;
        return;
    }

    productosFiltrados.forEach(prod => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "col";
        
        // Mostrar siempre la primera imagen del array como la portada principal
        const imagenPortada = (prod.imagenes && prod.imagenes.length > 0) ? prod.imagenes[0] : "img/placeholder.jpg";
        
        const botonHTML = prod.stock 
            ? `<button class="btn btn-dark w-100 fw-bold shadow-sm btn-agregar mb-2" onclick="agregarAlCarrito(${prod.id})">🛒 Agregar al Pedido</button>`
            : `<button class="btn btn-secondary w-100 text-white mb-2" disabled>Agotado momentáneamente</button>`;

        tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm border-0 bg-body card-producto">
                <img src="${imagenPortada}" class="card-img-top p-2 rounded" alt="${prod.nombre}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title fw-bold mb-1">${prod.nombre}</h5>
                        <p class="card-text text-muted small mb-0 text-truncate">${prod.descripcion}</p>
                    </div>
                    <div class="mt-3">
                        <div class="fs-4 fw-bold text-success mb-2">S/ ${prod.precio.toFixed(2)}</div>
                        ${botonHTML}
                        <!-- 🔍 Botón dinámico para abrir la galería multimedia -->
                        <button class="btn btn-outline-secondary btn-sm w-100" onclick="abrirGaleriaProducto(${prod.id})">🔍 Ver fotos y detalles</button>
                    </div>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
    
    sincronizarEstilosBotones();
}

// 🔍 NUEVO: Función para armar y mostrar el carrusel de imágenes del producto
function abrirGaleriaProducto(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    // Asignar los textos informativos en el modal
    document.getElementById("detalle-nombre-producto").innerText = prod.nombre;
    document.getElementById("detalle-descripcion-producto").innerText = prod.descripcion;
    document.getElementById("detalle-precio-producto").innerText = `S/ ${prod.precio.toFixed(2)}`;

    // Configurar el botón de agregar al carrito dentro del modal informativo
    const contenedorBoton = document.getElementById("contenedor-boton-modal-agregar");
    if (prod.stock) {
        contenedorBoton.innerHTML = `<button class="btn btn-success fw-bold" onclick="agregarAlCarrito(${prod.id})" data-bs-dismiss="modal">🛒 Añadir al Pedido</button>`;
    } else {
        contenedorBoton.innerHTML = `<button class="btn btn-secondary text-white" disabled>Agotado</button>`;
    }

    // Armar el bloque de imágenes para el carrusel
    const contenedorCarrusel = document.getElementById("carrusel-imagenes-internas");
    contenedorCarrusel.innerHTML = "";

    if (prod.imagenes && prod.imagenes.length > 0) {
        prod.imagenes.forEach((imgUrl, index) => {
            const divImagen = document.createElement("div");
            // La primera foto debe tener la clase 'active' para que Bootstrap sepa por dónde empezar
            divImagen.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            divImagen.innerHTML = `<img src="${imgUrl}" class="d-block w-100 img-carrusel-detalle" alt="Foto ${index + 1} de ${prod.nombre}">`;
            contenedorCarrusel.appendChild(divImagen);
        });
    } else {
        // Fallback por si acaso no tiene imágenes registradas
        contenedorCarrusel.innerHTML = `<div class="carousel-item active"><img src="img/placeholder.jpg" class="d-block w-100 img-carrusel-detalle" alt="Sin imagen"></div>`;
    }

    // Forzar a Bootstrap a mostrar la ventana flotante de la galería
    const modalGaleria = new bootstrap.Modal(document.getElementById("modalDetalleProducto"));
    modalGaleria.show();
}

// 🔄 Cambiar de categoría activa
function filtrarPorCategoria(categoria) {
    categoriaSeleccionada = categoria;
    
    const botones = document.querySelectorAll(".btn-filtro");
    botones.forEach(btn => {
        btn.classList.remove("btn-dark", "btn-light", "active");
        btn.classList.add(document.documentElement.getAttribute("data-bs-theme") === "dark" ? "btn-outline-light" : "btn-outline-dark");
    });

    const botonActivo = window.event.target;
    if (botonActivo && botonActivo.classList.contains("btn-filtro")) {
        const esOscuro = document.documentElement.getAttribute("data-bs-theme") === "dark";
        botonActivo.classList.remove("btn-outline-dark", "btn-outline-light");
        botonActivo.classList.add(esOscuro ? "btn-light" : "btn-dark", "active");
    }

    dibujarProductos();
}

// 🛒 Añadir un producto al carrito de compras
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

// ➕ / ➖ Cambiar unidades directo desde el carrito
function cambiarCantidad(id, cambio) {
    const itemEnCarrito = carrito.find(item => item.id === id);
    if (!itemEnCarrito) return;

    itemEnCarrito.cantidad += cambio;

    if (itemEnCarrito.cantidad <= 0) {
        carrito = carrito.filter(item => item.id !== id);
    }

    actualizarInterfazCarrito();
}

// 🔄 Renderizar las filas del carrito y controlar visibilidad del selector de entrega
function actualizarInterfazCarrito() {
    const contador = document.getElementById("contador-carrito");
    const listaItems = document.getElementById("items-carrito");
    const totalSpan = document.getElementById("total-carrito");
    const seccionEntrega = document.getElementById("seccion-entrega");

    const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (contador) contador.innerText = totalArticulos;

    if (carrito.length === 0) {
        if (listaItems) listaItems.innerHTML = `<p class="text-muted text-center my-3">El carrito está vacío.</p>`;
        if (totalSpan) totalSpan.innerText = "0.00";
        if (seccionEntrega) seccionEntrega.classList.add("d-none");
        return;
    }

    if (seccionEntrega) seccionEntrega.classList.remove("d-none");
    if (listaItems) listaItems.innerHTML = "";
    let totalPrecio = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalPrecio += subtotal;

        const fila = document.createElement("div");
        fila.className = "d-flex justify-content-between align-items-center mb-3 p-2 rounded border border-secondary-subtle";
        fila.innerHTML = `
            <div style="max-width: 55%;">
                <span class="fw-bold d-inline-block text-truncate w-100">${item.nombre}</span>
                <br>
                <small class="text-success fw-bold">S/ ${item.precio.toFixed(2)} c/u</small>
            </div>
            <div class="d-flex align-items-center gap-1">
                <button class="btn btn-sm btn-outline-secondary px-2 py-0 fw-bold" onclick="cambiarCantidad(${item.id}, -1)">-</button>
                <span class="fw-bold px-2" style="min-width: 25px; text-align: center;">${item.cantidad}</span>
                <button class="btn btn-sm btn-outline-secondary px-2 py-0 fw-bold" onclick="cambiarCantidad(${item.id}, 1)">+</button>
            </div>
            <div class="text-end" style="min-width: 75px;">
                <span class="fw-bold text-success">S/ ${subtotal.toFixed(2)}</span>
            </div>
        `;
        if (listaItems) listaItems.appendChild(fila);
    });

    if (totalSpan) totalSpan.innerText = totalPrecio.toFixed(2);
}

// 💬 Enviar el pedido estructurado a WhatsApp incluyendo tus opciones reales de entrega
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Tu carrito está vacío! Añade productos antes de confirmar tu pedido.");
        return;
    }

    const selectEntrega = document.getElementById("select-entrega");
    const metodoEntrega = selectEntrega ? selectEntrega.value : "No especificado";

    let textoMensaje = "¡Hola *Vía Store & Service*! 👋 Deseo realizar el siguiente pedido:\n\n";
    let totalPrecio = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalPrecio += subtotal;
        textoMensaje += `• *${item.cantidad}x* ${item.nombre} (S/ ${item.precio.toFixed(2)} c/u) → *S/ ${subtotal.toFixed(2)}*\n`;
    });

    textoMensaje += `\n💰 *Total de Productos:* S/ ${totalPrecio.toFixed(2)}`;
    textoMensaje += `\n\n📍 *Modalidad de Entrega Seleccionada:* \n→ _${metodoEntrega}_`;

    if (metodoEntrega.includes("Agencia")) {
        textoMensaje += `\n✨ _Nota: El envío a agencia ya está incluido gratis en el precio._`;
    } else if (metodoEntrega.includes("Domicilio Directo")) {
        textoMensaje += `\n⏳ _Nota: Coordinaremos el costo extra según la tarifa del app de delivery._`;
    } else if (metodoEntrega.includes("Punto de Encuentro")) {
        textoMensaje += `\n⏳ _Nota: Coordinaremos el punto exacto y el recargo por movilidad._`;
    }

    textoMensaje += "\n\n📌 *Mis Datos para la Coordinación:*";
    textoMensaje += "\n• Nombre Completo: ";
    textoMensaje += "\n• Celular de Contacto: ";
    textoMensaje += "\n• Agencia de preferencia / Dirección / Punto deseado: ";

    const mensajeCodificado = encodeURIComponent(textoMensaje);
    const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeCodificado}`;

    window.open(urlWhatsApp, "_blank");
}

// 🌙 Lógica del Modo Oscuro
function inicializarModoOscuro() {
    const boton = document.getElementById("btn-toggle-oscuro");
    if (!boton) return;

    boton.addEventListener("click", () => {
        const html = document.documentElement;
        const temaActual = html.getAttribute("data-bs-theme");
        const nuevoTema = temaActual === "dark" ? "light" : "dark";
        
        html.setAttribute("data-bs-theme", nuevoTema);
        boton.innerText = nuevoTema === "dark" ? "☀️" : "🌙";
        boton.className = nuevoTema === "dark" ? "btn btn-light shadow-lg btn-modo-oscuro" : "btn btn-dark shadow-lg btn-modo-oscuro";
        
        sincronizarEstilosBotones();
    });
}

function sincronizarEstilosBotones() {
    const esOscuro = document.documentElement.getAttribute("data-bs-theme") === "dark";
    const botonesAgregar = document.querySelectorAll(".btn-agregar");
    botonesAgregar.forEach(btn => {
        if (esOscuro) {
            btn.classList.remove("btn-dark");
            btn.classList.add("btn-light");
        } else {
            btn.classList.remove("btn-light");
            btn.classList.add("btn-dark");
        }
    });
}