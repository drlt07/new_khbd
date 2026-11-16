import "server-only";
import type { AIProvider } from "../types";

/**
 * Provider MÔ PHỎNG. Không gọi mô hình AI nào.
 * Runner sẽ dùng hàm `mock` của từng task để sinh kết quả xác định (deterministic),
 * và mọi bản ghi AIAnalysis tạo ra đều có isMock = true để hiển thị nhãn "Mô phỏng" trên UI.
 */
export const mockProvider: AIProvider = {
  name: "mock",
  isMock: true,
  async completeJSON() {
    throw new Error("mockProvider.completeJSON không được gọi trực tiếp — runner dùng task.mock()");
  },
};
