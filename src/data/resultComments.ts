import raw from "../../public/data/result_comments.json";

export type CommentId =
  | "P1" | "P2" | "P3" | "P4"
  | "A1" | "A2" | "A3" | "A4"
  | "B1" | "B2" | "B3" | "B4"
  | "C1" | "C2" | "C3" | "C4" | "C5";

export const COMMENT_IDS_BY_RANK: Record<"PERFECT" | "A" | "B" | "C", CommentId[]> = {
  PERFECT: ["P1", "P2", "P3", "P4"],
  A: ["A1", "A2", "A3", "A4"],
  B: ["B1", "B2", "B3", "B4"],
  C: ["C1", "C2", "C3", "C4", "C5"],
};

export const resultComments = raw as Record<CommentId, string>;
