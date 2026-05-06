let todasLasPuntuaciones = [];
let ordenarScoreDesc     = true;

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

    $('#btnRecords').click(async function() {
    try {
        const datos = await getRecords();
        const lista = datos && Array.isArray(datos.data) ? datos.data : [];

        todasLasPuntuaciones = lista.map(function(item) {
            return {
                usuario: item.nombre || 'Anónimo',
                puntuacion: item.mejorScore || 0,
                nivel_dificultad: item.mejorDificultad || 'normal',
                pais: item.pais || 'No indicado'
            };
        });

        renderizarTabla(todasLasPuntuaciones);
        mostrarAlerta('Mostrando el mejor score de cada jugador.', 'info');
    } catch(err) {
        mostrarAlerta('Error al cargar los récords.', 'error');
    }
});

});

async function cargarRanking() {
    try {
        const datos    = await getTop10();
        const listaApi = datos && Array.isArray(datos.data) ? datos.data : [];

        todasLasPuntuaciones = listaApi.map(function (item) {
            return {
                usuario: (item && item.usuario) || (item && item.nombre) || 'Anónimo',
                puntuacion: Number((item && item.puntuacion) || (item && item.score) || 0),
                nivel_dificultad: (item && item.nivel_dificultad) || (item && item.dificultad) || 'normal',
                pais: (item && item.pais) || 'No indicado'
            };
        });

        renderizarTabla(todasLasPuntuaciones);

    } catch (err) {
        console.error(err);
        mostrarAlerta(err.message || 'Error al cargar el ranking.', 'error');
    }
}

async function cargarRankingCompleto() {
    try {
        const datos    = await getRankingCompleto();
        const listaApi = datos && Array.isArray(datos.data) ? datos.data : [];

        todasLasPuntuaciones = listaApi.map(function (item) {
            return {
                usuario: (item && item.usuario) || (item && item.nombre) || 'Anónimo',
                puntuacion: Number((item && item.puntuacion) || (item && item.score) || 0),
                nivel_dificultad: (item && item.nivel_dificultad) || (item && item.dificultad) || 'normal',
                pais: (item && item.pais) || 'No indicado'
            };
        });

        renderizarTabla(todasLasPuntuaciones);

    } catch (err) {
        console.error(err);
        mostrarAlerta(err.message || 'Error al cargar todas las partidas.', 'error');
    }
}

function aplicarFiltros() {
    const jugador = $('#filtroJugador').val().toLowerCase().trim();
    let filtrados = todasLasPuntuaciones.slice();

    if (jugador) {
        filtrados = filtrados.filter(function (p) {
            return (p.usuario || '').toLowerCase().includes(jugador);
        });
    }

    filtrados.sort(function (a, b) {
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

    let filas = '';

    puntuaciones.forEach(function (p, i) {
        filas += '<tr>';
        filas += '<td>' + (i + 1) + '</td>';
        filas += '<td>' + p.usuario + '</td>';
        filas += '<td>' + (p.pais || 'No indicado') + '</td>';
        filas += '<td class="pts">' + p.puntuacion + ' pts</td>';
        filas += '<td class="col-nivel">' + (p.nivel_dificultad || 'normal') + '</td>';
        filas += '</tr>';
    });

    const html = '<table class="tabla-ranking">'
        + '<thead><tr><th>#</th><th>Jugador</th><th>País</th><th>Puntuación</th><th>Nivel</th></tr></thead>'
        + '<tbody>' + filas + '</tbody>'
        + '</table>';

    $(contenedor).fadeOut(150, function () {
        contenedor.innerHTML = html;
        $(contenedor).fadeIn(300);
    });
}