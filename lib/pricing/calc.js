/**
 * PRICING CALCULATOR — Pure function: inputs -> estimate
 *
 * Replace the formulas here when real pricing is available.
 * The UI embeds a copy of this logic in steel-buildings.html.
 * Keep both in sync when updating.
 *
 * @param {object} inputs - configurator form values
 * @param {object} config - pricing config (from ./config.js)
 * @returns {{ low: number, high: number, monthly: number, startingAt: number }}
 */

function calculatePrice(inputs, config) {
  const {
    buildingType = 'carport',
    width = 18,
    length = 21,
    height = 8,
    roofStyle = 'regular',
    enclosure = 'open',
    enclosedSides = 0,
    rollupDoors8x8 = 0,
    rollupDoors10x10 = 0,
    rollupDoors12x12 = 0,
    walkinDoors = 0,
    windows = 0,
    concrete = 'none',
    certified = false,
  } = inputs;

  const sqft = width * length;
  const bt = config.buildingTypes[buildingType] || config.buildingTypes.carport;

  // 1. Base price
  let price = bt.fixedBase + (sqft * bt.perSqFt);

  // 2. Roof style adder
  const roof = config.roofStyles[roofStyle] || config.roofStyles.regular;
  price += sqft * roof.adderPerSqFt;

  // 3. Extra height adder (above standard)
  const extraFeet = Math.max(0, height - config.standardHeight);
  price += sqft * extraFeet * config.extraHeightPerFt;

  // 4. Enclosure
  if (enclosure === 'enclosed') {
    // All 4 walls
    const wallArea = 2 * (width * height) + 2 * (length * height);
    price += wallArea * config.enclosure.enclosed.costPerWallSqFt;
  } else if (enclosure === 'partial') {
    // Partial: user picks number of sides (1-3)
    const sides = Math.min(3, Math.max(0, enclosedSides));
    // Assume mix of short and long walls
    const longWall = length * height;
    const shortWall = width * height;
    let wallArea = 0;
    if (sides >= 1) wallArea += longWall;   // back wall
    if (sides >= 2) wallArea += shortWall;  // left side
    if (sides >= 3) wallArea += shortWall;  // right side
    price += wallArea * config.enclosure.partial.costPerWallSqFt;
  }

  // 5. Doors
  price += rollupDoors8x8 * config.doors.rollup_8x8.price;
  price += rollupDoors10x10 * config.doors.rollup_10x10.price;
  price += rollupDoors12x12 * config.doors.rollup_12x12.price;
  price += walkinDoors * config.doors.walkin.price;

  // 6. Windows
  price += windows * config.windowPrice;

  // 7. Concrete
  const conc = config.concrete[concrete] || config.concrete.none;
  price += sqft * conc.perSqFt;

  // 8. Certification
  if (certified) {
    price += config.certification.base + (sqft * config.certification.perSqFt);
  }

  // Round to nearest $5
  const low = Math.round(price / 5) * 5;
  const high = Math.round((price * config.highMultiplier) / 5) * 5;
  const monthly = Math.round(low / config.financeMonths);

  return {
    low,
    high,
    monthly,
    startingAt: config.startingAtPrice,
  };
}

// CommonJS export for server-side (API)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculatePrice };
}
