let usuarioActual = null;

const AVATAR_FALLBACK = 'https://via.placeholder.com/120x120/12121a/a855f7?text=?';
const PAISES_FALLBACK = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador',
    'España', 'Estados Unidos', 'Francia', 'Guatemala', 'Honduras', 'Italia', 'México', 'Nicaragua', 'Panamá',
    'Paraguay', 'Perú', 'Portugal', 'República Dominicana', 'Uruguay', 'Venezuela'
];
const CODIGO_A_PAIS = {
    ar: 'Argentina', bo: 'Bolivia', br: 'Brasil',  cl: 'Chile',    co: 'Colombia',    cr: 'Costa Rica',
    cu: 'Cuba',      ec: 'Ecuador', sv: 'El Salvador', es: 'España', us: 'Estados Unidos', fr: 'Francia',
    gt: 'Guatemala', hn: 'Honduras', it: 'Italia',  mx: 'México',   ni: 'Nicaragua',   pa: 'Panamá',
    py: 'Paraguay',  pe: 'Perú',    pt: 'Portugal', do: 'República Dominicana', uy: 'Uruguay', ve: 'Venezuela'
};

function capitalizarPais(texto) {
    texto = texto || '';
    return String(texto).toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); })
        .join(' ');
}

function normalizarNombrePais(valor) {
    valor = valor || '';
    const limpio = String(valor).trim();
    if (!limpio) return '';

    const codigo = limpio.toLowerCase();
    if (/^[a-z]{2}$/.test(codigo) && CODIGO_A_PAIS[codigo]) return CODIGO_A_PAIS[codigo];

    return capitalizarPais(limpio);
}

function convertirInputPaisASelectSiHaceFalta() {
    const campoPais = document.getElementById('editPais');
    if (!campoPais || campoPais.tagName !== 'INPUT') return;

    const select = document.createElement('select');
    select.id = campoPais.id;
    select.className = campoPais.className;

    campoPais.parentNode.replaceChild(select, campoPais);
}

function asegurarDatalistPaises(paises) {
    paises = paises || [];
    const campoPais = document.getElementById('editPais');
    if (!campoPais || campoPais.tagName !== 'INPUT') return;

    const idLista = 'listaPaisesPerfil';
    let datalist  = document.getElementById(idLista);

    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = idLista;
        document.body.appendChild(datalist);
    }

    datalist.innerHTML = '';

    Array.from(new Set(paises.filter(Boolean)))
        .sort(function (a, b) { return a.localeCompare(b, 'es'); })
        .forEach(function (pais) {
            const option = document.createElement('option');
            option.value = pais;
            datalist.appendChild(option);
        });

    campoPais.setAttribute('list', idLista);
}

function poblarSelectPaises(paises, paisSeleccionado) {
    paises = paises || [];
    paisSeleccionado = paisSeleccionado || '';

    const campoPais = document.getElementById('editPais');
    if (!campoPais) return;

    const esSelect = campoPais.tagName === 'SELECT';
    const opcionActual = normalizarNombrePais(paisSeleccionado || campoPais.value || '');

    if (!esSelect) {
        asegurarDatalistPaises(paises);
        campoPais.value = opcionActual;
        return;
    }

    const setPaises = new Set(paises.filter(Boolean));
    if (opcionActual) setPaises.add(opcionActual);

    const ordenados = Array.from(setPaises).sort(function (a, b) { return a.localeCompare(b, 'es'); });

    campoPais.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona un país';
    campoPais.appendChild(placeholder);

    ordenados.forEach(function (pais) {
        const option = document.createElement('option');
        option.value = pais;
        option.textContent = pais;
        campoPais.appendChild(option);
    });

    campoPais.value = opcionActual;
}

function seleccionarPaisEnSelect(paisSeleccionado) {
    paisSeleccionado = paisSeleccionado || '';
    const campoPais  = document.getElementById('editPais');
    if (!campoPais) return;

    const esSelect = campoPais.tagName === 'SELECT';

    if (!esSelect) {
        campoPais.value = normalizarNombrePais(paisSeleccionado);
        return;
    }

    if (!paisSeleccionado) {
        campoPais.value = '';
        return;
    }

    const existe = Array.from(campoPais.options).some(function (opt) { return opt.value === paisSeleccionado; });

    if (!existe) {
        const option = document.createElement('option');
        option.value = paisSeleccionado;
        option.textContent = paisSeleccionado;
        campoPais.appendChild(option);
    }

    campoPais.value = paisSeleccionado;
}

