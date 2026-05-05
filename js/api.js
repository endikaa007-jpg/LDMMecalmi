const API_FALLBACK_URL = 'http://74.161.44.50:3000/api';

function construirBasesApi() {
    const guardada = localStorage.getItem('apiBaseUrl');
    const origen   = window.location.origin;
    const desdeHost = window.location.protocol + '//' + window.location.hostname + ':3000/api';

    const candidatas = [
        guardada,
        API_FALLBACK_URL,
        '/api',
        origen + '/api',
        desdeHost,
        'http://localhost:3000/api',
        'http://127.0.0.1:3000/api'
    ].filter(Boolean);

    return [...new Set(candidatas)];
}

let API_BASES = construirBasesApi();
let API_URL   = API_BASES[0];

async function parsearRespuesta(res) {
    const tipo = res.headers.get('content-type') || '';

    if (tipo.includes('application/json')) {
        return await res.json();
    }

    const texto = await res.text();
    return texto ? { message: texto } : {};
}

function limpiarMensajeServidor(mensaje) {
    if (!mensaje) return '';

    const limpio = String(mensaje)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (/Cannot\s+(GET|POST|PUT|DELETE)\s+/i.test(limpio)) {
        return 'Ruta no disponible en el servidor.';
    }

    return limpio;
}

function crearTimeout(ms) {
    ms = ms || 8000;
    const controller = new AbortController();
    const timer = setTimeout(function() { controller.abort(); }, ms);
    return { controller: controller, timer: timer };
}

function describirErrorConexion(err) {
    if (err && err.name === 'AbortError') {
        return 'Tiempo de espera agotado al conectar con la API.';
    }

    const texto = String((err && err.message) || '').toLowerCase();

    if (
        texto.includes('failed to fetch') ||
        texto.includes('networkerror') ||
        texto.includes('network request failed') ||
        texto.includes('load failed')
    ) {
        return 'No se pudo establecer conexion con la API.';
    }

    return (err && err.message) || 'Error de red al conectar con la API.';
}

async function requestApi(ruta, opciones) {
    opciones = opciones || {};
    let ultimoError = null;
    const intentadas = [];

    const headers = Object.assign({ 'Content-Type': 'application/json' }, opciones.headers || {});

    for (let i = 0; i < API_BASES.length; i++) {
        const base = API_BASES[i];
        const t = crearTimeout();
        intentadas.push(base);

        try {
            const res = await fetch(base + ruta, Object.assign({}, opciones, {
                headers: headers,
                signal: t.controller.signal
            }));

            clearTimeout(t.timer);
            API_URL = base;
            localStorage.setItem('apiBaseUrl', base);

            const data = await parsearRespuesta(res);

            if (!res.ok) {
                const errorHttp = {
                    status: 'Error',
                    statusCode: res.status,
                    message: limpiarMensajeServidor(data.message) || 'Error HTTP ' + res.status
                };

                if ([404, 405, 502, 503].includes(res.status)) {
                    ultimoError = new Error(errorHttp.message);
                    continue;
                }

                return errorHttp;
            }

            return data;

        } catch (err) {
            clearTimeout(t.timer);
            ultimoError = err;
        }
    }

    const detalle = describirErrorConexion(ultimoError);
    const bases = intentadas.join(' | ');
    throw new Error(detalle + ' Intentadas: ' + bases + '. Verifica que el backend este encendido y accesible.');
}

