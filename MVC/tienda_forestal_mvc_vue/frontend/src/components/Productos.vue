<template>
  <div>
    <h2>Catálogo de Productos</h2>

    <!-- Campo de búsqueda -->
    <input
      type="text"
      v-model="terminoBusqueda"
      placeholder="Buscar por nombre, tipo o marca"
      @keyup.enter="buscarProductos"
      class="search-input"
    />
    <button @click="buscarProductos">Buscar</button>

    <!-- Filtros -->
    <div class="filtros">
      <input type="text" v-model="filtroTipo" placeholder="Tipo (motosierra, hacha...)" />
      <input type="text" v-model="filtroMarca" placeholder="Marca (STIHL, Husqvarna...)" />
      <input type="number" v-model.number="precioMin" placeholder="Precio min" />
      <input type="number" v-model.number="precioMax" placeholder="Precio max" />
      <select v-model="orden">
        <option value="">Orden</option>
        <option value="asc">Precio ascendente</option>
        <option value="desc">Precio descendente</option>
      </select>
      <button @click="filtrarProductos">Filtrar</button>
    </div>

    <!-- Productos -->
    <div v-if="loading">Cargando productos...</div>
    <div v-else class="grid">
      <div v-for="p in productos" :key="p.id" class="card">
        <img :src="'/img/' + p.imagen" :alt="p.nombre" />
        <h3>{{ p.nombre }}</h3>
        <p>{{ p.descripcion }}</p>
        <strong>{{ p.precio }} €</strong><br>
        <small>Stock: {{ p.stock }}</small>
      </div>
    </div>

    <!-- Paginación -->
    <div class="paginacion" v-if="totalProductos > porPagina">
      <button @click="anteriorPagina" :disabled="pagina === 1">Anterior</button>
      <span>Página {{ pagina }}</span>
      <button @click="siguientePagina" :disabled="productos.length < porPagina">Siguiente</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

// --- Datos reactivos ---
const productos = ref([])
const loading = ref(true)

// Búsqueda y filtros
const terminoBusqueda = ref('')
const filtroTipo = ref('')
const filtroMarca = ref('')
const precioMin = ref(null)
const precioMax = ref(null)
const orden = ref('')

// Paginación
const pagina = ref(1)
const porPagina = ref(10)
const totalProductos = ref(0)

// --- Funciones ---
const cargarProductos = async () => {
  loading.value = true

  try {
    let url = '/api/productos/filtrar?pagina=' + pagina.value + '&por_pagina=' + porPagina.value

    // Agregar filtros
    if (filtroTipo.value) url += `&tipo=${filtroTipo.value}`
    if (filtroMarca.value) url += `&marca=${filtroMarca.value}`
    if (precioMin.value !== null) url += `&precio_min=${precioMin.value}`
    if (precioMax.value !== null) url += `&precio_max=${precioMax.value}`
    if (orden.value) url += `&ordenar=${orden.value}`

    const res = await axios.get(url)
    productos.value = res.data.productos
    totalProductos.value = res.data.productos.length // en un backend más completo podríamos devolver total global
  } catch (error) {
    productos.value = []
    console.error(error)
  }

  loading.value = false
}

const filtrarProductos = () => {
  pagina.value = 1
  cargarProductos()
}

const buscarProductos = () => {
  pagina.value = 1
  // Si hay término de búsqueda, usamos la ruta buscar
  if (terminoBusqueda.value.trim() !== '') {
    loading.value = true
    axios.get(`/api/productos/buscar?termino=${terminoBusqueda.value}`)
      .then(res => {
        productos.value = res.data
      })
      .catch(err => {
        productos.value = []
        console.error(err)
      })
      .finally(() => loading.value = false)
  } else {
    cargarProductos()
  }
}

// Funciones de paginación
const siguientePagina = () => {
  pagina.value++
  cargarProductos()
}
const anteriorPagina = () => {
  if (pagina.value > 1) {
    pagina.value--
    cargarProductos()
  }
}

// --- Cargar productos iniciales ---
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
.search-input {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  width: 250px;
}
.paginacion {
  margin-top: 1rem;
}
.paginacion button {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
}
</style>

