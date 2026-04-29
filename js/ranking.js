let todasLasPuntuaciones = [];
let ordenarScoreDesc = true;

$(document).ready(function () {

    protegerPagina();
    cargarRanking();

    $('#btnFiltrar').click(aplicarFiltros);
    $('#filtroJugador').on('input', aplicarFiltros);

    $('#btnOrdenarScore').click(function () {
        ordenarScoreDesc = !ordenarScoreDesc;
        $(this).text(ordenarScoreDesc ? 'Score ↓' : 'Score ↑');
        aplicarFiltros();
    });

    $('#btnReset').click(async function () {
        $('#filtroJugador').val('');
        ordenarScoreDesc = true;
        $('#btnOrdenarScore').text('Score ↓');
        await cargarRankingCompleto();
    });

});

async function cargarRanking() {
    try {
        const datos = await getTop10();
        const listaApi = Array.isArray(datos?.data) ? datos.data : [];

        todasLasPuntuaciones = listaApi.map(item => ({
            usuario: item?.usuario || item?.nombre || 'Anónimo',
            puntuacion: Number(item?.puntuacion ?? item?.score ?? 0),
            nivel_dificultad: item?.nivel_dificultad || item?.dificultad || 'normal',
            pais: item?.pais || 'No indicado'
        }));

        renderizarTabla(todasLasPuntuaciones);
    } catch (err) {
        console.error(err);
        mostrarAlerta(err.message || 'Error al cargar el ranking.', 'error');
    }
}

async function cargarRankingCompleto() {
    try {
        const datos = await getRankingCompleto();
        const listaApi = Array.isArray(datos?.data) ? datos.data : [];

        todasLasPuntuaciones = listaApi.map(item => ({
            usuario: item?.usuario || item?.nombre || 'Anónimo',
            puntuacion: Number(item?.puntuacion ?? item?.score ?? 0),
            nivel_dificultad: item?.nivel_dificultad || item?.dificultad || 'normal',
            pais: item?.pais || 'No indicado'
        }));

        renderizarTabla(todasLasPuntuaciones);
    } catch (err) {
        console.error(err);
        mostrarAlerta(err.message || 'Error al cargar todas las partidas.', 'error');
    }
}

function aplicarFiltros() {
    const jugador = $('#filtroJugador').val().toLowerCase().trim();

    let filtrados = [...todasLasPuntuaciones];

    if (jugador) {
        filtrados = filtrados.filter(p =>
            (p.usuario || '').toLowerCase().includes(jugador)
        );
    }

    filtrados.sort((a, b) => {
        const pa = Number(a.puntuacion) || 0;
        const pb = Number(b.puntuacion) || 0;
        return ordenarScoreDesc ? pb - pa : pa - pb;
    });

    renderizarTabla(filtrados);
}

function renderizarTabla(puntuaciones) {
    const contenedor = document.getElementById('contenedorTabla');

    if (!puntuaciones || puntuaciones.length === 0) {
        contenedor.innerHTML = '<p class="cargando">Sin resultados para esos filtros.</p>';
        return;
    }

    const medallaPos = (i) => `${i + 1}`;

    let html = `
        <table class="tabla-ranking">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Jugador</th>
                    <th>País</th>
                    <th>Puntuación</th>
                    <th>Nivel</th>
                </tr>
            </thead>
            <tbody>
    `;

    puntuaciones.forEach((p, i) => {
        html += `
            <tr>
                <td>${medallaPos(i)}</td>
                <td>${p.usuario}</td>
                <td>${p.pais || 'No indicado'}</td>
                <td class="pts">${p.puntuacion} pts</td>
                <td style="color:var(--text-muted); text-transform:uppercase; font-size:0.82rem; letter-spacing:1px;">
                    ${p.nivel_dificultad || 'normal'}
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';

    $(contenedor).fadeOut(150, function () {
        contenedor.innerHTML = html;
        $(contenedor).fadeIn(300);
    });
}
