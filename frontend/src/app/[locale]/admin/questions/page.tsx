"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Upload, AlertCircle, Image as ImageIcon } from "lucide-react";

interface AnswerItem {
  content: string;
  isCorrect: boolean;
}

interface QuestionAdminItem {
  questionId: number;
  content: string;
  score: number;
  image: string | null;
  active: boolean;
  answers: { id: number; content: string; isCorrect: boolean }[];
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Form tạo mới
  const [content, setContent] = useState("");
  const [answers, setAnswers] = useState<AnswerItem[]>([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ]);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/questions?page=${p}&pageSize=15`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.items || []);
        setPage(data.pageNumber || 1);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(1);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch("/api/v1/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          score: 1,
          answers: validAnswers.map((a, idx) => ({
            answerId: idx + 1,
            content: a.content,
            isCorrect: a.isCorrect,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể tạo câu hỏi.");
      }

      setShowModal(false);
      setContent("");
      setAnswers([
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
      ]);
      loadQuestions(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
      setError(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Xóa câu hỏi ID #${id}?`)) return;

    const res = await fetch(`/api/v1/admin/questions/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadQuestions(page);
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
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Ngân Hàng 600 Câu Hỏi</h2>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Câu Hỏi</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Đang tải câu hỏi...</div>
      ) : (
        <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Nội dung câu hỏi</th>
                <th className="py-2.5 px-3 text-center">Hình ảnh</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {questions.map((q) => (
                <tr key={q.questionId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-muted-foreground">
                    #{q.questionId}
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground max-w-md truncate">
                    {q.content}
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
                  <td className="py-3 px-3 text-right flex items-center justify-end gap-2">
                    <label className="cursor-pointer p-1 text-muted-foreground hover:text-foreground" title="Đổi ảnh">
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
                      className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                      title="Xóa câu hỏi"
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

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Trang {page} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadQuestions(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-border text-foreground hover:bg-muted disabled:opacity-40"
            >
              Trước
            </button>
            <button
              onClick={() => loadQuestions(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded border border-border text-foreground hover:bg-muted disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modal Thêm câu hỏi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-5 shadow-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-sm text-foreground">Thêm Câu Hỏi Sát Hạch Mới</h3>

            {error && (
              <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Nội dung câu hỏi</label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-semibold text-foreground">
                  Danh sách đáp án (Tick chọn đáp án đúng)
                </label>

                {answers.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={ans.isCorrect}
                      onChange={() => {
                        setAnswers(answers.map((a, i) => ({ ...a, isCorrect: i === idx })));
                      }}
                      className="cursor-pointer"
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
                      className="flex-1 px-3 py-1 rounded-md border border-border bg-background text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
