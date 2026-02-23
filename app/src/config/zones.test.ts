import { describe, it, expect } from 'vitest';
import { getZoneAtAltitude, ZONES } from './zones';

describe('getZoneAtAltitude', () => {
  it('should return Cultivation Zone for altitude between 800 and 1799', () => {
    expect(getZoneAtAltitude(800)?.name).toBe('Cultivation Zone');
    expect(getZoneAtAltitude(1000)?.name).toBe('Cultivation Zone');
    expect(getZoneAtAltitude(1799)?.name).toBe('Cultivation Zone');
  });

  it('should return Rainforest Zone for altitude between 1800 and 2799', () => {
    expect(getZoneAtAltitude(1800)?.name).toBe('Rainforest Zone');
    expect(getZoneAtAltitude(2500)?.name).toBe('Rainforest Zone');
    expect(getZoneAtAltitude(2799)?.name).toBe('Rainforest Zone');
  });

  it('should return Moorland Zone for altitude between 2800 and 3999', () => {
    expect(getZoneAtAltitude(2800)?.name).toBe('Moorland Zone');
    expect(getZoneAtAltitude(3500)?.name).toBe('Moorland Zone');
    expect(getZoneAtAltitude(3999)?.name).toBe('Moorland Zone');
  });

  it('should return Alpine Desert for altitude between 4000 and 4999', () => {
    expect(getZoneAtAltitude(4000)?.name).toBe('Alpine Desert');
    expect(getZoneAtAltitude(4500)?.name).toBe('Alpine Desert');
    expect(getZoneAtAltitude(4999)?.name).toBe('Alpine Desert');
  });

  it('should return Arctic Summit for altitude between 5000 and 6000', () => {
    expect(getZoneAtAltitude(5000)?.name).toBe('Arctic Summit');
    expect(getZoneAtAltitude(5500)?.name).toBe('Arctic Summit');
    expect(getZoneAtAltitude(5999)?.name).toBe('Arctic Summit');
  });

  it('should return the last zone (Arctic Summit) for altitudes above max range', () => {
    expect(getZoneAtAltitude(7000)?.name).toBe('Arctic Summit');
  });

  it('should verify zone properties exist', () => {
      const zone = ZONES[0];
      expect(zone).toHaveProperty('name');
      expect(zone).toHaveProperty('minAltitude');
      expect(zone).toHaveProperty('maxAltitude');
      expect(zone).toHaveProperty('color');
      expect(zone).toHaveProperty('fogColor');
      expect(zone).toHaveProperty('fogDensity');
      expect(zone).toHaveProperty('quote');
  });
});
