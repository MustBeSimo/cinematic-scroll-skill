// schema.mjs — machine mirror of references/pattern-ir.md. The .md is the human
// canon; this is the enforced shape. Keep the two in sync (a one-line comment in
// each points at the other). Zero deps; pure data.
export const SCHEMA_VERSION = "1.0";
export const TYPES = ["technique", "theme", "archetype", "taste-rule"];
export const STATUSES = ["candidate", "accepted", "merged", "rejected", "deprecated", "promoted"];
export const DEDUP_ACTIONS = ["create", "merge", "skip"];
export const OBSERVATION_METHODS = ["browser", "fetch", "screenshot", "dom", "motion-trace"];
export const COMPLEXITY = ["low", "medium", "high"];
export const FIREWALL_FLAGS = [
  "no_verbatim_code", "no_copied_assets", "no_brand_copy", "no_asset_dependency",
  "source_specific_terms_removed", "reimplemented_from_principle", "redescribable_without_source",
];
export const TYPE_DIR = { technique: "techniques", theme: "themes", archetype: "archetypes", "taste-rule": "taste" };
export const TYPE_HOST = {
  technique: "references/scroll-patterns.md",
  theme: "references/visual-systems.md",
  archetype: "references/film-archetypes.md",
  "taste-rule": "taste-guardrails.md",
};
// every required leaf (dot-path) an IR object must define:
export const REQUIRED = [
  "schema_version", "entry_id", "slug", "type", "status", "name", "source_url", "observed_date", "machine_distilled",
  "evidence.observation_method", "evidence.source_elements", "evidence.copied_material",
  "abstraction.core_mechanism", "abstraction.reusable_recipe", "abstraction.design_intent",
  "abstraction.why_it_works", "abstraction.constraints", "abstraction.failure_modes",
  ...FIREWALL_FLAGS.map((f) => `originality_firewall.${f}`),
  "applicability.best_for", "applicability.avoid_when", "applicability.compatible_buckets",
  "applicability.complexity", "applicability.tags",
  "scores.confidence", "scores.novelty", "scores.originality_risk", "scores.reuse",
  "dedup.action", "dedup.reason",
  "promotion.eligible_for_canon", "promotion.human_review_required",
];
