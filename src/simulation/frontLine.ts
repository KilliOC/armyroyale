import type { FrontLineSegment, FrontLineState, Lane } from "./types";

const FRICTION = 0.85;
const BREACH_THRESHOLD = 0.95;

/** Adds force to segment velocity, clamps position to [0,1], returns new state */
export function pushSegment(
  state: FrontLineState,
  lane: Lane,
  force: number,
): FrontLineState {
  const seg = state.segments[lane];
  const newVelocity = seg.velocity + force;
  const newPosition = Math.min(1, Math.max(0, seg.position));
  return {
    segments: {
      ...state.segments,
      [lane]: {
        ...seg,
        velocity: newVelocity,
        position: newPosition,
      },
    },
  };
}

/** Applies velocity to position each tick, decays velocity by FRICTION */
export function tickFrontLine(
  state: FrontLineState,
  dt: number,
): FrontLineState {
  const updatedSegments = {} as Record<Lane, FrontLineSegment>;
  const lanes: Lane[] = ["upper", "center", "lower"];

  for (const lane of lanes) {
    const seg = state.segments[lane];
    const newPosition = Math.min(1, Math.max(0, seg.position + seg.velocity * dt));
    const newVelocity = seg.velocity * FRICTION;
    updatedSegments[lane] = {
      ...seg,
      position: newPosition,
      velocity: newVelocity,
    };
  }

  return { segments: updatedSegments };
}

/** Returns true if segment.position >= BREACH_THRESHOLD */
export function isBreachable(segment: FrontLineSegment): boolean {
  return segment.position >= BREACH_THRESHOLD;
}
