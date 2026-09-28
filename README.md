# LoL Champions

Projeto front-end para explorar campeões de League of Legends usando o Data Dragon da Riot Games.

## Estrutura

- `index.html` — estrutura da aplicação
- `css/style.css` — visual, responsividade e modo claro/escuro
- `js/script.js` — consumo da API, pesquisa, filtros e modal de detalhes
- `assets/` — reservado para futuros arquivos locais

## Como executar

1. Extraia a pasta.
2. Abra o projeto no VS Code.
3. Recomenda-se usar a extensão Live Server.
4. Abra `index.html` pelo servidor local.

O projeto usa `fetch()` para consultar:
- `/api/versions.json`
- `/data/pt_BR/champion.json`
- `/data/pt_BR/champion/{campeão}.json`

As URLs são montadas automaticamente usando a versão mais recente disponível no Data Dragon.

## Observação

O projeto é um trabalho educacional e não é oficial da Riot Games.
