$(document).ready(function () {
    protegerPagina();
    cargarTop3();
});

async function cargarTop3() {
    try {
        const datos = await getTop10();
        const lista = datos && Array.isArray(datos.data) ? datos.data : [];
        const contenedor = document.getElementById('top3');

        contenedor.innerHTML = '';

        if (lista.length === 0) {
            contenedor.innerHTML = '<p class="cargando">Aún no hay puntuaciones registradas.</p>';
            return;
        }

        const clasePos = ['pos-1', 'pos-2', 'pos-3'];
        const numPos = ['1', '2', '3'];
        const top3 = lista.slice(0, 3);

        top3.forEach(function (j, i) {
            const tarjeta  = document.createElement('div');
            tarjeta.className = 'tarjeta-jugador';

            const nombre = j.usuario || j.nombre || 'Jugador';
            const puntuacion = Number(j.puntuacion || j.score || 0);
            const nivel = j.nivel_dificultad || j.dificultad || 'normal';
            const avatar = j.urlavatar || j.avatarUrl || '';

            const avatarHTML = avatar
                ? '<img class="avatar" src="' + avatar + '" alt="Avatar">'
                : '<div style="font-size:2.5rem;"></div>';

            tarjeta.innerHTML = '<div class="posicion ' + clasePos[i] + '">' + numPos[i] + 'º</div>';
            tarjeta.innerHTML += avatarHTML;
            tarjeta.innerHTML += '<h3>' + nombre + '</h3>';
            tarjeta.innerHTML += '<div class="puntuacion">' + puntuacion + ' pts</div>';
            tarjeta.innerHTML += '<div class="nivel">' + nivel + '</div>';

            $(tarjeta).hide();
            contenedor.appendChild(tarjeta);
            $(tarjeta).fadeIn(400 + i * 200);
        });

    } catch (err) {
        console.error(err);
        mostrarAlerta('No se pudo conectar con el servidor.', 'error');
    }
}