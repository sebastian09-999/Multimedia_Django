let layerPuntosEncuentro = null;

// Obtener la instancia del mapa desde window.mapaApp o variable global
function obtenerMapa() {
    return window.mapaApp ? window.mapaApp.mapa : (typeof mapa !== 'undefined' ? mapa : null);
}

async function cargarPuntosEncuentro() {
    const contenedorLista = document.getElementById('lista-puntos');
    const mapaInstancia = obtenerMapa();

    try {
        // Inicializar la capa en el mapa si existe la instancia y no se ha creado
        if (mapaInstancia && !layerPuntosEncuentro) {
            layerPuntosEncuentro = L.layerGroup().addTo(mapaInstancia);
        }

        const res = await fetch(URL_JSON);
        if (!res.ok) throw new Error('No se pudo cargar el archivo JSON');

        const datos = await res.json();
        // Soporte si el JSON devuelve una lista directa o la clave 'puntos_de_encuentro'
        const puntos = Array.isArray(datos) ? datos : (datos.puntos_de_encuentro || []);

        if (contenedorLista) contenedorLista.innerHTML = '';
        if (layerPuntosEncuentro) layerPuntosEncuentro.clearLayers();

        const marcadores = [];

        puntos.forEach(punto => {
            const lat = punto.ubicacion?.coordenadas?.latitud;
            const lng = punto.ubicacion?.coordenadas?.longitud;
            const direccion = punto.ubicacion?.direccion || 'Sin dirección';
            const aforo = punto.capacidad?.aforo_maximo_personas || 'N/A';

            // 1. Renderizar tarjeta en el HTML
            if (contenedorLista) {
                const card = document.createElement('div');
                card.className = 'punto-card';
                card.innerHTML = `
                    <h3>${punto.nombre}</h3>
                    <p><strong>Tipo:</strong> ${punto.tipo || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${direccion}</p>
                    <p><strong>Aforo máximo:</strong> ${aforo} personas</p>
                `;
                contenedorLista.appendChild(card);
            }

            // 2. Crear marcador y agregarlo al LayerGroup
            if (lat && lng && layerPuntosEncuentro) {
                const marker = L.marker([lat, lng])
                    .bindPopup(`<b>${punto.nombre}</b><br>${direccion}`);
                
                layerPuntosEncuentro.addLayer(marker);
                marcadores.push(marker);
            }
        });

        // Reencuadrar el mapa para enfocar todos los puntos
        if (mapaInstancia && marcadores.length > 0) {
            const grupo = L.featureGroup(marcadores);
            mapaInstancia.fitBounds(grupo.getBounds().pad(0.1));
        }

    } catch (err) {
        console.error('Error al procesar los puntos de encuentro:', err.message);
    }
}

// Vincular evento al botón tras cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const btnPuntos = document.getElementById('btn-puntos');
    if (btnPuntos) {
        btnPuntos.addEventListener('click', cargarPuntosEncuentro);
    }
});