async function cargarTablaExtintores() {
    const contenedorTabla = document.getElementById('contenedor-tabla-extintores');
    const inputFiltro = document.getElementById('filtro-extintores');

    try {
        const res = await fetch('/static/recursos/datos/tablas/extintores.csv');
        if (!res.ok) throw new Error('No se pudo descargar el archivo CSV');
        const textoCSV = await res.text();

        // Parseo de CSV
        const filas = textoCSV.trim().split('\n').map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
        if (filas.length === 0) return;

        const encabezados = filas[0];
        const datos = filas.slice(1);

        function renderizarTabla(filasFiltradas) {
            let html = '<table style="width:100%; border-collapse:collapse; font-size:12px; color:#e2e8f0;">';
            
            // Header
            html += '<thead style="background:#1e293b; color:#38bdf8;"><tr>';
            encabezados.forEach(h => html += `<th style="padding:8px; border:1px solid #334155; text-align:left;">${h}</th>`);
            html += '</tr></thead><tbody>';

            // Filas
            filasFiltradas.forEach(row => {
                html += '<tr style="border-bottom:1px solid #334155;">';
                row.forEach((cell, idx) => {
                    let style = 'padding:6px; border:1px solid #334155;';
                    if (encabezados[idx] === 'estado_general') {
                        if (cell.includes('Operativo')) style += ' color:#4ade80; font-weight:bold;';
                        else if (cell.includes('Vencido')) style += ' color:#f87171; font-weight:bold;';
                    }
                    html += `<td style="${style}">${cell}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
            if (contenedorTabla) contenedorTabla.innerHTML = html;
        }

        renderizarTabla(datos);

        // Evento del buscador
        if (inputFiltro) {
            inputFiltro.addEventListener('input', (e) => {
                const busqueda = e.target.value.toLowerCase();
                const filtrados = datos.filter(fila => 
                    fila.some(celda => celda.toLowerCase().includes(busqueda))
                );
                renderizarTabla(filtrados);
            });
        }
    } catch (err) {
        console.error('Error renderizando el archivo CSV:', err);
    }
}

document.addEventListener('DOMContentLoaded', cargarTablaExtintores);