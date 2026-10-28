using System.ComponentModel.DataAnnotations;
using QuizCarLicense.Constrains;

namespace QuizCarLicense.DTOs.Api;

/// <summary>
/// Thông tin cấu hình một hạng giấy phép lái xe (A1, A, B, C1, C, D1, D2, D, BE, C1E, CE).
/// </summary>
public sealed record LicenseClassResponse(
    int LicenseClassId,
    string Code,
    string Name,
    string Description,
    string VehicleGroup,
    int TotalQuestions,
    int DurationMinutes,
    int PassScore,
    int DisplayOrder,
    int ExamSetCount);

/// <summary>
/// Thông tin chương kiến thức trong bộ 600 câu hỏi.
/// </summary>
public sealed record QuestionCategoryResponse(
    int CategoryId,
    string Code,
    string Title,
    string? Description,
    int DisplayOrder,
    int QuestionCount,
    int? PracticeQuizId);

/// <summary>
/// Chi tiết ôn tập một chương kiến thức theo từng hạng GPLX.
/// </summary>
public sealed record PracticeChapterSummaryResponse(
    int QuizId,
    int ExamNumber,
    string CategoryCode,
    string Title,
    string Detail,
    int TotalQuestions,
    bool IsApplicable);

/// <summary>
/// Tổng hợp toàn bộ các bộ đề ôn tập (Điểm liệt, Hay sai, 6 Chương) được phân bổ theo một hạng GPLX cụ thể.
/// </summary>
public sealed record PracticeLicenseSummaryResponse(
    string LicenseCode,
    string LicenseName,
    int TotalQuestions,
    int CriticalQuizId,
    int CriticalCount,
    int FrequentMistakesQuizId,
    int FrequentMistakesCount,
    IReadOnlyList<PracticeChapterSummaryResponse> Chapters);

/// <summary>
/// Thông tin tóm tắt của một bộ đề thi hoặc bộ đề ôn tập công khai.
/// </summary>
public sealed record QuizSummaryResponse(
    int QuizId,
    string Title,
    string Detail,
    int TotalQuestions,
    DateTimeOffset? UpdatedAt,
    string? LicenseClassCode = null,
    string? LicenseClassName = null,
    string QuizType = "OfficialExam",
    int? ExamNumber = null,
    int DurationMinutes = 20,
    int PassScore = 27,
    bool IsPracticeMode = false);

/// <summary>
/// Lựa chọn đáp án khi đang làm bài (không chứa cờ IsCorrect ở chế độ thi sát hạch).
/// </summary>
public sealed record ExamAnswerOptionResponse(
    int Id,
    string Content);

/// <summary>
/// Câu hỏi trong đề thi khi đang làm bài.
/// Khi ở chế độ Ôn tập (IsPracticeMode = true), CorrectAnswerId và Explanation sẽ được cung cấp để hiển thị ngay.
/// </summary>
public sealed record ExamQuestionResponse(
    int Id,
    string Content,
    string? Image,
    IReadOnlyList<ExamAnswerOptionResponse> Answers,
    bool IsCritical = false,
    string? Explanation = null,
    int? CorrectAnswerId = null);

/// <summary>
/// Chi tiết bộ đề thi kèm danh sách câu hỏi để bắt đầu làm bài.
/// </summary>
public sealed record QuizExamDetailResponse(
    int QuizId,
    string Title,
    string Detail,
    int TotalQuestions,
    IReadOnlyList<ExamQuestionResponse> Questions,
    string? LicenseClassCode = null,
    string? LicenseClassName = null,
    string QuizType = "OfficialExam",
    int DurationMinutes = 20,
    int PassScore = 27,
    bool IsPracticeMode = false);

/// <summary>
/// Yêu cầu nộp bài thi để chấm điểm.
/// </summary>
public sealed record SubmitTestRequest
{
    /// <summary>Thời điểm bắt đầu làm bài (UTC).</summary>
    public DateTimeOffset StartTime { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Danh sách ID các đáp án mà thí sinh đã chọn.</summary>
    [Required]
    public required IReadOnlyList<int> SelectedAnswerIds { get; init; }

    /// <summary>Danh sách ID các câu hỏi của đề thi (dùng khi thi đề ngẫu nhiên).</summary>
    public IReadOnlyList<int>? QuestionIds { get; init; }
}

/// <summary>
/// Lựa chọn đáp án kèm kết quả đúng/sai sau khi nộp bài.
/// </summary>
public sealed record GradedAnswerOptionResponse(
    int Id,
    string Content,
    bool IsCorrect);

/// <summary>
/// Chi tiết kết quả từng câu hỏi sau khi chấm điểm.
/// </summary>
public sealed record GradedQuestionResponse(
    int Id,
    string Content,
    string? Image,
    QuestionStatus Status,
    int? SelectedAnswerId,
    IReadOnlyList<GradedAnswerOptionResponse> Answers,
    bool IsCritical = false,
    string? Explanation = null);

/// <summary>
/// Kết quả chấm điểm trả về ngay sau khi nộp bài (hỗ trợ cả User đã đăng nhập và Guest Stateless).
/// </summary>
public sealed record TestSubmitResultResponse(
    int? TakeId,
    int QuizId,
    string QuizTitle,
    int Score,
    int TotalQuestions,
    bool IsGuest,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    IReadOnlyList<GradedQuestionResponse> Questions,
    int PassScore = 27,
    bool IsPassed = false,
    bool HasCriticalError = false,
    string? LicenseClassCode = null);

/// <summary>
/// Chi tiết câu hỏi công khai kèm đáp án đúng phục vụ trang tra cứu và SEO.
/// </summary>
public sealed record PublicQuestionDetailResponse(
    int QuestionId,
    string Content,
    int Score,
    string? Image,
    IReadOnlyList<GradedAnswerOptionResponse> Answers,
    IReadOnlyList<string> InQuizzes,
    bool IsCritical = false,
    string? CategoryTitle = null,
    string? Explanation = null,
    string? CategoryCode = null,
    int? PrevQuestionId = null,
    int? NextQuestionId = null,
    IReadOnlyList<PublicQuestionItemResponse>? RelatedQuestions = null);

/// <summary>
/// Tóm tắt câu hỏi công khai phục vụ sitemap và danh mục câu hỏi.
/// </summary>
public sealed record PublicQuestionItemResponse(
    int QuestionId,
    string Content,
    int Score,
    bool HasImage,
    bool IsCritical = false,
    string? CategoryCode = null,
    string? CategoryTitle = null);
