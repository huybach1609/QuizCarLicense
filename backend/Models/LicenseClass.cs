using System.Collections.Generic;

namespace QuizCarLicense.Models;

/// <summary>
/// Thông tin cấu hình của một Hạng Giấy Phép Lái Xe (A1, A, B, C1, C, D1, D2, D, BE, C1E, CE)
/// theo quy định Thông tư 108/2026/TT-BCA.
/// </summary>
public partial class LicenseClass
{
    public int LicenseClassId { get; set; }

    /// <summary>Mã hạng bằng (A1, A, B, C1, C, D1, D2, D, BE, C1E, CE).</summary>
    public string Code { get; set; } = null!;

    /// <summary>Tên hiển thị của hạng bằng (VD: Hạng B).</summary>
    public string Name { get; set; } = null!;

    /// <summary>Mô tả phương tiện được phép điều khiển.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Nhóm phương tiện: Motorbike | Car.</summary>
    public string VehicleGroup { get; set; } = "Car";

    /// <summary>Số lượng câu hỏi trong một đề thi sát hạch (40 | 30 | 35 | 40 | 45).</summary>
    public int TotalQuestions { get; set; }

    /// <summary>Thời gian làm bài tính bằng phút (27 | 20 | 22 | 24 | 26).</summary>
    public int DurationMinutes { get; set; }

    /// <summary>Số điểm tối thiểu cần đạt (36 | 27 | 32 | 36 | 41) và không sai câu điểm liệt.</summary>
    public int PassScore { get; set; }

    /// <summary>Thứ tự sắp xếp trên giao diện (1..11).</summary>
    public int DisplayOrder { get; set; }

    public bool Active { get; set; } = true;

    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();

    public virtual ICollection<LicenseExamMatrix> ExamMatrices { get; set; } = new List<LicenseExamMatrix>();

    public virtual ICollection<QuizQuestion> AllowedQuestions { get; set; } = new List<QuizQuestion>();
}