async function cargarPaisesEnSelect() {
    try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name');
        const data = await res.json();
        const paises = Array.isArray(data)
            ? data.map(function (item) { return item && item.name && item.name.common; }).filter(Boolean)
            : [];

        poblarSelectPaises(
            paises.length > 0 ? paises : PAISES_FALLBACK,
            (usuarioActual && usuarioActual.pais) || ''
        );

    } catch (err) {
        poblarSelectPaises(PAISES_FALLBACK, (usuarioActual && usuarioActual.pais) || '');
    }
}

function obtenerConfigCloudinary() {
    const cloudName = localStorage.getItem('cloudinaryCloudName') || localStorage.getItem('dsclootiu') || 'dsclootiu';
    const uploadPreset = localStorage.getItem('cloudinaryUploadPreset') || localStorage.getItem('Mecalmi') || 'Mecalmi';
    return { cloudName: cloudName, uploadPreset: uploadPreset };
}

function normalizarUsuario(usuario) {
    if (!usuario) return null;

    return Object.assign({}, usuario, {
        _id: usuario._id || usuario.userId || usuario.id || '',
        usuario: usuario.usuario || usuario.nombre || '',
        nombre: usuario.nombre || usuario.usuario || '',
        urlavatar: usuario.urlavatar || usuario.avatarUrl || '',
        avatarUrl: usuario.avatarUrl || usuario.urlavatar || ''
    });
}

