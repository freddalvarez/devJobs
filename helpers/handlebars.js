module.exports = {
    seleccionarSkills : (seleccionadas = [], opciones) => {
        const skills = ['HTML5', 'CSS3', 'JavaScript', 'ReactJS', 'NodeJS', 'VueJS', 'AngularJS', 'PHP', 'Python', 'Ruby', 'Java', 'C#', 'C++', 'Django', 'Laravel', 'WordPress', 'Drupal', 'MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'SQL Server', 'Oracle', 'SASS', 'LESS', 'Bootstrap', 'Materialize', 'Tailwind', 'Git', 'GitHub', 'BitBucket', 'GitLab', 'Docker', 'AWS', 'Heroku', 'Vercel', 'Netlify'];
        let html = '';
        skills.forEach(skill => {
            html += `
                <li ${seleccionadas.includes(skill) ? 'class="activo"' : ''}>${skill}</li>
            `;
        });
        return opciones.fn().html = html;
    },
    tipoContrato : (seleccionado, opciones) => {
        return opciones.fn(this).replace(
            new RegExp(` value="${seleccionado}"`), '$& selected="selected"'
        );
    },
    mostrarAlertas : (errores = {}, alertas) => {
        const categoria = Object.keys(errores);
        let html = '';
        if(categoria.length) {
            errores[categoria].forEach(error => {
                html += `
                    <div class="${categoria} alerta">
                        ${error}
                    </div>
                `;
            });
        }
        return alertas.fn().html = html;
    }
}