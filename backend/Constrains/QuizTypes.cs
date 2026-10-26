namespace QuizCarLicense.Constrains;

/// <summary>
/// Phân loại các chế độ đề thi và ôn tập trong hệ thống sát hạch.
/// </summary>
public static class QuizTypes
{
    /// <summary>Bộ đề sát hạch cố định theo từng hạng bằng (Đề số 1, Đề số 2...).</summary>
    public const string OfficialExam = "OfficialExam";

    /// <summary>Đề đại diện dùng cho tính năng sinh đề ngẫu nhiên theo ma trận hạng bằng.</summary>
    public const string RandomTemplate = "RandomTemplate";

    /// <summary>Bộ đề ôn tập theo từng chương kiến thức (Chương 1..7).</summary>
    public const string ChapterPractice = "ChapterPractice";

    /// <summary>Bộ đề ôn tập 60 câu hỏi điểm liệt.</summary>
    public const string CriticalPractice = "CriticalPractice";

    /// <summary>Bộ đề ôn tập 50 câu hỏi thường xuyên bị trả lời sai.</summary>
    public const string FrequentMistakes = "FrequentMistakes";

    /// <summary>Kiểm tra xem loại đề có phải là chế độ ôn tập (hiển thị đáp án tức thì, không giới hạn giờ) hay không.</summary>
    public static bool IsPractice(string? quizType) =>
        quizType is ChapterPractice or CriticalPractice or FrequentMistakes;
}
