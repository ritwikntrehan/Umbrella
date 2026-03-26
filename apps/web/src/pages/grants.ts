import { grantsChannelConfig, grantsSources } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";

export function grantsPage(): string {
  const sourceList = grantsSources.map((source) => `<li>${source.name} (${source.cadence})</li>`).join("\n");

  const body = [
    renderCard(grantsChannelConfig.displayName, grantsChannelConfig.description),
    `<section class="card"><h2>Configured Sources</h2><ul>${sourceList}</ul></section>`,
    renderCard("Status", "Pilot placeholder page. Real channel rendering logic is intentionally deferred.")
  ].join("\n");

  return renderLayout("Umbrella | Grants", body);
}
