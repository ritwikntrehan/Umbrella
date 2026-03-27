import { manufacturingChannelConfig } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { formatBulletinPeriod, renderOptionalItems, renderProvenanceSnippet } from "../lib/grants-render-helpers.js";
import { readLatestManufacturingEditorialForWeb } from "../lib/manufacturing-artifact-reader.js";

export function manufacturingPage(): string {
  const manufacturing = readLatestManufacturingEditorialForWeb();

  if (manufacturing.fallbackReason) {
    const body = [
      renderCard(manufacturingChannelConfig.displayName, manufacturingChannelConfig.description),
      `<section class="card">
        <h2>Latest Editorial Bulletin</h2>
        <p>${manufacturing.fallbackReason}</p>
        <p>Run: <code>npm run pilot:manufacturing && npm run pilot:manufacturing:bulletin && npm run pilot:manufacturing:editorial</code></p>
      </section>`
    ].join("\n");

    return renderLayout("Umbrella | Manufacturing", body);
  }

  const body = [
    renderCard(manufacturingChannelConfig.displayName, manufacturingChannelConfig.description),
    `<section class="card">
      <h2>Bulletin Period</h2>
      <p>${formatBulletinPeriod(manufacturing)}</p>
      <p><small>Bulletin ID: ${manufacturing.bulletinId ?? "n/a"}</small></p>
    </section>`,
    `<section class="card">
      <h2>${manufacturing.refinedTopLine?.heading ?? "Top line"}</h2>
      <p>${manufacturing.refinedTopLine?.body ?? "Top line content unavailable."}</p>
    </section>`,
    `<section class="card">
      <h2>${manufacturing.refinedWhatChanged?.heading ?? "What changed"}</h2>
      <p>${manufacturing.refinedWhatChanged?.body ?? "What changed content unavailable."}</p>
      ${renderOptionalItems(manufacturing.refinedWhatChanged?.items, "No change items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${manufacturing.refinedWhyItMatters?.heading ?? "Why it matters"}</h2>
      <p>${manufacturing.refinedWhyItMatters?.body ?? "Why-it-matters content unavailable."}</p>
      ${renderOptionalItems(manufacturing.refinedWhyItMatters?.items, "No why-it-matters items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${manufacturing.refinedCustomWorkCta?.heading ?? "Custom work CTA"}</h2>
      <p>${manufacturing.refinedCustomWorkCta?.body ?? "Contact Umbrella for custom manufacturing intelligence work."}</p>
    </section>`,
    `<section class="card">
      <h2>Watchlist (1-4 weeks)</h2>
      ${renderOptionalItems(
        manufacturing.refinedWatchlist?.items,
        manufacturing.refinedWatchlist?.empty_state_reason ?? "Watchlist is not available for this issue."
      )}
    </section>`,
    `<section class="card">
      <h2>Data Snapshot</h2>
      ${
        manufacturing.refinedDataSnapshot
          ? `<ul>
              <li>Total records: ${manufacturing.refinedDataSnapshot.total_records}</li>
              <li>Added: ${manufacturing.refinedDataSnapshot.added_records}</li>
              <li>Updated: ${manufacturing.refinedDataSnapshot.updated_records}</li>
              <li>Removed: ${manufacturing.refinedDataSnapshot.removed_records}</li>
            </ul>`
          : "<p>Data snapshot not present in this artifact.</p>"
      }
    </section>`,
    `<section class="card">
      <h2>Provenance (snippet)</h2>
      ${renderProvenanceSnippet(manufacturing)}
      <p><small>Generated: ${manufacturing.generatedAt ?? "unknown"}</small></p>
    </section>`
  ].join("\n");

  return renderLayout("Umbrella | Manufacturing", body);
}
