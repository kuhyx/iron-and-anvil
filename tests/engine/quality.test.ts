import { describe, it, expect } from 'vitest';
import { scoreQuality } from '../../src/engine/quality';

function workpiece(shapeProgress: number, flaw: number) {
  return { temperatureC: 20, shapeProgress, flaw };
}

describe('scoreQuality', () => {
  it('clamps negative scores to 0 and grades them ruined', () => {
    const result = scoreQuality(workpiece(10, 50));
    expect(result.score).toBe(0);
    expect(result.grade).toBe('ruined');
  });

  it('clamps scores above 100 to 100 and grades them fine', () => {
    const result = scoreQuality(workpiece(150, 0));
    expect(result.score).toBe(100);
    expect(result.grade).toBe('fine');
  });

  it('grades just below the ruined boundary as ruined', () => {
    expect(scoreQuality(workpiece(19, 0)).grade).toBe('ruined');
  });

  it('grades exactly at the ruined boundary as flawed', () => {
    expect(scoreQuality(workpiece(20, 0)).grade).toBe('flawed');
  });

  it('grades just below the flawed boundary as flawed', () => {
    expect(scoreQuality(workpiece(49, 0)).grade).toBe('flawed');
  });

  it('grades exactly at the flawed boundary as sound', () => {
    expect(scoreQuality(workpiece(50, 0)).grade).toBe('sound');
  });

  it('grades just below the sound boundary as sound', () => {
    expect(scoreQuality(workpiece(84, 0)).grade).toBe('sound');
  });

  it('grades exactly at the sound boundary as fine', () => {
    expect(scoreQuality(workpiece(85, 0)).grade).toBe('fine');
  });

  it('subtracts flaw from shape progress', () => {
    const result = scoreQuality(workpiece(90, 30));
    expect(result.score).toBe(60);
    expect(result.grade).toBe('sound');
  });
});
