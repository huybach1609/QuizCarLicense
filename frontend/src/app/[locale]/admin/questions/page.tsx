"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Upload, AlertCircle, Image as ImageIcon, Edit2, Search, X, AlertTriangle } from "lucide-react";

interface AnswerItem {
  id?: number;
  content: string;
  isCorrect: boolean;
}

interface QuestionAdminItem {
  questionId: number;
  content: string;
  score: number;
  image: string | null;
  active: boolean;
  categoryId?: number | null;
  isCritical?: boolean;
  explanation?: string | null;
  answers: { id: number; content: string; isCorrect: boolean }[];
}

const CATEGORY_OPTIONS = [
  { id: 1, name: "Chương 1: Khái niệm và Quy tắc giao thông" },
  { id: 2, name: "Chương 2: Nghiệp vụ vận tải & Văn hóa giao thông" },
  { id: 3, name: "Chương 3: Kỹ thuật lái xe" },
  { id: 4, name: "Chương 4: Cấu tạo và Sửa chữa xe" },
  { id: 5, name: "Chương 5: Hệ thống Biển báo đường bộ" },
  { id: 6, name: "Chương 6: Các thế Sa hình giao thông" },
];

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionAdminItem | null>(null);

  // Form Fields
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [isCritical, setIsCritical] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [answers, setAnswers] = useState<AnswerItem[]>([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = useCallback(async (p = 1, search = activeSearch) => {
    setLoading(true);
    try {
      const url = new URL("/api/v1/admin/questions", window.location.origin);
      url.searchParams.set("page", p.toString());
      url.searchParams.set("pageSize", "15");
      if (search.trim()) {
        url.searchParams.set("search", search.trim());
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.items || []);
        setPage(data.pageNumber || 1);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [activeSearch]);

  useEffect(() => {
    loadQuestions(1, activeSearch);
  }, [loadQuestions, activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setContent("");
    setCategoryId(1);
    setIsCritical(false);
    setExplanation("");
    setAnswers([
      { content: "", isCorrect: true },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ]);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (q: QuestionAdminItem) => {
    setEditingQuestion(q);
    setContent(q.content);
    setCategoryId(q.categoryId ?? undefined);
    setIsCritical(!!q.isCritical);
    setExplanation(q.explanation || "");
    setAnswers(
      q.answers && q.answers.length > 0
        ? q.answers.map((a) => ({ id: a.id, content: a.content, isCorrect: a.isCorrect }))
        : [
            { content: "", isCorrect: true },
            { content: "", isCorrect: false },
          ]
    );
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validAnswers = answers.filter((a) => a.content.trim() !== "");
    if (validAnswers.length < 2) {
      setError("Cần tối thiểu 2 đáp án lựa chọn.");
      return;
    }

    if (!validAnswers.some((a) => a.isCorrect)) {
      setError("Phải chọn ít nhất 1 đáp án đúng.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: content.trim(),
        score: 1,
        categoryId: categoryId || null,
        isCritical,
        explanation: explanation.trim() || null,
        answers: validAnswers.map((a, idx) => ({
          answerId: a.id ?? idx + 1,
          content: a.content.trim(),
          isCorrect: a.isCorrect,
        })),
      };

      const isEdit = !!editingQuestion;
      const url = isEdit
        ? `/api/v1/admin/questions/${editingQuestion.questionId}`
        : "/api/v1/admin/questions";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const problem = await res.json().catch(() => null);
        throw new Error(problem?.detail || (isEdit ? "Không thể cập nhật câu hỏi." : "Không thể tạo câu hỏi."));
      }

      setShowModal(false);
      loadQuestions(isEdit ? page : 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi ID #${id}?`)) return;

    const res = await fetch(`/api/v1/admin/questions/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadQuestions(page);
    } else {
      alert("Không thể xóa câu hỏi.");
    }
  };

  const handleUploadImage = async (questionId: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`/api/v1/admin/questions/${questionId}/image`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      loadQuestions(page);
    } else {
      alert("Không thể tải lên hình ảnh.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Ngân Hàng 600 Câu Hỏi Sát Hạch</h2>
          <p className="text-xs text-muted-foreground">Quản lý nội dung câu hỏi, cờ điểm liệt, đáp án và giải thích.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Câu Hỏi</span>
        </button>
      </div>

      {/* Thanh Tìm Kiếm */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo ID (vd: #19) hoặc từ khóa nội dung..."
            className="w-full pl-8 pr-8 py-1.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          Tìm kiếm
        </button>
      </form>

      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Đang tải danh sách câu hỏi...</div>
      ) : (
        <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-16">ID</th>
                <th className="py-2.5 px-3">Nội dung câu hỏi</th>
                <th className="py-2.5 px-3 w-28 text-center">Đặc điểm</th>
                <th className="py-2.5 px-3 w-24 text-center">Hình ảnh</th>
                <th className="py-2.5 px-3 w-32 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy câu hỏi nào phù hợp.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.questionId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-muted-foreground">
                      #{q.questionId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 max-w-xl">
                        <span className="font-medium text-foreground line-clamp-2">
                          {q.content}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {q.isCritical && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-destructive/15 text-destructive font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Điểm liệt</span>
                          </span>
                        )}
                        {q.categoryId && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground">
                            Chương {q.categoryId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {q.image && q.image !== "none" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary font-medium">
                          <ImageIcon className="w-3 h-3" />
                          <span>Có ảnh</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Không</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-primary/10 transition-colors cursor-pointer"
                          title="Sửa câu hỏi & đáp án"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <label className="cursor-pointer p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Tải/Đổi ảnh">
                          <Upload className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadImage(q.questionId, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        <button
                          onClick={() => handleDelete(q.questionId)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Trang {page} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadQuestions(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-border text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer"
            >
              Trước
            </button>
            <button
              onClick={() => loadQuestions(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded border border-border text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa câu hỏi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-lg max-w-xl w-full p-5 shadow-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {editingQuestion ? `Chỉnh Sửa Câu Hỏi #${editingQuestion.questionId}` : "Thêm Câu Hỏi Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Nội dung câu hỏi */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi sát hạch..."
                  className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Phân loại: Chương & Cờ Điểm Liệt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">Chương kiến thức</label>
                  <select
                    value={categoryId ?? ""}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground"
                  >
                    <option value="">-- Chưa phân chương --</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 sm:pt-5">
                  <input
                    type="checkbox"
                    id="criticalCheckbox"
                    checked={isCritical}
                    onChange={(e) => setIsCritical(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-destructive focus:ring-destructive cursor-pointer"
                  />
                  <label htmlFor="criticalCheckbox" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    Câu điểm liệt 
                  </label>
                </div>
              </div>

              {/* Giải thích đáp án */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Giải thích chi tiết (Hiện khi học viên xem đáp án)</label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Ví dụ: Theo Luật Giao thông đường bộ Điều 5, nghiêm cấm tuyệt đối hành vi..."
                  className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Danh sách đáp án */}
              <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Danh sách đáp án (Chọn Radio để đánh dấu đáp án đúng)
                  </label>
                  {answers.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setAnswers([...answers, { content: "", isCorrect: false }])}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      + Thêm đáp án
                    </button>
                  )}
                </div>

                {answers.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswerOption"
                      checked={ans.isCorrect}
                      onChange={() => {
                        setAnswers(answers.map((a, i) => ({ ...a, isCorrect: i === idx })));
                      }}
                      className="cursor-pointer w-4 h-4 text-primary"
                      title="Chọn đáp án này là đúng"
                    />
                    <input
                      type="text"
                      required
                      value={ans.content}
                      onChange={(e) => {
                        const next = [...answers];
                        next[idx].content = e.target.value;
                        setAnswers(next);
                      }}
                      placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-3 py-1 rounded-md border border-border bg-background text-xs text-foreground"
                    />
                    {answers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = answers.filter((_, i) => i !== idx);
                          if (ans.isCorrect && next.length > 0) next[0].isCorrect = true;
                          setAnswers(next);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Bỏ đáp án này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Đang lưu..." : editingQuestion ? "Cập Nhật Câu Hỏi" : "Tạo Câu Hỏi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
