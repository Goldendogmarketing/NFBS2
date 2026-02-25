/**
 * PRICING CONFIGURATION — PLACEHOLDER VALUES
 *
 * Replace these with real pricing tables when ready.
 * The UI reads from this config; changing values here updates the page.
 *
 * NOTE: A copy of this config is embedded in steel-buildings.html for
 * browser-side instant pricing. Keep both in sync when updating.
 */

const PRICING_CONFIG = {

  // "Prices Starting At" displayed in hero (smallest carport config)
  startingAtPrice: 1395,

  // Base cost = fixedBase + (width * length * perSqFt)
  buildingTypes: {
    carport:     { label: 'Carport',     fixedBase: 500,  perSqFt: 3.75 },
    garage:      { label: 'Garage',      fixedBase: 1200, perSqFt: 7.00 },
    barn:        { label: 'Barn',        fixedBase: 1500, perSqFt: 7.50 },
    rv_cover:    { label: 'RV Cover',    fixedBase: 600,  perSqFt: 4.25 },
    commercial:  { label: 'Commercial',  fixedBase: 2000, perSqFt: 9.00 },
    custom:      { label: 'Custom',      fixedBase: 1500, perSqFt: 8.00 },
  },

  // Added per sqft of building footprint
  roofStyles: {
    regular:  { label: 'Regular',   adderPerSqFt: 0.00 },
    aframe:   { label: 'A-Frame',   adderPerSqFt: 0.50 },
    vertical: { label: 'Vertical',  adderPerSqFt: 1.50 },
  },

  // Enclosure: cost per sqft of wall area
  enclosure: {
    open:      { label: 'Open',               costPerWallSqFt: 0.00 },
    partial:   { label: 'Partially Enclosed',  costPerWallSqFt: 3.00 },
    enclosed:  { label: 'Fully Enclosed',      costPerWallSqFt: 3.00 },
  },

  // Standard leg height (ft). Extra height adds cost.
  standardHeight: 8,
  extraHeightPerFt: 0.75, // per sqft of footprint, per extra foot

  // Doors
  doors: {
    rollup_8x8:  { label: "8'x8' Roll-Up Door",  price: 650 },
    rollup_10x10: { label: "10'x10' Roll-Up Door", price: 950 },
    rollup_12x12: { label: "12'x12' Roll-Up Door", price: 1250 },
    walkin:      { label: 'Walk-In Door',          price: 350 },
  },

  // Windows
  windowPrice: 250,

  // Concrete slab
  concrete: {
    none: { label: 'No Concrete', perSqFt: 0 },
    four_inch:  { label: '4" Slab', perSqFt: 6.00 },
    six_inch:   { label: '6" Slab', perSqFt: 8.00 },
  },

  // Certification (wind/snow load)
  certification: {
    base: 500,
    perSqFt: 0.50,
  },

  // Financing placeholder: total / months
  financeMonths: 48,

  // Range multiplier: high estimate = low * this
  highMultiplier: 1.15,

  // Popular size presets
  popularSizes: [
    { label: '12x20', width: 12, length: 20 },
    { label: '18x21', width: 18, length: 21 },
    { label: '20x21', width: 20, length: 21 },
    { label: '20x30', width: 20, length: 30 },
    { label: '24x30', width: 24, length: 30 },
    { label: '30x40', width: 30, length: 40 },
    { label: '40x60', width: 40, length: 60 },
  ],

  // Width / Length / Height dropdown options
  widthOptions:  [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 50, 60],
  lengthOptions: [20, 21, 25, 26, 30, 31, 35, 36, 40, 41, 45, 50, 60, 80, 100],
  heightOptions: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],

  // Package cards for price anchoring
  packages: [
    {
      name: 'Budget Carport',
      badge: 'Most Affordable',
      roofStyle: 'regular',
      buildingType: 'carport',
      width: 18,
      length: 21,
      height: 8,
      enclosure: 'open',
      startingAt: 1595,
      features: [
        'Regular roof style',
        '18\' x 21\' footprint',
        'Open sides for easy access',
        'Free delivery & installation',
        '20-year warranty',
      ],
    },
    {
      name: 'Best Value Garage',
      badge: 'Most Popular',
      roofStyle: 'aframe',
      buildingType: 'garage',
      width: 20,
      length: 21,
      height: 9,
      enclosure: 'enclosed',
      startingAt: 4995,
      features: [
        'A-Frame boxed eave roof',
        '20\' x 21\' enclosed',
        '1 roll-up door + 1 walk-in door',
        'Free delivery & installation',
        '20-year warranty',
      ],
    },
    {
      name: 'Storm-Ready Garage',
      badge: 'Best for Weather',
      roofStyle: 'vertical',
      buildingType: 'garage',
      width: 24,
      length: 31,
      height: 10,
      enclosure: 'enclosed',
      startingAt: 8995,
      features: [
        'Vertical roof — sheds rain & debris',
        '24\' x 31\' enclosed',
        '2 roll-up doors + 1 walk-in door',
        'Wind certified option available',
        'Free delivery & installation',
      ],
    },
  ],
};

// CommonJS export for server-side (API)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRICING_CONFIG;
}
