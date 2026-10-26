using System.ComponentModel.DataAnnotations;
using QuizCarLicense.Constrains;

namespace QuizCarLicense.DTOs.Api;

/// <summary>
/// Thông tin tóm tắt của một bộ đề thi công khai.
/// </summary>
public sealed record QuizSummaryResponse(
    int QuizId,
    string Title,
    string Detail,
    int TotalQuestions,
    DateTimeOffset? UpdatedAt);

/// <summary>
/// Lựa chọn đáp án khi đang làm bài (không chứa cờ IsCorrect).
/// </summary>
public sealed record ExamAnswerOptionResponse(
    int Id,
    string Content);

/// <summary>
/// Câu hỏi trong đề thi khi đang làm bài.
/// </summary>
public sealed record ExamQuestionResponse(
    int Id,
    string Content,
    string? Image,
    IReadOnlyList<ExamAnswerOptionResponse> Answers);

/// <summary>
/// Chi tiết bộ đề thi kèm danh sách câu hỏi để bắt đầu làm bài.
/// </summary>
public sealed record QuizExamDetailResponse(
    int QuizId,
    string Title,
    string Detail,
    int TotalQuestions,
    IReadOnlyList<ExamQuestionResponse> Questions);

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
    IReadOnlyList<GradedAnswerOptionResponse> Answers);

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
    IReadOnlyList<GradedQuestionResponse> Questions);


/// <summary>
/// Chi tiết câu hỏi công khai kèm đáp án đúng phục vụ trang tra cứu và SEO.
/// </summary>
public sealed record PublicQuestionDetailResponse(
    int QuestionId,
    string Content,
    int Score,
    string? Image,
    IReadOnlyList<GradedAnswerOptionResponse> Answers,
    IReadOnlyList<string> InQuizzes);

/// <summary>
/// Tóm tắt câu hỏi công khai phục vụ sitemap và danh mục câu hỏi.
/// </summary>
public sealed record PublicQuestionItemResponse(
    int QuestionId,
    string Content,
    int Score,
    bool HasImage);
