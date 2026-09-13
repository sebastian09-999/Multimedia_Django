// Inicialización del mapa centrado en Popayán, Cauca
const map = L.map('map', {
    center: [2.4419, -76.6063],
    zoom: 14,
    zoomControl: true
});

const basemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
}).addTo(map);

// Capa de control para capas vectoriales
const layerGroupRuta = L.layerGroup().addTo(map);

// Carga y renderizado del archivo GeoJSON de la ruta
async function cargarRutaGeoJSON() {
    try {
        const response = await fetch('/static/recursos/datos/geo/ruta.geojson');
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const geojsonData = await response.json();

        L.geoJSON(geojsonData, {
            style: function (feature) {
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
    } catch (error) {
        console.error('Error cargando el archivo GeoJSON:', error);
    }
}

document.addEventListener('DOMContentLoaded', cargarRutaGeoJSON);
window.mapaApp = { map, layerGroupRuta };

map.invalidateSize(); // Ajuste del tamaño del mapa al contenedor
