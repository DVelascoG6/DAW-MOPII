<!-- ===================================
    - Se comunica con un backend pagindado
    - Soporta búsqueda general y filtrado
    - Implementa paginación profesional: botones numéricos,
    estado activo, anterior/siguiente.
    - Maneja estado de carga, errores y actualiza todos los
    controladores.
    ==================================== -->
<template>
  <div>
    <h2>Catálogo de Productos</h2>

    <!-- ===============================
         BÚSQUEDA GENERAL
         =============================== -->
    <input
      type="text"
      v-model="terminoBusqueda"
      placeholder="Buscar por nombre, tipo o marca"
      @keyup.enter="buscarProductos"
      class="search-input"
    />
    <button @click="buscarProductos">Buscar</button>

    <!-- ===============================
         FILTROS 
         =============================== -->
    <div class="filtros">
      <input type="text" v-model="filtroTipo" placeholder="Tipo (motosierra, taladro…)" />
      <input type="text" v-model="filtroMarca" placeholder="Marca (STIHL, Makita…)" />
      <input type="number" v-model.number="precioMin" placeholder="Precio mínimo" />
      <input type="number" v-model.number="precioMax" placeholder="Precio máximo" />

      <!-- Orden asc/desc -->
      <select v-model="orden">
        <option value="">Orden</option>
        <option value="asc">Precio ascendente</option>
        <option value="desc">Precio descendente</option>
      </select>

      <button @click="filtrarProductos">Filtrar</button>
    </div>

    <!-- ===============================
         LISTA DE PRODUCTOS
         =============================== -->
    <div v-if="loading">Cargando productos...</div>

    <div v-else class="grid">
      <div v-for="p in productos" :key="p.id" class="card">
        <!-- Imagen del producto -->
        <img :src="'/img/' + p.imagen" :alt="p.nombre" />

        <h3>{{ p.nombre }}</h3>
        <p>{{ p.descripcion }}</p>

        <strong>{{ p.precio }} €</strong><br>
        <small>Stock: {{ p.stock }}</small>
      </div>
    </div>

    <!-- ===============================
         PAGINACIÓN 
         =============================== -->
    <div class="paginacion" v-if="totalPaginas > 1">

      <!-- Botón anterior -->
      <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1">
        Anterior
      </button>

      <!-- Botones numerados -->
      <button
        v-for="n in totalPaginas"
        :key="n"
        @click="cambiarPagina(n)"
        :class="{ activo: n === paginaActual }"
      >
        {{ n }}
      </button>

      <!-- Botón siguiente -->
      <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas">
        Siguiente
      </button>
    </div>

    <!-- Mostrar información -->
    <p v-if="totalResultados > 0">
      Mostrando página {{ paginaActual }} de {{ totalPaginas }}  
      ({{ totalResultados }} productos en total)
    </p>

  </div>
</template>

<script setup>
/*
  ============================================
  IMPORTS Y REFERENCIAS REACTIVAS
  ============================================
*/
import { ref } from 'vue'
import axios from 'axios'

// Lista de productos recibidos del backend
const productos = ref([])

// Indicador de carga
const loading = ref(true)

/*
  ============================================
  VARIABLES PARA BÚSQUEDA Y FILTRADO
  ============================================
*/
const terminoBusqueda = ref('')
const filtroTipo = ref('')
const filtroMarca = ref('')
const precioMin = ref(null)
const precioMax = ref(null)
const orden = ref('')

/*
  ============================================
  PAGINACIÓN: variables controladas por el backend
  ============================================
*/
const paginaActual = ref(1)      // Página que se está mostrando actualmente
const porPagina = ref(10)        // Productos por página
const totalPaginas = ref(1)      // El servidor calcula cuántas páginas hay
const totalResultados = ref(0)   // Total de productos encontrados

/*
  ============================================
  FUNCIÓN PRINCIPAL: cargar productos desde la API
  ============================================
*/
const cargarProductos = async () => {
  loading.value = true

  try {
    // Construimos la URL con parámetros dinámicos
    let url = `/api/productos/filtrar?pagina=${paginaActual.value}&por_pagina=${porPagina.value}`

    if (filtroTipo.value) url += `&tipo=${filtroTipo.value}`
    if (filtroMarca.value) url += `&marca=${filtroMarca.value}`
    if (precioMin.value !== null) url += `&precio_min=${precioMin.value}`
    if (precioMax.value !== null) url += `&precio_max=${precioMax.value}`
    if (orden.value) url += `&ordenar=${orden.value}`

    // Petición al backend
    const res = await axios.get(url)

    /*
      Esperamos del backend:
      {
        productos: [...],
        pagina_actual: X,
        total_paginas: Y,
        total_resultados: Z
      }
    */
    productos.value = res.data.productos
    paginaActual.value = res.data.pagina_actual
    totalPaginas.value = res.data.total_paginas
    totalResultados.value = res.data.total_resultados

  } catch (error) {
    console.error("Error cargando productos:", error)
    productos.value = []
  }

  loading.value = false
}

/*
  ============================================
  FUNCIÓN: Filtrar (reinicia la página a la 1)
  ============================================
*/
const filtrarProductos = () => {
  paginaActual.value = 1
  cargarProductos()
}

/*
  ============================================
  FUNCIÓN: Búsqueda general (ruta diferente)
  ============================================
*/
const buscarProductos = () => {
  paginaActual.value = 1

  // Si no hay término de búsqueda, volver a la carga normal
  if (terminoBusqueda.value.trim() === '') {
    cargarProductos()
    return
  }

  loading.value = true

  axios.get(`/api/productos/buscar?termino=${terminoBusqueda.value}`)
    .then(res => {
      productos.value = res.data
      totalResultados.value = res.data.length
      totalPaginas.value = Math.ceil(res.data.length / porPagina.value)
    })
    .catch(err => console.error(err))
    .finally(() => loading.value = false)
}

/*
  ============================================
  FUNCIÓN: Cambiar de página directamente
  ============================================
*/
const cambiarPagina = (nuevaPagina) => {
  // Evitamos páginas inválidas (0 o mayores que totalPaginas)
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return

  paginaActual.value = nuevaPagina
  cargarProductos()
}

/*
  ============================================
  CARGA INICIAL AL MONTAR EL COMPONENTE
  ============================================
*/
cargarProductos()
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
}
.card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.filtros {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.paginacion button {
  margin: 0 4px;
  padding: 0.5rem 0.8rem;
}
button.activo {
  background-color: #4CAF50;
  color: white;
  font-weight: bold;
}
</style>
