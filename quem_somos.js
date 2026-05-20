document.addEventListener('DOMContentLoaded', function() {
    console.log("Script atualizado carregado com sucesso!"); // Se não aparecer isso no console, é cache!

    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    // Proteção: O script não vai mais travar se o id "container" não existir na página.
    const container = document.getElementById('container');
    if (container) {
        const pessoas = [
            {
                nome: 'Ricardo Mattos',
                curriculo: ["Psicólogo", "Pós-graduado", "Mestrando"],
                contato: "5571920004468",
                imagem: "img/ric3.jpg",
                especialidades: ["Psicologia Analítica","Ansiedade", "Depressão"],
                crp: "27/21157",
                formacao: ["formado pela Escola Bahiana de Medicina e Saúde Pública. </br> pós-graduado pelo Instituto Junguiano da Bahia"],
                bio: "Membro fundador da Clínica Arquê. Sua prática é pautada por uma escuta profunda, respeitosa e simbólica..."
            },
            {
                nome: 'Fernando Lopes',
                curriculo: ["Psicologo", "Pós-graduado"],
                contato: "5571920004468",
                imagem: "img/nando3.jpg",
                especialidades: ["Psicoterapia Analítica", "Morte e morrer", "Suicidio"],
                crp:'03/18814',
                formacao: ["Psicólogo com formação pela Escola Bahiana de Medicina e Saúde Pública (EBMSP)."],
                bio: "Com uma escuta atenta e um olhar voltado ao processo de autoconhecimento..."
            },
            {
                nome: 'Fernanda Romano',
                curriculo: ["Psicologa", "Pós-graduanda"],
                contato: "5571920004468",
                imagem: "img/nadna3.jpg",
                especialidades: ["Psicoterapia Analítica","Gênero", "Feminino"],
                crp:'03/26711',
                formacao: ["Formada pela Escola Bahiana de Medicina e Saúde Pública."],
                bio: "Apaixonada por arte, fotografia e literatura, traz a tais recursos como aliados em seus processos..."
            },
            {
                nome: 'João Araújo',
                curriculo: ["Psicólogo", "Pós-graduando"],
                contato: "5571920004468",
                imagem: "img/joao5.jpg",
                especialidades: ["Crise Suicida", "Masculinos e Masculinidades", "Atendimento a crianças"],
                crp: '03/27523',
                formacao: ["Graduação em Psicologia - EBMSP", "Pós-graduação em Andamento - Psicoterapia Analítica", "Pós-graduado em psicologia Clinica", "Pós-graduando em TEA e neurodivergências"],
                bio: "Atuação voltada ao (re)conhecimento de si, cuidados com desejos de morte."
            },
            {
                nome: 'Julia Kammuller',
                curriculo: ["Psicóloga", "Pós-graduada"],
                contato: "5571920004468",
                imagem: "img/JuliaK.jpg",
                especialidades: ["Psicologia Analítica", "Compulsão Alimentar", "Depressão"],
                crp: '03/18559',
                formacao: ["Graduada pela Escola Bahiana de Medicina e Saúde Pública."],
                bio: "Encantada com a profundidade e complexidade do ser humano..."
            },
            {
                nome: 'Gabriel Kramer Menezes',
                curriculo: ["Psicólogo", "Pós-graduando"],
                contato: "5571920004468",
                imagem: "img/gabriel.jpeg",
                especialidades: ["Psicologia Analítica", "ArteTerapia", "Gênero e sexualidade"],
                crp: '03/35347',
                formacao: ["Graduada pela Escola Bahiana de Medicina e Saúde Pública."],
                bio: "'Sou humano: nada do que é humano me é estranho.' — Terêncio"
            },
            {
                nome: 'Eliane Moraes',
                curriculo: ["Psicóloga", "Pós-graduada"],
                contato: "5571920004468",
                imagem: "img/Eliane.jpeg",
                especialidades: ["Psicologia Analítica", "Psicologia Infantil", "Depressão"],
                crp: '03/13380',
                formacao: ["Graduada em Psicologia pela FACED – Faculdade Divinópolis/MG. Pós-graduada em Psicologia Analítica pelo IJBA (Instituto Junguiano da Bahia). Pós-graduada em Filosofia para Psicólogos (Instituto Dédalus/CE). Pós-graduanda em Ciências da Religião (Instituto Dédalus/CE). "],
                bio: "A Psicologia é, para mim, abrir-se às palavras e aos silêncios. Um espaço seguro onde se pode simplesmente ser — e isso basta para tornar-se inteiro. É abertura à esperança."
            },
            {
                nome: 'Anna Beatriz',
                curriculo: ["Psicóloga", "Pós-graduamda", "Mestranda"],
                contato: "5571920004468",
                imagem: "img/anna.jpeg",
                especialidades: ["Psicologia Analítica", "⁠Clinica racializada", "Arteterapia"],
                crp: '03/35011',
                formacao: ["Graduada em Psicologia pela FACED – Faculdade Divinópolis/MG. Pós-graduada em Psicologia Analítica pelo IJBA (Instituto Junguiano da Bahia). Pós-graduada em Filosofia para Psicólogos (Instituto Dédalus/CE). Pós-graduanda em Ciências da Religião (Instituto Dédalus/CE). "],
                bio: "Como psicóloga junguiana penso em um espaço de escuta, corpo e transição. A clínica é uma trama com linhas sem começo nem fim, de encontrar-se com quem se é."
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
                window.open(`https://wa.me/${person.contato}?text=Olá, gostaria de agendar uma consulta com ${person.nome}`, '_blank');
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
            currentModal.querySelector('.detalhes ul').innerHTML = (person.especialidades || ['Não informado']).map(e => `<li>${e}</li>`).join('');
            currentModal.querySelector('#modal-crp').textContent = person.crp || 'Não informado';
            currentModal.querySelector('#modal-formacao').innerHTML = (person.formacao || ['Não informado']).join('<br>');
            currentModal.querySelector('#modal-bio').textContent = person.bio || 'Informações não disponíveis';
            currentModal.querySelector('.botao-contato').textContent = `Agendar com ${person.nome}`;
            currentModal.querySelector('.botao-contato').onclick = () => {
                 window.open(`https://wa.me/${person.contato}?text=Olá, gostaria de agendar uma consulta com ${person.nome}`, '_blank');
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

        container.innerHTML = '';
        pessoas.forEach((person, index) => {
            container.appendChild(createCard(person, index));
        });
    }

    // 3. FUNCIONALIDADE DO LIGHTBOX (Abre as fotos em tela cheia)
    const allImages = Array.from(document.querySelectorAll('.photos-container img'));
    if (allImages.length > 0) {
        let currentImgIdx = 0;
        const lightboxHTML = `
            <div id="clinicLightbox" class="lightbox">
                <span class="lightbox-close">&times;</span>
                <div class="lightbox-content-wrapper">
                    <img class="lightbox-content" id="lightboxImage">
                    <p class="lightbox-caption" id="lightboxCaption"></p>
                </div>
                <a class="lightbox-nav-btn lightbox-prev">&#10094;</a>
                <a class="lightbox-nav-btn lightbox-next">&#10095;</a>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        const lb = document.getElementById('clinicLightbox');
        const lbImg = document.getElementById('lightboxImage');
        const lbCap = document.getElementById('lightboxCaption');

        const updateLb = (idx) => {
            currentImgIdx = idx;
            lbImg.src = allImages[idx].src;
            lbCap.textContent = allImages[idx].alt;
        };

        allImages.forEach((img, i) => {
            img.addEventListener('click', () => {
                updateLb(i);
                lb.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        document.querySelector('.lightbox-close').onclick = () => {
            lb.classList.remove('active');
            document.body.style.overflow = '';
        };

        document.querySelector('.lightbox-next').onclick = () => updateLb((currentImgIdx + 1) % allImages.length);
        document.querySelector('.lightbox-prev').onclick = () => updateLb((currentImgIdx - 1 + allImages.length) % allImages.length);
    }
});