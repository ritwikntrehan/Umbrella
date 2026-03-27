import { mAndAChannelConfig } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { formatBulletinPeriod, renderOptionalItems, renderProvenanceSnippet } from "../lib/grants-render-helpers.js";
import { readLatestMAndAEditorialForWeb } from "../lib/m-and-a-artifact-reader.js";

export function mAndAPage(): string {
  const mAndA = readLatestMAndAEditorialForWeb();

  if (mAndA.fallbackReason) {
    const body = [
      renderCard(mAndAChannelConfig.displayName, mAndAChannelConfig.description),
      `<section class="card">
        <h2>Latest Editorial Bulletin</h2>
        <p>${mAndA.fallbackReason}</p>
        <p>Run: <code>npm run pilot:m-and-a && npm run pilot:m-and-a:bulletin && npm run pilot:m-and-a:editorial</code></p>
      </section>`
    ].join("\n");

    return renderLayout("Umbrella | M&A", body);
  }

  const body = [
    renderCard(mAndAChannelConfig.displayName, mAndAChannelConfig.description),
    `<section class="card">
      <h2>Bulletin Period</h2>
      <p>${formatBulletinPeriod(mAndA)}</p>
      <p><small>Bulletin ID: ${mAndA.bulletinId ?? "n/a"}</small></p>
    </section>`,
    `<section class="card">
      <h2>${mAndA.refinedTopLine?.heading ?? "Top line"}</h2>
      <p>${mAndA.refinedTopLine?.body ?? "Top line content unavailable."}</p>
    </section>`,
    `<section class="card">
      <h2>${mAndA.refinedWhatChanged?.heading ?? "What changed"}</h2>
      <p>${mAndA.refinedWhatChanged?.body ?? "What changed content unavailable."}</p>
      ${renderOptionalItems(mAndA.refinedWhatChanged?.items, "No change items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${mAndA.refinedWhyItMatters?.heading ?? "Why it matters"}</h2>
      <p>${mAndA.refinedWhyItMatters?.body ?? "Why-it-matters content unavailable."}</p>
      ${renderOptionalItems(mAndA.refinedWhyItMatters?.items, "No why-it-matters items were provided.")}
    </section>`,
    `<section class="card">
      <h2>${mAndA.refinedCustomWorkCta?.heading ?? "Custom work CTA"}</h2>
      <p>${mAndA.refinedCustomWorkCta?.body ?? "Contact Umbrella for custom business assessment and M&A intelligence work."}</p>
    </section>`,
    `<section class="card">
      <h2>Watchlist (1-4 weeks)</h2>
      ${renderOptionalItems(
        mAndA.refinedWatchlist?.items,
        mAndA.refinedWatchlist?.empty_state_reason ?? "Watchlist is not available for this issue."
      )}
    </section>`,
    `<section class="card">
      <h2>Data Snapshot</h2>
      ${
        mAndA.refinedDataSnapshot
          ? `<ul>
              <li>Total records: ${mAndA.refinedDataSnapshot.total_records}</li>
              <li>Added: ${mAndA.refinedDataSnapshot.added_records}</li>
              <li>Updated: ${mAndA.refinedDataSnapshot.updated_records}</li>
              <li>Removed: ${mAndA.refinedDataSnapshot.removed_records}</li>
            </ul>`
          : "<p>Data snapshot not present in this artifact.</p>"
      }
    </section>`,
    `<section class="card">
      <h2>Provenance (snippet)</h2>
      ${renderProvenanceSnippet(mAndA)}
      <p><small>Generated: ${mAndA.generatedAt ?? "unknown"}</small></p>
    </section>`
  ].join("\n");

  return renderLayout("Umbrella | M&A", body);
}
