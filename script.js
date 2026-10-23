// ============================================================
// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ============================================================

// Elementos da página que vamos manipular
const inputCidade   = document.getElementById('input-cidade');
const btnBuscar     = document.getElementById('btn-buscar');
const statusEl      = document.getElementById('status');
const resultadosEl  = document.getElementById('resultados');
const nomeCidadeEl  = document.getElementById('nome-cidade');

// Elementos do clima
const tempEl      = document.getElementById('temp');
const sensacaoEl  = document.getElementById('sensacao');
const umidadeEl   = document.getElementById('umidade');
const ventoEl     = document.getElementById('vento');
const condicaoEl  = document.getElementById('condicao');
const tempMaxEl = document.getElementById('temp-max');
const tempMinEl = document.getElementById('temp-min');

// Elemento da curiosidade (Wikipedia)
const resumoWikiEl = document.getElementById('resumo-wiki');

// Variável que guardará a instância do mapa Leaflet
// (criada uma única vez, depois só reposicionamos)
let mapa = null;
let marcador = null;

// ============================================================
// 2. TABELA DE CÓDIGOS DE TEMPO (Open-Meteo → texto em português)
//    A Open-Meteo usa "weather_code" numérico. Traduzimos para
//    algo amigável ao usuário.
// ============================================================
const CODIGOS_TEMPO = {
  0: 'Céu limpo',
  1: 'Principalmente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Nevoeiro',
  48: 'Nevoeiro com geada',
  51: 'Garoa leve',
  53: 'Garoa moderada',
  55: 'Garoa densa',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  80: 'Pancadas leves',
  81: 'Pancadas moderadas',
  82: 'Pancadas violentas',
  95: 'Tempestade',
  96: 'Tempestade com granizo leve',
  99: 'Tempestade com granizo forte'
};

// ============================================================
// 3. FUNÇÃO PRINCIPAL: buscar tudo a partir do nome da cidade
// ============================================================
// ------------------------------------------------------------
// 3A. Busca por COORDENADAS (usada por sugestão, mapa e busca manual)
// Recebe lat/lon prontos e faz clima + mapa + wiki.
// 'recenter' controla se o mapa deve ser recentralizado.
// ------------------------------------------------------------
async function buscarCidadePorCoordenadas(lat, lon, nomeExibicao, recenter = true) {
  try {
    // ----- Clima -----
    const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`;
    const respClima = await fetch(urlClima);
    const dadosClima = await respClima.json();

    const atual = dadosClima.current;
    tempEl.textContent     = atual.temperature_2m.toFixed(1);
    sensacaoEl.textContent = atual.apparent_temperature.toFixed(1);
    umidadeEl.textContent  = atual.relative_humidity_2m;
    ventoEl.textContent    = atual.wind_speed_10m.toFixed(1);
    condicaoEl.textContent = CODIGOS_TEMPO[atual.weather_code] || 'Condição desconhecida';
    // Máx/mín do dia atual (forecast_days=1 → só o índice [0] existe)
    if (dadosClima.daily) {
    tempMaxEl.textContent = dadosClima.daily.temperature_2m_max[0].toFixed(0);
    tempMinEl.textContent = dadosClima.daily.temperature_2m_min[0].toFixed(0);
    }

    nomeCidadeEl.textContent = `📍 ${nomeExibicao}`;

    // Mostra a seção ANTES de criar o mapa (senão o Leaflet mede 0x0)
    resultadosEl.classList.remove('escondido');

    // ----- Mapa -----
    if (!mapa) {
      mapa = L.map('mapa').setView([lat, lon], 11);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapa);

      // Ativa o clique no mapa (ver item 4)
      mapa.on('click', tratarCliqueNoMapa);
    } else if (recenter) {
      mapa.setView([lat, lon], 11);
    }

    // Recalcula tamanho do mapa (necessário após o CSS exibir a seção)
    setTimeout(() => mapa.invalidateSize(), 100);

    // Marcador
    if (marcador) mapa.removeLayer(marcador);
    marcador = L.marker([lat, lon]).addTo(mapa);
    marcador.bindPopup(`<strong>${nomeExibicao}</strong>`).openPopup();

    // ----- Wikipédia -----
    resumoWikiEl.textContent = 'Carregando curiosidade...';
    try {
      // Extrai só o nome base (antes da vírgula) para a busca na Wikipédia
      const nomeBase = nomeExibicao.split(',')[0].trim();
      const urlWiki = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nomeBase)}`;
      const respWiki = await fetch(urlWiki);

      if (respWiki.ok) {
        const dadosWiki = await respWiki.json();
        const texto = (dadosWiki.extract || '').trim();

        // Filtros de qualidade:
        // - type === 'disambiguation'  → página de desambiguação (não é artigo real)
        // - texto curto demais          → provavelmente stub
        const MIN_CARACTERES = 200; // ajuste fino: 150–300 é razoável
        const ehDesambiguacao = dadosWiki.type === 'disambiguation';
        const ehCurtoDemais   = texto.length < MIN_CARACTERES;

        if (ehDesambiguacao || ehCurtoDemais || !texto) {
            resumoWikiEl.textContent = 'Curiosidade detalhada não disponível para esta localidade.';
        } else {
            resumoWikiEl.textContent = texto;
        }
        } else {
        resumoWikiEl.textContent = 'Curiosidade não disponível para esta localidade na Wikipédia em português.';
        }
    } catch (e) {
      resumoWikiEl.textContent = 'Não foi possível carregar a curiosidade agora.';
    }

  } catch (erro) {
    console.error(erro);
    statusEl.textContent = 'Ocorreu um erro ao buscar os dados. Verifique sua conexão.';
  }
}

