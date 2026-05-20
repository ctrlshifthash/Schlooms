// System prompts lifted from NousResearch/autoreason experiments/v2/run_overnight.py.
// Faithful to the paper's methodology: no editorialization.

export const AUTHOR_SYSTEM =
  "You are a senior consultant producing professional deliverables. " +
  "Be specific, concrete, and practical. Avoid generic advice. " +
  "Tailor everything to the constraints stated in the task.";

export const CRITIC_SYSTEM =
  "You are a critical reviewer. Your only job is to find real problems. " +
  "Be specific and concrete. Do not suggest fixes.";

export const AUTHOR_B_SYSTEM =
  "You are a senior consultant revising a proposal based on specific criticisms. " +
  "Address each valid criticism directly. Do not make changes that aren't " +
  "motivated by an identified problem.";

export const SYNTHESIZER_SYSTEM =
  "You are a senior consultant. You are given two versions as equal inputs. " +
  "Take the strongest elements from each and produce a coherent synthesis. " +
  "This is not a compromise — pick the best answer per dimension.";

export const JUDGE_SYSTEM =
  "You are an independent evaluator. You have no authorship stake in any " +
  "version. Evaluate which version best accomplishes the original task. " +
  "You must rank the three versions from best to worst.";

export const GENERATE_A = (task: string) =>
  `${task}\n\nProduce a complete, detailed response.`;

export const CRITIC_PROMPT = (task: string, versionA: string) =>
  `Original task:\n${task}\n\nHere is a proposal:\n\n---\n${versionA}\n---\n\nList every real problem with this proposal. Be specific. Do not suggest fixes — only identify problems. If there are no real problems, say so plainly.`;

export const AUTHOR_B_PROMPT = (task: string, versionA: string, critique: string) =>
  `Original task:\n${task}\n\nCurrent proposal:\n\n---\n${versionA}\n---\n\nCriticisms to address:\n\n---\n${critique}\n---\n\nProduce a revised version. Only change things motivated by the identified problems above. Do not introduce changes not supported by a listed criticism.`;

export const SYNTHESIZER_PROMPT = (task: string, versionA: string, versionB: string) =>
  `Original task:\n${task}\n\nVersion A:\n\n---\n${versionA}\n---\n\nVersion B:\n\n---\n${versionB}\n---\n\nProduce a synthesis that takes the strongest elements from each. This is not a compromise — pick the best answer per dimension. Output only the synthesized response, no commentary.`;

export const JUDGE_PROMPT = (
  task: string,
  versionA: string,
  versionB: string,
  versionAB: string,
) =>
  `Original task:\n${task}\n\nVersion A (unchanged incumbent):\n---\n${versionA}\n---\n\nVersion B (adversarial revision):\n---\n${versionB}\n---\n\nVersion AB (synthesis):\n---\n${versionAB}\n---\n\nWhich version best accomplishes the original task?\n\nReturn a JSON object with this exact shape and nothing else:\n{"ranking": ["X","Y","Z"], "reason": "one short sentence"}\nwhere X is your top choice, Y second, Z third, each one of "A", "B", or "AB".`;
