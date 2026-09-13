async function obtenerSismosRecientes() {
    const apiURL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' + 
                   new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] +
                   '&minlatitude=-4.5&maxlatitude=13.5&minlongitude=-79.0&maxlongitude=-66.0&minmagnitude=2.5';

    const contenedorSismos = document.getElementById('panel-sismos');

    try {
        const response = await fetch(apiURL);
        const data = await response.json();
        const sismos = data.features;

        if (contenedorSismos) contenedorSismos.innerHTML = '';

        if (sismos.length === 0 && contenedorSismos) {
            contenedorSismos.innerHTML = '<p style="color:#94a3b8;">No hay sismos significativos reportados en la última semana.</p>';
            return;
        }

        sismos.slice(0, 5).forEach(sismo => {
            const props = sismo.properties;
            const coords = sismo.geometry.coordinates; // [lng, lat, depth]
            const fecha = new Date(props.time).toLocaleString('es-CO');

            if (window.mapaApp && window.mapaApp.map) {
                L.circleMarker([coords[1], coords[0]], {
                    radius: props.mag * 3,
                    fillColor: props.mag >= 4.5 ? '#ef4444' : '#f59e0b',
                    color: '#fff',
                    weight: 1,
                    fillOpacity: 0.7
                }).bindPopup(`
                    <b>Alerta Sísmica</b><br>
                    Magnitud: ${props.mag} M<br>
                    Lugar: ${props.place}<br>
                    Fecha: ${fecha}<br>
                    Profundidad: ${coords[2]} km
                `).addTo(window.mapaApp.map);
            }

            if (contenedorSismos) {
                const elem = document.createElement('div');
                elem.style.cssText = 'padding:8px; border-bottom:1px solid #334155; font-size:13px; color:#e2e8f0;';
                elem.innerHTML = `
                    <strong style="color:${props.mag >= 4.5 ? '#ef4444' : '#f59e0b'};">M ${props.mag}</strong> - ${props.place}<br>
                    <span style="font-size:11px; color:#94a3b8;">${fecha} | Prof: ${coords[2]}km</span>
                `;
                contenedorSismos.appendChild(elem);
            }
        });
    } catch (error) {
        console.error('Error obteniendo datos de sismos:', error);
    }
}

document.addEventListener('DOMContentLoaded', obtenerSismosRecientes);