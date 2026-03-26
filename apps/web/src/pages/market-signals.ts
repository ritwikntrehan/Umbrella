import { marketSignalsChannelConfig } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { formatBulletinPeriod, renderOptionalItems, renderProvenanceSnippet } from "../lib/grants-render-helpers.js";
import { readLatestMarketSignalsEditorialForWeb } from "../lib/market-signals-artifact-reader.js";

export function marketSignalsPage(): string {
  const marketSignals = readLatestMarketSignalsEditorialForWeb();

  if (marketSignals.fallbackReason) {
    const body = [
      renderCard(marketSignalsChannelConfig.displayName, marketSignalsChannelConfig.description),
      `<section class="card">
        <h2>Latest Editorial Bulletin</h2>
        <p>${marketSignals.fallbackReason}</p>
        <p>Run: <code>npm run pilot:market-signals && npm run pilot:market-signals:bulletin && npm run pilot:market-signals:editorial</code></p>
      </section>`
    ].join("\n");

    return renderLayout("Umbrella | Market Signals", body);
  }

  const body = [
    renderCard(marketSignalsChannelConfig.displayName, marketSignalsChannelConfig.description),
    `<section class="card">
      <h2>Bulletin Period</h2>
      <p>${formatBulletinPeriod(marketSignals)}</p>
      <p><small>Bulletin ID: ${marketSignals.bulletinId ?? "n/a"}</small></p>
    </section>`,
    `<section class="card">
      <h2>${marketSignals.refinedTopLine?.heading ?? "Top line"}</h2>
      <p>${marketSignals.refinedTopLine?.body ?? "Top line content unavailable."}</p>
    </section>`,
    `<section class="card">
      <h2>${marketSignals.refinedWhatChanged?.heading ?? "What changed"}</h2>
      <p>${marketSignals.refinedWhatChanged?.body ?? "What changed content unavailable."}</p>
      ${renderOptionalItems(marketSignals.refinedWhatChanged?.items, "No change items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${marketSignals.refinedWhyItMatters?.heading ?? "Why it matters"}</h2>
      <p>${marketSignals.refinedWhyItMatters?.body ?? "Why-it-matters content unavailable."}</p>
      ${renderOptionalItems(marketSignals.refinedWhyItMatters?.items, "No why-it-matters items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${marketSignals.refinedCustomWorkCta?.heading ?? "Custom work CTA"}</h2>
      <p>${marketSignals.refinedCustomWorkCta?.body ?? "Contact Umbrella for custom market-signals work."}</p>
    </section>`,
    `<section class="card">
      <h2>Watchlist (1-4 weeks)</h2>
      ${renderOptionalItems(
        marketSignals.refinedWatchlist?.items,
        marketSignals.refinedWatchlist?.empty_state_reason ?? "Watchlist is not available for this issue."
      )}
    </section>`,
    `<section class="card">
      <h2>Data Snapshot</h2>
      ${
        marketSignals.refinedDataSnapshot
          ? `<ul>
              <li>Total records: ${marketSignals.refinedDataSnapshot.total_records}</li>
              <li>Added: ${marketSignals.refinedDataSnapshot.added_records}</li>
              <li>Updated: ${marketSignals.refinedDataSnapshot.updated_records}</li>
              <li>Removed: ${marketSignals.refinedDataSnapshot.removed_records}</li>
            </ul>`
          : "<p>Data snapshot not present in this artifact.</p>"
      }
    </section>`,
    `<section class="card">
      <h2>Provenance (snippet)</h2>
      ${renderProvenanceSnippet(marketSignals)}
      <p><small>Generated: ${marketSignals.generatedAt ?? "unknown"}</small></p>
    </section>`
  ].join("\n");

  return renderLayout("Umbrella | Market Signals", body);
}
