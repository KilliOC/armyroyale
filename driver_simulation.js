import { clamp, forwardFromYaw } from "@lfg/mini-engine";
import {
  CAR_RADIUS,
  CHECKPOINT_LOCKOUT_SECONDS,
  CHECKPOINT_RADIUS,
  CHECKPOINTS,
  MAX_FORWARD_SPEED,
  MAX_REVERSE_SPEED,
  WORLD_HALF,
} from "./shared_world.js";

function approach(value, target, maxDelta) {
  if (value < target)
    return Math.min(value + maxDelta, target);
  if (value > target)
    return Math.max(value - maxDelta, target);
  return target;
}

export function cloneDriverState(driverState) {
  return {
    ...driverState,
    position: { ...driverState.position },
  };
}

export function clonePlayerState(playerState) {
  return {
    ...playerState,
    data: cloneDriverState(playerState.data),
  };
}

export function collidesAt(layout, position) {
  if (Math.abs(position.x) > WORLD_HALF || Math.abs(position.z) > WORLD_HALF)
    return true;

  for (const rect of layout.collisionRects) {
    const dx = Math.abs(position.x - rect.centerX);
    const dz = Math.abs(position.z - rect.centerZ);
    if (dx <= (rect.halfX + CAR_RADIUS) && dz <= (rect.halfZ + CAR_RADIUS))
      return true;
  }

  for (const circle of layout.collisionCircles) {
    const dx = position.x - circle.centerX;
    const dz = position.z - circle.centerZ;
    const limit = circle.radius + CAR_RADIUS;
    if ((dx * dx) + (dz * dz) <= (limit * limit))
      return true;
  }

  return false;
}

export function advanceCheckpoints(driverState, worldState) {
  if (driverState.checkpointLockout > 0)
    return worldState.statusMessage;

  const checkpoint = CHECKPOINTS[driverState.nextCheckpointIndex];
  const dx = driverState.position.x - checkpoint.x;
  const dz = driverState.position.z - checkpoint.z;
  if ((dx * dx) + (dz * dz) > (CHECKPOINT_RADIUS * CHECKPOINT_RADIUS))
    return worldState.statusMessage;

  driverState.checkpointLockout = CHECKPOINT_LOCKOUT_SECONDS;
  if (driverState.nextCheckpointIndex === 0) {
    driverState.completedLaps += 1;
    driverState.score += 500;
    driverState.nextCheckpointIndex = 1;
    return `Lap ${driverState.completedLaps} complete. +500 score. Aim for ${CHECKPOINTS[1].label}.`;
  }

  driverState.score += 100;
  const clearedLabel = checkpoint.label;
  driverState.nextCheckpointIndex = (driverState.nextCheckpointIndex + 1) % CHECKPOINTS.length;
  const nextLabel = CHECKPOINTS[driverState.nextCheckpointIndex].label;
  return `Checkpoint cleared: ${clearedLabel}. +100 score. Next gate: ${nextLabel}.`;
}

export function simulateTick(driverState, layout, input, dtSeconds) {
  const throttle = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  driverState.checkpointLockout = Math.max(0, driverState.checkpointLockout - dtSeconds);

  if (input.brake) {
    driverState.speed = approach(driverState.speed, 0, 30 * dtSeconds);
  } else if (throttle > 0) {
    driverState.speed += (driverState.speed >= 0 ? 19 : 28) * dtSeconds;
  } else if (throttle < 0) {
    driverState.speed -= (driverState.speed <= 0 ? 12 : 24) * dtSeconds;
  } else {
    driverState.speed = approach(driverState.speed, 0, 8 * dtSeconds);
  }

  driverState.speed = clamp(driverState.speed, -MAX_REVERSE_SPEED, MAX_FORWARD_SPEED);

  const speedFactor = clamp(Math.abs(driverState.speed) / MAX_FORWARD_SPEED, 0, 1);
  if (steer !== 0 && speedFactor > 0.03) {
    const direction = driverState.speed >= 0 ? 1 : -1;
    driverState.yaw -= steer * (1.2 + (0.85 * speedFactor)) * speedFactor * direction * dtSeconds;
  }

  const forward = forwardFromYaw(driverState.yaw);
  const moveX = forward.x * driverState.speed * dtSeconds;
  const moveZ = forward.z * driverState.speed * dtSeconds;
  const next = {
    x: driverState.position.x + moveX,
    y: driverState.position.y,
    z: driverState.position.z + moveZ,
  };

  if (!collidesAt(layout, next)) {
    driverState.position = next;
    return;
  }

  const slideX = {
    x: driverState.position.x + moveX,
    y: driverState.position.y,
    z: driverState.position.z,
  };
  const slideZ = {
    x: driverState.position.x,
    y: driverState.position.y,
    z: driverState.position.z + moveZ,
  };

  if (!collidesAt(layout, slideX)) {
    driverState.position = slideX;
  } else if (!collidesAt(layout, slideZ)) {
    driverState.position = slideZ;
  } else {
    driverState.speed *= -0.18;
  }
}
