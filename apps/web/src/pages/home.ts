import {
  grantsChannelConfig,
  manufacturingChannelConfig,
  marketSignalsChannelConfig,
  tradeChannelConfig
} from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";
import { readLatestGrantsEditorialForWeb } from "../lib/grants-artifact-reader.js";
import { formatBulletinPeriod } from "../lib/grants-render-helpers.js";
import { readLatestManufacturingEditorialForWeb } from "../lib/manufacturing-artifact-reader.js";
import { readLatestMarketSignalsEditorialForWeb } from "../lib/market-signals-artifact-reader.js";
import { readLatestTradeEditorialForWeb } from "../lib/trade-artifact-reader.js";

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
  const grants = readLatestGrantsEditorialForWeb();
  const trade = readLatestTradeEditorialForWeb();
  const manufacturing = readLatestManufacturingEditorialForWeb();
  const marketSignals = readLatestMarketSignalsEditorialForWeb();

  const body = [
    renderCard(
      "Umbrella Platform",
      "Visible deterministic slices now include grants, trade, and market-signals end-to-end rendering."
    ),
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
    renderCard(
      "Other Channels",
      `Still placeholder-only while ${grantsChannelConfig.displayName}, ${tradeChannelConfig.displayName}, ${manufacturingChannelConfig.displayName}, and ${marketSignalsChannelConfig.displayName} are active web-integrated pilots.`
    )
  ].join("\n");

  return renderLayout("Umbrella | Home", body);
}
