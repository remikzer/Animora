import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";

const BASE_URL = "https://api.jikan.moe/v4/top/anime";
const OUTPUT_DIR = "./anime-database";
const DELAY_BETWEEN_CALLS = 2000; // 2s entre chaque appel
const SAVE_INTERVAL = 5; // Sauvegarder tous les X pages

let currentPage = 1;
let hasNextPage = true;
let fullAnimeList = [];

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchAnimeDetails(id) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
    if (!res.ok) throw new Error(`Erreur détail anime ID ${id}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error(`❌ Détail échoué pour ${id} :`, err.message);
    return null;
  }
}

async function savePartial(page) {
  const filePath = path.join(OUTPUT_DIR, `animes_page_${page}.json`);
  await fs.writeFile(filePath, JSON.stringify(fullAnimeList, null, 2));
  console.log(`✅ Sauvegardé : ${filePath}`);
  fullAnimeList = []; // Réinitialiser pour le prochain batch
}

async function main() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    while (hasNextPage) {
      console.log(`📥 Page ${currentPage}...`);

      const res = await fetch(`${BASE_URL}?page=${currentPage}`);
      if (!res.ok) throw new Error(`Erreur page ${currentPage}`);
      const json = await res.json();

      const pageAnimes = json.data;

      for (const anime of pageAnimes) {
        const details = await fetchAnimeDetails(anime.mal_id);
        if (details) fullAnimeList.push(details);
        await delay(DELAY_BETWEEN_CALLS); // Pause pour respecter les quotas
      }

      if (currentPage % SAVE_INTERVAL === 0) {
        await savePartial(currentPage);
      }

      hasNextPage = json.pagination?.has_next_page ?? false;
      currentPage++;
    }

    // Dernière sauvegarde
    if (fullAnimeList.length) {
      await savePartial("final");
    }

    console.log("🎉 Fini !");
  } catch (err) {
    console.error("❌ Erreur principale :", err);
  }
}

main();
