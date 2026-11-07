'use strict';
const JSON_URL = './cognitio_capitulos_v3.json';
const TREE = './assets/arvore.webp';
let DATA = null;
let state = { query: '', onlyEssential: false, phase: 'todas', exampleArea: 'computacao' };

const el = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const safeUrl = (v) => { try { let u = new URL(v, location.href); return ['https:', 'http:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; } };
const arr = v => Array.isArray(v) ? v : [];
const p = v => v ? `<p>${esc(v)}</p>` : '';
const items = v => `<ul class="guide-list">${arr(v).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
const link = (hash, label, cls = '') => `<a class="${cls}" href="#${esc(hash)}">${esc(label)}</a>`;
const nfmt = n => String(n).padStart(2, '0');
const chapters = () => arr(DATA?.capitulos).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
const allEntries = () => [DATA.capitulo_preliminar, ...chapters(), { id: 'conclusao', titulo: DATA.conclusao?.titulo || 'Conclusão' }];

function renderDonation() {
  return `<p class="site-donation">Se este site te foi útil, considere <a href="https://hospitaldafap.org.br/doe-para-fap">fazer uma doação ao Hospital da FAP</a>.</p>`;
}

function makeHeader(context = 'indice') {
  if (context === 'capa') return '';
  const goBack = context === 'indice' ? '#/capa' : '#/indice';
  const caption = '← Voltar ao índice';
  return `<header class="header header-with-donation"><div class="header-identity"><a class="brand" href="#/capa" aria-label="Cognitio, ir à capa">Cognitio</a>${renderDonation()}</div><nav class="header-right" aria-label="Navegação">${context === 'indice' ? '<a class="top-link" href="#/atlas">Atlas semântico</a>' : `<a class="top-link" href="${goBack}">${caption}</a>`}</nav></header>`;
}

function hero(title, meta, number, subtitle = '', prelim = false) {
  return `<div class="chapter-hero ${prelim ? 'is-prelim' : ''}"><div class="hero-meta">${esc(meta)}</div><div class="hero-number">${esc(number)}</div><h1>${esc(title)}</h1>${subtitle ? `<div class="hero-description">${esc(subtitle)}</div>` : ''}</div>`;
}

function footerNav(current) {
  const entries = allEntries();
  const pos = entries.findIndex(e => e.id === current);
  const prev = entries[pos - 1], next = entries[pos + 1];
  const dest = e => e.id === 'preliminar' ? '#/preliminar' : e.id === 'conclusao' ? '#/conclusao' : `#/capitulo/${encodeURIComponent(e.id)}`;
  return `<nav class="footer-nav" aria-label="Capítulos adjacentes"><div>${prev ? `<a href="${dest(prev)}"><small>← Anterior</small><strong>${esc(prev.titulo)}</strong></a>` : `<a href="#/indice"><small>← Voltar</small><strong>Índice</strong></a>`}</div><div>${next ? `<a href="${dest(next)}"><small>Próximo →</small><strong>${esc(next.titulo)}</strong></a>` : `<a href="#/indice"><small>Voltar ao índice →</small><strong>Índice</strong></a>`}</div></nav>`;
}

function renderCover() {
  return `<main class="page cover" aria-labelledby="book-title"><img src="${TREE}" alt="Ilustração de uma árvore antiga com raízes expostas" class="cover-tree" width="1254" height="1254" fetchpriority="high"><div class="cover-copy"><h1 class="cover-title" id="book-title">Cognitio</h1>${renderDonation()}<a class="thin-link" href="#/indice"><span>Acessar o livro</span><svg viewBox="0 0 32 20" aria-hidden="true"><path d="M1 10h26M19 2l8 8-8 8" /></svg></a></div></main>`;
}

function card(c, index, featured = false) {
  const prelim = c.id === 'preliminar';
  const href = prelim ? '#/preliminar' : `#/capitulo/${encodeURIComponent(c.id)}`;
  const date = prelim ? 'ABERTURA' : c.ano_marco;
  const category = prelim ? c.indice?.categoria : (c.eixo || 'PESQUISA');
  return `<a class="index-card ${featured ? 'is-featured' : ''}" href="${href}" aria-label="Abrir ${esc(c.titulo)}"><div class="card-head"><span class="card-date">${esc(date)}</span><span class="card-category">${esc(category)}</span><span class="card-no">${prelim ? '00' : nfmt(c.ordem || index)}</span></div><h3 class="card-title">${esc(c.titulo)}</h3><p class="card-descr">${esc(c.indice?.pilula || c.cabecalho?.descricao_curta || '')}</p><div class="card-bottom"><span class="arrow-corner" aria-hidden="true">↗</span></div></a>`;
}

function renderIndex() {
  const c = chapters();
  const q = state.query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const indexed = c.filter(x => {
    if (state.onlyEssential && x.prioridade_editorial !== 'essencial') return false;
    const flat = [x.titulo, x.eixo, x.ano_marco, x.indice?.pilula, ...(arr(x.referencias_ids))].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (q && !flat.includes(q)) return false;
    if (state.phase !== 'todas' && !DATA.fases.find(f => f.id === state.phase)?.capitulos.includes(x.id)) return false;
    return true;
  });
  const grouped = arr(DATA.fases).map(f => ({ ...f, found: indexed.filter(x => arr(f.capitulos).includes(x.id)) })).filter(f => f.found.length);
  const prelim = DATA.capitulo_preliminar;
  return `${makeHeader('indice')}<main class="page index-wrap"><div class="index-intro"><h1>Índice</h1></div>
  <aside class="editorial-scope" aria-label="Escopo editorial"><p>${esc(DATA.apresentacao?.aviso_critico || '')}</p></aside>
  <section class="index-zero" aria-label="Antes de começar"><div class="index-eyebrow">Prólogo · comece por aqui</div><div class="chapter-grid" style="margin-top:18px">${card(prelim, 0, true)}<a class="index-card" href="#/conclusao"><div class="card-head"><span class="card-date">FINAL</span><span class="card-category">SÍNTESE E DECISÃO</span><span class="card-no">↘</span></div><h3 class="card-title">Conclusão</h3><p class="card-descr">${esc(DATA.conclusao?.criterio_de_adocao_pessoal || 'Como decidir se uma técnica vale a pena.')}</p><div class="card-bottom"><span class="arrow-corner">↗</span></div></a></div></section>
  <div class="index-tools" role="search" aria-label="Filtros do índice"><div class="search-control"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5" stroke-linecap="round"/></svg><input id="search" class="field search-field" type="search" value="${esc(state.query)}" aria-label="Buscar no índice" placeholder="Buscar no índice"></div><div class="period-control"><select id="phase" class="field period-field" aria-label="Selecionar período"><option value="todas">Todos os períodos</option>${arr(DATA.fases).map(f => `<option value="${esc(f.id)}" ${state.phase === f.id ? 'selected' : ''}>${esc(f.periodo)} · ${esc(f.titulo)}</option>`).join('')}</select></div><button class="filter-button" id="essential" type="button" role="switch" aria-checked="${state.onlyEssential}" aria-controls="index-results"><span class="switch-track" aria-hidden="true"></span><span>Somente essenciais</span></button><p class="filter-label" id="count" role="status" aria-live="polite" aria-atomic="true">${resultCount(indexed.length, c.length)}</p></div>
  <div id="index-results">${renderIndexGroups(grouped)}</div><p class="index-footnote">As categorias e os recortes históricos são escolhas editoriais; os experimentos pessoais propostos não reproduzem necessariamente as pesquisas citadas.</p></main>`;
}

function renderIndexGroups(grouped) {
  return grouped.length ? grouped.map(f => `<section class="phase-block"><div class="phase-heading"><div><span class="eyebrow">${esc(f.periodo)} · ${String(f.found.length).padStart(2, '0')} capítulos</span><h2>${esc(f.titulo)}</h2></div><p>${esc(f.tese)}</p></div><div class="chapter-grid">${f.found.map((x, i) => card(x, i, x.prioridade_editorial === 'essencial' && i === 0)).join('')}</div></section>`).join('') : `<p class="empty-state">Nenhum capítulo corresponde a essa busca.</p>`;
}

function section(title, kicker, body, note = '') {
  return `<section class="story-section"><div class="section-head"><div><div class="section-kicker">${esc(kicker)}</div><h2 class="section-title">${esc(title)}</h2></div>${note ? `<p class="section-note">${esc(note)}</p>` : ''}</div>${body}</section>`;
}

function factsCards(c) {
  const k = c.cartoes || {}, ex = k.experimento || {};
  const cards = [['A promessa teórica', k.promessa_teorica, ''], ['Onde brilha', k.onde_brilha, ''], ['Onde morre na praia', k.onde_morre_na_praia, ''], ['Experimento pessoal', ex.convite, ex.metrica]];
  return `<div class="four-cards">${cards.map((v, i) => `<article class="evidence-card ${i === 3 ? 'is-dark' : ''}"><div class="evidence-label">${['✦', '↗', '△', '◷'][i]} ${esc(v[0])}</div><p class="evidence-body">${esc(v[1] || '')}</p>${v[2] ? `<small>${esc(v[2])}</small>` : ''}</article>`).join('')}</div><div class="verdict"><strong>Veredito do praticante:</strong> ${esc(c.veredito_do_praticante || '')} </div>`;
}

function appGuide(a) {
  const g = a.guia_de_aplicacao || {}, basic = g.roteiro_para_iniciantes || {};
  const worked = basic.exemplo_resolvido || a.exemplo_resolvido || {};
  const challenge = basic.exercicio_inedito || a.exercicio_inedito || {};
  const pre = g.preparacao || {}, evaluation = g.avaliacao || {}, decision = evaluation.criterios_de_decisao || {};
  const ex1 = worked.pergunta_para_tentar ? `<div class="worked-example">
    <div class="worked-kicker">01 · ENTENDA O CASO E TENTE RESPONDER</div>
    ${basic.termos_essenciais ? `<p class="worked-gloss"><strong>Vocabulário:</strong> ${esc(basic.termos_essenciais)}</p>` : ''}
    <p class="worked-scene"><strong>Situação:</strong> ${esc(worked.situacao)}</p>
    <p class="worked-question"><strong>Pergunta:</strong> ${esc(worked.pergunta_para_tentar)}</p>
    <p class="attempt-reminder">Escreva sua resposta ou “não sei” antes de abrir a explicação.</p>
    <details class="worked-answer"><summary>Revelar resposta explicada</summary><p>${esc(worked.resposta_e_por_que)}</p></details>
  </div>` : '';
  const ex2 = challenge.pergunta ? `<div class="worked-example is-transfer">
    <div class="worked-kicker">02 · AGORA VOCÊ: UM CASO DIFERENTE</div>
    <p class="worked-scene"><strong>Nova situação:</strong> ${esc(challenge.situacao || '')}</p>
    <p class="worked-question"><strong>Resolva sem consulta:</strong> ${esc(challenge.pergunta)}</p>
    <p class="attempt-reminder">Só revele a solução depois de registrar sua própria tentativa.</p>
    <details class="worked-answer"><summary>Revelar gabarito da variante</summary><p>${esc(challenge.gabarito_comentado)}</p></details>
  </div>` : '';
  return `<div class="long-guide">
  ${basic.objetivo_em_linguagem_simples ? `<p class="guide-question">${esc(basic.objetivo_em_linguagem_simples)}</p>` : ''}
  ${ex1}${ex2}
  <h4>03 · Faça o exercício do começo ao fim</h4>
  <p class="guide-intro">O exemplo ensina a regra. O segundo caso e as tentativas posteriores ajudam a observar se você consegue usá-la sem ajuda.</p>
  <ol class="guide-timeline">${arr(g.roteiro).map(step => `<li><span class="step-index">${nfmt(step.etapa || 0)}</span><strong>${esc(step.nome)}</strong><p>${esc(step.instrucao)}</p><small>${esc(step.saida)}</small></li>`).join('')}</ol>
  <h4>04 · Materiais e conferência</h4>
  ${[['Materiais concretos', pre.materiais], ['Como criar mais questões', pre.conjuntos], ['Tempo previsto para o teste', pre.tempo_e_custo], ['Conferência dos gabaritos', pre.controle_de_qualidade]].filter(([_, val]) => val).map(([label, val]) => `<p class="edition-warning"><strong>${esc(label)}:</strong> ${esc(val)}</p>`).join('')}
  <h4>05 · Avalie antes de decidir</h4>
  ${evaluation.momento_sugerido ? `<p class="edition-warning"><strong>Reteste:</strong> ${esc(evaluation.momento_sugerido)}</p>` : ''}
  <ul class="assessment-list">${arr(evaluation.indicadores).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${Object.keys(decision).length ? `<h4>06 · Manter, ajustar ou abandonar</h4>${Object.entries(decision).map(([k, v]) => `<p class="edition-warning"><strong>${esc(k.replaceAll('_', ' '))}:</strong> ${esc(v)}</p>`).join('')}` : ''}
  ${g.o_que_nao_inferir ? `<p class="edition-warning"><strong>O que não concluir:</strong> ${esc(g.o_que_nao_inferir)}</p>` : ''}
  ${g.seguranca ? `<p class="edition-warning"><strong>Segurança:</strong> ${esc(g.seguranca)}</p>` : ''}
  </div>`;
}

function domain(a, title, number) {
  return `<article class="domain-card"><div class="domain-top"><span class="domain-type">${esc(title)}</span><span class="domain-no">${number}</span></div>
  <h3>${esc(a.cenario || title)}</h3>
  <p class="domain-blurb">Leia um caso, responda antes de ver a solução, experimente a técnica e resolva uma variante. Depois, confira se você ainda sabe fazer.</p>
  <div class="domain-outcome"><strong>Você vai produzir:</strong> ${esc(a.entrega_observavel)}</div>
  <details class="app-steps"><summary class="action-toggle">Abrir exemplo e roteiro completo</summary>${appGuide(a)}</details></article>`;
}

function exampleSwitch(examples, id) {
  const selected = examples.some(example => example.area === state.exampleArea) ? state.exampleArea : examples[0]?.area;
  return `<div class="example-switch"><div class="example-toggle" role="group" aria-label="Área do exemplo">${examples.map(example => `<button type="button" data-example-area="${esc(example.area)}" aria-pressed="${example.area === selected}" aria-controls="${esc(id)}-${esc(example.area)}">${esc(example.title)}</button>`).join('')}</div>${examples.map(example => `<div class="example-panel" id="${esc(id)}-${esc(example.area)}" data-example-panel="${esc(example.area)}" role="region" aria-label="Exemplo em ${esc(example.title)}" ${example.area === selected ? '' : 'hidden'}>${example.content}</div>`).join('')}</div>`;
}

function attachExampleSwitches() {
  document.querySelectorAll('.example-switch').forEach(group => {
    group.querySelectorAll('[data-example-area]').forEach(button => {
      button.addEventListener('click', () => {
        state.exampleArea = button.dataset.exampleArea;
        group.querySelectorAll('[data-example-area]').forEach(option => {
          option.setAttribute('aria-pressed', String(option.dataset.exampleArea === state.exampleArea));
        });
        group.querySelectorAll('[data-example-panel]').forEach(panel => {
          panel.hidden = panel.dataset.examplePanel !== state.exampleArea;
        });
        updateProgress();
      });
    });
  });
}

function renderRefs(c) {
  const all = arr(DATA.bibliografia);
  const refs = arr(c.referencias_ids).map(id => all.find(x => x.id === id)).filter(Boolean);
  if (!refs.length) return '<p>Não há referência associada a este capítulo no JSON.</p>';
  return `<ul class="ref-list">${refs.map(r => {
    const publication = String(r.publicacao || r.tipo || '').trim();
    const description = publication && !/[.!?]$/.test(publication) ? `${publication}.` : publication;
    return `<li><div class="ref-year">${esc(r.ano)}</div><div><strong>${esc(r.autores)}. ${esc(r.titulo_original)}.</strong><span>${esc(description)}</span>${r.doi ? `<div><span>DOI: ${esc(r.doi)}</span></div>` : ''}${r.url ? ` <a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">Abrir referência ↗</a>` : ''}</div></li>`;
  }).join('')}</ul>`;
}

function renderChapter(c) {
  const n = c.narrativa || {}, d = n.secao_descoberta || {};
  const e = c.evidencia || {};
  const ev = c.avaliacao || {};
  const exp = c.experimento_de_uma_pagina || {};
  const dependencies = arr(c.arvore?.dependencias_conceituais).map(id => chapters().find(x => x.id === id)).filter(Boolean);
  const short = c.cabecalho?.descricao_curta || c.indice?.pilula || '';
  return `${makeHeader('capitulo')}<main class="page chapter-shell">${hero(c.titulo, c.cabecalho?.sobretitulo || c.eixo, nfmt(c.ordem), short)}<div class="story-main"><div class="lead-intro"><div class="side-label">${esc(n.rotulo_abertura || 'A IDEIA EM UMA PÁGINA')}</div><p>${esc(n.abertura || short)}</p></div>
  ${section(d.titulo || 'O que mudou na nossa compreensão', d.rotulo || '01 — A DESCOBERTA', `<div class="story-copy">${arr(d.paragrafos).map(p).join('')}</div>`, d.nota_de_contexto || '')}
  ${section('A ideia, em quatro perspectivas', '02 — O QUE A EVIDÊNCIA SUGERE', factsCards(c), 'O benefício depende do material, do contexto e de como a técnica é aplicada.')}
  ${section('Leve a ideia para a prática', '03 — LABORATÓRIO PESSOAL', `${exampleSwitch([{ area: 'computacao', title: 'Computação', content: domain(c.aplicacoes?.computacao || {}, 'Computação', '01') }, { area: 'medicina', title: 'Medicina', content: domain(c.aplicacoes?.medicina || {}, 'Medicina', '02') }], 'chapter-example')}<p class="critical-foot">${esc(n.ponte_para_a_pratica || 'Exemplos para testar, não receitas de eficácia garantida.')}</p>`, 'Escolha uma área e expanda o guia para ver o protocolo completo.')}
  ${section('O que medir — e quando mudar', '04 — AVALIAÇÃO', `<div class="evaluation-items"><article><h3>Indicador principal</h3><p>${esc(ev.metrica_primaria || '')}</p></article><article><h3>Comparação</h3><p>${esc(ev.como_comparar || '')}</p></article><article><h3>Decisão</h3><p>${esc(ev.ajustar_ou_abandonar || '')}</p></article></div>${ev.evitar_confundidores ? `<p class="critical-foot"><strong>Evite confundir:</strong> ${esc(ev.evitar_confundidores)}</p>` : ''}`)}
  ${section('O experimento em uma página', '05 — UMA HIPÓTESE, UM TESTE', `<div class="rubric">${[['Hipótese', exp.hipotese], ['O que mudar', exp.o_que_mudar], ['Como medir', exp.como_medirei], ['Como evitar o autoengano', exp.como_evitar_autoengano], ['Se não ajudar', exp.o_que_farei_se_nao_ajudar], ['O que a evidência não garante', n.limite_da_inferencia]].filter(([_, v]) => v).map(([k, v]) => `<article><b>${esc(k)}</b><p>${esc(v)}</p></article>`).join('')}</div>`)}
  ${section('O alcance da evidência', '06 — LEITURA CRÍTICA', `<div class="summary-pair"><div><h3>O que foi estudado</h3>${p(e.escopo_que_foi_estudado)}</div><div><h3>O que permanece incerto</h3>${p(e.reserva)}</div></div><div class="mini-context"><strong>${esc(e.grau_editorial || 'Evidência contextual')}</strong><span>Classificação editorial, não índice estatístico universal.</span></div>${dependencies.length ? `<div class="tagstrip">${dependencies.map(dep => `<a class="subtle-link" href="#/capitulo/${encodeURIComponent(dep.id)}">${esc(dep.titulo)} ↗</a>`).join('')}</div>` : ''}`)}
  ${section('Fontes e trabalhos originais', '07 — BIBLIOGRAFIA', renderRefs(c), 'Consulte o estudo para avaliar métodos, participantes, resultados e limites.')}
  ${footerNav(c.id)}</div></main>`;
}

function renderPrelim() {
  const prelim = DATA.capitulo_preliminar || {}, head = prelim.cabecalho || {}, opening = prelim.abertura || {};
  let sections = arr(prelim.secoes).map(sectionData => {
    let content = '';
    if (sectionData.itens) content = `<div class="prelim-list">${arr(sectionData.itens).map(x => `<article class="prelim-box"><b>${esc(x.numero)}</b><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></article>`).join('')}</div>`;
    if (sectionData.etapas) content = `<div class="howto">${arr(sectionData.etapas).map(x => `<article class="howto-step"><span class="howto-number">${esc(x.numero)}</span><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></article>`).join('')}</div>`;
    if (sectionData.momentos) content = `<div class="measure-grid">${arr(sectionData.momentos).map(x => `<article><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></article>`).join('')}</div>${sectionData.aviso ? `<p class="critical-foot">${esc(sectionData.aviso)}</p>` : ''}`;
    if (sectionData.areas) content = exampleSwitch(arr(sectionData.areas).map((a, i) => ({
      area: a.area,
      title: a.area === 'computacao' ? 'Computação' : a.area === 'medicina' ? 'Medicina' : a.area,
      content: `<article class="domain-card"><div class="domain-top"><span class="domain-type">${a.area === 'computacao' ? 'Computação' : a.area === 'medicina' ? 'Medicina' : esc(a.area)}</span><span class="domain-no">0${i + 1}</span></div><h3>${esc(a.titulo)}</h3><ol>${arr(a.passos).map(x => `<li>${esc(x)}</li>`).join('')}</ol><div class="domain-outcome"><strong>Como verificar:</strong> ${esc(a.evidencia_observavel)}</div></article>`
    })), `opening-${sectionData.id}`);
    if (sectionData.epigrafe) content = `<div class="statute"><small>O princípio editorial</small><blockquote>${esc(sectionData.epigrafe)}</blockquote><p>${esc(sectionData.comentario || '')}</p></div>`;
    return section(sectionData.titulo, sectionData.rotulo, content, sectionData.nota || '');
  }).join('');
  const protocol = prelim.registro_minimo_de_experimento || {};
  sections += section('Seu registro mínimo', '06 — DOCUMENTE PARA DECIDIR', `<div class="check-cols">${[['Antes', protocol.antes], ['Durante', protocol.durante], ['Depois', protocol.depois]].map(([title, questions]) => `<div class="check-col"><h3>${title}</h3>${items(questions)}</div>`).join('')}</div><p class="critical-foot">${esc(prelim.nota_metodologica)}</p>`);
  return `${makeHeader('preliminar')}<main class="page chapter-shell">${hero(head.titulo_destaque || prelim.titulo, head.sobretitulo || 'PRELIMINAR', '00', prelim.indice?.pilula || '', true)}<div class="story-main"><div class="lead-intro"><div class="side-label">${esc(opening.rotulo || 'O PROPÓSITO')}</div><div class="opening-copy">${p(opening.texto)}${p(opening.nota_ao_leitor)}</div></div>${sections}${footerNav('preliminar')}</div></main>`;
}

function renderConclusion() {
  const c = DATA.conclusao || {};
  const r = c.regra_de_decisao || {};
  return `${makeHeader('conclusao')}<main class="page chapter-shell">${hero('Conclusão', 'O que permanece', '—', c.tese || '')}<div class="story-main"><div class="lead-intro"><span class="side-label">O CRITÉRIO FINAL</span><p>${esc(c.paradoxo_final)}</p></div>${section('Da evidência à escolha', '01 — REGRAS DE DECISÃO', `<div class="rubric">${Object.entries(r).map(([k, v]) => `<article><b>${esc(k[0].toUpperCase() + k.slice(1))}</b><p>${esc(v)}</p></article>`).join('')}</div>`)}${section('O que levar para a próxima experiência', '02 — PRINCÍPIOS OPERACIONAIS', `<div class="prelim-list">${arr(c.principios_operacionais).map((x, i) => `<article class="prelim-box"><b>${nfmt(i + 1)}</b><p>${esc(x)}</p></article>`).join('')}</div>`)}<div class="end-cover"><h2>${esc(c.titulo)}</h2><p>${esc(c.convite)}</p><a href="#/indice" class="thin-link">Voltar ao índice →</a></div>${footerNav('conclusao')}</div></main>`;
}

function renderAtlas() {
  const nodes = arr(DATA.atlas_semantico?.nos);
  return `${makeHeader('atlas')}<main class="page index-wrap"><div class="index-intro"><div><div class="index-eyebrow">Visão complementar · ordem semântica</div><h1>Atlas</h1></div><p>${esc(DATA.atlas_semantico?.orientacao_visual || 'Dependências e profundidade conceitual.')}</p></div><div class="lead-intro" style="padding:40px 0 65px"><div class="side-label">OUTRA FORMA DE LER</div><p>O índice organiza a narrativa no tempo. Este atlas ajuda a reconhecer fundamentos e relações entre ideias. Não confunda posição na árvore com validade científica.</p></div>${['raiz', 'tronco', 'ramos', 'folhas'].map((depth, i) => { let here = nodes.filter(n => n.profundidade === depth); return section(["Raízes · fundamentos", "Tronco · estrutura", "Ramos · desdobramentos", "Folhas · contextos e especializações"][i], `CAMADA 0${i + 1}`, `<div class="atlas-grid">${here.map(n => `<a href="#/capitulo/${encodeURIComponent(n.id)}" class="atlas-node"><small>${esc(n.ano)} · ${esc(n.eixo)}</small><strong>${esc(n.rotulo)}</strong></a>`).join('')}</div>`); }).join('')}<p class="footer-quiet">${esc(DATA.atlas_semantico?.tipo || 'Relações editoriais interpretativas.')}</p></main>`;
}

function renderFileHelp(reason = '') {
  return `<header class="header header-with-donation"><div class="header-identity"><a class="brand" href="#/capa">Cognitio</a>${renderDonation()}</div></header><main class="page file-loader"><h1>Abra o livro</h1><p>O leitor carrega seus capítulos diretamente do arquivo JSON, sem copiá-los para o HTML.</p><p><strong>Para abrir com duplo clique:</strong> selecione o arquivo <code>cognitio_capitulos_v3.json</code> que está nesta pasta. Isso contorna a restrição de acesso a arquivos locais de alguns navegadores.</p><label class="file-picker" tabindex="0">Selecionar JSON <input id="json-picker" type="file" accept=".json,application/json"></label><p>Ou abra esta pasta com um servidor local: <code>python3 -m http.server 8000</code> e visite <code>http://localhost:8000</code>. Nesse modo, o carregamento é automático.</p>${reason ? `<p role="alert" style="color:var(--rust)">${esc(reason)}</p>` : ''}</main>`;
}

function activeRoute() {
    if (!DATA) { el('app').innerHTML = renderFileHelp(); attachFilePicker(); return; }

    const requestedRoute = decodeURIComponent(location.hash.replace(/^#/, ''));
    const hash = !requestedRoute || requestedRoute === '/' ? '/capa' : requestedRoute;

    let html = '';
    if (hash === '/capa') html = renderCover();
    else if (hash === '/indice') html = renderIndex();
    else if (hash === '/preliminar') html = renderPrelim();
    else if (hash === '/conclusao') html = renderConclusion();
    else if (hash === '/atlas') html = renderAtlas();
    else if (hash.startsWith('/capitulo/')) { 
        const slug = hash.slice('/capitulo/'.length); 
        const found = chapters().find(c => c.id === slug || c.url_slug === slug); 
        html = found ? renderChapter(found) : renderNotFound(); 
    }
    else html = renderNotFound();

    el('app').innerHTML = html;
    if (hash === '/indice') attachIndexControls();
    attachExampleSwitches();

    document.title = (hash === '/indice' ? 'Índice' : hash === '/preliminar' ? 'Antes de começar' : hash === '/capa' ? 'Cognitio' : hash === '/conclusao' ? 'Conclusão' : chapters().find(c => hash.includes(c.id))?.titulo || 'Cognitio') + ' — Cognitio';
    window.scrollTo({ top: 0, behavior: 'instant' }); 
    updateProgress();
}

function renderNotFound() { return `${makeHeader()}<main class="file-loader"><h1>Capítulo não encontrado</h1><p>O endereço não corresponde a uma entrada do JSON.</p><a class="thin-link" href="#/indice">Voltar ao índice →</a></main>`; }

function attachIndexControls() {
  el('search')?.addEventListener('input', e => { state.query = e.target.value; refreshResults(); });
  el('phase')?.addEventListener('change', e => { state.phase = e.target.value; refreshResults(); });
  el('essential')?.addEventListener('click', () => { state.onlyEssential = !state.onlyEssential; el('essential').setAttribute('aria-checked', String(state.onlyEssential)); refreshResults(); });
}

function resultCount(visible, total) {
  const filtered = state.query.trim() || state.onlyEssential || state.phase !== 'todas';
  return filtered ? `${visible} de ${total} capítulos` : `${total} ${total === 1 ? 'capítulo' : 'capítulos'}`;
}

function refreshResults() {
  const c = chapters(), q = state.query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const chosen = c.filter(x => {
    if (state.onlyEssential && x.prioridade_editorial !== 'essencial') return false;
    if (state.phase !== 'todas' && !DATA.fases.find(f => f.id === state.phase)?.capitulos.includes(x.id)) return false;
    const flat = [x.titulo, x.eixo, x.ano_marco, x.indice?.pilula, ...arr(x.referencias_ids)].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); return !q || flat.includes(q);
  });
  const groups = arr(DATA.fases).map(f => ({ ...f, found: chosen.filter(x => arr(f.capitulos).includes(x.id)) })).filter(f => f.found.length);
  el('index-results').innerHTML = renderIndexGroups(groups);
  el('count').textContent = resultCount(chosen.length, c.length);
  updateProgress();
}

function attachFilePicker() { el('json-picker')?.addEventListener('change', async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const obj = JSON.parse(await f.text()); validate(obj); DATA = obj; activeRoute(); } catch (err) { el('app').innerHTML = renderFileHelp('Não foi possível ler o JSON: ' + err.message); attachFilePicker(); } }); }
function validate(obj) { if (!obj || !Array.isArray(obj.capitulos) || !obj.capitulos.length || !obj.capitulo_preliminar || !Array.isArray(obj.bibliografia)) throw Error('Estrutura inesperada: faltam capítulos, preliminar ou bibliografia.'); }
function updateProgress() { const bar = el('progress'); if (!bar) return; const doc = document.documentElement; const scrollable = Math.max(1, doc.scrollHeight - innerHeight); bar.style.width = `${Math.min(100, Math.max(0, scrollY / scrollable * 100))}%`; }

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
window.addEventListener('hashchange', activeRoute);

(async () => {
  try {
    const res = await fetch(JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw Error('HTTP ' + res.status);
    const obj = await res.json();
    validate(obj);
    DATA = obj;
    activeRoute();
  } catch (err) {
    el('app').innerHTML = renderFileHelp(location.protocol === 'file:' ? 'Seu navegador bloqueou a leitura automática de arquivos locais.' : 'Arquivo JSON não encontrado. ' + err.message);
    attachFilePicker();
  }
})();
