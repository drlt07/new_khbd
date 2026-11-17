import { redirect } from "next/navigation";

/** Đường dẫn cũ — chức năng nay nằm trong từng lớp học */
export default function Legacy() {
  redirect("/classes");
}
