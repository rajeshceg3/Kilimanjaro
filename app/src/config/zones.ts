export interface Zone {
  name: string;
  minAltitude: number;
  maxAltitude: number;
  color: string;
  fogColor: string;
  fogDensity: number;
  quote: string;
  /** bright fog/scene floor: HUD + narrative must use dark ink, not white blend */
  brightScene: boolean;
}

export const ZONES: Zone[] = [
  {
    name: "Cultivation Zone",
    minAltitude: 800,
    maxAltitude: 1800,
    color: "#e6c229",
    fogColor: "#d4a76a",
    fogDensity: 0.02,
    quote: "You begin where life already exists.",
    brightScene: true
  },
  {
    name: "Rainforest Zone",
    minAltitude: 1800,
    maxAltitude: 2800,
    color: "#2d5a27",
    fogColor: "#1a3c18",
    fogDensity: 0.04,
    quote: "Lush, enveloping, damp silence.",
    brightScene: false
  },
  {
    name: "Moorland Zone",
    minAltitude: 2800,
    maxAltitude: 4000,
    color: "#6b4c35",
    fogColor: "#583e2f",
    fogDensity: 0.03,
    quote: "Alien calm, thinning air.",
    brightScene: false
  },
  {
    name: "Alpine Desert",
    minAltitude: 4000,
    maxAltitude: 5000,
    color: "#8c8c8c",
    fogColor: "#a6a6a6",
    fogDensity: 0.02,
    quote: "Vast, exposed, quiet.",
    brightScene: true
  },
  {
    name: "Arctic Summit",
    minAltitude: 5000,
    maxAltitude: 6000,
    color: "#ffffff",
    fogColor: "#e6f7ff",
    fogDensity: 0.015,
    quote: "You are standing above weather.",
    brightScene: true
  }
];

export const getZoneAtAltitude = (altitude: number): Zone => {
  return ZONES.find(z => altitude >= z.minAltitude && altitude < z.maxAltitude) || ZONES[ZONES.length - 1];
};
