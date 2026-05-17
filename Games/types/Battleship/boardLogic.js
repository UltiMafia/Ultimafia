const GRID_SIZE = 10;

const SHIP_SPECS = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

const SHIP_TYPES = Object.keys(SHIP_SPECS);

function cellKey(row, col) {
  return `${row},${col}`;
}

function validateFleet(ships, gridSize = GRID_SIZE) {
  if (!Array.isArray(ships) || ships.length !== SHIP_TYPES.length) {
    return "You must place exactly 5 ships.";
  }

  const usedTypes = new Set();
  const occupied = new Set();

  for (const ship of ships) {
    if (!ship || typeof ship.type !== "string" || !Array.isArray(ship.cells)) {
      return "Invalid ship data.";
    }

    const type = ship.type;
    if (!SHIP_SPECS[type]) return `Unknown ship type: ${type}.`;
    if (usedTypes.has(type)) return `Duplicate ship type: ${type}.`;
    usedTypes.add(type);

    const expectedLen = SHIP_SPECS[type];
    if (ship.cells.length !== expectedLen) {
      return `${type} must be ${expectedLen} cells long.`;
    }

    const rows = ship.cells.map((c) => c[0]);
    const cols = ship.cells.map((c) => c[1]);
    const sameRow = rows.every((r) => r === rows[0]);
    const sameCol = cols.every((c) => c === cols[0]);

    if (!sameRow && !sameCol) {
      return "Ships must be placed in a straight horizontal or vertical line.";
    }

    if (sameRow) {
      const sorted = [...cols].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i - 1] + 1) {
          return "Ship cells must be contiguous.";
        }
      }
    } else {
      const sorted = [...rows].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i - 1] + 1) {
          return "Ship cells must be contiguous.";
        }
      }
    }

    for (const [row, col] of ship.cells) {
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
        return "Ships must be placed within the grid.";
      }
      const key = cellKey(row, col);
      if (occupied.has(key)) return "Ships cannot overlap.";
      occupied.add(key);
    }
  }

  for (const type of SHIP_TYPES) {
    if (!usedTypes.has(type)) return `Missing ship: ${type}.`;
  }

  return null;
}

function allShipsSunk(fleet) {
  return fleet.every((ship) => ship.hits >= ship.cells.length);
}

function resolveFire(attackerBoard, defenderBoard, row, col) {
  if (
    row < 0 ||
    row >= GRID_SIZE ||
    col < 0 ||
    col >= GRID_SIZE
  ) {
    return { error: "Invalid coordinates." };
  }

  const key = cellKey(row, col);
  if (attackerBoard.shots[key]) {
    return { error: "You have already fired at that cell." };
  }

  let result = "miss";
  let hitShip = null;

  for (const ship of defenderBoard.fleet) {
    if (ship.cells.some(([r, c]) => r === row && c === col)) {
      result = "hit";
      hitShip = ship;
      ship.hits += 1;
      break;
    }
  }

  attackerBoard.shots[key] = { result };

  if (hitShip && hitShip.hits >= hitShip.cells.length) {
    for (const [r, c] of hitShip.cells) {
      const shipKey = cellKey(r, c);
      if (attackerBoard.shots[shipKey]) {
        attackerBoard.shots[shipKey].result = "sunk";
      }
    }
  }

  return {
    result,
    sunkShip: hitShip && hitShip.hits >= hitShip.cells.length ? hitShip : null,
    won: allShipsSunk(defenderBoard.fleet),
  };
}

module.exports = {
  GRID_SIZE,
  SHIP_SPECS,
  SHIP_TYPES,
  cellKey,
  validateFleet,
  allShipsSunk,
  resolveFire,
};
