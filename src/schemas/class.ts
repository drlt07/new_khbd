import { z } from "zod";
import { schoolYear } from "./common";

export const classInputSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên lớp").max(50),
  schoolYear,
});
export type ClassInput = z.infer<typeof classInputSchema>;
