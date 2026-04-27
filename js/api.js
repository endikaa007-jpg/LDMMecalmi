/* ============================================================
   api.js  —  PlayAlmi
   Centralización de llamadas fetch() y gestión de sesión.
   ============================================================ */

const API_FALLBACK_URL = 'http://74.161.44.50:3000/api';

function construirBasesApi() {
    const guardada = localStorage.getItem('apiBaseUrl');
    const origenActual = window.location.origin;
    const desdeHostActual = `${window.location.protocol}//${window.location.hostname}:3000/api`;

    const candidatas = [
        guardada,
        API_FALLBACK_URL,
        '/api',
        `${origenActual}/api`,
        desdeHostActual,
        'http://localhost:3000/api',
        'http://127.0.0.1:3000/api'
    ].filter(Boolean);

    return [...new Set(candidatas)];
}

let API_BASES = construirBasesApi();
let API_URL = API_BASES[0];

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

    const textoPlano = String(mensaje)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (/Cannot\s+(GET|POST|PUT|DELETE)\s+/i.test(textoPlano)) {
        return 'Ruta no disponible en el servidor.';
    }

    return textoPlano;
}

function conTimeout(ms = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return { controller, timer };
}

function describirErrorConexion(err) {
    if (err?.name === 'AbortError') {
        return 'Tiempo de espera agotado al conectar con la API.';
    }

    const texto = String(err?.message || '').toLowerCase();
    if (
        texto.includes('failed to fetch') ||
        texto.includes('networkerror') ||
        texto.includes('network request failed') ||
        texto.includes('load failed')
    ) {
        return 'No se pudo establecer conexion con la API.';
    }

    return err?.message || 'Error de red al conectar con la API.';
}

async function requestApi(ruta, opciones = {}) {
    let ultimoError = null;
    const intentadas = [];
    const headers = {
        'Content-Type': 'application/json',
        ...(opciones.headers || {})
    };

    for (const base of API_BASES) {
        const { controller, timer } = conTimeout();
        intentadas.push(base);

        try {
            const res = await fetch(`${base}${ruta}`, {
                ...opciones,
                headers,
                signal: controller.signal
            });

            clearTimeout(timer);
            API_URL = base;
            localStorage.setItem('apiBaseUrl', base);
            const data = await parsearRespuesta(res);

            if (!res.ok) {
                const errorHttp = {
                    status: 'Error',
                    statusCode: res.status,
                    message: limpiarMensajeServidor(data.message) || `Error HTTP ${res.status}`
                };

                // Si una base responde con ruta/metodo no valido, probamos la siguiente base.
                if ([404, 405, 502, 503].includes(res.status)) {
                    ultimoError = new Error(errorHttp.message);
                    continue;
                }

                return errorHttp;
            }

            return data;
        } catch (err) {
            clearTimeout(timer);
            ultimoError = err;
        }
    }

    const detalle = describirErrorConexion(ultimoError);
    const bases = intentadas.join(' | ');
    throw new Error(`${detalle} Intentadas: ${bases}. Verifica que el backend este encendido y accesible.`);
}

/* ──────────────────────────────────────────
   USUARIOS & AUTENTICACIÓN
────────────────────────────────────────── */

/**
 * Iniciar sesión (POST)
 * Envía usuario y contraseña al servidor para validar.
 */
