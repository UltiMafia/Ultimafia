// These are pregenerated cuz it's hard to generate them in mongo
const ID_LIST = [
  "29CMjOIZz1",
  "zMv9UE7ttB",
  "AbCFc4OdaO",
  "C8ayqowyON",
  "oyL6rPCTwc",
  "52OZf5UVvQ",
  "S7xnDsa38C",
  "FEkb7ZAoDl",
  "5JtRVSDzsn",
  "Btdmy5dYFP",
  "w9aieEQ1ZX",
  "ythPnRatnc",
  "lJhELT67cw",
  "9jgdyekSlG",
  "5AcHOvBhd5",
  "bmRlsNLLB0",
  "tqx8txPnEr",
  "hqaW5AzLtX",
  "KI0e3OxITP",
  "cLY3CrlC9Z",
  "5MZWqWrogi",
  "qnEZDon0Me",
  "3RGKa2yPrE",
  "FWmJ5nNlMl",
  "nbPhe1V0EB",
  "P9cZQ1H63D",
  "9IgusRQtCj",
  "MBXTssStBC",
  "dSvzgzKvKV",
  "CZoWYRexuw",
  "Q15Qz0r23n",
  "dW9uCpolIn",
  "8GiywJV8zm",
  "yWqrlAEB0b",
  "pf5Zp37m13",
  "RP5khrnCoW",
  "3od01qXvbz",
  "wVSJhFFHCo",
  "I2PvCZzFba",
  "1en948IGvx",
  "mdM4aM5cyx",
  "nvGFqHM3EA",
  "VPdmX8kJaO",
  "SVDFucvFN4",
  "y9K4PgMhkw",
  "VkcpSKifUR",
  "R8TRWSzSgA",
  "tKqkhzH4rV",
  "VsDB4dF4yu",
  "UB8gg2irtp",
  "FF6mZi13Vb",
  "UcXLmXJXj6",
  "WYqRtc3RzO",
  "KkVx8ofK3x",
  "6EEKxQ60ED",
  "iouLq9tGIY",
  "vLFnaj1otO",
  "ZYY5lbDdCV",
  "oQ4GCEQPGM",
  "KMpOwdwhvF",
  "FcJBkEw45J",
  "b2g5Wg94pu",
  "5HfQ6jfEjY",
  "uO2mjqAj4Z",
  "se3cxLDU3G",
  "NSYLGkvFyk",
  "wmS2HLEgit",
  "zWwNtzUPKm",
  "CuLEKYoNKJ",
  "CzMcf0DW00",
  "KjuahuEiKm",
  "JJH6so5COL",
  "QdzA39oEdP",
  "JWk4U5KdeL",
  "IWgv9bCcIa",
  "J1UUfxWvRt",
  "GjNc0YbyhL",
  "qwlRhb1Ncq",
  "Qw7U6M4FhQ",
  "arP3xORJ0t",
  "xWlzpllCXG",
  "9B8RfBbzLC",
  "193zDPRLc9",
  "6MXMAfDi00",
  "rUoiUk6lbV",
  "vCUXQvGVUr",
  "WJcVy61xrg",
  "Mla6OPlsQF",
  "qlS1Soz2pY",
  "xXGQfLA4cT",
  "slkd0ZXUKP",
  "dW7wc7n1hz",
  "1o3pda3VMH",
  "eTM8Nd26op",
  "07HXr75VMD",
  "XBu9FHSC5S",
  "UgOEWoO8Xu",
  "u6gnu3dmdY",
  "Gp3k0coVER",
  "fXE9lb1J3Q",
];

function generateUser(index) {
  const id = ID_LIST[index];
  return {
    id: id,
    name: `leaderboardTest${id}`,
    email: `leaderboardTest${id}@fakedomain.com`,
    fbUid: id,
    joined: Date.now(),
    lastActive: Date.now(),
    dev: true,
    deleted: false,
    kudos: 10 + index,
    karma: 110 - index,
  };
}

const users = [];

for (var i = 0; i < ID_LIST.length; i++) {
  users.push(generateUser(i));
}

// Reverse this operation with: db.users.deleteMany({ "name": {"$regex": "^leaderboardTest.*$" }})
db.users.insertMany(users);
