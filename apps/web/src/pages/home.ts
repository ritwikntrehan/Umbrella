import { grantsChannelConfig } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";

export function homePage(): string {
  const body = [
    renderCard("Umbrella Platform", "Phase 1 scaffold for deterministic ingestion and channel publishing."),
    renderCard("Pilot Channel", `Current pilot: ${grantsChannelConfig.displayName}.`),
    renderCard("Next", "Phase 2 will add real adapters, persistence, and deterministic transforms.")
  ].join("\n");

  return renderLayout("Umbrella | Home", body);
}
