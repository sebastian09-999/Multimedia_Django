// ==========================================
// 1. INICIALIZACIÓN DEL MAPA BASE
// ==========================================
const mapa = L.map('mapa', { zoomControl: false }).setView([2.4419, -76.6063], 13);
L.control.zoom({ position: 'bottomright' }).addTo(mapa);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
}).addTo(mapa);

const layerGroupRuta = L.layerGroup().addTo(mapa);
let layerRutaManual = null;
let layerBufferSismos = null;

// ==========================================
// 2. FUNCIÓN: CARGAR RUTA GEOJSON ESTÁTICA
// ==========================================
async function cargarRutaGeoJSON(urlArchivo = URL_GEO, nombreRuta = 'Ruta GeoJSON') {
    try {
        layerGroupRuta.clearLayers();
        if (layerBufferSismos) layerBufferSismos.clearLayers();
        if (layerRutaManual) layerRutaManual.clearLayers();

        const response = await fetch(urlArchivo);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const geojsonData = await response.json();

        const capaGeoJSON = L.geoJSON(geojsonData, {
            style: () => ({
                color: '#38bdf8', // Azul claro
                weight: 5,
                opacity: 0.9,
                dashArray: '10, 6'
            }),
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nombre) {
                    layer.bindPopup(`
                        <div style="font-family: 'Outfit', sans-serif;">
                            <h4 style="margin:0 0 5px 0; color:#38bdf8;">${feature.properties.nombre}</h4>
                            <p style="margin:0; font-size:12px;">${feature.properties.descripcion || 'Ruta de evacuación'}</p>
                        </div>
                    `);
                }
            }
        }).addTo(layerGroupRuta);

        mapa.fitBounds(capaGeoJSON.getBounds().pad(0.1));
        mapa.invalidateSize(); // Asegura que el mapa se redibuje

    } catch (error) {
        console.error('Error cargando el archivo GeoJSON:', error);
        alert(`No se pudo cargar la ruta: ${nombreRuta}. Verifica que el archivo exista.`);
    }
}

