export function laneToWorldZ(index, laneSpacing = 11) {
  return (1 - index) * laneSpacing;
}
