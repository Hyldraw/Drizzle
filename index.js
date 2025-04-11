const express = require('express');
const { addonBuilder } = require("stremio-addon-sdk");
const TorrentSearchApi = require("torrent-search-api");

const app = express();
const PORT = process.env.PORT || 7000; // Porta do Render ou padrão (7000)

const manifest = {
  id: "community.torrentio.clone",
  version: "1.0.0",
  name: "Torrentio Clone (PT/EN)",
  description: "Addon de torrents com suporte para filmes e séries em português e inglês",
  resources: ["stream"],
  types: ["movie", "series"],
  idPrefixes: ["tt"], 
  catalogs: [],
  logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_Torrent.png",
  behaviorHints: {
    configurationRequired: false,
    configurable: false,
  },
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  if (!id.startsWith("tt")) return { streams: [] };

  let query = id;

  try {
    const results = await TorrentSearchApi.search(query, type === "series" ? "TV" : "Movies", 30);

    const filtered = results.filter(torrent => {
      const title = torrent.title.toLowerCase();
      const is720 = title.includes("720p");
      const is1080 = title.includes("1080p");
      const isPT = title.includes("pt") || title.includes("portugues") || title.includes("dual");
      const isEN = title.includes("en") || title.includes("english") || title.includes("legendado");

      return (is720 || is1080) && (isPT || isEN);
    });

    const streams = filtered.map((torrent) => {
      const title = torrent.title;
      const quality = title.includes("1080p") ? "1080p" : "720p";
      const lang = title.includes("pt") || title.includes("portugues") || title.includes("dual") ? "PT" : "EN";

      return {
        name: `[${lang}] ${quality} - ${title}`,
        type: "torrent",
        infoHash: torrent.infoHash,
        sources: [{ url: torrent.magnet }],
      };
    });

    return { streams };
  } catch (err) {
    console.error("Erro ao buscar torrents:", err);
    return { streams: [] };
  }
});

app.use("/", builder.getInterface());

app.listen(PORT, () => {
  console.log(`Addon rodando na porta ${PORT}`);
});

