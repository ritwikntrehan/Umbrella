import { grantsChannelConfig } from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { readLatestGrantsEditorialForWeb } from "../lib/grants-artifact-reader.js";
import { formatBulletinPeriod } from "../lib/grants-render-helpers.js";

export function homePage(): string {
  const grants = readLatestGrantsEditorialForWeb();

  const grantsHighlight = grants.fallbackReason
    ? `<section class="card">
        <h2>${grants.channelLabel} Highlight</h2>
        <p>${grants.fallbackReason}</p>
        <p><a href="/channels/grants">Open grants channel page</a></p>
      </section>`
    : `<section class="card">
        <h2>${grants.channelLabel} Highlight</h2>
        <p><strong>Period:</strong> ${formatBulletinPeriod(grants)}</p>
        <p><strong>Top line:</strong> ${grants.refinedTopLine?.body ?? "Top line pending"}</p>
        <p><strong>Editorial summary:</strong> ${grants.editorialSummary ?? "Summary pending"}</p>
        <p><strong>CTA:</strong> ${grants.refinedCustomWorkCta?.body ?? "Contact Umbrella for grants support."}</p>
        <p><a href="/channels/grants">View full grants channel bulletin</a></p>
      </section>`;

  const body = [
    renderCard("Umbrella Platform", "First visible grants end-to-end slice: pipeline artifact -> web rendering."),
    grantsHighlight,
    renderCard("Other Channels", `Still placeholder-only while ${grantsChannelConfig.displayName} is the active web-integrated pilot.`)
  ].join("\n");

  return renderLayout("Umbrella | Home", body);
}
