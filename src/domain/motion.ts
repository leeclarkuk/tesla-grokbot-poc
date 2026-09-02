export const MOTION_STATES = ["moving", "parked", "unknown"] as const;

export type MotionState = (typeof MOTION_STATES)[number];

export function isMovingForPolicy(motion: MotionState): boolean {
  return motion === "moving" || motion === "unknown";
}
