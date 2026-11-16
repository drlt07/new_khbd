import type { ConfidenceLevel, ItemOrigin, ProfileDimension, ReviewStatus } from "@prisma/client";

export type ProfileItemView = {
  id: string;
  dimension: ProfileDimension;
  title: string;
  description: string | null;
  supportStrategy?: string | null;
  subject?: { id: string; name: string } | null;
  criteria: { id: string; name: string } | null;
  origin: ItemOrigin;
  reviewStatus: ReviewStatus;
  confidence: ConfidenceLevel | null;
  evidences: { id: string; title: string }[];
  createdAt: Date;
  updatedAt: Date;
};

export type CriteriaOption = { id: string; name: string; dimension: ProfileDimension; framework: { name: string } };
export type SubjectOption = { id: string; name: string };
