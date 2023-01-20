import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', function() {
    const skills = document.querySelector('.lista-conocimientos');

    let alertas = document.querySelector('.alertas');

    if(alertas) {
        limpiarAlertas();
    }

    if(skills) {
        skills.addEventListener('click', agregarSkills);

        skillsSeleccionadas();
    }

    const vacantesListado = document.querySelector('.panel-administracion');
    if(vacantesListado) {
        vacantesListado.addEventListener('click', accionesListado);
    }
});

const skills = new Set();

const agregarSkills = e => {
    if(e.target.tagName === 'LI') {
        if(e.target.classList.contains('activo')) {
            skills.delete(e.target.textContent);
            e.target.classList.remove('activo');
        } else {
            skills.add(e.target.textContent);
            e.target.classList.add('activo');
        }
    }

    document.querySelector('#skills').value = [...skills];
    
}  

const skillsSeleccionadas = () => {
    const seleccionadas = Array.from(document.querySelectorAll('.lista-conocimientos .activo'));

    seleccionadas.forEach(seleccionada => {
        skills.add(seleccionada.textContent);
    });

    document.querySelector('#skills').value = [...skills];
}

const limpiarAlertas = () => {

    const alertas = document.querySelector('.alertas');
    
    const interval = setInterval(() => {
        if(alertas.children.length > 0) {
            alertas.removeChild(alertas.children[0]);
        } else if(alertas.children.length === 0) {
            alertas.parentElement.removeChild(alertas);
            clearInterval(interval);
        }
    }, 2000);
}

const accionesListado = e => {
    e.preventDefault();

    if(e.target.dataset.eliminar) {
        Swal.fire({
            title: 'Deseas borrar esta vacante?',
            text: "Una vacante eliminada no se puede recuperar!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, borrar!',
            cancelButtonText: 'No, cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;
                
                axios.delete(url, { params: {url} })
                    .then(function(respuesta) {
                        if(respuesta.status === 200) {
                            Swal.fire(
                                'Vacante Eliminada',
                                respuesta.data,
                                'success'
                            );

                            e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement);
                        }
                    })
                    .catch(() => {
                        Swal.fire({
                            type: 'error',
                            title: 'Hubo un error',
                            text: 'No se pudo eliminar la vacante'
                        })
                    })
            }
        })
    } else if(e.target.tagName === 'A') {
        window.location.href = e.target.href;
    }
}