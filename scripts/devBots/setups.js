const mongoose = require("/srv/ultimafia/Ultimafia/node_modules/mongoose");
const db = require("/srv/ultimafia/Ultimafia/db/db");
(async () => {
  await db.promise;
  const rows = await mongoose.connection.db.collection("setups").find({ gameType: { $in: ["Secret Dictator", "Liars Dice"] } }).project({ id: 1, name: 1, total: 1, gameType: 1, roles: 1, played: 1 }).sort({ played: -1 }).limit(15).toArray();
  for (const r of rows) console.log(r.gameType, r.id, r.total, r.name, JSON.stringify(r.roles).slice(0, 120), r.played);
  process.exit(0);
})();
