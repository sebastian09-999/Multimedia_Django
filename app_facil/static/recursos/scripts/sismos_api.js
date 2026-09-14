let layerSismos = null;

// Obtener la instancia global del mapa
function obtenerMapa() {
    return window.mapaApp ? window.mapaApp.mapa : (typeof mapa !== 'undefined' ? mapa : null);
}

// Determinar el color del círculo según la magnitud
function obtenerColorMagnitud(mag) {
    if (mag >= 5.0) return '#ef4444'; // Rojo (Sismo fuerte)
    if (mag >= 3.5) return '#f97316'; // Naranja (Sismo moderado)
    return '#eab308';                // Amarillo (Sismo leve)
}

async function cargarSismosAPI() {
    const mapaInstancia = obtenerMapa();
    if (!mapaInstancia) {
        console.warn('El mapa aún no está listo para renderizar los sismos.');
        return;
    }

    // Crear o limpiar el grupo de capas para los sismos
    if (!layerSismos) {
        layerSismos = L.layerGroup().addTo(mapaInstancia);
    } else {
        layerSismos.clearLayers();
    }

    try {
        const response = await fetch(URL_API_SISMOS);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();

        L.geoJSON(data, {
            // Transformar cada punto en un marcador circular dinámico
            pointToLayer: function (feature, latlng) {
                const mag = feature.properties.mag || 1;
                return L.circleMarker(latlng, {
                    radius: Math.max(mag * 2.5, 4), // Tamaño según la magnitud
                    fillColor: obtenerColorMagnitud(mag),
                    color: '#1e293b',
                    weight: 1,
                    opacity: 0.9,
                    fillOpacity: 0.75
                });
            },
            // Contenido emergente al hacer clic en un sismo
            onEachFeature: function (feature, layer) {
                const props = feature.properties;
                const fecha = new Date(props.time).toLocaleString('es-CO');
                const profundidad = feature.geometry.coordinates[2];

                layer.bindPopup(`
                    <div style="font-family: sans-serif; min-width: 160px;">
                        <h4 style="margin:0 0 5px 0; color:#dc2626;">Magnitud: ${props.mag}</h4>
                        <p style="margin:0 0 3px 0; font-size:12px;"><strong>Ubicación:</strong> ${props.place}</p>
                        <p style="margin:0 0 3px 0; font-size:12px;"><strong>Fecha:</strong> ${fecha}</p>
                        <p style="margin:0; font-size:12px;"><strong>Profundidad:</strong> ${profundidad} km</p>
                    </div>
                `);
            }
        }).addTo(layerSismos);

    } catch (error) {
        console.error('Error al cargar la API de sismos:', error);
    }
}

// Cargar los sismos automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarSismosAPI); 