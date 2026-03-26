import {
  grantsChannelConfig,
  mAndAChannelConfig,
  manufacturingChannelConfig,
  marketSignalsChannelConfig,
  tradeChannelConfig
} from "@umbrella/channel-config";
import { renderCard, renderLayout } from "@umbrella/ui";

export function channelsPage(): string {
  const channels = [
    grantsChannelConfig,
    tradeChannelConfig,
    manufacturingChannelConfig,
    marketSignalsChannelConfig,
    mAndAChannelConfig
  ];

  const body = channels
    .map((channel) => renderCard(channel.displayName, `${channel.description} Enabled: ${channel.enabled}.`))
    .join("\n");

  return renderLayout("Umbrella | Channels", body);
}