async function loginUsuario(usuario, contrasena) {
    const rutasLogin = ['/login', '/usuarios/login', '/auth/login', '/usuarios/auth/login'];
    const payloads = [
        { nombre: usuario, contrasena },
        { usuario, contrasena },
        { user: usuario, pass: contrasena },
        { user: usuario, password: contrasena },
        { email: usuario, contrasena },
        { nickname: usuario, contrasena }
    ];

    let ultimoErrorHttp = null;

    for (const ruta of rutasLogin) {
        for (const payload of payloads) {
            for (const base of API_BASES) {
                const { controller, timer } = conTimeout();

                try {
                    const res = await fetch(`${base}${ruta}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });

                    clearTimeout(timer);
                    const data = await parsearRespuesta(res);

                    if (res.ok) {
                        API_URL = base;
                        localStorage.setItem('apiBaseUrl', base);
                        return data;
                    }

                    const errorHttp = {
                        status: 'Error',
                        statusCode: res.status,
                        message: limpiarMensajeServidor(data?.message) || `Error HTTP ${res.status}`
                    };

                    const mensaje = String(errorHttp.message || '').toLowerCase();
                    const esRutaMetodo = [404, 405].includes(res.status) || mensaje.includes('cannot post') || mensaje.includes('ruta no disponible');
                    const esUsuarioNoEncontrado = res.status === 401 && (mensaje.includes('usuario no encontrado') || mensaje.includes('user not found'));

                    if (esRutaMetodo || esUsuarioNoEncontrado) {
                        ultimoErrorHttp = errorHttp;
                        continue;
                    }

                    return errorHttp;
                } catch (err) {
                    clearTimeout(timer);
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

/**
 * Obtener un usuario por ID
 */
async function getUsuario(id) {
    return await requestApi(`/usuarios/${id}`);
}

/**
 * Crear usuario nuevo (POST)
 */
async function crearUsuario(datos) {
    return await requestApi('/usuarios', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

/**
 * Modificar usuario (PUT)
 */
async function actualizarUsuario(id, datos) {
    return await requestApi(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

/**
 * Eliminar usuario (DELETE)
 */
async function eliminarUsuario(id) {
    return await requestApi(`/usuarios/${id}`, {
        method: 'DELETE'
    });
}

/* ──────────────────────────────────────────
   PUNTUACIONES / RANKING
────────────────────────────────────────── */

/**
 * Obtener top 10 puntuaciones (global)
 */
async function getTop10() {
    const respuesta = await requestApi('/rankings');
    if (String(respuesta?.status || '').toLowerCase() !== 'success') {
        return respuesta;
    }

    const lista = Array.isArray(respuesta.data) ? respuesta.data.slice(0, 10) : [];
    return { ...respuesta, data: lista };
}

/**
 * Obtener todas las puntuaciones (sin limite)
 */
async function getRankingCompleto() {
    return await requestApi('/rankings');
}

/**
 * Obtener todas las puntuaciones filtradas por nivel
 */
async function getPuntuacionesPorNivel(nivel) {
    const respuesta = await requestApi('/rankings');
    if (String(respuesta?.status || '').toLowerCase() !== 'success') {
        return respuesta;
    }

    const nivelNormalizado = String(nivel || '').toLowerCase();
    const lista = Array.isArray(respuesta.data)
        ? respuesta.data.filter(item => String(item?.dificultad || '').toLowerCase() === nivelNormalizado)
        : [];

    return { ...respuesta, data: lista };
}

/**
 * Obtener puntuaciones de un jugador concreto
 */
async function getPuntuacionesJugador(nickname) {
    const respuesta = await requestApi('/rankings');
    if (String(respuesta?.status || '').toLowerCase() !== 'success') {
        return respuesta;
    }

    const jugadorNormalizado = String(nickname || '').toLowerCase();
    const lista = Array.isArray(respuesta.data)
        ? respuesta.data.filter(item => String(item?.nombre || '').toLowerCase().includes(jugadorNormalizado))
        : [];

    return { ...respuesta, data: lista };
}

/* ──────────────────────────────────────────
   SESIÓN Y UTILIDADES
────────────────────────────────────────── */

/**
 * Guarda el objeto usuario en localStorage
 */
function guardarSesion(usuario) {
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
}

/**
 * Recupera la sesión actual del localStorage
 */
function obtenerSesion() {
    const datos = localStorage.getItem('usuarioActual');
    return datos ? JSON.parse(datos) : null;
}

/**
 * Borra la sesión y redirige al login
 */
function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    window.location.href = 'login.html';
}

/**
 * Comprueba si hay sesión. Si no, redirige fuera.
 */
function protegerPagina() {
    if (!obtenerSesion()) {
        window.location.href = 'login.html';
    }
}

/**
 * Muestra alertas visuales con jQuery
 */
function mostrarAlerta(mensaje, tipo = 'error') {
    const div = document.getElementById('mensajesAlerta');
    if (!div) return;
    div.textContent = mensaje;
    div.className = tipo; // 'error', 'exito' o 'info'
    
    $(div).fadeIn(400);
    setTimeout(() => $(div).fadeOut(400), 3500);
}

/**
 * Listener automático para el botón de cerrar sesión del menú
 */
$(document).ready(function () {
    $('#linkCerrarSesion').click(function (e) {
        e.preventDefault();
        cerrarSesion();
    });
});