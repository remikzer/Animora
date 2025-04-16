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

// const menuToggle = document.getElementById("menuToggle");
// const navLinks = document.querySelector(".nav-links");

// menuToggle?.addEventListener("click", () => {
//   menuToggle.classList.toggle("open");
//   navLinks.classList.toggle("open");
// });

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
// CRÉATION D'UNE CARTE ANIME
// =====================

function createAnimeCard(anime) {
  const imageUrl =
    anime.images?.jpg?.image_url || anime.image_url || "default.jpg";

  const card = document.createElement("div");
  card.classList.add("card");

  card.innerHTML = `
    <a href="details.html?id=${
      anime.mal_id || anime.id
    }" style="text-decoration: none; color: inherit;">
      <img src="${imageUrl}" alt="${anime.title}" />
      <h5><strong>${anime.type || "Anime"}</strong> • Score : ${
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
  return card;
}

// =====================
// RECOMMANDATIONS ACCUEIL
// =====================

const accueilContainer = document.getElementById("animeContainer");

async function fetchRecommendations() {
  if (!accueilContainer) return;
  try {
    const response = await fetch("https://api.jikan.moe/v4/top/anime?limit=8");
    const { data } = await response.json();

    data.forEach((anime) => {
      const card = createAnimeCard(anime);
      accueilContainer.appendChild(card);
    });

    observeCards();
    // setupCarouselIndicators();
  } catch (error) {
    console.error("Erreur chargement recommandations :", error);
    accueilContainer.innerHTML = "<p>Erreur lors du chargement.</p>";
  }
}

// =====================
// PAGE DÉTAIL
// =====================

const detailContainer = document.getElementById("animeDetail");

async function fetchAnimeDetails(id) {
  if (!detailContainer) return;

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
    const { data: anime } = await response.json();
    displayAnimeDetails(anime);
  } catch (error) {
    console.error("Erreur chargement détail :", error);
    detailContainer.innerHTML = "<p>Impossible de charger l'anime.</p>";
  }
}

function displayAnimeDetails(anime) {
  const genres = anime.genres
    .map(
      (genre) =>
        `<a href="search.html?genre=${encodeURIComponent(
          genre.name
        )}" class="genre-badge">${genre.name}</a>`
    )
    .join("");

  detailContainer.innerHTML = `
    <div class="anime-left">
      <a href="../index.html" class="button">← Retour à l'accueil</a>
      <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}" />
      <a href="${
        anime.url
      }" target="_blank" class="button">Voir sur MyAnimeList</a>
      <button id="watchlistBtn">✅ Marquer comme vu</button>
      <div id="starRating">
        <span data-value="1">★</span>
        <span data-value="2">★</span>
        <span data-value="3">★</span>
        <span data-value="4">★</span>
        <span data-value="5">★</span>
      </div>
      <p id="userRatingDisplay" class="rating-text"></p>
    </div>

    <div class="anime-right">
      <h2>${anime.title}</h2>
      <p><strong>Type :</strong> ${anime.type}</p>
      <p><strong>Score :</strong> ${anime.score ?? "N/A"}</p>
      <p><strong>Statut :</strong> ${anime.status}</p>
      <p><strong>Épisodes :</strong> ${anime.episodes ?? "?"}</p>
      <div class="genre-badges">${genres}</div>
      <p>${anime.synopsis ?? "Pas de description disponible."}</p>
    </div>
  `;

  setupWatchlistAndRating(anime.mal_id);
}

function getCurrentAnimeId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

