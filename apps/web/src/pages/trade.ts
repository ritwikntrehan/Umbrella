import { tradeChannelConfig } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { formatBulletinPeriod, renderOptionalItems, renderProvenanceSnippet } from "../lib/grants-render-helpers.js";
import { readLatestTradeEditorialForWeb } from "../lib/trade-artifact-reader.js";

export function tradePage(): string {
  const trade = readLatestTradeEditorialForWeb();

  if (trade.fallbackReason) {
    const body = [
      renderCard(tradeChannelConfig.displayName, tradeChannelConfig.description),
      `<section class="card">
        <h2>Latest Editorial Bulletin</h2>
        <p>${trade.fallbackReason}</p>
        <p>Run: <code>npm run pilot:trade && npm run pilot:trade:bulletin && npm run pilot:trade:editorial</code></p>
      </section>`
    ].join("\n");

    return renderLayout("Umbrella | Trade", body);
  }

  const body = [
    renderCard(tradeChannelConfig.displayName, tradeChannelConfig.description),
    `<section class="card">
      <h2>Bulletin Period</h2>
      <p>${formatBulletinPeriod(trade)}</p>
      <p><small>Bulletin ID: ${trade.bulletinId ?? "n/a"}</small></p>
    </section>`,
    `<section class="card">
      <h2>${trade.refinedTopLine?.heading ?? "Top line"}</h2>
      <p>${trade.refinedTopLine?.body ?? "Top line content unavailable."}</p>
    </section>`,
    `<section class="card">
      <h2>${trade.refinedWhatChanged?.heading ?? "What changed"}</h2>
      <p>${trade.refinedWhatChanged?.body ?? "What changed content unavailable."}</p>
      ${renderOptionalItems(trade.refinedWhatChanged?.items, "No change items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${trade.refinedWhyItMatters?.heading ?? "Why it matters"}</h2>
      <p>${trade.refinedWhyItMatters?.body ?? "Why-it-matters content unavailable."}</p>
      ${renderOptionalItems(trade.refinedWhyItMatters?.items, "No why-it-matters items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${trade.refinedCustomWorkCta?.heading ?? "Custom work CTA"}</h2>
      <p>${trade.refinedCustomWorkCta?.body ?? "Contact Umbrella for custom trade work."}</p>
    </section>`,
    `<section class="card">
      <h2>Watchlist (1-4 weeks)</h2>
      ${renderOptionalItems(
        trade.refinedWatchlist?.items,
        trade.refinedWatchlist?.empty_state_reason ?? "Watchlist is not available for this issue."
      )}
    </section>`,
    `<section class="card">
      <h2>Data Snapshot</h2>
      ${
        trade.refinedDataSnapshot
          ? `<ul>
              <li>Total records: ${trade.refinedDataSnapshot.total_records}</li>
              <li>Added: ${trade.refinedDataSnapshot.added_records}</li>
              <li>Updated: ${trade.refinedDataSnapshot.updated_records}</li>
              <li>Removed: ${trade.refinedDataSnapshot.removed_records}</li>
            </ul>`
          : "<p>Data snapshot not present in this artifact.</p>"
      }
    </section>`,
    `<section class="card">
      <h2>Provenance (snippet)</h2>
      ${renderProvenanceSnippet(trade)}
      <p><small>Generated: ${trade.generatedAt ?? "unknown"}</small></p>
    </section>`
  ].join("\n");

  return renderLayout("Umbrella | Trade", body);
}
