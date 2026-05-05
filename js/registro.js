const AVATAR_FALLBACK = 'https://via.placeholder.com/88x88/12121a/a855f7?text=?';
const PAISES_FALLBACK = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador',
    'España', 'Estados Unidos', 'Francia', 'Guatemala', 'Honduras', 'Italia', 'México', 'Nicaragua', 'Panamá',
    'Paraguay', 'Perú', 'Portugal', 'República Dominicana', 'Uruguay', 'Venezuela'
];

function convertirInputPaisASelect() {
    const campoPais = document.getElementById('editPais');
    if (!campoPais || campoPais.tagName !== 'INPUT') return;

    const select = document.createElement('select');
    select.id = campoPais.id;
    select.className = campoPais.className;

    campoPais.parentNode.replaceChild(select, campoPais);
}

function poblarSelectPaises(paises) {
    paises = paises || [];
    const campoPais = document.getElementById('editPais');
    if (!campoPais || campoPais.tagName !== 'SELECT') return;

    const ordenados = Array.from(new Set(paises.filter(Boolean)))
        .sort(function (a, b) { return a.localeCompare(b, 'es'); });

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

    campoPais.value = '';
}

async function cargarPaisesEnSelect() {
    try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name');
        const data = await res.json();
        const paises = Array.isArray(data)
            ? data.map(function (item) { return item && item.name && item.name.common; }).filter(Boolean)
            : [];

        poblarSelectPaises(paises.length > 0 ? paises : PAISES_FALLBACK);

    } catch (err) {
        poblarSelectPaises(PAISES_FALLBACK);
    }
}

function obtenerConfigCloudinary() {
    const cloudName = localStorage.getItem('cloudinaryCloudName') || localStorage.getItem('dsclootiu') || 'dsclootiu';
    const uploadPreset = localStorage.getItem('cloudinaryUploadPreset') || localStorage.getItem('Mecalmi') || 'Mecalmi';
    return { cloudName: cloudName, uploadPreset: uploadPreset };
}

async function subirAvatarCloudinary(file) {
    if (!file) return '';

    const config = obtenerConfigCloudinary();

    if (!config.cloudName || !config.uploadPreset) {
        throw new Error('Falta configurar Cloudinary (cloud name y upload preset).');
    }

    if (!String(file.type || '').startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen para el avatar.');
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
        throw new Error((data.error && data.error.message) || 'No se pudo subir la imagen a Cloudinary.');
    }

    return data.secure_url;
}

$(document).ready(function () {

    if (obtenerSesion()) {
        window.location.href = 'index.html';
        return;
    }

    convertirInputPaisASelect();
    poblarSelectPaises(PAISES_FALLBACK);
    cargarPaisesEnSelect();

    $('#avatarArchivo').on('change', function () {
        const archivo = this.files && this.files[0];

        if (!archivo) {
            $('#avatarPreview').attr('src', AVATAR_FALLBACK);
            return;
        }

        $('#avatarPreview').attr('src', URL.createObjectURL(archivo));
    });

    $('#btnSiguiente').click(function () {
        const usuario = $('#usuario').val().trim();
        const email = $('#email').val().trim();
        const contrasena = $('#contrasena').val();
        const recontras = $('#recontrasena').val();

        if (usuario.length < 3) {
            mostrarAlerta('El usuario debe tener al menos 3 caracteres.', 'error');
            return;
        }
        if (!email.includes('@')) {
            mostrarAlerta('Introduce un email válido.', 'error');
            return;
        }
        if (contrasena.length < 6) {
            mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        if (contrasena !== recontras) {
            mostrarAlerta('Las contraseñas no coinciden.', 'error');
            return;
        }

        $('#paso1').fadeOut(300, function () { $('#paso2').fadeIn(300); });
    });

    $('#btnAnterior').click(function () {
        $('#paso2').fadeOut(300, function () { $('#paso1').fadeIn(300); });
    });

    $('#btnRegistrar').click(async function () {
        $(this).prop('disabled', true).text('Enviando...');

        const archivoAvatar = document.getElementById('avatarArchivo');
        const archivo = archivoAvatar && archivoAvatar.files && archivoAvatar.files[0] || null;

        const nuevoUsuario = {
            nombre: $('#usuario').val().trim(),
            contrasena: $('#contrasena').val(),
            email: $('#email').val().trim(),
            pais: $('#editPais').val().trim(),
            avatarUrl: ''
        };

        try {
            if (archivo) {
                $('#btnRegistrar').text('Subiendo foto...');
                nuevoUsuario.avatarUrl = await subirAvatarCloudinary(archivo);
                $('#btnRegistrar').text('Enviando...');
            }

            const respuesta = await crearUsuario(nuevoUsuario);

            if (respuesta.data) {
                guardarSesion(respuesta.data);
                mostrarAlerta('¡Cuenta creada! Redirigiendo...', 'exito');
                setTimeout(function () { window.location.href = 'index.html'; }, 1500);
            } else {
                mostrarAlerta(respuesta.message || 'Error al registrar.', 'error');
                $('#btnRegistrar').prop('disabled', false).text('✓ Registrarse');
            }

        } catch (err) {
            console.error(err);
            mostrarAlerta(err.message || 'Error de conexión con el servidor.', 'error');
            $('#btnRegistrar').prop('disabled', false).text('Registrarse');
        }
    });

});