async function setupWatchlistAndRating(animeId) {
  console.log("🔐 Utilisateur actuel :", auth.currentUser);
  const ratingDisplay = document.getElementById("userRatingDisplay");
  const watchlistBtn = document.getElementById("watchlistBtn");
  const starRating = document.getElementById("starRating");
  const stars = starRating?.querySelectorAll("span");

  if (!watchlistBtn || !starRating || !stars) return;

  // === Si utilisateur NON connecté → griser les interactions ===
  if (!auth.currentUser) {
    watchlistBtn.textContent = "Connexion requise";
    watchlistBtn.disabled = true;
    watchlistBtn.classList.add("already-seen");

    stars.forEach((s) => {
      s.style.opacity = "0.4";
      s.style.pointerEvents = "none";
    });

    if (ratingDisplay) {
      ratingDisplay.textContent = "Connectez-vous pour noter";
    }

    return; // stop ici pour les non-connectés
  }

  // === Si connecté → activer les interactions ===
  const uid = auth.currentUser.uid;

  // === WATCHLIST ===
  const watchRef = doc(db, "users", uid, "watchlist", String(animeId));
  const watchSnap = await getDoc(watchRef);
  if (watchSnap.exists()) {
    watchlistBtn.textContent = "👁️ Déjà vu";
    watchlistBtn.disabled = true;
    watchlistBtn.classList.add("already-seen");

    // ✅ Badge visuel "Vu"
    const wrapper = document.querySelector(".anime-left");
    const image = wrapper?.querySelector("img");
    if (wrapper && image && !wrapper.querySelector(".seen-badge")) {
      const badge = document.createElement("div");
      badge.classList.add("seen-badge");
      badge.textContent = "✅ Vu";
      wrapper.style.position = "relative";
      wrapper.appendChild(badge);
    }
  }

  // === RATING ===
  const ratingRef = doc(db, "users", uid, "ratings", String(animeId));
  const ratingSnap = await getDoc(ratingRef);

  let locked = false;

  if (ratingSnap.exists()) {
    const savedRating = ratingSnap.data().rating;
    stars.forEach((s) => {
      const val = parseInt(s.dataset.value);
      s.classList.toggle("selected", val <= savedRating);
    });
    starRating.classList.add("locked");
    locked = true;

    if (ratingDisplay) {
      ratingDisplay.textContent = `Votre note : ${savedRating}/5`;
    }
  }

  // === Enregistrement de la note
  stars.forEach((star) => {
    star.addEventListener("click", async () => {
      if (locked) return;
      const val = parseInt(star.dataset.value);

      stars.forEach((s) => {
        const v = parseInt(s.dataset.value);
        s.classList.toggle("selected", v <= val);
      });

      try {
        await setDoc(ratingRef, { rating: val });
        console.log("⭐ Note enregistrée avec succès :", val);

        starRating.classList.add("locked");
        locked = true;

        if (ratingDisplay) {
          ratingDisplay.textContent = `Votre note : ${val}/5`;
        }
      } catch (error) {
        console.error("Erreur enregistrement note :", error);
      }
    });
  });

  // === Réinitialise l'affichage au survol uniquement si pas encore noté
  starRating.addEventListener("mouseleave", () => {
    if (locked) return;
    stars.forEach((s) => s.classList.remove("selected"));
  });
}

// =====================
// RECHERCHE AVANCÉE AVEC PAGINATION
// =====================

const form = document.getElementById("advancedSearchForm");
const searchContainer = document.getElementById("animeContainer");
const genreButtons = document.querySelectorAll(".tag-toggle");
const selectedGenres = { include: new Set(), exclude: new Set() };

genreButtons.forEach((button) => {
  button.dataset.state = "neutral";

  button.addEventListener("click", () => {
    const genre = button.dataset.value;
    const currentState = button.dataset.state;

    button.classList.remove("include", "exclude");

    if (currentState === "neutral") {
      button.dataset.state = "include";
      button.classList.add("include");
      selectedGenres.include.add(genre);
      selectedGenres.exclude.delete(genre);
    } else if (currentState === "include") {
      button.dataset.state = "exclude";
      button.classList.add("exclude");
      selectedGenres.include.delete(genre);
      selectedGenres.exclude.add(genre);
    } else {
      button.dataset.state = "neutral";
      selectedGenres.include.delete(genre);
      selectedGenres.exclude.delete(genre);
    }
  });
});