// ==========================================
// 3. FUNCIÓN MAESTRA: TRAZAR RUTA POR CARRETERA (OSRM)
// ==========================================
async function trazarRutaOSRM(puntos, nombreRuta = 'Ruta') {
    if (!puntos || puntos.length < 2) {
        alert('Se necesitan al menos 2 puntos para trazar una ruta.');
        return;
    }

    const btnTrazar = document.getElementById('btn-trazar-manual');
    const textoOriginal = btnTrazar ? btnTrazar.innerHTML : '';
    if (btnTrazar) {
        btnTrazar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculando...';
        btnTrazar.disabled = true;
    }

    if (!layerRutaManual) layerRutaManual = L.layerGroup().addTo(mapa);
    else layerRutaManual.clearLayers();
    
    if (!layerBufferSismos) layerBufferSismos = L.layerGroup().addTo(mapa);
    else layerBufferSismos.clearLayers();

    L.marker([puntos[0][1], puntos[0][0]]).bindPopup(`<b>Inicio: ${nombreRuta}</b>`).addTo(layerRutaManual);
    L.marker([puntos[puntos.length - 1][1], puntos[puntos.length - 1][0]]).bindPopup(`<b>Destino: ${nombreRuta}</b>`).addTo(layerRutaManual);

    const coordenadasOSRM = puntos.map(p => `${p[0]},${p[1]}`).join(';');
    const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${coordenadasOSRM}?overview=full&geometries=geojson`;

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

        const colorRuta = nombreRuta.includes('Manual') ? '#6366f1' : '#f59e0b';
        
        const capaRuta = L.geoJSON(rutaGeoJSON, {
            style: { color: colorRuta, weight: 6, opacity: 0.85 }
        }).bindPopup(`<b>${nombreRuta}</b><br>Distancia: ${distanciaTotalKm} km<br>Tiempo: ${duracionMin} min`)
          .addTo(layerRutaManual);

        mapa.fitBounds(capaRuta.getBounds().pad(0.2));

        // Buffer visual de 50km
        const RADIO_ALERTA_KM = 50;
        const pautasCoordenadas = rutaGeoJSON.coordinates;
        pautasCoordenadas.forEach((coord, i) => {
            if (i % 20 === 0) {
                L.circle([coord[1], coord[0]], {
                    radius: RADIO_ALERTA_KM * 1000,
                    color: '#ef4444', fillColor: '#ef4444',
                    fillOpacity: 0.05, weight: 1, opacity: 0.2, interactive: false
                }).addTo(layerBufferSismos);
            }
        });

        // Sismos
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
                    radius: Math.max(mag * 3, 6), fillColor: '#ef4444', color: '#7f1d1d', weight: 2, fillOpacity: 0.9
                }).bindPopup(`<b>⚠️ Sismo cerca de la ruta</b><br>Mag: ${mag}<br>Dist: ~${distMinimaKm.toFixed(1)} km`).addTo(layerRutaManual);
            }
        });

        alert(`✅ Ruta "${nombreRuta}" trazada (${distanciaTotalKm} km, ~${duracionMin} min).\n⚠️ ${contadorSismos} sismos a menos de ${RADIO_ALERTA_KM} km.`);

    } catch (err) {
        console.error('Error al calcular la ruta:', err);
        alert('Ocurrió un error al calcular la ruta por carretera.');
    } finally {
        if (btnTrazar) {
            btnTrazar.innerHTML = textoOriginal;
            btnTrazar.disabled = false;
        }
    }
}

// ==========================================
// 4. EVENTOS E INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar rutas predefinidas en el select
    const selectRutas = document.getElementById('select-ruta-predefinida');
    if (selectRutas) {
        try {
            const res = await fetch(URL_RUTAS_PREDEFINIDAS);
            const rutas = await res.json();
            selectRutas.innerHTML = '<option value="">-- Seleccione una ruta --</option>';
            rutas.forEach(ruta => {
                const option = document.createElement('option');
                option.value = ruta.id;
                option.textContent = ruta.nombre;
                option.dataset.puntos = JSON.stringify(ruta.puntos);
                selectRutas.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando rutas predefinidas:', error);
            selectRutas.innerHTML = '<option value="">Error al cargar rutas</option>';
        }
    }

    // Botón: Cargar Ruta Predefinida
    const btnCargarPredefinida = document.getElementById('btn-cargar-ruta-predefinida');
    if (btnCargarPredefinida) {
        btnCargarPredefinida.addEventListener('click', () => {
            const select = document.getElementById('select-ruta-predefinida');
            const opcion = select.options[select.selectedIndex];
            if (!select.value) return alert('Seleccione una ruta.');
            trazarRutaOSRM(JSON.parse(opcion.dataset.puntos), opcion.textContent);
        });
    }

    // Botón: Mostrar Ruta GeoJSON (El que te daba error)
    const btnRuta = document.getElementById('btn-ruta');
    if (btnRuta) {
        btnRuta.addEventListener('click', () => {
            cargarRutaGeoJSON(URL_GEO, 'Ruta GeoJSON Estática');
        });
    }

    // Botón: Trazar Ruta Manual
    const btnTrazarManual = document.getElementById('btn-trazar-manual');
    if (btnTrazarManual) {
        btnTrazarManual.addEventListener('click', () => {
            const latI = parseFloat(document.getElementById('lat-inicio').value);
            const lngI = parseFloat(document.getElementById('lng-inicio').value);
            const latD = parseFloat(document.getElementById('lat-destino').value);
            const lngD = parseFloat(document.getElementById('lng-destino').value);

            if (isNaN(latI) || isNaN(lngI) || isNaN(latD) || isNaN(lngD)) {
                return alert('Por favor, ingresa coordenadas válidas.');
            }
            trazarRutaOSRM([[lngI, latI], [lngD, latD]], 'Ruta Manual');
        });
    }

    // Geolocalización
    const btnUbicacion = document.getElementById('btn-usar-mi-ubicacion');
    if (btnUbicacion) {
        btnUbicacion.addEventListener('click', () => {
            if (!navigator.geolocation) return alert('Geolocalización no soportada.');
            btnUbicacion.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    document.getElementById('lat-inicio').value = pos.coords.latitude.toFixed(6);
                    document.getElementById('lng-inicio').value = pos.coords.longitude.toFixed(6);
                    mapa.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.5 });
                    btnUbicacion.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Mi ubicación';
                },
                () => {
                    alert('Error al obtener ubicación.');
                    btnUbicacion.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Mi ubicación';
                }
            );
        });
    }
});

// Ajuste del renderizado tras carga inicial
setTimeout(() => { mapa.invalidateSize(); }, 500);
window.addEventListener('resize', () => { mapa.invalidateSize(); });

window.mapaApp = { mapa, layerGroupRuta };