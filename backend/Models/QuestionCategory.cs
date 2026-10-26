using System.Collections.Generic;

namespace QuizCarLicense.Models;

/// <summary>
/// Chương / Chủ đề kiến thức trong bộ 600 câu hỏi lý thuyết lái xe.
/// </summary>
public partial class QuestionCategory
{
    public int CategoryId { get; set; }

    /// <summary>Mã chương (CH1_RULES, CH2_CULTURE, CH3_TECHNIQUE, CH4_STRUCTURE, CH5_SIGNS, CH6_SAHINH).</summary>
    public string Code { get; set; } = null!;

    /// <summary>Tên chương hiển thị (VD: Chương I: Quy định chung và quy tắc giao thông).</summary>
    public string Title { get; set; } = null!;

    /// <summary>Mô tả ngắn gọn nội dung chương.</summary>
    public string? Description { get; set; }

    public int DisplayOrder { get; set; }

    public virtual ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();

    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();

    public virtual ICollection<LicenseExamMatrix> ExamMatrices { get; set; } = new List<LicenseExamMatrix>();
}
