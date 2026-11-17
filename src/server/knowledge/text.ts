/** Bỏ dấu tiếng Việt + chữ thường — dùng cho chỉ mục tìm kiếm và truy vấn. */
export function foldVietnamese(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

/** Chuỗi để đánh chỉ mục: không dấu, chỉ giữ chữ/số, gom khoảng trắng. */
export function toSearchText(s: string) {
  return foldVietnamese(s).replace(/[^a-z0-9]+/g, " ").trim();
}