// ------------------------------------------------------------
// 3B. Busca MANUAL por nome (digitação + botão/Enter)
// Geocodifica o nome e delega para a função acima.
// ------------------------------------------------------------
async function buscarCidade(nomeCidade) {
  statusEl.textContent = '';
  resultadosEl.classList.add('escondido');

  if (!nomeCidade.trim()) {
    statusEl.textContent = 'Digite o nome de uma cidade.';
    return;
  }

  try {
    const urlGeo = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nomeCidade)}&count=1&language=pt&format=json`;
    const respGeo = await fetch(urlGeo);
    const dadosGeo = await respGeo.json();

    if (!dadosGeo.results || dadosGeo.results.length === 0) {
      statusEl.textContent = `Cidade "${nomeCidade}" não encontrada. Tente outro nome.`;
      return;
    }

    const local = dadosGeo.results[0];
    const nomeExibicao = montarNomeExibicao(local);
    await buscarCidadePorCoordenadas(local.latitude, local.longitude, nomeExibicao);
  } catch (erro) {
    console.error(erro);
    statusEl.textContent = 'Ocorreu um erro ao buscar os dados.';
  }
}

// ------------------------------------------------------------
// Helper: monta "Cidade, Estado, País" a partir de um resultado
// da geocodificação (evita repetir essa lógica em vários lugares)
// ------------------------------------------------------------
function montarNomeExibicao(local) {
  const partes = [local.name];
  if (local.admin1) partes.push(local.admin1);
  if (local.country) partes.push(local.country);
  return partes.join(', ');
}

// ============================================================
// 4. EVENTOS: botão e tecla Enter
// ============================================================
btnBuscar.addEventListener('click', () => {
  buscarCidade(inputCidade.value);
});

inputCidade.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    buscarCidade(inputCidade.value);
  }
});
// ------------------------------------------------------------
// 4A. Reverse geocoding: coordenadas → nome de cidade
// Usa Nominatim (OpenStreetMap). Gratuito, CORS liberado.
// ⚠️ Política de uso: ~1 req/seg. Cliques manuais não têm problema.
// ------------------------------------------------------------
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=pt`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) return null;

    const dados = await resp.json();
    const a = dados.address || {};
    const cidade  = a.city || a.town || a.village || a.municipality;
    const estado  = a.state;
    const pais    = a.country;
    const partes  = [cidade, estado, pais].filter(Boolean);
    return partes.length ? partes.join(', ') : (dados.display_name || null);
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------
// 4B. Handler de clique no mapa
// ------------------------------------------------------------
async function tratarCliqueNoMapa(evento) {
  const { lat, lng } = evento.latlng;

  statusEl.textContent = 'Buscando local clicado...';
  resumoWikiEl.textContent = 'Carregando...';

  // Tenta obter nome; se falhar, usa coordenadas como nome
  const nome = await reverseGeocode(lat, lng);
  statusEl.textContent = '';

  const nomeExibicao = nome || `Lat ${lat.toFixed(3)}, Lon ${lng.toFixed(3)}`;

  // recenter = false: o usuário já escolheu o ponto, não reposiciona o mapa
  await buscarCidadePorCoordenadas(lat, lng, nomeExibicao, false);
}

// ============================================================
// 5. AUTOCOMPLETE: mostra sugestões enquanto o usuário digita
// ============================================================
const sugestoesEl = document.getElementById('sugestoes');
let debounceTimer = null;

inputCidade.addEventListener('input', () => {
  // Cancela busca anterior se o usuário continuar digitando
  clearTimeout(debounceTimer);

  const termo = inputCidade.value.trim();

  // Só busca a partir de 2 caracteres (evita chamadas inúteis)
  if (termo.length < 2) {
    sugestoesEl.classList.add('escondido');
    return;
  }

  // Espera 300 ms após a última tecla antes de chamar a API
  // (evita 1 requisição por tecla — "debounce")
  debounceTimer = setTimeout(async () => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(termo)}&count=5&language=pt`;
      const resp = await fetch(url);
      const dados = await resp.json();

      if (!dados.results || dados.results.length === 0) {
        sugestoesEl.classList.add('escondido');
        return;
      }

      // Monta os <li> de sugestão
      sugestoesEl.innerHTML = '';
      dados.results.forEach((local) => {
        const li = document.createElement('li');

        // Nome principal + localização secundária em cinza
        const nomePrincipal = document.createElement('span');
        nomePrincipal.textContent = local.name;

        const detalhe = [local.admin1, local.country].filter(Boolean).join(', ');
        const spanDetalhe = document.createElement('span');
        spanDetalhe.className = 'sugestao-secundaria';
        spanDetalhe.textContent = detalhe;

        li.appendChild(nomePrincipal);
        if (detalhe) li.appendChild(spanDetalhe);

        // Ao clicar: usa as coordenadas EXATAS da sugestão
        li.addEventListener('click', () => {
          sugestoesEl.classList.add('escondido');
          inputCidade.value = local.name;
          buscarCidadePorCoordenadas(
            local.latitude,
            local.longitude,
            montarNomeExibicao(local)
          );
        });

        sugestoesEl.appendChild(li);
      });

      sugestoesEl.classList.remove('escondido');
    } catch (e) {
      console.error(e);
    }
  }, 300);
});

// Fecha o dropdown ao clicar fora da área de busca
document.addEventListener('click', (evento) => {
  if (!evento.target.closest('.busca-input-wrapper')) {
    sugestoesEl.classList.add('escondido');
  }
});