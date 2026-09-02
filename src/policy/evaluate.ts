import type { ActionKind } from "../domain/actions.js";
import { isMovingForPolicy, type MotionState } from "../domain/motion.js";
import { catalogue } from "./catalogue.js";
import type { PolicyDecision } from "./decisions.js";

export function evaluate(
  action: ActionKind,
  motion: MotionState,
): PolicyDecision {
  const rule = catalogue[action];
  if (!rule) {
    return "DENY";
  }
  return isMovingForPolicy(motion) ? rule.whileMoving : rule.whileParked;
}
