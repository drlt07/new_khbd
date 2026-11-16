import type { ProfileDimension } from "@prisma/client";
import type { StudentProfileData } from "@/server/services/profile.service";
import type { ProfileItemView } from "./types";

type S = StudentProfileData["student"];

type Common = Omit<ProfileItemView, "dimension" | "title" | "description">;
const common = (x: S["interests"][number]): Common => ({
  id: x.id, criteria: x.criteria, origin: x.origin, reviewStatus: x.reviewStatus, confidence: x.confidence,
  evidences: x.evidences, createdAt: x.createdAt, updatedAt: x.updatedAt,
});
const simple = (dimension: ProfileDimension, list: S["interests"]): ProfileItemView[] =>
  list.map((x) => ({ ...common(x), dimension, title: x.title, description: x.description }));

/** Chuẩn hóa 6 bảng mục hồ sơ về một dạng hiển thị chung. */
export function toItemViews(s: S): Record<ProfileDimension, ProfileItemView[]> {
  return {
    INTEREST: simple("INTEREST", s.interests),
    STRENGTH: simple("STRENGTH", s.strengths),
    LEARNING_PREFERENCE: simple("LEARNING_PREFERENCE", s.preferences),
    DEVELOPMENT_GOAL: simple("DEVELOPMENT_GOAL", s.developmentGoals),
    LEARNING_NEED: s.learningNeeds.map((x) => ({ ...common(x), dimension: "LEARNING_NEED", title: x.title, description: x.description, supportStrategy: x.supportStrategy })),
    COMPETENCY: s.competencies.map((x) => ({
      id: x.id, criteria: x.criteria, origin: x.origin, reviewStatus: x.reviewStatus, confidence: x.confidence,
      evidences: x.evidences, createdAt: x.createdAt, updatedAt: x.updatedAt,
      dimension: "COMPETENCY", title: x.competencyName, description: x.observation, subject: x.subject,
    })),
  };
}