// 👉 Fonction pour récupérer plusieurs pages
async function fetchAllAnimes(queryParams, maxPages = 300) {
  const results = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?${queryParams}&page=${page}`
    );
    const { data } = await res.json();
    if (!data || data.length === 0) break;
    results.push(...data);
  }
  return results;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!searchContainer) return;
  searchContainer.innerHTML = "<p>Chargement des résultats...</p>";

  const title = document.getElementById("searchTitle").value.trim();
  const year = document.getElementById("searchYear").value.trim();
  const score = document.getElementById("searchScore").value.trim();
  const status = document.getElementById("searchStatus").value;
  const type = document.getElementById("searchType").value;

  // Mapping des genres → IDs
  const genreMap = {
    Action: 1,
    Adventure: 2,
    AvantGarde: 5,
    AwardWinning: 46,
    BoysLove: 28,
    Comedy: 4,
    Drama: 8,
    Fantasy: 10,
    GirlsLove: 26,
    Gourmet: 47,
    Horror: 14,
    Mystery: 7,
    Romance: 22,
    SciFi: 24,
    SliceOfLife: 36,
    Sports: 30,
    Supernatural: 37,
    Suspense: 41,
    Ecchi: 9,
    Harem: 35,
    Magic: 16,
    MartialArts: 17,
    Mecha: 18,
    Military: 38,
    Music: 19,
    Parody: 20,
    Psychological: 40,
    Reincarnation: 68,
    Samurai: 21,
    School: 23,
    Seinen: 42,
    Shoujo: 25,
    Shounen: 27,
    Space: 29,
    SuperPower: 31,
    Thriller: 41,
    Vampire: 32,
    Isekai: 62,
  };

  const includeIds = [...selectedGenres.include]
    .map((g) => genreMap[g])
    .filter(Boolean);
  const excludeIds = [...selectedGenres.exclude]
    .map((g) => genreMap[g])
    .filter(Boolean);

  const allResults = new Map();

  const totalPages = 10; // jusqu’à 1000 animes
  for (let page = 1; page <= totalPages; page++) {
    const query = new URLSearchParams();
    if (title) query.append("q", title);
    if (type) query.append("type", type);
    if (status) query.append("status", status);
    if (score) query.append("min_score", score);
    if (year) query.append("start_date", `${year}-01-01`);
    if (includeIds.length) query.append("genres", includeIds.join(","));
    if (excludeIds.length) query.append("genres_exclude", excludeIds.join(","));
    query.append("limit", 25);
    query.append("page", page);

    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime?${query}`);
      const { data } = await response.json();

      data.forEach((anime) => {
        if (!allResults.has(anime.mal_id)) {
          allResults.set(anime.mal_id, anime);
        }
      });
    } catch (error) {
      console.error(`❌ Erreur à la page ${page}`, error);
      break;
    }
  }

  const finalResults = [...allResults.values()];
  displaySearchResults(finalResults);
});

function displaySearchResults(animes) {
  searchContainer.innerHTML = "";

  if (!animes.length) {
    searchContainer.innerHTML = "<p>Aucun résultat trouvé.</p>";
    return;
  }

  animes.forEach((anime) => {
    const card = createAnimeCard(anime);
    searchContainer.appendChild(card);
  });

  observeCards();
}

// =====================
// CAROUSEL COMPLET
// =====================

const container = document.querySelector(".recommendations-container");
const leftArrow = document.querySelector(".carousel-arrow.left");
const rightArrow = document.querySelector(".carousel-arrow.right");
const section = document.querySelector(".recommendations-section");

if (container && section) {
  const cards = container.querySelectorAll(".card");
  const indicatorsWrapper = document.createElement("div");
  indicatorsWrapper.classList.add("carousel-indicators");
  section.appendChild(indicatorsWrapper);

  // === Création des indicateurs dynamiquement ===
  cards.forEach((_, i) => {
    const dot = document.createElement("span");
    if (i === 0) dot.classList.add("active");
    indicatorsWrapper.appendChild(dot);
  });

  const indicators = indicatorsWrapper.querySelectorAll("span");

  // === Flèches de navigation ===
  leftArrow?.addEventListener("click", () => {
    container.scrollBy({
      left: -container.clientWidth * 0.9,
      behavior: "smooth",
    });
  });

  rightArrow?.addEventListener("click", () => {
    container.scrollBy({
      left: container.clientWidth * 0.9,
      behavior: "smooth",
    });
  });

  // === Mise à jour des indicateurs dynamiquement ===
  function updateIndicators() {
    const scrollLeft = container.scrollLeft;
    const cardWidth =
      cards[0].offsetWidth + parseInt(getComputedStyle(container).gap || 16);
    const activeIndex = Math.round(scrollLeft / cardWidth);

    indicators.forEach((dot, i) =>
      dot.classList.toggle("active", i === activeIndex)
    );
  }

  container.addEventListener("scroll", updateIndicators);

  // === Auto-scroll sur mobile toutes les 5s ===
  let autoScrollIndex = 0;
  function autoScrollCarousel() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    autoScrollIndex++;
    if (autoScrollIndex >= cards.length) autoScrollIndex = 0;

    const scrollX = autoScrollIndex * (cards[0].offsetWidth + 16);
    container.scrollTo({ left: scrollX, behavior: "smooth" });

    updateIndicators();
  }

  let autoScrollInterval = setInterval(autoScrollCarousel, 5000);

  // === Stop auto-scroll si interaction utilisateur ===
  container.addEventListener("touchstart", () =>
    clearInterval(autoScrollInterval)
  );
}

