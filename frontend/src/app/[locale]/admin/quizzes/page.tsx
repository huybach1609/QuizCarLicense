"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import type { QuizSummary } from "@/lib/api-client";

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [questionIdsInput, setQuestionIdsInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/quizzes");
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const questionIds = questionIdsInput
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    try {
      const res = await fetch("/api/v1/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          detail,
          questionIds: questionIds.length > 0 ? questionIds : undefined,
        }),
      });

      if (!res.ok) {
        const p = await res.json();
        throw new Error(p.detail || "Không thể tạo bộ đề thi.");
      }

      setShowCreateModal(false);
      setTitle("");
      setDetail("");
      setQuestionIdsInput("");
      loadQuizzes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
      setError(msg);
    }
  };

  const handleDelete = async (quizId: number) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bộ đề thi ID #${quizId}?`)) return;

    const res = await fetch(`/api/v1/admin/quizzes/${quizId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      loadQuizzes();
    } else {
      alert("Không thể xóa đề thi này.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Danh Sách Bộ Đề Thi</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo Đề Mới</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Đang tải danh sách...</div>
      ) : (
        <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Tiêu đề đề thi</th>
                <th className="py-2.5 px-3 text-center">Số câu hỏi</th>
                <th className="py-2.5 px-3 hidden md:table-cell">Mô tả</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {quizzes.map((quiz) => (
                <tr key={quiz.quizId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-muted-foreground">
                    #{quiz.quizId}
                  </td>
                  <td className="py-3 px-3 font-semibold text-foreground">{quiz.title}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">
                    {quiz.totalQuestions}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-xs truncate hidden md:table-cell">
                    {quiz.detail || "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDelete(quiz.quizId)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tạo đề thi mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 shadow-lg flex flex-col gap-4">
            <h3 className="font-bold text-sm text-foreground">Tạo Bộ Đề Thi Mới</h3>

            {error && (
              <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Tiêu đề đề thi</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đề thi thử số 10 - Hạng B2"
                  className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Mô tả cấu trúc đề thi..."
                  className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">
                  Danh sách ID câu hỏi (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={questionIdsInput}
                  onChange={(e) => setQuestionIdsInput(e.target.value)}
                  placeholder="Ví dụ: 1, 2, 5, 10, 15, 20"
                  className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                >
                  Lưu Đề Thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
