class Producto {
    constructor(id, nombre, precio, categoria, imagen) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.categoria = categoria;
        this.imagen = imagen;
    }
}

class BaseDeDatos {
    constructor() {
        this.productos = [];
    }

    //prueba

    async traerRegistros() {
        try {
            const response = await fetch("./productos.json");
            if (!response.ok) {
                throw new Error(`Error al cargar los productos: ${response.status} - ${response.statusText}`);
            }
            this.productos = await response.json();
            return this.productos;
        } catch (error) {
            console.error(error);
        }
    }

    registroPorId(id) {
        return this.productos.find((producto) => producto.id === id);
    }

    registroPorNombre(palabra) {
        return this.productos.filter((producto) => producto.nombre.toLowerCase().includes(palabra));
    }

    registroPorCategoia(categoria) {
        return this.productos.filter((producto) => producto.categoria == categoria);
    }
}

const bd = new BaseDeDatos();

//Elementos
const divProductos = document.querySelector("#productos");
const divCarrito = document.querySelector("#carrito");
const spanCantidadProductos = document.querySelector("#cantidadProductos");
const spanTotalCarrito = document.querySelector("#totalCarrito");
const inputBuscar = document.querySelector("#inputBuscar");
const botonCarrito = document.querySelector("section h1");
const botonComprar = document.querySelector("#botonComprar");
const botonesCategorias = document.querySelectorAll(".btnCategoria");

botonesCategorias.forEach((boton) => {
    boton.addEventListener("click", (event) => {
        event.preventDefault();
        const productosPorCategoria = bd.registroPorCategoia(boton.innerText);
        cargarProductos(productosPorCategoria);
    });
});

document.querySelector("#btnTodos").addEventListener("click", (event) => {
    event.preventDefault();
    cargarProductos(bd.productos);
});

bd.traerRegistros().then((productos) => cargarProductos(productos));

function cargarProductos(productos) {
    divProductos.innerHTML = "";
    for (const producto of productos) {
        divProductos.innerHTML += `
        <div class="producto">
        <h2>${producto.nombre}</h2>
        <p class="precio">$${producto.precio}</p>
        <div class= "imagen">
        <img src="img/${producto.imagen}" width="150">
        </div>
        <a href="#" class="btnAgregar" data-id="${producto.id}">Agregar al carrito</a>
        </div>
        `;
    }

    const botonesAgregar = document.querySelectorAll(".btnAgregar");
    for (const boton of botonesAgregar) {
        boton.addEventListener("click", (event) => {
            event.preventDefault();
            const id = Number(boton.dataset.id);
            const producto = bd.registroPorId(id);
            carrito.agregar(producto);
        });
    }
}

//Clase carrito

class Carrito {
    constructor() {
        const carritoStorage = JSON.parse(localStorage.getItem("carrito"));
        this.carrito = carritoStorage || [];
        this.total = 0;
        this.totalProductos = 0;
        this.listar();
    }

    //Método para agregar el producto al carrito
    agregar(producto) {
        const productoEnCarrito = this.figuraEnCarrito(producto);
        if (productoEnCarrito) {
            productoEnCarrito.cantidad++;
        } else {
            this.carrito.push({ ...producto, cantidad: 1 });
        }
        localStorage.setItem("carrito", JSON.stringify(this.carrito));
        this.listar();
        //Toastify
        Toastify({
            text: "Se agregó el producto al carrito",
            position: "left",
            className: "info",
            style: {
                background: "linear-gradient(to right, #ff80af, #ff59f0)",
            }
        }).showToast();
    }

    figuraEnCarrito({ id }) {
        return this.carrito.find((producto) => producto.id === id);
    }

    listar() {
        this.total = 0;
        this.totalProductos = 0;
        divCarrito.innerHTML = "";
        for (const producto of this.carrito) {
            divCarrito.innerHTML += `
            <div class="productoCarrito">
            <h2>${producto.nombre}</h2>
            <p>$${producto.precio}</p>
            <p>Cantidad: 
            <button class="btnCantidad" data-id="${producto.id}" data-operacion="restar">-</button>
            ${producto.cantidad}
            <button class="btnCantidad" data-id="${producto.id}" data-operacion="sumar">+</button>
            </p>
            <a href="#" data-id="${producto.id}" class="btnQuitarProducto">Quitar del carrito</a>
            </div>
            `;
            this.total += producto.precio * producto.cantidad;
            this.totalProductos += producto.cantidad;
        }

        if (this.totalProductos > 0) {
            botonComprar.classList.remove("oculto");
        } else {
            botonComprar.classList.add("oculto");
        }

        const botonesQuitar = document.querySelectorAll(".btnQuitar");
        for (const boton of botonesQuitar) {
            boton.onclick = (event) => {
                event.preventDefault();
                this.quitar(Number(boton.dataset.id));
            };
        }

        const botonesCantidad = document.querySelectorAll(".btnCantidad");
        for (const boton of botonesCantidad) {
            boton.onclick = (event) => {
                event.preventDefault();
                const id = Number(boton.dataset.id);
                const operacion = boton.dataset.operacion;
                if (operacion === "sumar") {
                    this.sumar(id);
                } else if (operacion === "restar") {
                    this.restar(id);
                }
            };
        }

        const botonesQuitarProducto = document.querySelectorAll(".btnQuitarProducto");
        for (const boton of botonesQuitarProducto) {
            boton.addEventListener("click", (event) => {
                event.preventDefault();
                const id = Number(boton.dataset.id);
                carrito.quitarProducto(id);
            });
        }

        spanCantidadProductos.innerText = this.totalProductos;
        spanTotalCarrito.innerText = this.total;
    }

    sumar(id) {
        const indice = this.carrito.findIndex((producto) => producto.id === id);
        this.carrito[indice].cantidad++;
        localStorage.setItem("carrito", JSON.stringify(this.carrito));
        this.listar();
    }

    restar(id) {
        const indice = this.carrito.findIndex((producto) => producto.id === id);
        if (this.carrito[indice].cantidad > 1) {
            this.carrito[indice].cantidad--;
        } else {
            this.carrito.splice(indice, 1);
        }
        localStorage.setItem("carrito", JSON.stringify(this.carrito));
        this.listar();
    }

    vaciar() {
        this.carrito = [];
        localStorage.removeItem("carrito");
        this.listar();
    }

    quitarProducto(id) {
        const indice = this.carrito.findIndex((producto) => producto.id === id);
        if (indice !== -1) {
            this.carrito.splice(indice, 1);
            localStorage.setItem("carrito", JSON.stringify(this.carrito));
            this.listar();
        }
    }

}

//Evento del buscador
inputBuscar.addEventListener("keyup", () => {
    const palabra = inputBuscar.value;
    const productos = bd.registroPorNombre(palabra.toLowerCase());
    cargarProductos(productos);
});

botonCarrito.addEventListener("click", () => {
    document.querySelector("section").classList.toggle("ocultar");
});

botonComprar.addEventListener("click", () => {
    Swal.fire({
        title: 'Su compra se ha efectuado con éxito',
        text: 'Su pedido está en camino',
        icon: 'success',
        confirmButtonText: 'Aceptar'
    });
    carrito.vaciar();
});

const carrito = new Carrito();