// =====================
// FIREBASE INIT
// =====================

import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtOUvEgUiRJTEczdnPRGmEVVC7bGSgIo8",
  authDomain: "animora-2d9f1.firebaseapp.com",
  projectId: "animora-2d9f1",
  storageBucket: "animora-2d9f1.appspot.com",
  messagingSenderId: "145575131863",
  appId: "1:145575131863:web:0bae8fff0f298b0f8bce92",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================
// AUTH
// =====================

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const authMessage = document.getElementById("authMessage");

signupBtn?.addEventListener("click", async () => {
  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    authMessage.textContent = `Bienvenue ${userCred.user.email}`;
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

loginBtn?.addEventListener("click", async () => {
  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    authMessage.textContent = `Connecté : ${userCred.user.email}`;
    window.location.href = "profil.html";
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

// =====================
// PROFIL DASHBOARD
// =====================

const welcomeMessage = document.getElementById("welcomeMessage");
const followedContainer = document.getElementById("followedAnimes");
const recommendedContainer = document.getElementById(
  "recommendationsContainer"
);

document.addEventListener("DOMContentLoaded", () => {
  if (body.classList.contains("page-detail")) {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;

    fetchAnimeDetails(id); // 👈 accès libre pour tous
  }
});

async function loadFollowedAnimes(uid) {
  const followedContainer = document.getElementById("followedContainer");
  if (!followedContainer) return;

  followedContainer.innerHTML = "<p>Chargement...</p>";

  const watchlistRef = collection(db, "users", uid, "watchlist");
  const snapshot = await getDocs(watchlistRef);

  followedContainer.innerHTML = ""; // Reset contenu

  if (snapshot.empty) {
    followedContainer.innerHTML = "<p>Aucun anime suivi pour l'instant.</p>";
    return;
  }

  snapshot.forEach((doc) => {
    const anime = doc.data();
    const card = createAnimeCard(anime);
    followedContainer.appendChild(card);
  });

  observeCards(); // 👀 pour les animations
}

async function loadRecommendedAnimes(user) {
  if (!user || !recommendedContainer) {
    console.warn("⛔ Aucun utilisateur ou container non trouvé.");
    return;
  }

  console.log("🔍 Début chargement recommandations personnalisées...");

  recommendedContainer.innerHTML =
    "<p>Chargement de vos recommandations...</p>";

  const uid = user.uid;
  const watchlistRef = collection(db, "users", uid, "watchlist");
  const ratingsRef = collection(db, "users", uid, "ratings");

  const [watchlistSnap, ratingsSnap] = await Promise.all([
    getDocs(watchlistRef),
    getDocs(ratingsRef),
  ]);

  const allAnimes = new Map();

  watchlistSnap.forEach((doc) => {
    const data = doc.data();
    if (data && data.mal_id) {
      console.log("👁️ Vu :", data.title || data.mal_id);
      allAnimes.set(data.mal_id, data);
    }
  });

  ratingsSnap.forEach((doc) => {
    const rating = doc.data().rating;
    const id = parseInt(doc.id, 10);
    if (rating >= 3 && !allAnimes.has(id)) {
      console.log("⭐ Noté :", id, "=>", rating, "★");
      allAnimes.set(id, { mal_id: id, rating });
    }
  });

  const baseIds = Array.from(allAnimes.keys()).slice(0, 3);
  console.log("📌 Base pour recommandations :", baseIds);

  if (baseIds.length === 0) {
    recommendedContainer.innerHTML =
      "<p>Aucune base de recommandation trouvée.</p>";
    return;
  }

  const recommended = new Map();

  for (const id of baseIds) {
    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/anime/${id}/recommendations`
      );
      const { data } = await response.json();

      data.slice(0, 5).forEach((rec) => {
        const recId = rec.entry.mal_id;
        if (!recommended.has(recId) && !allAnimes.has(recId)) {
          recommended.set(recId, rec.entry);
          console.log("➕ Recommandé :", rec.entry.title);
        }
      });
    } catch (error) {
      console.error("❌ Erreur recommendations (ID " + id + ") :", error);
    }
  }

  recommendedContainer.innerHTML = "";

  if (recommended.size === 0) {
    recommendedContainer.innerHTML = "<p>Aucune recommandation trouvée.</p>";
    return;
  }

  recommended.forEach((anime) => {
    const card = createAnimeCard(anime);
    recommendedContainer.appendChild(card);
  });

  observeCards();
}

// =====================
// INIT GLOBAL
// =====================

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  if (body.classList.contains("page-accueil")) fetchRecommendations();
  if (body.classList.contains("page-detail")) {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;

    fetchAnimeDetails(id); // 🔓 accès libre
  }

  if (body.classList.contains("page-search")) {
    const genreParam = new URLSearchParams(window.location.search).get("genre");
    if (genreParam) {
      const btn = [...genreButtons].find(
        (b) => b.dataset.value.toLowerCase() === genreParam.toLowerCase()
      );
      if (btn) {
        btn.dataset.state = "include";
        btn.classList.add("include");
        selectedGenres.include.add(btn.dataset.value);
        form.dispatchEvent(new Event("submit"));
      }
    }
  }
});

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn?.addEventListener("click", async () => {
  try {
    await auth.signOut(); // 🔓 Déconnexion Firebase
    window.location.href = "login.html"; // 🔁 Redirection manuelle
  } catch (error) {
    console.error("❌ Erreur lors de la déconnexion :", error);
  }
});

// =====================
// RECOMMANDATION CUSTOM
// +====================
async function getUserData(uid) {
  const watchlistRef = collection(db, "users", uid, "watchlist");
  const ratingsRef = collection(db, "users", uid, "ratings");

  const [watchSnap, ratingsSnap] = await Promise.all([
    getDocs(watchlistRef),
    getDocs(ratingsRef),
  ]);

  const userData = [];

  // Watchlist
  watchSnap.forEach((doc) => {
    const data = doc.data();
    userData.push({
      ...data,
      from: "watchlist",
      rating: null,
    });
  });

  // Ratings
  ratingsSnap.forEach((docSnap) => {
    const rating = docSnap.data().rating;
    const id = docSnap.id;

    // Si l'anime n’est pas déjà dans la liste (évite doublon avec watchlist)
    if (!userData.find((a) => a.mal_id == id)) {
      userData.push({
        mal_id: id,
        rating,
        from: "ratingOnly",
      });
    } else {
      const existing = userData.find((a) => a.mal_id == id);
      existing.rating = rating;
    }
  });

  return userData;
}
function analyzeUserPreferences(userData) {
  const genreScores = {};
  const typeScores = {};
  let totalScore = 0;
  let totalRating = 0;
  let ratingCount = 0;

  userData.forEach((anime) => {
    const rating = anime.rating ?? 0;
    let score = 0;

    if (rating >= 5) score = 3;
    else if (rating === 4) score = 2;
    else if (rating === 3) score = 1;
    else if (anime.from === "watchlist") score = 1;

    // ➕ Cumule score global pour moyenne
    if (rating > 0) {
      totalRating += rating;
      ratingCount++;
    }

    totalScore += score;

    // 🧠 Analyse genres
    if (anime.genres) {
      anime.genres.forEach((genre) => {
        genreScores[genre.name] = (genreScores[genre.name] || 0) + score;
      });
    }

    // 🧠 Analyse type
    const type = anime.type ?? "TV";
    typeScores[type] = (typeScores[type] || 0) + score;
  });

  const avgRating = ratingCount
    ? (totalRating / ratingCount).toFixed(1)
    : "N/A";

  // 🔝 Genres préférés
  const topGenres = Object.entries(genreScores)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 5);

  // 🔝 Types préférés
  const topTypes = Object.entries(typeScores)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 2);

  return {
    avgRating,
    topGenres,
    topTypes,
  };
}
async function fetchAdvancedRecommendations(profile, userData) {
  // === 1. Dictionnaire des genres Jikan ===
  const genreMap = {
    Action: 1,
    Adventure: 2,
    AvantGarde: 5,
    AwardWinning: 46,
    BoysLove: 28,
    Comedy: 4,
    Drama: 8,
    Fantasy: 10,
    GirlsLove: 26,
    Gourmet: 47,
    Horror: 14,
    Mystery: 7,
    Romance: 22,
    SciFi: 24,
    SliceOfLife: 36,
    Sports: 30,
    Supernatural: 37,
    Suspense: 41,
    Ecchi: 9,
    Hentai: 12,
    Erotica: 49,
    Harem: 35,
    Isekai: 62,
    Josei: 43,
    Kids: 15,
    Magic: 16,
    MartialArts: 17,
    Mecha: 18,
    Military: 38,
    Music: 19,
    Parody: 20,
    Psychological: 40,
    Reincarnation: 68,
    Samurai: 21,
    School: 23,
    Seinen: 42,
    Shoujo: 25,
    ShoujoAi: 26,
    Shounen: 27,
    ShounenAi: 28,
    Space: 29,
    StrategyGame: 11,
    SuperPower: 31,
    Thriller: 41,
    Vampire: 32,
    WorkLife: 48,
    Yuri: 26,
    // certains doublons sont regroupés sous un seul ID (ex: GirlsLove = Yuri = 26)
  };

  // === 2. Convertit les genres en ID Jikan ===
  const genreIds = profile.topGenres
    .map((g) => genreMap[g])
    .filter(Boolean)
    .join(",");

  // === 3. Prépare les autres paramètres ===
  const type = profile.topTypes[0]?.toLowerCase() || "tv";
  const minScore = Math.max(0, Math.floor(profile.avgRating - 1)) || 6;

  // === 4. Construire la requête Jikan ===
  const query = `https://api.jikan.moe/v4/anime?genres=${genreIds}&type=${type}&min_score=${minScore}&order_by=score&sort=desc&limit=25`;

  console.log("🔍 Requête API :", query);

  try {
    const res = await fetch(query);
    const { data } = await res.json();

    // === 5. Filtrer les animes déjà vus ou notés ===
    const seenIds = new Set(userData.map((a) => String(a.mal_id)));
    const filtered = data.filter((anime) => !seenIds.has(String(anime.mal_id)));

    console.log("🎯 Recommandations finales :", filtered);
    return filtered;
  } catch (error) {
    console.error("❌ Erreur fetchAdvancedRecommendations :", error);
    return [];
  }
}
if (document.body.classList.contains("page-profil")) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;

      welcomeMessage.textContent = `Bienvenue, ${user.email}`;
      const userData = await getUserData(uid);
      const profile = analyzeUserPreferences(userData);
      const recommendations = await fetchAdvancedRecommendations(
        profile,
        userData
      );

      const recommendedContainer = document.getElementById(
        "recommendationsContainer"
      );
      recommendedContainer.innerHTML = "";

      recommendations.forEach((anime) => {
        const card = createAnimeCard(anime); // ta fonction carte existante
        recommendedContainer.appendChild(card);
      });

      observeCards(); // si tu veux les animations d’apparition
    } else {
      window.location.href = "login.html";
    }
  });
}

//===================
// TEXTE ANIME PAGE ACCUEIL
//===================

function typeWriterMultiPhrases(phrases, elementId, speed = 100, pause = 2000) {
  const element = document.getElementById(elementId);
  let phraseIndex = 0;
  let charIndex = 0;

  function type() {
    if (!element) return;

    const currentPhrase = phrases[phraseIndex];
    if (charIndex < currentPhrase.length) {
      element.textContent += currentPhrase.charAt(charIndex);
      charIndex++;
      setTimeout(type, speed);
    } else {
      setTimeout(() => {
        erase();
      }, pause);
    }
  }

  function erase() {
    if (!element) return;

    if (charIndex > 0) {
      element.textContent = element.textContent.slice(0, -1);
      charIndex--;
      setTimeout(erase, speed / 2);
    } else {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(type, speed);
    }
  }

  type();
}

// 🔥 À lancer uniquement sur la page d’accueil
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("page-accueil")) {
    typeWriterMultiPhrases(
      [
        "Bienvenue sur Animora.",
        "Explorez des animes inoubliables.",
        "Notez vos coups de cœur.",
        "Recevez des recommandations personnalisées.",
        "Plongez dans un monde d’émotions.",
      ],
      "typewriter"
    );
  }
});
