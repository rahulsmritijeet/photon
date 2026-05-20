export const cinematicPresets = [
  {
    name: 'Daylight',
    colors: [
      { name: 'Pure Day', r: 255, g: 250, b: 240 },
      { name: 'Sky Blue', r: 200, g: 225, b: 255 },
      { name: 'Cloud', r: 240, g: 245, b: 255 },
    ],
  },
  {
    name: 'Golden Hour',
    colors: [
      { name: 'Golden', r: 255, g: 180, b: 60 },
      { name: 'Warm Sun', r: 255, g: 210, b: 120 },
      { name: 'Amber', r: 255, g: 150, b: 30 },
    ],
  },
  {
    name: 'Tungsten',
    colors: [
      { name: 'Tungsten', r: 255, g: 160, b: 80 },
      { name: 'Warm Lamp', r: 255, g: 200, b: 140 },
      { name: 'Deep Orange', r: 200, g: 100, b: 20 },
    ],
  },
  {
    name: 'Neon Night',
    colors: [
      { name: 'Neon Pink', r: 255, g: 20, b: 120 },
      { name: 'Cyber Blue', r: 0, g: 200, b: 255 },
      { name: 'Acid Green', r: 50, g: 255, b: 100 },
    ],
  },
  {
    name: 'Arctic',
    colors: [
      { name: 'Ice', r: 200, g: 230, b: 255 },
      { name: 'Snow', r: 240, g: 248, b: 255 },
      { name: 'Frost', r: 170, g: 210, b: 255 },
    ],
  },
  {
    name: 'Sunset',
    colors: [
      { name: 'Coral', r: 255, g: 100, b: 80 },
      { name: 'Magenta', r: 255, g: 80, b: 160 },
      { name: 'Deep Violet', r: 180, g: 60, b: 220 },
    ],
  },
  {
    name: 'Moonlight',
    colors: [
      { name: 'Moon', r: 180, g: 200, b: 230 },
      { name: 'Midnight', r: 40, g: 60, b: 120 },
      { name: 'Starlight', r: 200, g: 210, b: 240 },
    ],
  },
  {
    name: 'Film Noir',
    colors: [
      { name: 'Shadow', r: 30, g: 30, b: 35 },
      { name: 'Smoke', r: 80, g: 80, b: 90 },
      { name: 'Silver', r: 180, g: 180, b: 190 },
    ],
  },
];

export const basicColors = [
  { name: 'White', r: 255, g: 255, b: 255 },
  { name: 'Warm White', r: 255, g: 220, b: 180 },
  { name: 'Cool White', r: 200, g: 220, b: 255 },
  { name: 'Red', r: 255, g: 0, b: 0 },
  { name: 'Green', r: 0, g: 200, b: 0 },
  { name: 'Blue', r: 0, g: 80, b: 255 },
  { name: 'Yellow', r: 255, g: 230, b: 0 },
  { name: 'Cyan', r: 0, g: 220, b: 255 },
  { name: 'Magenta', r: 255, g: 0, b: 200 },
  { name: 'Orange', r: 255, g: 120, b: 0 },
  { name: 'Purple', r: 140, g: 0, b: 255 },
  { name: 'Pink', r: 255, g: 100, b: 160 },
  { name: 'Teal', r: 0, g: 180, b: 180 },
  { name: 'Lime', r: 120, g: 255, b: 0 },
  { name: 'Indigo', r: 60, g: 0, b: 180 },
  { name: 'Rose', r: 255, g: 50, b: 100 },
];

export const ctPresets = [
  { name: 'Candle', k: 1800 },
  { name: 'Tungsten', k: 2700 },
  { name: 'Halogen', k: 3200 },
  { name: 'Fluorescent', k: 4000 },
  { name: 'Daylight', k: 5600 },
  { name: 'Overcast', k: 6500 },
  { name: 'Shade', k: 7500 },
  { name: 'Blue Sky', k: 10000 },
  { name: 'Clear Sky', k: 12000 },
];

export function kelvinToRGB(k) {
  const temp = k / 100;
  let r, g, b;

  if (temp <= 66) {
    r = 255;
    g = temp <= 0 ? 0 : Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
  }

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  }

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}