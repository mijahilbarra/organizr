import { UserCapabilityState } from "../../types";

export function getCapabilityStatusLabel(state: UserCapabilityState) {
  if (state === "available") {
    return "Ready";
  }

  if (state === "missing") {
    return "Needs setup";
  }

  if (state === "disabled") {
    return "Disabled";
  }

  return "Pending backend";
}
