export function getLaneImpactScale(lane) {
  const clash = Math.min(1, Math.abs((lane.bluePressure || 0) - (lane.redPressure || 0)) / 20);
  return 0.6 + clash * 0.9;
}
