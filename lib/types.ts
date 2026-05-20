export type Role = "A" | "B" | "AB";

export type Phase = "author" | "critic" | "authorB" | "synth" | "judges" | "decided" | "converged" | "max_passes";

export type StreamEvent =
  | { type: "pass_start"; pass: number }
  | { type: "phase_start"; pass: number; phase: Phase; label: string }
  | { type: "token"; pass: number; phase: Phase; text: string }
  | { type: "phase_done"; pass: number; phase: Phase; content: string }
  | { type: "judge_vote"; pass: number; judge: number; ranking: Role[]; reason: string }
  | { type: "pass_winner"; pass: number; winner: Role; borda: Record<Role, number> }
  | { type: "converged"; pass: number; final: string }
  | { type: "max_passes_reached"; pass: number; final: string }
  | { type: "error"; message: string };

export interface RunRequest {
  task: string;
  maxPasses?: number;
  numJudges?: number;
  model?: string;
}
