/*
 * Pastas de fotos/vídeos com visualizador em tela cheia.
 *
 * Uso:
 *   const pastas = Pastas.lerTemplate(document.getElementById('meuTemplate'));
 *   Pastas.render(document.getElementById('container'), pastas, { ...opções });
 *
 * Cada pasta: { slug, titulo, itens: [{ tipo: 'image'|'video', src, legenda, alt, id?, removivel? }] }
 *
 * Opções:
 *   textoVazio      texto exibido quando não há pastas
 *   mostrarVazias   exibe pastas sem itens (útil para administradores)
 *   linkAdmin(p)    retorna um link "Adicionar" exibido no topo da pasta aberta
 *   aoExcluir(item, pasta)  função assíncrona; se existir, mostra a lixeira nos itens "removivel"
 */
(function() {
    'use strict';

    const ICONES = {
        pasta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
        abrir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
        fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        anterior: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
        proxima: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
        lixeira: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>'
    };

    function esc(v) {
        return String(v ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function slugify(texto) {
        return String(texto || '')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'pasta';
    }

    function contagemTexto(itens) {
        const fotos = itens.filter(i => i.tipo !== 'video').length;
        const videos = itens.length - fotos;
        const partes = [];
        if (fotos) partes.push(`${fotos} ${fotos === 1 ? 'foto' : 'fotos'}`);
        if (videos) partes.push(`${videos} ${videos === 1 ? 'vídeo' : 'vídeos'}`);
        return partes.length ? partes.join(' · ') : 'Pasta vazia';
    }

    function midiaHtml(item, extras) {
        if (item.tipo === 'video') {
            // "#t=0.5" faz o navegador mostrar um quadro do vídeo como prévia
            return `<video src="${esc(item.src)}#t=0.5" preload="metadata" muted playsinline ${extras || ''}></video>`;
        }
        return `<img src="${esc(item.src)}" alt="${esc(item.alt || item.legenda || '')}" loading="lazy" decoding="async" ${extras || ''}>`;
    }

    // ---------------------------------------------------------------
    // Leitura de pastas escritas direto no HTML (dentro de <template>)
    // ---------------------------------------------------------------
    function lerTemplate(template) {
        if (!template) return [];
        const raiz = template.content || template;
        return Array.from(raiz.querySelectorAll('.pasta')).map(el => ({
            slug: el.dataset.slug || slugify(el.dataset.titulo),
            titulo: el.dataset.titulo || 'Pasta',
            itens: Array.from(el.querySelectorAll('img, video')).map(m => ({
                tipo: m.tagName === 'VIDEO' ? 'video' : 'image',
                src: m.getAttribute('src'),
                alt: m.getAttribute('alt') || '',
                legenda: m.dataset.legenda || m.getAttribute('title') || ''
            }))
        }));
    }

    // ---------------------------------------------------------------
    // Estado global (uma pasta aberta por vez)
    // ---------------------------------------------------------------
    const estado = {
        pastas: [],
        container: null,
        opcoes: {},
        modal: null,
        pastaAberta: null,
        historicoEmpurrado: false,
        lightbox: null,
        indiceAtual: 0,
        focoAnterior: null,
        focoAntesLightbox: null
    };

    function travarRolagem(travar) {
        document.documentElement.style.overflow = travar ? 'hidden' : '';
        document.body.style.overflow = travar ? 'hidden' : '';
    }

    // ---------------------------------------------------------------
    // Grade de pastas
    // ---------------------------------------------------------------
    function render(container, pastas, opcoes) {
        estado.container = container;
        estado.pastas = pastas;
        estado.opcoes = opcoes || {};

        const visiveis = pastas.filter(p => p.itens.length > 0 || estado.opcoes.mostrarVazias);
        if (visiveis.length === 0) {
            container.innerHTML = `<p class="pastas-vazio">${esc(estado.opcoes.textoVazio || 'Nenhuma pasta disponível.')}</p>`;
            return;
        }

        container.innerHTML = visiveis.map(p => {
            const capaItem = p.itens.find(i => i.tipo !== 'video') || p.itens[0];
            const capa = capaItem
                ? midiaHtml(capaItem, 'alt=""')
                : `<span class="pasta-capa-vazia">${ICONES.pasta}</span>`;
            return `
                <button type="button" class="pasta-card" data-slug="${esc(p.slug)}"
                        aria-label="Abrir pasta ${esc(p.titulo)} (${esc(contagemTexto(p.itens))})">
                    <span class="pasta-corpo">
                        <span class="pasta-capa">
                            ${capa}
                            <span class="pasta-abrir">Abrir ${ICONES.abrir}</span>
                        </span>
                        <span class="pasta-info">
                            <span class="pasta-icone">${ICONES.pasta}</span>
                            <span class="pasta-textos">
                                <span class="pasta-titulo">${esc(p.titulo)}</span>
                                <span class="pasta-contagem">${esc(contagemTexto(p.itens))}</span>
                            </span>
                        </span>
                    </span>
                </button>`;
        }).join('');

        container.querySelectorAll('.pasta-card').forEach(card => {
            card.addEventListener('click', () => abrirPasta(card.dataset.slug));
        });
    }

    function buscarPasta(slug) {
        return estado.pastas.find(p => p.slug === slug) || null;
    }

    // ---------------------------------------------------------------
    // Janela da pasta (lista de miniaturas)
    // ---------------------------------------------------------------
    function abrirPasta(slug, { doHistorico = false } = {}) {
        const pasta = buscarPasta(slug);
        if (!pasta) return;

        if (estado.modal) fecharModalImediato();

        estado.focoAnterior = document.activeElement;
        estado.pastaAberta = pasta;

        const modal = document.createElement('div');
        modal.className = 'pasta-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'pasta-modal-titulo');
        modal.innerHTML = `
            <div class="pasta-painel">
                <div class="pasta-cabecalho">
                    <div class="pasta-cabecalho-textos">
                        <h3 id="pasta-modal-titulo">${esc(pasta.titulo)}</h3>
                        <p class="pasta-contagem"></p>
                    </div>
                    ${estado.opcoes.linkAdmin ? `<a class="pasta-acao-admin" href="${esc(estado.opcoes.linkAdmin(pasta))}">+ Adicionar</a>` : ''}
                    <button type="button" class="pasta-fechar" aria-label="Fechar pasta">${ICONES.fechar}</button>
                </div>
                <div class="pasta-miniaturas"></div>
            </div>`;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharPasta();
        });
        modal.querySelector('.pasta-fechar').addEventListener('click', fecharPasta);

        document.body.appendChild(modal);
        estado.modal = modal;
        renderMiniaturas();
        travarRolagem(true);

        requestAnimationFrame(() => modal.classList.add('aberta'));
        modal.querySelector('.pasta-fechar').focus({ preventScroll: true });

        // Botão "voltar" do celular fecha a pasta em vez de sair da página
        const hash = `#pasta-${pasta.slug}`;
        if (!doHistorico) {
            if (window.location.hash === hash) {
                estado.historicoEmpurrado = false;
            } else {
                history.pushState({ pasta: pasta.slug }, '', hash);
                estado.historicoEmpurrado = true;
            }
        }
    }

    function renderMiniaturas() {
        const pasta = estado.pastaAberta;
        const modal = estado.modal;
        if (!pasta || !modal) return;

        modal.querySelector('.pasta-cabecalho .pasta-contagem').textContent = contagemTexto(pasta.itens);
        const grade = modal.querySelector('.pasta-miniaturas');

        if (pasta.itens.length === 0) {
            grade.innerHTML = '<p class="pastas-vazio">Esta pasta ainda não tem fotos ou vídeos.</p>';
            return;
        }

        const podeExcluir = typeof estado.opcoes.aoExcluir === 'function';
        grade.innerHTML = pasta.itens.map((item, i) => `
            <div class="pasta-miniatura">
                <button type="button" class="pasta-miniatura-btn" data-indice="${i}"
                        aria-label="${item.tipo === 'video' ? 'Assistir vídeo' : 'Ampliar foto'} ${i + 1} de ${pasta.itens.length}${item.legenda ? ': ' + esc(item.legenda) : ''}">
                    ${midiaHtml(item, 'alt=""')}
                    ${item.tipo === 'video' ? `<span class="pasta-play"><span>${ICONES.play}</span></span>` : ''}
                </button>
                ${podeExcluir && item.removivel ? `<button type="button" class="pasta-excluir" data-indice="${i}" aria-label="Excluir este item">${ICONES.lixeira}</button>` : ''}
                ${item.legenda ? `<span class="pasta-legenda-mini">${esc(item.legenda)}</span>` : ''}
            </div>`).join('');

        grade.querySelectorAll('.pasta-miniatura-btn').forEach(btn => {
            btn.addEventListener('click', () => abrirLightbox(Number(btn.dataset.indice), btn));
        });

        grade.querySelectorAll('.pasta-excluir').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const indice = Number(btn.dataset.indice);
                const item = pasta.itens[indice];
                if (!confirm('Excluir este item permanentemente?')) return;
                btn.disabled = true;
                try {
                    await estado.opcoes.aoExcluir(item, pasta);
                    pasta.itens.splice(indice, 1);
                    renderMiniaturas();
                    render(estado.container, estado.pastas, estado.opcoes);
                } catch (err) {
                    alert(err && err.message ? err.message : 'Não foi possível excluir.');
                    btn.disabled = false;
                }
            });
        });
    }

    function fecharModalImediato() {
        if (estado.lightbox) fecharLightbox(true);
        if (estado.modal) estado.modal.remove();
        estado.modal = null;
        estado.pastaAberta = null;
        travarRolagem(false);
    }

    function fecharPasta() {
        if (!estado.modal) return;
        if (estado.historicoEmpurrado) {
            estado.historicoEmpurrado = false;
            history.back(); // o evento popstate fecha a janela
            return;
        }
        if (window.location.hash.startsWith('#pasta-')) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        fecharComAnimacao();
    }

    function fecharComAnimacao() {
        const modal = estado.modal;
        if (!modal) return;
        if (estado.lightbox) fecharLightbox(true);
        modal.classList.remove('aberta');
        estado.modal = null;
        estado.pastaAberta = null;
        travarRolagem(false);
        setTimeout(() => modal.remove(), 250);
        if (estado.focoAnterior && document.contains(estado.focoAnterior)) {
            estado.focoAnterior.focus({ preventScroll: true });
        }
    }

    window.addEventListener('popstate', (e) => {
        const slug = e.state && e.state.pasta;
        if (slug && buscarPasta(slug)) {
            if (!estado.modal || estado.pastaAberta.slug !== slug) abrirPasta(slug, { doHistorico: true });
        } else if (estado.modal) {
            estado.historicoEmpurrado = false;
            fecharComAnimacao();
        }
    });

    // ---------------------------------------------------------------
    // Visualizador em tela cheia (com efeito de ampliar a partir da miniatura)
    // ---------------------------------------------------------------
    function abrirLightbox(indice, origem) {
        const pasta = estado.pastaAberta;
        if (!pasta) return;

        estado.focoAntesLightbox = origem || document.activeElement;
        const lb = document.createElement('div');
        lb.className = 'pasta-lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.setAttribute('aria-label', 'Visualizador de fotos');
        lb.innerHTML = `
            <span class="pasta-lb-contador" aria-live="polite"></span>
            <button type="button" class="pasta-lb-btn pasta-lb-fechar" aria-label="Fechar">${ICONES.fechar}</button>
            <button type="button" class="pasta-lb-btn pasta-lb-anterior" aria-label="Anterior">${ICONES.anterior}</button>
            <figure class="pasta-lightbox-palco"></figure>
            <button type="button" class="pasta-lb-btn pasta-lb-proxima" aria-label="Próxima">${ICONES.proxima}</button>
            <span class="pasta-lb-dica">Deslize para o lado para navegar</span>`;

        lb.querySelector('.pasta-lb-fechar').addEventListener('click', () => fecharLightbox());
        lb.querySelector('.pasta-lb-anterior').addEventListener('click', (e) => { e.stopPropagation(); navegar(-1); });
        lb.querySelector('.pasta-lb-proxima').addEventListener('click', (e) => { e.stopPropagation(); navegar(1); });
        lb.addEventListener('click', (e) => {
            if (e.target === lb) fecharLightbox();
        });
        ligarGestos(lb);

        document.body.appendChild(lb);
        estado.lightbox = lb;
        mostrarItem(indice, origem);
        requestAnimationFrame(() => lb.classList.add('aberta'));
        lb.querySelector('.pasta-lb-fechar').focus({ preventScroll: true });
    }

    function mostrarItem(indice, origem) {
        const pasta = estado.pastaAberta;
        const lb = estado.lightbox;
        if (!pasta || !lb || pasta.itens.length === 0) return;

        const total = pasta.itens.length;
        estado.indiceAtual = (indice + total) % total;
        const item = pasta.itens[estado.indiceAtual];

        const palco = lb.querySelector('.pasta-lightbox-palco');
        const antigo = palco.querySelector('video');
        if (antigo) antigo.pause();

        const midia = item.tipo === 'video'
            ? `<video src="${esc(item.src)}" controls playsinline preload="metadata"></video>`
            : `<img src="${esc(item.src)}" alt="${esc(item.alt || item.legenda || '')}">`;
        palco.innerHTML = `${midia}<figcaption>${esc(item.legenda || '')}</figcaption>`;

        lb.querySelector('.pasta-lb-contador').textContent = `${estado.indiceAtual + 1} / ${total}`;
        const varios = total > 1;
        lb.querySelector('.pasta-lb-anterior').style.display = varios ? '' : 'none';
        lb.querySelector('.pasta-lb-proxima').style.display = varios ? '' : 'none';
        lb.querySelector('.pasta-lb-dica').style.visibility = varios ? '' : 'hidden';

        animarEntrada(palco.querySelector('img, video'), origem);
    }

    // Efeito de "ampliar": a foto cresce a partir da posição da miniatura clicada.
    function animarEntrada(el, origem) {
        if (!el) return;
        const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const aplicar = () => {
            const destino = el.getBoundingClientRect();
            if (!destino.width || !destino.height) return;

            if (origem && !reduzir) {
                const inicio = origem.getBoundingClientRect();
                const dx = inicio.left - destino.left;
                const dy = inicio.top - destino.top;
                const sx = inicio.width / destino.width;
                const sy = inicio.height / destino.height;
                el.style.transition = 'none';
                el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
                el.style.opacity = '0.6';
            } else {
                el.style.transition = 'none';
                el.style.transform = 'scale(0.85)';
                el.style.opacity = '0';
                el.style.transformOrigin = 'center';
            }
            el.getBoundingClientRect(); // força o navegador a aplicar o estado inicial
            el.style.transition = reduzir ? 'none' : 'transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease';
            el.style.transform = 'none';
            el.style.opacity = '1';
        };

        if (el.tagName === 'IMG' && !el.complete) {
            el.style.opacity = '0';
            el.addEventListener('load', aplicar, { once: true });
            el.addEventListener('error', () => { el.style.opacity = '1'; }, { once: true });
        } else if (el.tagName === 'VIDEO' && el.readyState < 1) {
            el.addEventListener('loadedmetadata', aplicar, { once: true });
        } else {
            aplicar();
        }
    }

    function navegar(passo) {
        mostrarItem(estado.indiceAtual + passo, null);
    }

    function fecharLightbox(imediato) {
        const lb = estado.lightbox;
        if (!lb) return;
        const video = lb.querySelector('video');
        if (video) video.pause();
        estado.lightbox = null;
        if (imediato) {
            lb.remove();
        } else {
            lb.classList.remove('aberta');
            setTimeout(() => lb.remove(), 250);
            if (estado.focoAntesLightbox && document.contains(estado.focoAntesLightbox)) {
                estado.focoAntesLightbox.focus({ preventScroll: true });
            }
        }
    }

    // Gestos no celular: deslizar para os lados navega; deslizar para baixo fecha.
    function ligarGestos(lb) {
        let inicioX = 0, inicioY = 0, toques = 0, ativo = false;

        lb.addEventListener('touchstart', (e) => {
            toques = e.touches.length;
            if (toques !== 1) { ativo = false; return; }
            ativo = true;
            inicioX = e.touches[0].clientX;
            inicioY = e.touches[0].clientY;
        }, { passive: true });

        lb.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) ativo = false; // pinça para zoom: ignora
        }, { passive: true });

        lb.addEventListener('touchend', (e) => {
            if (!ativo || toques !== 1) return;
            ativo = false;
            if (e.target.closest('video')) return; // não atrapalha os controles do vídeo
            const t = e.changedTouches[0];
            const dx = t.clientX - inicioX;
            const dy = t.clientY - inicioY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                navegar(dx < 0 ? 1 : -1);
            } else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.3) {
                fecharLightbox();
            }
        });
    }

    // Teclado: Esc fecha, setas navegam.
    document.addEventListener('keydown', (e) => {
        if (estado.lightbox) {
            if (e.key === 'Escape') { e.preventDefault(); fecharLightbox(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); navegar(1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); navegar(-1); }
        } else if (estado.modal && e.key === 'Escape') {
            e.preventDefault();
            fecharPasta();
        }
    });

    // Abre automaticamente a pasta indicada no endereço (ex.: galeria.html#pasta-palestras)
    function abrirPeloEndereco() {
        const m = window.location.hash.match(/^#pasta-(.+)$/);
        if (m && buscarPasta(decodeURIComponent(m[1]))) {
            abrirPasta(decodeURIComponent(m[1]), { doHistorico: true });
        }
    }

    window.Pastas = { lerTemplate, render, abrir: abrirPasta, abrirPeloEndereco, slugify, contagemTexto };
})();
