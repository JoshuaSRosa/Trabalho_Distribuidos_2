# Clima & Mapa das Cidades

Cliente web que integra múltiplas APIs públicas para exibir, a partir do nome de uma cidade, o **clima atual**, a **máxima e mínima do dia**, um **mapa interativo** e uma **curiosidade** sobre a localidade. Desenvolvido como trabalho da disciplina de Cliente/Servidor com Web Service, com foco em integração de APIs e tratamento das respostas no frontend.

## Acesse online

**URL:** https://trabalho-distribuidos-2.onrender.com

O projeto está hospedado no [Render](https://render.com/) como _Static Site_. Não é necessário instalar nada: basta abrir o link no navegador.

## Funcionalidades

- **Busca com autocomplete:** enquanto o usuário digita, uma lista de sugestões é exibida mostrando cidade + estado + país, permitindo desambiguar cidades homônimas (ex.: _Springfield_ de vários estados dos EUA).
- **Clima atual:** temperatura, sensação térmica, umidade, vento e condição do tempo (texto em português).
- **Máxima e mínima do dia:** exibidas no mesmo card do clima.
- **Curiosidade da Wikipédia:** resumo do artigo da cidade, com filtro de qualidade (descarta páginas de desambiguação e textos com menos de 200 caracteres).
- **Mapa interativo:** mapa OpenStreetMap centralizado na cidade com marcador.
- **Busca pelo mapa:** clicar em qualquer ponto do mapa carrega automaticamente os dados daquele local (reverse geocoding).
- **Tratamento de erros:** mensagens amigáveis para cidade inexistente, campo vazio e falhas de rede.

## Tecnologias e APIs

| Camada | Tecnologia / Serviço |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla, sem frameworks) |
| Clima e geocodificação | [Open-Meteo](https://open-meteo.com/) (Geocoding + Forecast APIs) |
| Curiosidades | [Wikipedia REST API](https://www.mediawiki.org/wiki/API:REST_API) |
| Mapa | [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) (tiles) |
| Reverse geocoding | [Nominatim](https://nominatim.org/) |

Todas as APIs são **públicas e gratuitas**, sem necessidade de cadastro ou chave de API. A escolha da Open-Meteo em detrimento da OpenWeatherMap foi motivada pela **liberação de CORS** para chamadas diretas do navegador — requisito do trabalho, já que não há backend.

## Arquitetura

Fluxo de uma busca por nome:
Usuário digita "Paris"
│
▼
[1] Geocoding API (Open-Meteo) ──→ latitude, longitude
│
├──→ [2] Forecast API ──→ clima atual + máx/mín do dia
├──→ [3] Leaflet + OSM ──→ mapa + marcador
└──→ [4] Wikipedia API ──→ curiosidade filtrada

text

Fluxo de uma busca pelo mapa:
Usuário clica em um ponto do mapa
│
▼
[Nominatim] ──→ nome do local (cidade, estado, país)
│
▼
[Forecast] + [Leaflet] + [Wikipedia] ──→ dados atualizados

text

## Estrutura do projeto
Trabalho_Distribuidos_2/
├── index.html ← estrutura da página
├── style.css ← aparência (layout, cores, tipografia)
├── script.js ← comportamento (fetch nas APIs, manipulação do DOM)
└── README.md

text

## Como executar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/JoshuaSRosa/Trabalho_Distribuidos_2.git
Abra a pasta no VS Code.

Instale a extensão Live Server (Ritwick Dey).

Clique com o botão direito em index.html → "Open with Live Server".

O navegador abrirá em http://127.0.0.1:5500.

Abrir o index.html diretamente (file://) não funciona porque os fetch para as APIs são bloqueados pelo protocolo. Use um servidor local (Live Server, python -m http.server, etc.).

Como usar
Digite o nome de uma cidade no campo de busca (o autocomplete sugere opções com estado e país).

Clique em Buscar ou pressione Enter.

Veja o clima atual, a máxima/mínima do dia, a curiosidade e o mapa.

Clique em qualquer ponto do mapa para carregar os dados daquele local.

Cenários de teste
Cenário	Resultado esperado
Buscar Paris	Clima + máx/mín + mapa + curiosidade
Buscar Spring (parcial)	Dropdown com sugestões de várias cidades
Buscar Xyzabc123	"Cidade não encontrada"
Campo vazio + Buscar	"Digite o nome de uma cidade"
Clicar em outra cidade no mapa	Dados atualizam sem recarregar a página
Cidade com artigo curto na Wikipédia	"Curiosidade detalhada não disponível para esta localidade"

Limitações conhecidas
Dependência de APIs públicas: se alguma delas ficar indisponível, a funcionalidade correspondente não carrega (o try/catch exibe mensagem amigável).

Wikipédia em português: a cobertura é variável. Cidades pequenas podem não ter verbete com tamanho mínimo para exibição.

Rate limit do Nominatim: ~1 requisição por segundo. Não é um problema para cliques manuais, mas impediria automações em massa.

Granularidade do clima: a Open-Meteo trabalha por coordenadas, não por nível administrativo (bairro/estado). A menor unidade prática é a cidade.

favicon.ico ausente: o console do navegador registra um 404 para esse arquivo. Não afeta o funcionamento.

Licenças e créditos
Dados meteorológicos: Open-Meteo — licença CC BY 4.0.

Curiosidades: Wikipédia em português — CC BY-SA 4.0.

Mapas e tiles: © OpenStreetMap contributors — licença ODbL.

Reverse geocoding: Nominatim — política de uso disponível em operations.osmfoundation.org.

Biblioteca de mapas: Leaflet — licença BSD 2-Clause.

Autores
António Lopes
Jadson Henrique Almeida
Joshua Souza

Trabalho da disciplina de Sistemas Distribuídos.