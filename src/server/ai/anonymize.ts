/**
 * Ẩn danh hóa trước khi gửi dữ liệu học sinh tới AI (Phần 11):
 * thay họ tên bằng mã tạm (HS01, HS02...), loại bỏ ngày sinh, giới tính, ghi chú cá nhân.
 * Bảng ánh xạ chỉ tồn tại trong bộ nhớ server để khôi phục kết quả.
 */
export function createPseudonymizer() {
  const forward = new Map<string, string>();
  const backward = new Map<string, string>();
  return {
    alias(studentId: string) {
      if (!forward.has(studentId)) {
        const code = `HS${String(forward.size + 1).padStart(2, "0")}`;
        forward.set(studentId, code);
        backward.set(code, studentId);
      }
      return forward.get(studentId)!;
    },
    resolve(code: string) {
      return backward.get(code) ?? null;
    },
  };
}
