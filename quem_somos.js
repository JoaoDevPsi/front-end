document.addEventListener('DOMContentLoaded', function() {
    const pessoas = [
        {
            nome: 'Ricardo Mattos',
            curriculo: ["Psicólogo", "Pós-graduado em Psicologia Analitica"],
            contato: "5571992394554",
            imagem: "img/ric3.jpg",
            especialidades: ["Psicologia Analítica","Ansiedade", "Depressão"],
            crp: "27/21157",
            formacao: ["formado pela Escola Bahiana de Medicina e Saúde Pública. </br> pós-graduado pelo Instituto Junguiano da Bahia"],
            bio: "Membro fundador da Clínica Arquê. Sua prática é pautada por uma escuta profunda, respeitosa e simbólica, buscando acolher cada pessoa em sua singularidade, Apaixonado por mitologia, contos de fadas, relações humanas e cultura pop, Ricardo acredita que nossas histórias internas se conectam com narrativas universais que nos ajudam a compreender quem somos. Seu trabalho é um convite para quem deseja olhar para a própria jornada com mais significado, cuidado e transformação"
        },
        {
            nome: 'Fernando Lopes',
            curriculo: ["Psicologo", "Pós-graduado"],
            contato: "5571992394554",
            imagem: "img/nando3.jpg",
            especialidades: ["Psicoterapia Analítica", "Morte e morrer", "Suicidio"],
            crp:'03/18814',
            formacao: ["Psicólogo com formação pela Escola Bahiana de Medicina e Saúde Pública (EBMSP). </br> Especialização em Psicoterapia Analítica pelo Instituto Junguiano da Bahia (IJBA). É membro fundador do Programa de Ações e Estudos sobre o Suicídio (PAES), onde atuava com seriedade e sensibilidade em temáticas complexas da saúde mental."],
            bio: "Com uma escuta atenta e um olhar voltado ao processo de autoconhecimento, Fernando acredita que cada trajetória humana é marcada por desafios que também revelam possibilidades de transformação. Seus principais temas de estudo incluem Contos de Fadas, Morte e o Morrer, Suicídio, Transtorno de Déficit de Atenção e Hiperatividade (TDAH), Mitologia e Sandplay."
        },
        {
            nome: 'Fernanda Romano',
            curriculo: ["Psicologa", "Pós-graduanda"],
            contato: "5571992394554",
            imagem: "img/nadna3.jpg",
            especialidades: ["Psicoterapia Analítica","Gênero", "Feminino"],
            crp:'03/26711',
            formacao: ["Formada pela Escola Bahiana de Medicina e Saúde Pública. </br> Pós-graduanda em Psicoterapia Analítica pelo IJEP, Fernanda desenvolve um trabalho que une técnica, sensibilidade e criatividade. Acredita em uma psicologia viva, humana e plural, que se faz no encontro entre pessoas e na escuta genuína das singularidades."],
            bio: "Apaixonada por arte, fotografia e literatura, traz a tais recursos como aliados em seus processos terapêuticos. Seus campos de interesse incluem os estudos sobre o feminino, interpretação dos sonhos, mitologia e contos de fadas — elementos que atravessam e enriquecem sua prática clínica."
        },
        {
            nome: 'João Araújo',
            curriculo: ["Psicólogo", "Pós-graduando"],
            contato: "5571992394554",
            imagem: "img/joao5.jpg",
            especialidades: ["Crise Suicida", "Orientação Profissional", "Atendimento a crianças"],
            crp: '03/27523',
            formacao: ["Graduação em Psicologia - EBMSP", "Pós-graduação em Andamento - Psicoterapia Analítica"],
            bio: "Atuação voltada ao (re)conhecimento de si, cuidados com desejos de morte. Praticamente e aplicante de Mindfullness, em momentos de crises e no cotidiano. Atendimento e cuidados a crianças e adolescentes. Estuda genêros, ideação suicida, mitos e o lúdico na clínica. Realiza orientação de vida e carreira."
        },
        {
            nome: 'Alana Pitanga',
            curriculo: ["Psicóloga", "Pós-graduada"],
            contato: "5571992394554",
            imagem: "img/Alana.jpg",
            especialidades: ["Psicologia Analítica", "Neuropsicologia"],
            crp:'03/16003',
            formacao: ["Graduação em Psicologia - UNIFACS", "Especialização em Psicologia Hospitalar"],
            bio: "Atuo como psicóloga através da abordagem analítica de Carl G. Jung. Participei de grupos de estudo e pesquisa acerca da pós-modernidade, sendo meu maior foco, assim como respiração e meditação.</br>Acredito que o trabalho é um ato de amor próprio, de dividir e se dar conta junto com o outro. Não repreender a vida, mas lidar com ela e encontrar ferramentas dentro dela (e de si), é um instrumento vital para caminhar em qualquer direção."
        },
        {
            nome: 'Julia Péret',
            curriculo: ["Psicóloga", "Pós-graduada"],
            contato: "5571992394554",
            imagem: "img/juliaP.jpg",
            especialidades: ["Arteterapia", "LGBTQIAP+"],
            crp: '03/21052 ',
            formacao: ["Possui graduação em Psicologia pela Escola Bahiana de Medicina e Saúde Pública. </br> Especialização em Arteterapia Junguiana pelo Instituto Junguiano da Bahia. </br> Mestra pelo Programa Multidisciplinar de Pós-Graduação em Cultura e Sociedade da Universidade Federal da Bahia (UFBA)."],
            bio: "Pesquisa no campo psicológico dos Complexos Culturais, se debruçando sobre o sofrimento psíquico gerado pelo machismo, racismo e LGBTfobias estruturais. É integrante do Núcleo de Pesquisa e Extensão em Culturas, Gêneros e Sexualidades (NuCuS) e tem experiência na área de Psicologia Clínica, com ênfase em Saúde Mental, trabalhando com a abordagem Junguiana. "
        },
        {
            nome: 'Louise Rosado',
            curriculo: ["Psicóloga", "Pós-graduada"],
            contato: "5571992394554",
            imagem: "img/Louise.jpg",
            especialidades: ["Psicologia Analítica", "Saúde Mental"],
            crp:'03/21339',
            formacao: ["Psicóloga formada pela Escola Bahiana de Medicina e Saúde Pública. </br> Pós Graduação em Psicoterapia Analítica pelo Instituto Junguiano da Bahia."],
            bio: "Possui experiência em Saúde Mental e Psicologia Clínica."
        },
        {
            nome: 'Julia Kammuller',
            curriculo: ["Psicóloga", "Pós-graduada"],
            contato: "5571992394554",
            imagem: "img/JuliaK.jpg",
            especialidades: ["Psicologia Analítica", "Compulsão Alimentar", "Depressão"],
            crp: '03/18559',
            formacao: ["Graduada pela Escola Bahiana de Medicina e Saúde Pública. </br> pós graduada em psicoterapia Analítica pela Clínica Psiquê."],
            bio: "Encantada com a profundidade e complexidade do ser humano, vejo na clínica, fundamentada nos conceitos Juguianos, a possibilidade de ajudar pessoas a viverem melhor. </br> Com experiência em compulsões alimentares e depressão, no fazer clínico busco aprofundar para compreender a origem dos sintomas, levando em conta a subjetividade do sujeito, para que seja possível transformar e elaborar o sofrimento. Atendo adolescentes e adultos."
        },
        {
            nome: 'Mayla Araújo',
            curriculo: ["Psicóloga", "Pós-graduada"],
            contato: "5571992394554",
            imagem: "img/Mayla.jpg",
            especialidades: ["Psicologia Analítica", "Preparação Mental"],
            crp: '03/21052',
            formacao: ["Graduada em Psicologia pela Escola Bahiana de Medicina e Saúde Pública.</br> pós-graduada em Abordagem Junguiana pelo IDE."],
            bio: "Tenho uma profunda paixão pelo estudo do inconsciente, explorando as formas simbólicas que ele nos traz, acessíveis por meio da fala, dos sonhos e da arte, e que podem nos guiar no processo de individuação. Como afirmou Nise da Silveira: 'Todo mundo deve inventar alguma coisa; a criatividade reúne em si várias funções psicológicas importantes para a reestruturação da psique. O que cura, fundamentalmente, é o estímulo à criatividade. Ela é indestrutível. A criatividade está em toda parte.'"
        }
    ];

    let currentModal = null;
    let currentIndex = 0;

    function createCard(person, index) {
        const card = document.createElement('div');
        card.classList.add('card');
        
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${person.imagem || 'img/padrao.jpg'}" alt="${person.nome}" class="foto-profissional" onerror="this.src='img/padrao.jpg'">
            </div>
            <div class="card-content">
                <h2>${person.nome}</h2>
                <p>${person.curriculo.join(' | ')}</p>
                <button class="card-btn">Agendar consulta</button>
            </div>
        `;
        
        card.querySelector('.card-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(`https://wa.me/${person.contato}?text=Olá ${person.nome}, gostaria de agendar uma consulta`, '_blank');
        });
        
        card.addEventListener('click', () => {
            currentIndex = index;
            openModal(pessoas[currentIndex]);
        });
        
        return card;
    }

    function openModal(person) {
        closeModal();
        
        const modal = document.createElement('div');
        modal.classList.add('modal-perfil');
        currentModal = modal;
        modal.innerHTML = `
            <div class="modal-conteudo">
                <button class="fechar-modal">&times;</button>
                <div class="modal-img-container">
                    <img src="${person.imagem || 'img/padrao.jpg'}" alt="${person.nome}" class="modal-foto" onerror="this.src='img/padrao.jpg'">
                </div>
                <div class="modal-nav">
                    <button class="nav-btn prev-btn">‹</button>
                    <h2>${person.nome}</h2>
                    <button class="nav-btn next-btn">›</button>
                </div>
                <div class="detalhes">
                    <h3>CRP</h3>
                    <p id="modal-crp">${person.crp}</p>
                    <h3>Especialidades</h3>
                    <ul>${(person.especialidades || ['Não informado']).map(e => `<li>${e}</li>`).join('')}</ul>
                    <h3>Formação</h3>
                    <p id="modal-formacao">${(person.formacao || ['Não informado']).join('<br>')}</p>
                    <h3>Sobre</h3>
                    <p id="modal-bio">${person.bio || 'Informações não disponíveis'}</p>
                </div>
                <button class="botao-contato">Agendar com ${person.nome}</button>
            </div>
        `;
        
        modal.querySelector('.fechar-modal').addEventListener('click', closeModal);
        
        modal.querySelector('.botao-contato').addEventListener('click', () => {
            window.open(`https://wa.me/${person.contato}?text=Olá ${person.nome}, gostaria de agendar uma consulta`, '_blank');
        });
        
        modal.querySelector('.prev-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + pessoas.length) % pessoas.length;
            updateModalContent(pessoas[currentIndex]);
        });
        
        modal.querySelector('.next-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % pessoas.length;
            updateModalContent(pessoas[currentIndex]);
        });
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    function updateModalContent(person) {
        if (!currentModal) return;
        
        currentModal.querySelector('.modal-foto').src = person.imagem || 'img/padrao.jpg';
        currentModal.querySelector('.modal-nav h2').textContent = person.nome;
        currentModal.querySelector('.detalhes ul').innerHTML = 
            (person.especialidades || ['Não informado']).map(e => `<li>${e}</li>`).join('');
        currentModal.querySelector('#modal-crp').textContent = person.crp || 'Não informado';
        currentModal.querySelector('#modal-formacao').innerHTML = 
            (person.formacao || ['Não informado']).join('<br>');
        currentModal.querySelector('#modal-bio').textContent = 
            person.bio || 'Informações não disponíveis';

        currentModal.querySelector('.botao-contato').textContent = `Agendar com ${person.nome}`;
        currentModal.querySelector('.botao-contato').onclick = () => {
             window.open(`https://wa.me/${person.contato}?text=Olá ${person.nome}, gostaria de agendar uma consulta`, '_blank');
        };
    }

    function closeModal() {
        if (currentModal) {
            currentModal.classList.remove('active');
            
            setTimeout(() => {
                if (currentModal && currentModal.parentNode) {
                    document.body.removeChild(currentModal);
                }
                currentModal = null;
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    function init() {
        const container = document.getElementById('container');
        container.innerHTML = '';
        
        pessoas.forEach((person, index) => {
            container.appendChild(createCard(person, index));
        });
    }

    init();
});