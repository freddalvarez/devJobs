
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

exports.formularioNuevaVacante = (req, res) => {
    res.render('nueva-vacante', {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.agregarVacante = async (req, res) => {
    const vacante = new Vacante(req.body)

    vacante.autor = req.user._id;

    vacante.skills = req.body.skills.split(',');
    const nuevaVacante = await vacante.save();
    res.redirect(`/vacantes/${nuevaVacante.url}`);
}

exports.mostrarVacante = async (req, res, next) => {
    const vacante = await Vacante.findOne({ url: req.params.url }).lean().populate('autor');

    if (!vacante) return next();
    res.render('vacante', {
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    });
}

exports.formEditarVacante = async (req, res, next) => {
    const vacante = await Vacante.findOne({ url: req.params.url }).lean();
    if (!vacante) return next();
    res.render('editar-vacante', {
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        tagline: 'Edita tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    });
}

exports.editarVacante = async (req, res) => {
    const vacanteActualizada = req.body;
    vacanteActualizada.skills = req.body.skills.split(',');
    const vacante = await Vacante.findOneAndUpdate({ url: req.params.url }, vacanteActualizada, {
        new: true,
        runValidators: true
    });
    res.redirect(`/vacantes/${vacante.url}`);
}

exports.validarVacante = async (req, res, next) => {
    const rules = [
        body('titulo').not().isEmpty().withMessage('Agrega un título a la vacante').escape(),
        body('empresa').not().isEmpty().withMessage('Agrega una empresa').escape(),
        body('ubicacion').not().isEmpty().withMessage('Agrega una ubicación').escape(),
        body('contrato').not().isEmpty().withMessage('Selecciona el tipo de contrato').escape(),
        body('skills').not().isEmpty().withMessage('Agrega al menos una habilidad').escape()

    ];

    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);

    if(!errores.isEmpty()) {
        req.flash('error', errores.array().map(error => error.msg));
        res.render('nueva-vacante', {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            mensajes: req.flash(),
            cerrarSesion: true,
            nombre: req.user.nombre
        })
        return;
    }
    next();
}

exports.validarVacanteEditar = async (req, res, next) => {
    const rules = [
        body('titulo').not().isEmpty().withMessage('Agrega un título a la vacante').escape(),
        body('empresa').not().isEmpty().withMessage('Agrega una empresa').escape(),
        body('ubicacion').not().isEmpty().withMessage('Agrega una ubicación').escape(),
        body('contrato').not().isEmpty().withMessage('Selecciona el tipo de contrato').escape(),
        body('skills').not().isEmpty().withMessage('Agrega al menos una habilidad').escape()

    ];

    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);

    if(!errores.isEmpty()) {
        const vacante = await Vacante.findOne({ url: req.params.url }).lean();
        if (!vacante) return next();
        req.flash('error', errores.array().map(error => error.msg));
        res.render('editar-vacante', {
            vacante,
            nombrePagina: `Editar - ${vacante.titulo}`,
            tagline: 'Edita tu vacante',
            mensajes: req.flash(),
            cerrarSesion: true,
            nombre: req.user.nombre
        });
        return;
    }
    next();
}

exports.eliminarVacante = async (req, res) => {
    const { id } = req.params;
    const vacante = await Vacante.findById(id);

    if(verificarAutor(vacante, req.user)) {
        vacante.remove();
        res.status(200).send('Vacante Eliminada Correctamente');
    } else {
        res.status(403).send('Error');
    }

    
}

const verificarAutor = (vacante = {}, usuario = {}) => {
    if(!vacante.autor.equals(usuario._id)) {
        return false;
    }
    return true;
}

exports.subirCV = (req, res, next) => {
    upload(req, res, function(error) {
        if(error) {
            if(error instanceof multer.MulterError) {
                if(error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El archivo es muy grande: Máximo 100kb');
                } else {
                    req.flash('error', error.message);
                }
            } else {
                req.flash('error', error.message);
            }
            res.redirect('back');
            return;
        } else {
            return next();
        }
    })
}

const configuracionMulter = {
    limits: { fileSize: 100000 },
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, __dirname+'../../public/uploads/cv');
        },
        filename: (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Formato no válido'));
        }
    }
}

const upload = multer(configuracionMulter).single('cv');

exports.contactar = async (req, res, next) => {
    console.log(req.file);
    const vacante = await Vacante.findOne({ url: req.params.url });
    if(!vacante) return next();
    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();
    req.flash('correcto', 'Se envió tu Curriculum Correctamente');
    res.redirect('/');  
}

exports.mostrarCandidatos = async (req, res, next) => {
    const vacante = await Vacante.findById(req.params.id).lean();

    if(vacante.autor != req.user._id.toString()){
        return next();
    } 

    if(!vacante) return next();

    res.render('candidatos', {
        nombrePagina : `Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion : true,
        nombre : req.user.nombre,
        imagen : req.user.imagen,
        candidatos : vacante.candidatos 
    })
}

exports.buscarVacantes = async (req, res) => {
    const vacantes = await Vacante.find({
        $text: {
            $search: req.body.q
        }
    }).lean();
    res.render('home', {
        nombrePagina: `Resultados para la búsqueda: ${req.body.q}`,
        barra: true,
        vacantes
    })
}



