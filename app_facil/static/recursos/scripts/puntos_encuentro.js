const layerPuntosEncuentro = L.layerGroup().addTo(window.mapaApp ? window.mapaApp.map : map);

async function cargarPuntosEncuentro() {
    const contenedorLista = document.getElementById('lista-puntos');
    try {
        const res = await fetch('/static/recursos/datos/json/puntos_encuentro.json');
        if (!res.ok) throw new Error('No se pudo cargar el archivo JSON');
        
        const datos = await res.json();
        // Accedemos a la lista dentro de 'puntos_de_encuentro'
        const puntos = datos.puntos_de_encuentro; 

        if (contenedorLista) contenedorLista.innerHTML = '';

        puntos.forEach(punto => {
            // Extracción de coordenadas desde 'ubicacion'
            const lat = punto.ubicacion?.coordenadas?.latitud;
            const lng = punto.ubicacion?.coordenadas?.longitud;

            // 1. Agregar tarjeta a la lista HTML
            if (contenedorLista) {
                const card = document.createElement('div');
                card.className = 'punto-card';
                card.innerHTML = `
                    <h3>${punto.nombre}</h3>
                    <p><strong>Tipo:</strong> ${punto.tipo}</p>
                    <p><strong>Dirección:</strong> ${punto.ubicacion.direccion}</p>
                    <p><strong>Aforo máximo:</strong> ${punto.capacidad.aforo_maximo_personas} personas</p>
                `;
                contenedorLista.appendChild(card);
            }

            // 2. Agregar marcador al mapa Leaflet
            if (lat && lng && typeof map !== 'undefined') {
                L.marker([lat, lng])
                 .addTo(map)
                 .bindPopup(`<b>${punto.nombre}</b><br>${punto.ubicacion.direccion}`);
            }
        });

    } catch (err) {
        console.error('Error al procesar los puntos de encuentro:', err.message);
    }
}

document.addEventListener('DOMContentLoaded', cargarPuntosEncuentro);