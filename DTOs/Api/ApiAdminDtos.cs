using System.ComponentModel.DataAnnotations;

namespace QuizCarLicense.DTOs.Api;

/// <summary>
/// Payload tạo mới hoặc cập nhật thông tin đề thi.
/// </summary>
public sealed record UpsertQuizRequest
{
    /// <summary>Tiêu đề đề thi.</summary>
    [Required, MaxLength(200)]
    public required string Title { get; init; }

    /// <summary>Mô tả chi tiết đề thi.</summary>
    [Required, MaxLength(500)]
    public required string Detail { get; init; }

    /// <summary>Danh sách ID câu hỏi gán vào đề thi (tùy chọn).</summary>
    public IReadOnlyList<int>? QuestionIds { get; init; }
}

/// <summary>
/// Đáp án đầu vào khi tạo hoặc cập nhật câu hỏi.
/// </summary>
public sealed record AdminAnswerInputRequest
{
    public int AnswerId { get; init; }

    [Required, MaxLength(500)]
    public required string Content { get; init; }

    public bool IsCorrect { get; init; }
}

/// <summary>
/// Payload tạo mới hoặc cập nhật câu hỏi qua API.
/// </summary>
public sealed record UpsertQuestionRequest
{
    [Required, MaxLength(1000)]
    public required string Content { get; init; }

    [Range(1, 10)]
    public int Score { get; init; } = 1;

    [Required, MinLength(2)]
    public required IReadOnlyList<AdminAnswerInputRequest> Answers { get; init; }
}

/// <summary>
/// Thông tin câu hỏi quản trị trả về qua API.
/// </summary>
public sealed record AdminQuestionResponse(
    int QuestionId,
    string Content,
    int Score,
    string? Image,
    bool Active,
    IReadOnlyList<GradedAnswerOptionResponse> Answers);
