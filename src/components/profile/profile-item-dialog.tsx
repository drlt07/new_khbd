"use client";
import { Loader2 } from "lucide-react";
import type { ProfileDimension } from "@prisma/client";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { DIMENSION_LABEL } from "@/lib/labels";
import type { CriteriaOption, ProfileItemView, SubjectOption } from "./types";

const PLACEHOLDER: Record<ProfileDimension, string> = {
  INTEREST: "Ví dụ: Yêu thích lập trình trò chơi",
  STRENGTH: "Ví dụ: Khả năng tưởng tượng tốt, có ý tưởng sáng tác độc đáo",
  COMPETENCY: "Ví dụ: Vận dụng kiến thức vào tình huống thực tế",
  LEARNING_NEED: "Ví dụ: Kỹ năng trình bày bài viết còn hạn chế",
  LEARNING_PREFERENCE: "Ví dụ: Học hiệu quả qua thực hành và hình ảnh",
  DEVELOPMENT_GOAL: "Ví dụ: Muốn thử sức với vai trò thuyết trình",
};

export function ProfileItemDialog({
  open, onOpenChange, studentId, dimension, item, criteria, subjects,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studentId: string;
  dimension: ProfileDimension;
  item?: ProfileItemView;
  criteria: CriteriaOption[];
  subjects: SubjectOption[];
}) {
  const { mutate, pending, error, fieldError, reset } = useMutation();
  const options = criteria.filter((c) => c.dimension === dimension);
  const isCompetency = dimension === "COMPETENCY";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = item
      ? await mutate(`/api/profile-items/${dimension}/${item.id}`, "PATCH", body)
      : await mutate(`/api/students/${studentId}/profile-items`, "POST", { ...body, dimension });
    if (res.ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent
        title={`${item ? "Sửa" : "Thêm"}: ${DIMENSION_LABEL[dimension]}`}
        description={item?.origin === "AI" ? "Mục do AI đề xuất — sau khi sửa sẽ được đánh dấu “Đã chỉnh sửa”." : "Mục do giáo viên nhập được xem là dữ liệu đã xác thực."}
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Tiêu chí" htmlFor="criteriaId" error={fieldError("criteriaId")}>
            <Select id="criteriaId" name="criteriaId" defaultValue={item?.criteria?.id ?? ""}>
              <option value="">— Không gắn tiêu chí —</option>
              {options.map((c) => <option key={c.id} value={c.id}>{c.name}{c.framework.name.includes("mặc định") ? "" : ` · ${c.framework.name}`}</option>)}
            </Select>
          </Field>
          <Field label={isCompetency ? "Năng lực" : "Nội dung"} htmlFor="title" error={fieldError("title")} required>
            <Input id="title" name="title" defaultValue={item?.title} placeholder={PLACEHOLDER[dimension]} autoFocus />
          </Field>
          {isCompetency && (
            <Field label="Môn học" htmlFor="subjectId">
              <Select id="subjectId" name="subjectId" defaultValue={item?.subject?.id ?? ""}>
                <option value="">— Chung —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          )}
          <Field
            label={isCompetency ? "Biểu hiện cụ thể quan sát được" : "Mô tả / căn cứ"}
            htmlFor="description"
            error={fieldError("description")}
            required={isCompetency}
            hint={isCompetency ? "Mô tả định tính, không dùng nhãn xếp loại (giỏi/khá/trung bình/yếu)." : "Ghi rõ tình huống, sản phẩm hoặc quan sát làm căn cứ."}
          >
            <Textarea id="description" name="description" defaultValue={item?.description ?? ""} rows={3} />
          </Field>
          {dimension === "LEARNING_NEED" && (
            <Field label="Hình thức hỗ trợ gợi ý" htmlFor="supportStrategy" error={fieldError("supportStrategy")}>
              <Textarea id="supportStrategy" name="supportStrategy" defaultValue={item?.supportStrategy ?? ""} rows={2} placeholder="Ví dụ: Cung cấp dàn ý mẫu, chia nhỏ nhiệm vụ" />
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
