import { describe, it, expect } from 'vitest';
import {
  SEGMENT_COUNT,
  TARGET_PROFILE,
  createStartingProfile,
  strokeStrength,
  applyStroke,
  progressTowardTarget,
  overshootFlaw,
  applyStrokeToWorkpiece,
  type Profile,
} from '../../src/mechanics/shape-sculpt';

describe('createStartingProfile', () => {
  it('starts every segment at full thickness', () => {
    const profile = createStartingProfile();
    expect(profile.segments).toHaveLength(SEGMENT_COUNT);
    expect(profile.segments.every((thickness) => thickness === 1)).toBe(true);
  });
});

describe('strokeStrength', () => {
  it('is zero below the workable threshold', () => {
    expect(strokeStrength(20)).toBe(0);
    expect(strokeStrength(549)).toBe(0);
  });

  it('is at its weakest right at the workable threshold', () => {
    expect(strokeStrength(550)).toBeCloseTo(0);
  });

  it('grows toward its maximum as temperature approaches burning', () => {
    const midStrength = strokeStrength(1025); // halfway between 550 and 1500
    const hotStrength = strokeStrength(1500);
    expect(midStrength).toBeGreaterThan(0);
    expect(hotStrength).toBeGreaterThan(midStrength);
  });
});

describe('applyStroke', () => {
  it('thins only the targeted segment', () => {
    const profile = createStartingProfile();
    const result = applyStroke(profile, { segmentIndex: 2, temperatureC: 1500 });
    expect(result.segments[2]).toBeLessThan(1);
    const untouched = result.segments.filter((_thickness, index) => index !== 2);
    expect(untouched.every((thickness) => thickness === 1)).toBe(true);
  });

  it('does nothing when the metal is too cold', () => {
    const profile = createStartingProfile();
    const result = applyStroke(profile, { segmentIndex: 0, temperatureC: 20 });
    expect(result).toEqual(profile);
  });

  it('clamps thickness at zero after repeated strokes', () => {
    let profile: Profile = createStartingProfile();
    for (let index = 0; index < 50; index += 1) {
      profile = applyStroke(profile, { segmentIndex: 0, temperatureC: 1500 });
    }
    expect(profile.segments[0]).toBe(0);
  });
});

describe('progressTowardTarget', () => {
  it('is 100 when the profile exactly matches the target', () => {
    expect(progressTowardTarget({ segments: [...TARGET_PROFILE] })).toBeCloseTo(100);
  });

  it('is less than 100 for an unworked bar', () => {
    expect(progressTowardTarget(createStartingProfile())).toBeLessThan(100);
  });

  it('is 0 when every segment is maximally wrong', () => {
    const inverted = TARGET_PROFILE.map((value) => (value >= 0.5 ? 0 : 1));
    expect(progressTowardTarget({ segments: inverted })).toBeCloseTo(0);
  });

  it('treats a target shorter than the profile as 0 for the missing segments', () => {
    const profile: Profile = { segments: [1, 0] };
    expect(progressTowardTarget(profile, [1])).toBeCloseTo(100);
  });

  it('is 100 against an empty target when the profile is also empty', () => {
    expect(progressTowardTarget({ segments: [] }, [])).toBeCloseTo(100);
  });
});

describe('overshootFlaw', () => {
  it('is 0 when no segment is thinner than its target', () => {
    expect(overshootFlaw(createStartingProfile())).toBe(0);
    expect(overshootFlaw({ segments: [...TARGET_PROFILE] })).toBe(0);
  });

  it('is positive when segments are thinned past their target', () => {
    const overThinned = TARGET_PROFILE.map((value) => Math.max(0, value - 0.2));
    expect(overshootFlaw({ segments: overThinned })).toBeGreaterThan(0);
  });

  it('treats a target shorter than the profile as 0 for the missing segments', () => {
    expect(overshootFlaw({ segments: [1, 1] }, [1])).toBe(0);
  });

  it('is 0 against an empty target', () => {
    expect(overshootFlaw({ segments: [] }, [])).toBe(0);
  });
});

describe('applyStrokeToWorkpiece', () => {
  function workpiece() {
    return { temperatureC: 1200, shapeProgress: 0, flaw: 0 };
  }

  it('ruins the workpiece on a burnt stroke without changing the profile', () => {
    const profile = createStartingProfile();
    const result = applyStrokeToWorkpiece(workpiece(), profile, { segmentIndex: 0, temperatureC: 1600 });
    expect(result.workpiece.flaw).toBe(100);
    expect(result.profile).toEqual(profile);
  });

  it('updates shapeProgress and flaw from the new profile on a normal stroke', () => {
    const profile = createStartingProfile();
    const result = applyStrokeToWorkpiece(workpiece(), profile, { segmentIndex: 7, temperatureC: 1200 });
    expect(result.profile.segments[7]).toBeLessThan(1);
    expect(result.workpiece.shapeProgress).toBeGreaterThan(0);
  });
});
