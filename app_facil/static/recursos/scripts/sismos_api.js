let layerSismos = null;

// Obtener la instancia global del mapa
function obtenerMapa() {
    return window.mapaApp ? window.mapaApp.mapa : (typeof mapa !== 'undefined' ? mapa : null);
}

// Determinar el color según la magnitud
function obtenerColorMagnitud(mag) {
    if (mag >= 5.0) return '#ef4444'; // Rojo (Fuerte)
    if (mag >= 3.5) return '#f59e0b'; // Naranja (Moderado)
    return '#10b981';                // Verde (Leve)
}

// Determinar la clase CSS según la magnitud
function obtenerClaseMagnitud(mag) {
    if (mag >= 5.0) return 'alta';
    if (mag >= 3.5) return 'media';
    return 'baja';
}

async function cargarSismosAPI() {
    const mapaInstancia = obtenerMapa();
    const panelSismos = document.getElementById('panel-sismos');
    const statSismos = document.getElementById('stat-sismos');

    // Crear o limpiar el grupo de capas
    if (mapaInstancia) {
        if (!layerSismos) {
            layerSismos = L.layerGroup().addTo(mapaInstancia);
        } else {
            layerSismos.clearLayers();
        }
    }

    try {
        const response = await fetch(URL_API_SISMOS);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        const sismos = data.features;

        // Actualizar estadística superior
        if (statSismos) statSismos.textContent = sismos.length;

        // Limpiar panel HTML
        if (panelSismos) panelSismos.innerHTML = '';

        if (sismos.length === 0) {
            if (panelSismos) panelSismos.innerHTML = '<p class="info-texto">No hay sismos recientes registrados.</p>';
            return;
        }

        // Ordenar sismos por magnitud (de mayor a menor) para el panel
        sismos.sort((a, b) => b.properties.mag - a.properties.mag);

        sismos.forEach((feature, index) => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates; // [lng, lat, depth]
            const mag = props.mag || 0;
            const fecha = new Date(props.time).toLocaleString('es-CO', { 
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            });

            // 1. Crear marcador en el mapa
            if (mapaInstancia && layerSismos) {
                const marker = L.circleMarker([coords[1], coords[0]], {
                    radius: Math.max(mag * 2.5, 5),
                    fillColor: obtenerColorMagnitud(mag),
                    color: '#0f172a',
                    weight: 2,
                    opacity: 0.9,
                    fillOpacity: 0.8
                });

                marker.bindPopup(`
                    <div style="font-family: 'Outfit', sans-serif; min-width: 180px;">
                        <h4 style="margin:0 0 5px 0; color:${obtenerColorMagnitud(mag)}; font-size: 1.2rem;">
                            Magnitud ${mag}
                        </h4>
                        <p style="margin:0 0 3px 0; font-size:13px;"><strong>Lugar:</strong> ${props.place}</p>
                        <p style="margin:0 0 3px 0; font-size:13px;"><strong>Profundidad:</strong> ${coords[2]} km</p>
                        <p style="margin:0; font-size:12px; color:#64748b;"><i class="fa-regular fa-clock"></i> ${fecha}</p>
                    </div>
                `);

                layerSismos.addLayer(marker);

                // 2. Crear tarjeta en el panel HTML (solo mostramos las 6 más fuertes para no saturar)
                if (panelSismos && index < 6) {
                    const card = document.createElement('div');
                    card.className = 'sismo-card';
                    card.style.cursor = 'pointer';
                    card.innerHTML = `
                        <div class="sismo-magnitud ${obtenerClaseMagnitud(mag)}">
                            <i class="fa-solid fa-house-crack"></i> M ${mag}
                        </div>
                        <div class="sismo-lugar">${props.place}</div>
                        <div class="sismo-fecha"><i class="fa-regular fa-clock"></i> ${fecha} | Prof: ${coords[2]} km</div>
                    `;
                    
                    // Interacción: Clic en la tarjeta -> Volar al mapa
                    card.addEventListener('click', () => {
                        mapaInstancia.flyTo([coords[1], coords[0]], 10, { duration: 1.5 });
                        marker.openPopup();
                    });

                    panelSismos.appendChild(card);
                }
            }
        });

    } catch (error) {
        console.error('Error al cargar la API de sismos:', error);
        if (panelSismos) panelSismos.innerHTML = '<p class="info-texto text-danger">Error al cargar datos sísmicos.</p>';
    }
}

// Cargar los sismos automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarSismosAPI);