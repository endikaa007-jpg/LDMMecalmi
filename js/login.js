
$(document).ready(function () {

    let loginEnCurso = false;
    if (obtenerSesion()) {
        window.location.href = 'index.html';
        return;
    }

    // Login con Enter en contraseña
    $('#contrasena').keypress(function (e) {
        if (e.which === 13) $('#btnLogin').click();
    });

    $('#btnLogin').click(async function () {

        if (loginEnCurso) {
            return;
        }

        const usuario    = $('#usuario').val().trim();
        const contrasena = $('#contrasena').val();

        if (!usuario) { 
            mostrarAlerta('Introduce tu nombre de usuario.', 'error'); 
            return; 
        }
        
        if (!contrasena) { 
            mostrarAlerta('Introduce tu contraseña.', 'error'); 
            return; 
        }

        loginEnCurso = true;
        $(this).prop('disabled', true).text('Comprobando...');

        try {
            const datos = await loginUsuario(usuario, contrasena);
            const usuarioSesion = datos?.data || datos?.usuario || datos?.user || null;
            const loginExitoso = Boolean(usuarioSesion) || String(datos?.status || '').toLowerCase() === 'success';

            if (loginExitoso) {
                guardarSesion(usuarioSesion || { usuario });
                mostrarAlerta('¡Bienvenido, ' + usuario + '!', 'exito');
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            } else {
                mostrarAlerta(datos.message || 'Usuario o contraseña incorrectos.', 'error');
            }
        } catch (err) {
            console.error(err);
            mostrarAlerta(err.message || 'Error de conexión con el servidor.', 'error');
        } finally {
            loginEnCurso = false;
            $('#btnLogin').prop('disabled', false).text('Entrar');
        }
    });

});
