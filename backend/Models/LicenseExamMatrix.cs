namespace QuizCarLicense.Models;

/// <summary>
/// Ma trận phân bổ số lượng câu hỏi theo từng Chương (hoặc nhóm câu điểm liệt) cho một Hạng GPLX.
/// </summary>
public partial class LicenseExamMatrix
{
    public int MatrixId { get; set; }

    public int LicenseClassId { get; set; }

    /// <summary>Chương câu hỏi cần bốc (có thể null nếu chỉ định chung cho nhóm câu điểm liệt).</summary>
    public int? CategoryId { get; set; }

    /// <summary>True = Bốc từ tập câu điểm liệt; False = Bốc từ các câu thường của chương.</summary>
    public bool IsCriticalPool { get; set; }

    /// <summary>Số lượng câu hỏi cần rút ra cho đề thi.</summary>
    public int QuestionCount { get; set; }

    public virtual LicenseClass LicenseClass { get; set; } = null!;

    public virtual QuestionCategory? Category { get; set; }
}
