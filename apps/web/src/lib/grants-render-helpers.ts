interface EditorialModelBase {
  bulletinPeriod?: { label?: string };
  publicationMetadata?: { issue_date?: string };
  provenanceReferences?: Array<{ ref_type: string; ref_value: string }>;
}

export function formatBulletinPeriod(model: EditorialModelBase): string {
  if (model.bulletinPeriod?.label) {
    return model.bulletinPeriod.label;
  }

  if (model.publicationMetadata?.issue_date) {
    return model.publicationMetadata.issue_date;
  }

  return "Period pending";
}

export function renderOptionalItems(items: string[] | undefined, emptyMessage: string): string {
  if (!items || items.length === 0) {
    return `<p>${emptyMessage}</p>`;
  }

  const list = items.map((item) => `<li>${item}</li>`).join("\n");
  return `<ul>${list}</ul>`;
}

export function renderProvenanceSnippet(model: EditorialModelBase, max = 3): string {
  const refs = model.provenanceReferences ?? [];
  if (refs.length === 0) {
    return "<p>Provenance references are not available in this artifact.</p>";
  }

  const snippet = refs.slice(0, max).map((ref) => `<li><code>${ref.ref_type}</code>: ${ref.ref_value}</li>`).join("\n");
  const suffix = refs.length > max ? `<p><small>Showing ${max} of ${refs.length} provenance references.</small></p>` : "";

  return `<ul>${snippet}</ul>${suffix}`;
}
