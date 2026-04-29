$(document).ready(function () {
    protegerPagina();
    cargarTop3();
});

async function cargarTop3() {
    try {
        const datos = await getTop10();
        const jugadores = Array.isArray(datos?.data)
            ? datos.data.map((j) => ({
                usuario: j?.usuario || j?.nombre || 'Jugador',
                puntuacion: Number(j?.puntuacion ?? j?.score ?? 0),
                nivel_dificultad: j?.nivel_dificultad || j?.dificultad || 'normal',
                urlavatar: j?.urlavatar || j?.avatarUrl || ''
            }))
            : [];
        const contenedor = document.getElementById('top3');
        contenedor.innerHTML = '';

        if (jugadores.length === 0) {
            contenedor.innerHTML = '<p class="cargando">Aún no hay puntuaciones registradas.</p>';
            return;
        }

        const clasePos  = ['pos-1', 'pos-2', 'pos-3'];
        const numPos    = ['1', '2', '3'];
        const top3      = jugadores.slice(0, 3);

        top3.forEach((j, i) => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-jugador';

            const avatarHTML = j.urlavatar
                ? `<img class="avatar" src="${j.urlavatar}" alt="Avatar">`
                : `<div style="font-size:2.5rem;"></div>`;

            tarjeta.innerHTML = `
                <div class="posicion ${clasePos[i]}">${numPos[i]}º</div>
                ${avatarHTML}
                <h3>${j.usuario}</h3>
                <div class="puntuacion">${j.puntuacion} pts</div>
                <div class="nivel">${j.nivel_dificultad || 'normal'}</div>
            `;

            $(tarjeta).hide();
            contenedor.appendChild(tarjeta);
            $(tarjeta).fadeIn(400 + i * 200);
        });

    } catch (err) {
        console.error(err);
        mostrarAlerta('No se pudo conectar con el servidor.', 'error');
    }
}
