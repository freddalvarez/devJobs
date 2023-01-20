const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuario = mongoose.model('Usuario');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');


exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
});

exports.mostrarPanel = async (req, res) => {

    const vacantes = await Vacante.find({ autor: req.user._id }).lean();

    res.render('administracion', {
        nombrePagina: 'Panel de Administración',
        tagline: 'Crea y administra tus vacantes desde aquí',
        vacantes,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    });
}

exports.verificarUsuario = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/iniciar-sesion');
}

exports.cerrarSesion = (req, res) => {
    req.logout(function(err) {
    if(err) {
            console.log(err);
    }
    });
    req.flash('correcto', 'Cerraste sesión correctamente');
    return res.redirect('/iniciar-sesion');
}

exports.formReestablecerPassword = (req, res) => {
    res.render('reestablecer-password', {
        nombrePagina: 'Reestablecer tu contraseña',
        tagline: 'Si ya tienes una cuenta pero olvidaste tu contraseña, coloca tu email'
    });
}

exports.enviarToken = async (req, res) => {
    const usuario = await Usuario.findOne({ email: req.body.email });
    if (!usuario) {
        req.flash('error', 'No existe esa cuenta');
        res.redirect('/iniciar-sesion');
    }

    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    await usuario.save();

    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'reset'
    });

    req.flash('correcto', 'Se envió un mensaje a tu correo');
    res.redirect('/iniciar-sesion');

}

exports.restablcerPassword = async (req, res) => {
    const usuario = await Usuario.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if (!usuario) {
        req.flash('error', 'El formulario ya no es válido, intenta de nuevo');
        res.redirect('/reestablecer-password');
    }

    res.render('nuevo-password', {
        nombrePagina: 'Nuevo Password'
    });
}


exports.guardarPassword = async (req, res) => {
    const usuario = await Usuario.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if (!usuario) {
        req.flash('error', 'El formulario ya no es válido, intenta de nuevo');
        res.redirect('/reestablecer-password');
    }

    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    await usuario.save();

    req.flash('correcto', 'Tu password se ha modificado correctamente');
    res.redirect('/iniciar-sesion');
}