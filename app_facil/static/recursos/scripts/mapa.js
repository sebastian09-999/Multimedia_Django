// ==========================================
// 1. INICIALIZACIÓN DEL MAPA BASE
// ==========================================
const mapa = L.map('mapa').setView([2.4419, -76.6063], 13);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
}).addTo(mapa);

// Capas para controlar elementos independientes
const layerGroupRuta = L.layerGroup().addTo(mapa);
let layerRutaManual = null;

// ==========================================
// 2. RUTA GEOJSON ESTÁTICA
// ==========================================
async function cargarRutaGeoJSON() {
    try {
        layerGroupRuta.clearLayers();

        const response = await fetch(URL_GEO);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const geojsonData = await response.json();

        const capaGeoJSON = L.geoJSON(geojsonData, {
            style: function () {
                return {
                    color: '#0284c7',
                    weight: 4,
                    opacity: 0.85,
                    dashArray: '5, 10'
                };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.nombre) {
                    layer.bindPopup(`
                        <div style="font-family: sans-serif;">
                            <h4 style="margin:0 0 5px 0; color:#0284c7;">${feature.properties.nombre}</h4>
                            <p style="margin:0; font-size:12px;">${feature.properties.descripcion || 'Ruta turística y de evacuación'}</p>
                        </div>
                    `);
                }
            }
        }).addTo(layerGroupRuta);

        mapa.fitBounds(capaGeoJSON.getBounds());

    } catch (error) {
        console.error('Error cargando el archivo GeoJSON:', error);
    }
}

// ==========================================
// 3. RUTA VIAL POR CARRETERA (OSRM + SISMOS)
// ==========================================
async function trazarRutaManual() {
    const latInicio = parseFloat(document.getElementById('lat-inicio').value);
    const lngInicio = parseFloat(document.getElementById('lng-inicio').value);
    const latDestino = parseFloat(document.getElementById('lat-destino').value);
    const lngDestino = parseFloat(document.getElementById('lng-destino').value);

    if (isNaN(latInicio) || isNaN(lngInicio) || isNaN(latDestino) || isNaN(lngDestino)) {
        alert('Por favor, ingresa coordenadas válidas en todos los campos.');
        return;
    }

    if (!layerRutaManual) {
        layerRutaManual = L.layerGroup().addTo(mapa);
    } else {
        layerRutaManual.clearLayers();
    }

    // Marcadores de origen y destino
    L.marker([latInicio, lngInicio]).bindPopup('<b>Punto de Inicio</b>').addTo(layerRutaManual);
    L.marker([latDestino, lngDestino]).bindPopup('<b>Punto de Destino</b>').addTo(layerRutaManual);

    // Consulta OSRM (formato Longitud, Latitud)
    const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${lngInicio},${latInicio};${lngDestino},${latDestino}?overview=full&geometries=geojson`;

    try {
        const resRuta = await fetch(urlOSRM);
        const dataRuta = await resRuta.json();

        if (!dataRuta.routes || dataRuta.routes.length === 0) {
            alert('No se pudo encontrar una ruta por carretera entre estos puntos.');
            return;
        }

        const rutaGeoJSON = dataRuta.routes[0].geometry;
        const distanciaTotalKm = (dataRuta.routes[0].distance / 1000).toFixed(2);
        const duracionMin = (dataRuta.routes[0].duration / 60).toFixed(0);

        // Trazar la vía en el mapa
        const capaRuta = L.geoJSON(rutaGeoJSON, {
            style: {
                color: '#2563eb',
                weight: 5,
                opacity: 0.85
            }
        }).bindPopup(`<b>Ruta Vial Real</b><br>Distancia: ${distanciaTotalKm} km<br>Tiempo aprox: ${duracionMin} min`)
          .addTo(layerRutaManual);

        mapa.fitBounds(capaRuta.getBounds().pad(0.2));

        // Evaluar sismos en un radio de 50 km alrededor de la carretera
        const pautasCoordenadas = rutaGeoJSON.coordinates;
        const RADIO_ALERTA_KM = 50;

        const resSismos = await fetch(URL_API_SISMOS);
        const dataSismos = await resSismos.json();
        let contadorSismos = 0;

        dataSismos.features.forEach(feature => {
            const [lngSismo, latSismo] = feature.geometry.coordinates;
            const pSismo = L.latLng(latSismo, lngSismo);

            let distMinimaKm = Infinity;
            pautasCoordenadas.forEach(([lngVia, latVia]) => {
                const dist = pSismo.distanceTo(L.latLng(latVia, lngVia)) / 1000;
                if (dist < distMinimaKm) distMinimaKm = dist;
            });

            if (distMinimaKm <= RADIO_ALERTA_KM) {
                contadorSismos++;
                const mag = feature.properties.mag || 0;

                L.circleMarker([latSismo, lngSismo], {
                    radius: Math.max(mag * 3, 6),
                    fillColor: '#ef4444',
                    color: '#7f1d1d',
                    weight: 2,
                    fillOpacity: 0.8
                })
                .bindPopup(`
                    <div style="font-family: sans-serif;">
                        <h4 style="margin:0; color:#dc2626;">⚠️ Sismo cerca de la carretera</h4>
                        <p style="margin:3px 0; font-size:12px;"><strong>Magnitud:</strong> ${mag}</p>
                        <p style="margin:3px 0; font-size:12px;"><strong>Lugar:</strong> ${feature.properties.place}</p>
                        <p style="margin:3px 0; font-size:12px;"><strong>Distancia a la vía:</strong> ~${distMinimaKm.toFixed(1)} km</p>
                    </div>
                `)
                .addTo(layerRutaManual);
            }
        });

        alert(`Ruta trazada por vía (${distanciaTotalKm} km, ~${duracionMin} min).\nSe encontraron ${contadorSismos} sismos registrados a menos de ${RADIO_ALERTA_KM} km de la vía.`);

    } catch (err) {
        console.error('Error al calcular la ruta por carretera o consultar sismos:', err);
    }
}

// ==========================================
// 4. EVENTOS Y EXPORTACIÓN GLOBAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Escucha del botón de ruta GeoJSON predefinida
    const btnRuta = document.getElementById('btn-ruta');
    if (btnRuta) btnRuta.addEventListener('click', cargarRutaGeoJSON);

    // Escucha del botón para trazar ruta manual por coordenadas
    const btnTrazarManual = document.getElementById('btn-trazar-manual');
    if (btnTrazarManual) btnTrazarManual.addEventListener('click', trazarRutaManual);
});

// Ajuste del renderizado tras carga inicial
setTimeout(() => {
    mapa.invalidateSize();
}, 200);

// Exportar referencia para otros scripts (como puntos_encuentro.js y sismos_api.js)
window.mapaApp = { mapa, layerGroupRuta };