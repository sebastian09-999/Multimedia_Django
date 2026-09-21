let layerPuntosEncuentro = null;

function obtenerMapa() {
    return window.mapaApp ? window.mapaApp.mapa : (typeof mapa !== 'undefined' ? mapa : null);
}

async function cargarPuntosEncuentro() {
    const contenedorLista = document.getElementById('lista-puntos');
    const mapaInstancia = obtenerMapa();
    const btnPuntos = document.getElementById('btn-puntos');

    if (btnPuntos) btnPuntos.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';

    try {
        if (mapaInstancia && !layerPuntosEncuentro) {
            layerPuntosEncuentro = L.layerGroup().addTo(mapaInstancia);
        } else if (layerPuntosEncuentro) {
            layerPuntosEncuentro.clearLayers();
        }

        const res = await fetch(URL_JSON);
        if (!res.ok) throw new Error('No se pudo cargar el archivo JSON');

        const datos = await res.json();
        const puntos = Array.isArray(datos) ? datos : (datos.puntos_de_encuentro || []);

        if (contenedorLista) contenedorLista.innerHTML = '';
        const marcadores = [];

        puntos.forEach((punto, index) => {
            const lat = punto.ubicacion?.coordenadas?.latitud;
            const lng = punto.ubicacion?.coordenadas?.longitud;
            const direccion = punto.ubicacion?.direccion || 'Sin dirección';
            const aforo = punto.capacidad?.aforo_maximo_personas || 'N/A';
            const tipo = punto.tipo || 'Punto de Encuentro';

            // 1. Renderizar tarjeta en el HTML
            if (contenedorLista) {
                const card = document.createElement('div');
                card.className = 'punto-card';
                card.id = `punto-card-${index}`;
                card.innerHTML = `
                    <div class="punto-header">
                        <h3><i class="fa-solid fa-location-dot text-primary"></i> ${punto.nombre}</h3>
                        <span class="badge-tipo">${tipo}</span>
                    </div>
                    <p><i class="fa-solid fa-map-pin text-muted"></i> ${direccion}</p>
                    <p><i class="fa-solid fa-users text-success"></i> Aforo: <strong>${aforo}</strong> personas</p>
                    <button class="btn-accion btn-sm btn-geoloc-outline mt-2" onclick="centrarMapaEnPunto(${lat}, ${lng}, ${index})">
                        <i class="fa-solid fa-crosshairs"></i> Ver en mapa
                    </button>
                `;
                contenedorLista.appendChild(card);
            }

            // 2. Crear marcador en el mapa
            if (lat && lng && layerPuntosEncuentro) {
                const marker = L.marker([lat, lng])
                    .bindPopup(`
                        <div style="font-family: 'Outfit', sans-serif;">
                            <h4 style="margin:0 0 5px 0; color:#38bdf8;">${punto.nombre}</h4>
                            <p style="margin:0 0 3px 0; font-size:13px;"><strong>Tipo:</strong> ${tipo}</p>
                            <p style="margin:0; font-size:13px;"><strong>Dirección:</strong> ${direccion}</p>
                        </div>
                    `);
                
                // Interacción: Clic en marcador -> Resaltar tarjeta en la lista
                marker.on('click', () => {
                    const card = document.getElementById(`punto-card-${index}`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.style.borderColor = 'var(--primary)';
                        card.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.3)';
                        setTimeout(() => {
                            card.style.borderColor = 'var(--border-color)';
                            card.style.boxShadow = 'none';
                        }, 2000);
                    }
                });

                layerPuntosEncuentro.addLayer(marker);
                marcadores.push(marker);
            }
        });

        if (mapaInstancia && marcadores.length > 0) {
            const grupo = L.featureGroup(marcadores);
            mapaInstancia.fitBounds(grupo.getBounds().pad(0.1));
        }

    } catch (err) {
        console.error('Error al procesar los puntos de encuentro:', err.message);
        if (contenedorLista) contenedorLista.innerHTML = '<p class="text-danger">Error al cargar los puntos de encuentro.</p>';
    } finally {
        if (btnPuntos) btnPuntos.innerHTML = '<i class="fa-solid fa-map-pin"></i> Cargar Puntos';
    }
}

// Función global para centrar el mapa desde el botón de la tarjeta
window.centrarMapaEnPunto = function(lat, lng, index) {
    const mapaInstancia = obtenerMapa();
    if (mapaInstancia) {
        mapaInstancia.flyTo([lat, lng], 16, { duration: 1.5 });
        
        // Buscar el marcador en la capa y abrir su popup
        if (layerPuntosEncuentro) {
            layerPuntosEncuentro.eachLayer(layer => {
                if (layer.getLatLng && layer.getLatLng().lat === lat && layer.getLatLng().lng === lng) {
                    setTimeout(() => layer.openPopup(), 1600); // Abrir después de que termine la animación
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnPuntos = document.getElementById('btn-puntos');
    if (btnPuntos) {
        btnPuntos.addEventListener('click', cargarPuntosEncuentro);
    }
});