async function loginUsuario(usuario, contrasena) {
    const rutasLogin = ['/login', '/usuarios/login', '/auth/login', '/usuarios/auth/login'];
    const payloads = [
        { nombre: usuario, contrasena: contrasena },
        { usuario: usuario, contrasena: contrasena },
        { user: usuario, pass: contrasena },
        { user: usuario, password: contrasena },
        { email: usuario, contrasena: contrasena },
        { nickname: usuario, contrasena: contrasena }
    ];

    let ultimoErrorHttp = null;

    for (let r = 0; r < rutasLogin.length; r++) {
        const ruta = rutasLogin[r];

        for (let p = 0; p < payloads.length; p++) {
            const payload = payloads[p];

            for (let b = 0; b < API_BASES.length; b++) {
                const base = API_BASES[b];
                const t = crearTimeout();

                try {
                    const res = await fetch(base + ruta, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: t.controller.signal
                    });

                    clearTimeout(t.timer);
                    const data = await parsearRespuesta(res);

                    if (res.ok) {
                        API_URL = base;
                        localStorage.setItem('apiBaseUrl', base);
                        return data;
                    }

                    const errorHttp = {
                        status: 'Error',
                        statusCode: res.status,
                        message: limpiarMensajeServidor((data && data.message)) || 'Error HTTP ' + res.status
                    };

                    const msg = String(errorHttp.message || '').toLowerCase();
                    const esRutaInvalida = [404, 405].includes(res.status) || msg.includes('cannot post') || msg.includes('ruta no disponible');
                    const esUsuarioInvalido = res.status === 401 && (msg.includes('usuario no encontrado') || msg.includes('user not found'));

                    if (esUsuarioInvalido) {
                        return errorHttp;
                    }

                    if (esRutaInvalida) {
                        ultimoErrorHttp = errorHttp;
                        continue;
                    }

                    return errorHttp;

                } catch (err) {
                    clearTimeout(t.timer);
                    ultimoErrorHttp = {
                        status: 'Error',
                        message: describirErrorConexion(err)
                    };
                }
            }
        }
    }

    return ultimoErrorHttp || { status: 'Error', message: 'No se pudo validar el usuario con la API.' };
}

async function getUsuario(id) {
    return await requestApi('/usuarios/' + id);
}

async function crearUsuario(datos) {
    return await requestApi('/usuarios', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function actualizarUsuario(id, datos) {
    return await requestApi('/usuarios/' + id, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

async function eliminarUsuario(id) {
    return await requestApi('/usuarios/' + id, {
        method: 'DELETE'
    });
}

async function getTop10() {
    const respuesta = await requestApi('/rankings');

    if (String((respuesta && respuesta.status) || '').toLowerCase() !== 'success') {
        return respuesta;
    }

    const lista = Array.isArray(respuesta.data) ? respuesta.data.slice(0, 10) : [];
    return Object.assign({}, respuesta, { data: lista });
}

async function getRankingCompleto() {
    return await requestApi('/rankings');
}

async function getPuntuacionesPorNivel(nivel) {
    const respuesta = await requestApi('/rankings');

    if (String((respuesta && respuesta.status) || '').toLowerCase() !== 'success') {
        return respuesta;
    }

    const nivelNormalizado = String(nivel || '').toLowerCase();
    const lista = Array.isArray(respuesta.data)
        ? respuesta.data.filter(function(item) {
            return String((item && item.dificultad) || '').toLowerCase() === nivelNormalizado;
          })
        : [];

    return Object.assign({}, respuesta, { data: lista });
}

async function getPuntuacionesJugador(nickname) {
    const respuesta = await requestApi('/rankings');

    if (String((respuesta && respuesta.status) || '').toLowerCase() !== 'success') {
        return respuesta;
    }

    const jugadorNormalizado = String(nickname || '').toLowerCase();
    const lista = Array.isArray(respuesta.data)
        ? respuesta.data.filter(function(item) {
            return String((item && item.nombre) || '').toLowerCase().includes(jugadorNormalizado);
          })
        : [];

    return Object.assign({}, respuesta, { data: lista });
}

function guardarSesion(usuario) {
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
}

function obtenerSesion() {
    const datos = localStorage.getItem('usuarioActual');
    return datos ? JSON.parse(datos) : null;
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    window.location.href = 'login.html';
}

function protegerPagina() {
    if (!obtenerSesion()) {
        window.location.href = 'login.html';
    }
}

function mostrarAlerta(mensaje, tipo) {
    tipo = tipo || 'error';
    const div = document.getElementById('mensajesAlerta');
    if (!div) return;

    div.textContent = mensaje;
    div.className = tipo;

    $(div).fadeIn(400);
    setTimeout(function() { $(div).fadeOut(400); }, 3500);
}

$(document).ready(function () {
    $('#linkCerrarSesion').click(function (e) {
        e.preventDefault();
        cerrarSesion();
    });
});