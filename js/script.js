const state = {
  version: "",
  champions: [],
  filter: "Todos",
  search: ""
};

const API = "https://ddragon.leagueoflegends.com";
const LOCALE = "pt_BR";

const $ = (selector) => document.querySelector(selector);
const championsEl = $("#champions");
const statusEl = $("#status");
const counterEl = $("#counter");
const filtersEl = $("#filters");
const modal = $("#modal");

async function init() {
  try {
    const versions = await fetchJSON(`${API}/api/versions.json`);
    state.version = versions[0];

    const data = await fetchJSON(
      `${API}/cdn/${state.version}/data/${LOCALE}/champion.json`
    );

    state.champions = Object.values(data.data);
    createFilters();
    render();
  } catch (error) {
    statusEl.textContent =
      "Não foi possível carregar os campeões. Verifique sua conexão e tente novamente.";
    console.error(error);
  }
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
  return response.json();
}

function createFilters() {
  const tags = ["Todos", ...new Set(state.champions.flatMap(c => c.tags))];

  filtersEl.innerHTML = tags.map(tag => `
    <button class="filter ${tag === "Todos" ? "active" : ""}"
      type="button" data-filter="${tag}">
      ${tag}
    </button>
  `).join("");

  filtersEl.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.filter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(el =>
      el.classList.toggle("active", el === button)
    );
    render();
  });
}

function render() {
  const search = state.search.toLowerCase().trim();

  const list = state.champions
    .filter(champion => {
      const matchesSearch = champion.name.toLowerCase().includes(search);
      const matchesFilter =
        state.filter === "Todos" || champion.tags.includes(state.filter);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  counterEl.textContent = `${list.length} campeão(ões)`;

  if (!list.length) {
    championsEl.innerHTML = "";
    statusEl.textContent = "Nenhum campeão encontrado.";
    statusEl.classList.remove("hidden");
    return;
  }

  statusEl.classList.add("hidden");

  championsEl.innerHTML = list.map(champion => {
    const image = `${API}/cdn/${state.version}/img/champion/${champion.image.full}`;
    return `
      <article class="champion-card" tabindex="0"
        data-id="${champion.id}"
        aria-label="Ver detalhes de ${escapeHTML(champion.name)}">
        <img src="${image}" alt="${escapeHTML(champion.name)}" loading="lazy">
        <div class="champion-card__info">
          <h3>${escapeHTML(champion.name)}</h3>
          <p>${champion.tags.join(" • ")}</p>
        </div>
      </article>
    `;
  }).join("");

  championsEl.querySelectorAll(".champion-card").forEach(card => {
    card.addEventListener("click", () => openChampion(card.dataset.id));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") openChampion(card.dataset.id);
    });
  });
}

async function openChampion(id) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  $("#modalName").textContent = "Carregando...";
  $("#modalTitle").textContent = "";
  $("#modalLore").textContent = "";
  $("#abilities").innerHTML = "";
  $("#stats").innerHTML = "";

  try {
    const result = await fetchJSON(
      `${API}/cdn/${state.version}/data/${LOCALE}/champion/${id}.json`
    );
    const champion = result.data[id];

    const splash = `${API}/cdn/img/champion/splash/${champion.id}_0.jpg`;

    $("#modalSplash").src = splash;
    $("#modalSplash").alt = champion.name;
    $("#modalName").textContent = champion.name;
    $("#modalTitle").textContent = champion.title;
    $("#modalLore").textContent = champion.lore;

    $("#modalTags").innerHTML =
      champion.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("");

    const abilities = [
      {
        name: champion.passive.name,
        description: champion.passive.description,
        image: `${API}/cdn/${state.version}/img/passive/${champion.passive.image.full}`
      },
      ...champion.spells.map(spell => ({
        name: spell.name,
        description: spell.description,
        image: `${API}/cdn/${state.version}/img/spell/${spell.image.full}`
      }))
    ];

    $("#abilities").innerHTML = abilities.map(ability => `
      <div class="ability">
        <img src="${ability.image}" alt="${escapeHTML(ability.name)}">
        <strong>${escapeHTML(ability.name)}</strong>
        <small>${escapeHTML(stripHTML(ability.description))}</small>
      </div>
    `).join("");

    renderStats(champion.stats);
  } catch (error) {
    $("#modalName").textContent = "Erro ao carregar";
    $("#modalLore").textContent =
      "Não foi possível carregar os detalhes deste campeão.";
    console.error(error);
  }
}

function renderStats(stats) {
  const fields = [
    ["Vida", "hp", 1000],
    ["Ataque", "attackdamage", 100],
    ["Armadura", "armor", 100],
    ["Resist. mágica", "spellblock", 100],
    ["Velocidade", "movespeed", 400]
  ];

  $("#stats").innerHTML = fields.map(([label, key, max]) => {
    const value = Number(stats[key]) || 0;
    const percentage = Math.min(100, (value / max) * 100);

    return `
      <div class="stat">
        <span>${label}</span>
        <div class="bar"><i style="width:${percentage}%"></i></div>
        <strong>${Math.round(value)}</strong>
      </div>
    `;
  }).join("");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

$("#searchInput").addEventListener("input", event => {
  state.search = event.target.value;
  render();
});

$("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", event => {
  if (event.target.hasAttribute("data-close")) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
});

$("#themeButton").addEventListener("click", () => {
  document.body.classList.toggle("light");
  const light = document.body.classList.contains("light");
  $("#themeButton").textContent = light ? "🌙" : "☀️";
  localStorage.setItem("lol-theme", light ? "light" : "dark");
});

if (localStorage.getItem("lol-theme") === "light") {
  document.body.classList.add("light");
  $("#themeButton").textContent = "🌙";
}

function stripHTML(text) {
  const div = document.createElement("div");
  div.innerHTML = text;
  return div.textContent || div.innerText || "";
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
