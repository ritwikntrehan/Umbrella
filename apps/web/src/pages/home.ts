import {
  grantsChannelConfig,
  manufacturingChannelConfig,
  marketSignalsChannelConfig,
  mAndAChannelConfig,
  tradeChannelConfig
} from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { readLatestGrantsEditorialForWeb } from "../lib/grants-artifact-reader.js";
import { formatBulletinPeriod } from "../lib/grants-render-helpers.js";
import { readLatestManufacturingEditorialForWeb } from "../lib/manufacturing-artifact-reader.js";
import { readLatestMarketSignalsEditorialForWeb } from "../lib/market-signals-artifact-reader.js";
import { readLatestMAndAEditorialForWeb } from "../lib/m-and-a-artifact-reader.js";
import { readLatestTradeEditorialForWeb } from "../lib/trade-artifact-reader.js";
import { readLatestUmbrellaSynthesisForWeb } from "../lib/umbrella-synthesis-artifact-reader.js";

function renderHighlight(params: {
  label: string;
  pageHref: string;
  fallbackReason?: string;
  period: string;
  topLine?: string;
  summary?: string;
  cta?: string;
}): string {
  if (params.fallbackReason) {
    return `<section class="card">
      <h2>${params.label} Highlight</h2>
      <p>${params.fallbackReason}</p>
      <p><a href="${params.pageHref}">Open ${params.label.toLowerCase()} channel page</a></p>
    </section>`;
  }

  return `<section class="card">
    <h2>${params.label} Highlight</h2>
    <p><strong>Period:</strong> ${params.period}</p>
    <p><strong>Top line:</strong> ${params.topLine ?? "Top line pending"}</p>
    <p><strong>Editorial summary:</strong> ${params.summary ?? "Summary pending"}</p>
    <p><strong>CTA:</strong> ${params.cta ?? "Contact Umbrella for support."}</p>
    <p><a href="${params.pageHref}">View full ${params.label.toLowerCase()} channel bulletin</a></p>
  </section>`;
}

export function homePage(): string {
  const umbrella = readLatestUmbrellaSynthesisForWeb();
  const grants = readLatestGrantsEditorialForWeb();
  const trade = readLatestTradeEditorialForWeb();
  const manufacturing = readLatestManufacturingEditorialForWeb();
  const marketSignals = readLatestMarketSignalsEditorialForWeb();
  const mAndA = readLatestMAndAEditorialForWeb();

  const body = [
    renderCard(
      "Umbrella Platform",
      "Visible deterministic slices now include grants, trade, market-signals, manufacturing, and M&A end-to-end rendering."
    ),
    `<section class="card">
      <h2>Umbrella Synthesis Layer</h2>
      <p><strong>Summary:</strong> ${umbrella.summary}</p>
      <p><strong>Included channels:</strong> ${umbrella.includedChannels.join(", ") || "none"}</p>
      <p><strong>Missing channels:</strong> ${umbrella.missingChannels.join(", ") || "none"}</p>
      ${
        umbrella.fallbackReason
          ? `<p>${umbrella.fallbackReason}</p>`
          : `<p><strong>Generated at:</strong> ${umbrella.generatedAt ?? "unknown"}</p>`
      }
      <h3>Top updates across channels</h3>
      <ul>${(umbrella.topUpdates.length > 0 ? umbrella.topUpdates : ["No synthesized updates available yet."]).map((item) => `<li>${item}</li>`).join("")}</ul>
      <h3>Notable patterns</h3>
      <ul>${(umbrella.notablePatterns.length > 0 ? umbrella.notablePatterns : ["No notable cross-channel patterns detected yet."]).map((item) => `<li>${item}</li>`).join("")}</ul>
      <p><strong>Custom work CTA:</strong> ${umbrella.customWorkCta}</p>
    </section>`,
    renderCard("Contributing channels", "Channel pages remain available for detailed review:"),
    renderHighlight({
      label: grants.channelLabel,
      pageHref: "/channels/grants",
      fallbackReason: grants.fallbackReason,
      period: formatBulletinPeriod(grants),
      topLine: grants.refinedTopLine?.body,
      summary: grants.editorialSummary,
      cta: grants.refinedCustomWorkCta?.body
    }),
    renderHighlight({
      label: trade.channelLabel,
      pageHref: "/channels/trade",
      fallbackReason: trade.fallbackReason,
      period: formatBulletinPeriod(trade),
      topLine: trade.refinedTopLine?.body,
      summary: trade.editorialSummary,
      cta: trade.refinedCustomWorkCta?.body
    }),
    renderHighlight({
      label: manufacturing.channelLabel,
      pageHref: "/channels/manufacturing",
      fallbackReason: manufacturing.fallbackReason,
      period: formatBulletinPeriod(manufacturing),
      topLine: manufacturing.refinedTopLine?.body,
      summary: manufacturing.editorialSummary,
      cta: manufacturing.refinedCustomWorkCta?.body
    }),
    renderHighlight({
      label: marketSignals.channelLabel,
      pageHref: "/channels/market-signals",
      fallbackReason: marketSignals.fallbackReason,
      period: formatBulletinPeriod(marketSignals),
      topLine: marketSignals.refinedTopLine?.body,
      summary: marketSignals.editorialSummary,
      cta: marketSignals.refinedCustomWorkCta?.body
    }),
    renderHighlight({
      label: mAndA.channelLabel,
      pageHref: "/channels/m-and-a",
      fallbackReason: mAndA.fallbackReason,
      period: formatBulletinPeriod(mAndA),
      topLine: mAndA.refinedTopLine?.body,
      summary: mAndA.editorialSummary,
      cta: mAndA.refinedCustomWorkCta?.body
    }),
    renderCard(
      "Other Channels",
      `Implemented web-integrated pilots contributing to umbrella synthesis: ${grantsChannelConfig.displayName}, ${tradeChannelConfig.displayName}, ${manufacturingChannelConfig.displayName}, ${marketSignalsChannelConfig.displayName}, and ${mAndAChannelConfig.displayName}.`
    )
  ].join("\n");

  return renderLayout("Umbrella | Home", body);
}
