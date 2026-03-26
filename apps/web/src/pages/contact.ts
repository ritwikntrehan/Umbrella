import { renderCard, renderLayout } from "@umbrella/ui";

export function contactPage(): string {
  const body = renderCard(
    "Contact",
    "Interested in channel onboarding or source integration? Email: editorial@umbrella.local (placeholder)."
  );

  return renderLayout("Umbrella | Contact", body);
}
