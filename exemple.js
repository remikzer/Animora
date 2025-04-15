// =====================
// NAVBAR TRANSPARENCE AU SCROLL
// =====================

// const navbar = document.querySelector(".navbar");

// window.addEventListener("scroll", () => {
//   const scrolled = window.scrollY > 50;
//   navbar.style.background = scrolled
//     ? "rgba(255, 255, 255, 0.25)"
//     : "rgba(255, 255, 255, 0.15)";
//   navbar.style.backdropFilter = scrolled ? "blur(25px)" : "blur(20px)";
// });

// =====================
// MENU BURGER
// =====================

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

menuToggle?.addEventListener("click", () => {
  menuToggle.classList.toggle("open");
  navLinks.classList.toggle("open");
});

// =====================
// OBSERVEUR D'APPARITION DES CARTES
// =====================

const observer = new IntersectionObserver(
  (entries, observerInstance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observerInstance.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

function observeCards() {
  document.querySelectorAll(".card:not(.observed)").forEach((card) => {
    observer.observe(card);
    card.classList.add("observed");
  });
}

// =====================
// FETCH & AFFICHAGE DES ANIMES (Accueil)
// =====================

let currentPage = 1;
const container = document.getElementById("animeContainer");

async function fetchAnimes(page = 1) {
  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/top/anime?page=${page}`
    );
    const { data: animes } = await response.json();
    displayAnimes(animes);
  } catch (error) {
    console.error("Erreur lors de la récupération des animes:", error);
  }
}

function displayAnimes(animes) {
  if (!container) return;

  animes.slice(0, 20).forEach((anime) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <a href="details.html?id=${
        anime.mal_id
      }" style="text-decoration: none; color: inherit;">
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}" />
        <h5><strong>${anime.type}</strong> • Score : ${
      anime.score ?? "N/A"
    }</h5>
        <h3>${anime.title}</h3>
        <p>${
          anime.synopsis
            ? anime.synopsis.substring(0, 100) + "..."
            : "Pas de description disponible."
        }</p>
      </a>
    `;
    container.appendChild(card);
  });

  observeCards();
}

// Infinite scroll
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    currentPage++;
    fetchAnimes(currentPage);
  }
});

// =====================
// PAGE DETAIL
// =====================

const detailContainer = document.getElementById("animeDetail");

if (detailContainer) {
  document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get("id");

    if (animeId) fetchAnimeDetails(animeId);
  });

  async function fetchAnimeDetails(id) {
    const loader = document.getElementById("loaderDetail");
    if (loader) loader.style.display = "flex";

    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
      const { data: anime } = await response.json();
      displayAnimeDetails(anime);
    } catch (error) {
      console.error("Erreur :", error);
      detailContainer.innerHTML = "<p>Impossible de charger l'anime.</p>";
    } finally {
      if (loader) loader.style.display = "none";
    }
  }

  function displayAnimeDetails(anime) {
    const genreBadges = anime.genres
      .map((genre) => `<span class="genre-badge">${genre.name}</span>`)
      .join("");

    const trailerEmbed = anime.trailer.embed_url
      ? `<iframe width="100%" height="315" src="${anime.trailer.embed_url}" frameborder="0" allowfullscreen></iframe>`
      : "<p>Aucun trailer disponible.</p>";

    detailContainer.innerHTML = `
      <div class="anime-left">
        <a href="index.html" class="button">← Retour à l'accueil</a>
        <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}" />
        <a href="${
          anime.url
        }" target="_blank" class="button">Voir sur MyAnimeList</a>
      </div>

      <div class="anime-right">
        <h2>${anime.title}</h2>
        <p><strong>Type :</strong> ${anime.type}</p>
        <p><strong>Score :</strong> ${anime.score ?? "N/A"}</p>
        <p><strong>Statut :</strong> ${anime.status}</p>
        <p><strong>Épisodes :</strong> ${anime.episodes ?? "?"}</p>

        <div class="genre-badges">
          ${genreBadges || "<span class='genre-badge'>Aucun genre</span>"}
        </div>

        <p class="synopsis">
          ${anime.synopsis ?? "Pas de description disponible."}
        </p>
      </div>
    `;

    detailContainer.classList.add("revealed");
  }
}

// =====================
// Initialisation globale
// =====================
document.addEventListener("DOMContentLoaded", () => {
  if (container) fetchAnimes();
});

// --------------------
// SEARCH
// --------------------

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("advancedSearchForm");
  const container = document.getElementById("animeContainer");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    container.innerHTML = "<p>Chargement des résultats...</p>";

    const formData = new FormData(form);
    const query = new URLSearchParams();

    if (formData.get("title")) query.append("q", formData.get("title"));
    if (formData.get("type")) query.append("type", formData.get("type"));
    if (formData.get("status")) query.append("status", formData.get("status"));
    if (formData.get("score")) query.append("min_score", formData.get("score"));
    if (formData.get("year"))
      query.append("start_date", `${formData.get("year")}-01-01`);
    query.append("limit", 20);

    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/anime?${query.toString()}`
      );
      const data = await response.json();

      container.innerHTML = ""; // reset container

      if (!data.data.length) {
        container.innerHTML = "<p>Aucun résultat trouvé.</p>";
        return;
      }

      data.data.forEach((anime) => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <a href="details.html?id=${
              anime.mal_id
            }" style="text-decoration: none; color: inherit;">
              <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
              <h5><strong>${anime.type}</strong> • Score : ${
          anime.score ?? "N/A"
        }</h5>
              <h3>${anime.title}</h3>
              <p>${
                anime.synopsis
                  ? anime.synopsis.substring(0, 100) + "..."
                  : "Pas de description disponible."
              }</p>
            </a>
          `;

        container.appendChild(card);
      });
      document
        .querySelectorAll(".card")
        .forEach((card) => card.classList.add("visible"));
    } catch (error) {
      console.error("Erreur lors de la recherche avancée :", error);
      container.innerHTML =
        "<p>Une erreur est survenue lors de la recherche.</p>";
    }
  });
});

// -------------
// TAG SEARCH
// ------------
// Gestion des états des filtres thématiques
const genreButtons = document.querySelectorAll(".tag-toggle");

genreButtons.forEach((button) => {
  button.dataset.state = "neutral"; // État initial

  button.addEventListener("click", () => {
    const currentState = button.dataset.state;

    // Reset classes avant changement d'état
    button.classList.remove("include", "exclude");

    if (currentState === "neutral") {
      button.dataset.state = "include";
      button.classList.add("include");
    } else if (currentState === "include") {
      button.dataset.state = "exclude";
      button.classList.add("exclude");
    } else {
      button.dataset.state = "neutral";
      // Pas de classe à appliquer pour neutre
    }
  });
});
