import { grantsChannelConfig } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { readLatestGrantsEditorialForWeb } from "../lib/grants-artifact-reader.js";
import { formatBulletinPeriod, renderOptionalItems, renderProvenanceSnippet } from "../lib/grants-render-helpers.js";

export function grantsPage(): string {
  const grants = readLatestGrantsEditorialForWeb();

  if (grants.fallbackReason) {
    const body = [
      renderCard(grantsChannelConfig.displayName, grantsChannelConfig.description),
      `<section class="card">
        <h2>Latest Editorial Bulletin</h2>
        <p>${grants.fallbackReason}</p>
        <p>Run: <code>npm run pilot:grants && npm run pilot:grants:bulletin && npm run pilot:grants:editorial</code></p>
      </section>`
    ].join("\n");

    return renderLayout("Umbrella | Grants", body);
  }

  const body = [
    renderCard(grantsChannelConfig.displayName, grantsChannelConfig.description),
    `<section class="card">
      <h2>Bulletin Period</h2>
      <p>${formatBulletinPeriod(grants)}</p>
      <p><small>Bulletin ID: ${grants.bulletinId ?? "n/a"}</small></p>
    </section>`,
    `<section class="card">
      <h2>${grants.refinedTopLine?.heading ?? "Top line"}</h2>
      <p>${grants.refinedTopLine?.body ?? "Top line content unavailable."}</p>
    </section>`,
    `<section class="card">
      <h2>${grants.refinedWhatChanged?.heading ?? "What changed"}</h2>
      <p>${grants.refinedWhatChanged?.body ?? "What changed content unavailable."}</p>
      ${renderOptionalItems(grants.refinedWhatChanged?.items, "No change items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${grants.refinedWhyItMatters?.heading ?? "Why it matters"}</h2>
      <p>${grants.refinedWhyItMatters?.body ?? "Why-it-matters content unavailable."}</p>
      ${renderOptionalItems(grants.refinedWhyItMatters?.items, "No why-it-matters items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${grants.refinedCustomWorkCta?.heading ?? "Custom work CTA"}</h2>
      <p>${grants.refinedCustomWorkCta?.body ?? "Contact Umbrella for custom grants work."}</p>
    </section>`,
    `<section class="card">
      <h2>Watchlist (1-4 weeks)</h2>
      ${renderOptionalItems(
        grants.refinedWatchlist?.items,
        grants.refinedWatchlist?.empty_state_reason ?? "Watchlist is not available for this issue."
      )}
    </section>`,
    `<section class="card">
      <h2>Data Snapshot</h2>
      ${
        grants.refinedDataSnapshot
          ? `<ul>
              <li>Total records: ${grants.refinedDataSnapshot.total_records}</li>
              <li>Added: ${grants.refinedDataSnapshot.added_records}</li>
              <li>Updated: ${grants.refinedDataSnapshot.updated_records}</li>
              <li>Removed: ${grants.refinedDataSnapshot.removed_records}</li>
            </ul>`
          : "<p>Data snapshot not present in this artifact.</p>"
      }
    </section>`,
    `<section class="card">
      <h2>Provenance (snippet)</h2>
      ${renderProvenanceSnippet(grants)}
      <p><small>Generated: ${grants.generatedAt ?? "unknown"}</small></p>
    </section>`
  ].join("\n");

  return renderLayout("Umbrella | Grants", body);
}
