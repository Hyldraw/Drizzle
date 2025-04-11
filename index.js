const { addonBuilder } = require("stremio-addon-sdk");
const TorrentSearchApi = require("torrent-search-api");

// Ativando providers públicos (YTS, 1337x, etc.)
TorrentSearchApi.enablePublicProviders();

const manifest = {
  id: "community.torrentio.clone",
  version: "1.0.0",
  name: "Torrentio Clone (PT/EN)",
  description: "Addon de torrents com suporte para filmes e séries em português e inglês",
  resources: ["stream"],
  types: ["movie", "series"],
  idPrefixes: ["tt"], // IMDb ID
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

  // Busca pelo IMDb ID
  let query = id;

  try {
    // Busca até 30 resultados de torrents
    const results = await TorrentSearchApi.search(query, type === "series" ? "TV" : "Movies", 30);

    // Filtrar torrents por idioma e qualidade
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
      const size = torrent.size || "unknown size";
      const quality = title.includes("1080p") ? "1080p" : "720p";
      const lang =
        title.includes("pt") || title.includes("portugues") || title.includes("dual")
          ? "PT"
          : "EN";

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

module.exports = builder.getInterface();