async function subirAvatarCloudinary(file) {
    if (!file) return '';

    const config = obtenerConfigCloudinary();

    if (!config.cloudName || !config.uploadPreset) {
        throw new Error('Falta configurar Cloudinary.');
    }

    if (!String(file.type || '').startsWith('image/')) {
        throw new Error('Solo imagen permitida.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', 'playalmi/avatars');

    const res  = await fetch('https://api.cloudinary.com/v1_1/' + config.cloudName + '/image/upload', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();

    if (!res.ok || !data.secure_url) {
        throw new Error((data.error && data.error.message) || 'Error al subir a Cloudinary.');
    }

    return data.secure_url;
}

$(document).ready(function () {

    convertirInputPaisASelectSiHaceFalta();
    usuarioActual = normalizarUsuario(obtenerSesion());
    poblarSelectPaises(PAISES_FALLBACK, (usuarioActual && usuarioActual.pais) || '');
    cargarPaisesEnSelect();
    cargarPerfil();

    $('#editAvatarArchivo').on('change', function () {
        const archivo = this.files && this.files[0];

        if (!archivo) {
            const src = (usuarioActual && (usuarioActual.avatarUrl || usuarioActual.urlavatar)) || AVATAR_FALLBACK;
            $('#editAvatarPreview').attr('src', src);
            return;
        }

        $('#editAvatarPreview').attr('src', URL.createObjectURL(archivo));
    });

    $('#btnMostrarEdicion').click(function () {
        $('#editNombre').val((usuarioActual && (usuarioActual.nombre || usuarioActual.usuario)) || '');
        $('#editEmail').val((usuarioActual && usuarioActual.email) || '');
        seleccionarPaisEnSelect((usuarioActual && usuarioActual.pais) || '');
        $('#editAvatarArchivo').val('');
        $('#editAvatarPreview').attr('src', (usuarioActual && (usuarioActual.avatarUrl || usuarioActual.urlavatar)) || AVATAR_FALLBACK);
        $('#vistaPerfil').fadeOut(300, function () { $('#formularioEdicion').fadeIn(300); });
    });

    $('#btnCancelarEdicion').click(function () {
        $('#formularioEdicion').fadeOut(300, function () { $('#vistaPerfil').fadeIn(300); });
    });

    $('#btnGuardarCambios').click(async function () {
        const nombre = $('#editNombre').val().trim();
        const email = $('#editEmail').val().trim();

        if (nombre && nombre.length < 3) {
            mostrarAlerta('El nombre debe tener al menos 3 caracteres.', 'error');
            return;
        }
        if (email && !email.includes('@')) {
            mostrarAlerta('El email no es válido.', 'error');
            return;
        }

        $(this).prop('disabled', true).text('Guardando...');

        if (!usuarioActual || !usuarioActual._id) {
            mostrarAlerta('Tu sesión no tiene ID de usuario. Cierra sesión y vuelve a entrar.', 'error');
            $('#btnGuardarCambios').prop('disabled', false).text('Guardar');
            return;
        }

        const datosActualizados = {};
        if (nombre) datosActualizados.nombre = nombre;
        if ($('#editEmail').val().trim()) datosActualizados.email = $('#editEmail').val().trim();
        if ($('#editPais').val().trim()) datosActualizados.pais = $('#editPais').val().trim();
        if ($('#editContrasena').val()) datosActualizados.contrasena = $('#editContrasena').val();

        try {
            const inputAvatar = document.getElementById('editAvatarArchivo');
            const archivoAvatar = inputAvatar && inputAvatar.files && inputAvatar.files[0] || null;

            if (archivoAvatar) {
                $('#btnGuardarCambios').text('Subiendo avatar...');
                datosActualizados.avatarUrl = await subirAvatarCloudinary(archivoAvatar);
                $('#btnGuardarCambios').text('Guardando...');
            }

            const respuesta = await actualizarUsuario(usuarioActual._id, datosActualizados);

            if (respuesta.data) {
                usuarioActual = normalizarUsuario(respuesta.data);
                guardarSesion(usuarioActual);
                mostrarAlerta('¡Perfil actualizado!', 'exito');
                $('#formularioEdicion').fadeOut(300, function () { cargarPerfil(); });
            } else {
                mostrarAlerta(respuesta.message || 'Error al actualizar.', 'error');
            }

        } catch (err) {
            console.error(err);
            mostrarAlerta(err.message || 'Error de conexión.', 'error');
        }

        $('#btnGuardarCambios').prop('disabled', false).text('Guardar');
    });

    $('#btnEliminarCuenta').click(function () {
        $('#modalEliminar').addClass('visible');
    });

    $('#btnCancelarEliminar').click(function () {
        $('#modalEliminar').removeClass('visible');
    });

    $('#modalEliminar').click(function (e) {
        if (e.target === this) $('#modalEliminar').removeClass('visible');
    });

    $('#btnConfirmarEliminar').click(async function () {
        $('#modalEliminar').removeClass('visible');

        try {
            const respuesta = await eliminarUsuario(usuarioActual._id);

            if (respuesta.status === 'Success' || respuesta.message) {
                mostrarAlerta('Cuenta eliminada. ¡Hasta pronto!', 'info');
                localStorage.clear();
                setTimeout(function () { window.location.href = 'login.html'; }, 2000);
            } else {
                mostrarAlerta('Error al eliminar la cuenta.', 'error');
            }

        } catch (err) {
            console.error(err);
            mostrarAlerta(err.message || 'Error de conexión.', 'error');
        }
    });

});

async function cargarPerfil() {
    if (!usuarioActual || !usuarioActual._id) {
        mostrarAlerta('Inicia sesión para ver tus datos.', 'error');
        mostrarDatosPerfil(usuarioActual);
        $('#vistaPerfil').fadeIn(400);
        return;
    }

    try {
        if (typeof getUsuario === 'function') {
            const respuesta = await getUsuario(usuarioActual._id);
            if (respuesta && respuesta.data) {
                usuarioActual = normalizarUsuario(respuesta.data);
                if (typeof guardarSesion === 'function') guardarSesion(usuarioActual);
            }
        }

        if (typeof getRankingCompleto === 'function') {
            const resRanking = await getRankingCompleto();
            if (resRanking && resRanking.data) {
                usuarioActual.historialPartidas = resRanking.data;
            }
        }

    } catch (err) {
        console.error('ERROR de conexión con la BBDD:', err);
    } finally {
        mostrarDatosPerfil(usuarioActual);
        $('#vistaPerfil').fadeIn(400);
    }
}

function mostrarDatosPerfil(u) {
    if (!u) return;

    const nombre = u.nombre || u.usuario || '—';
    const avatar = u.avatarUrl || u.urlavatar || AVATAR_FALLBACK;

    $('#verUsuario').text(nombre);
    $('#verEmail').text(u.email || '—');
    $('#verPais').text(u.pais || 'No indicado');
    $('#avatarGrande').attr('src', avatar);

    let recordNormal  = 0;
    let recordDificil = 0;

    const miNombre = String(nombre).toLowerCase().trim();

    if (u.historialPartidas && Array.isArray(u.historialPartidas)) {
        u.historialPartidas.forEach(function (partida) {
            const nombreJugador = String(partida.nombre || partida.usuario || partida.jugador || partida.nickname || '').toLowerCase().trim();

            if (nombreJugador !== miNombre) return;

            const dif = String(partida.dificultad || partida.nivel || partida.level || '').toLowerCase().trim();
            const puntos = Number(partida.puntuacion  || partida.puntos || partida.score || partida.puntuaciones || 0);

            if ((dif === 'normal' || dif === '1') && puntos > recordNormal) {
                recordNormal = puntos;
            } else if ((dif.includes('dif') || dif === 'hard' || dif === '2') && puntos > recordDificil) {
                recordDificil = puntos;
            }
        });
    }

    $('#verPuntuacionNormal').text(recordNormal);
    $('#verPuntuacionDificil').text(recordDificil);
}