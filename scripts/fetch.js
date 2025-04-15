import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const OUTPUT_FILE = path.join("data", "animes.json");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchAnimes() {
  let allAnimes = [];
  let page = 1;
  const maxPages = 20; // change selon la limite que tu veux atteindre
  const delayMs = 1500; // on évite d'être bloqué par l'API

  while (page <= maxPages) {
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?page=${page}&limit=25`
      );
      const json = await res.json();

      if (!json.data || json.data.length === 0) break;

      allAnimes.push(...json.data);
      console.log(`✅ Page ${page} récupérée (${json.data.length} animes)`);

      page++;
      await delay(delayMs);
    } catch (error) {
      console.error(`❌ Erreur à la page ${page} :`, error.message);
      break;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allAnimes, null, 2));
  console.log(
    `\n✅ ${allAnimes.length} animes sauvegardés dans ${OUTPUT_FILE}`
  );
}

fetchAnimes();
