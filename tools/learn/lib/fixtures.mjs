// fixtures.mjs — shared, valid Pattern IR fixture for tool selftests. NOT shipped knowledge.
export const VALID_ENTRY_ID = "learned-technique-0001";
export const VALID_ENTRY_SLUG = "scroll-synced-focal-reveal";
export const VALID_ENTRY_NAME = "Scroll-synced focal reveal";
export const VALID_ENTRY_TAGS = ["scroll-sync", "focal-reveal", "opacity"];

export const VALID_ENTRY_TEXT = `---
schema_version: "1.0"
entry_id: "${VALID_ENTRY_ID}"
slug: "${VALID_ENTRY_SLUG}"
type: technique
status: accepted
name: "${VALID_ENTRY_NAME}"
source_url: "https://example.com/owned-demo"
observed_date: "2026-06-27"
machine_distilled: true
evidence:
  observation_method: browser
  source_elements: ["interaction","timing"]
  copied_material: false
abstraction:
  core_mechanism: "Map scroll progress within a pinned range to one focal element's opacity and scale."
  reusable_recipe: "Pin the section; drive one element opacity 0->1 and scale 0.96->1 across 30-60% of the pin; transform/opacity only."
  design_intent: "Direct the eye to one subject before revealing context."
  why_it_works: "A single moving focal point reads as intentional camera work, not decoration."
  constraints: "Transform/opacity only; finish before 70% of the pin; respect reduced-motion."
  failure_modes: "Revealing many elements at once; animating filter/blur; pin under 150vh."
originality_firewall:
  no_verbatim_code: true
  no_copied_assets: true
  no_brand_copy: true
  no_asset_dependency: true
  source_specific_terms_removed: true
  reimplemented_from_principle: true
  redescribable_without_source: true
applicability:
  best_for: ["product-hero","chapter-intro"]
  avoid_when: ["dense-dashboards","text-only-pages"]
  compatible_buckets: ["technique"]
  complexity: medium
  tags: ${JSON.stringify(VALID_ENTRY_TAGS)}
scores:
  confidence: 0.8
  novelty: 0.55
  originality_risk: 0.2
  reuse: null
dedup:
  nearest_existing_entries: []
  similarity_score: 0.0
  action: create
  reason: "No existing focal-reveal technique on the shelf."
promotion:
  eligible_for_canon: false
  cluster_id: ""
  required_cluster_size: 3
  source_diversity_required: true
  human_review_required: true
---

## Reusable recipe
Pin the section over 150-400vh. Within the first 30-60% of the pin, drive a single focal
element opacity 0->1 and scale 0.96->1 (transform/opacity only).

## Constraints
Transform/opacity only; finish before 70% of the pin; provide a reduced-motion path that
shows the element statically.

## Failure modes
Revealing several elements at once; animating filter blur; pins under 150vh.

## Negative twin - what this is NOT
Not a generic fade-in-on-enter. The reveal is scrubbed by scroll position inside a pin,
not a one-shot transition on intersection.

## Original variant A
Drive opacity plus a 12px->0 translateY instead of scale, for a "rise into focus" feel.
`;

export function pointerLine({ id = VALID_ENTRY_ID, name = VALID_ENTRY_NAME, dir = "techniques", slug = VALID_ENTRY_SLUG, oneLiner = "Scrubbed single-focal reveal inside a pin." } = {}) {
  return `- **${name}** -> \`references/learned/${dir}/${slug}.md\` - ${oneLiner} <!-- learned:${id} -->`;
}
