namespace QuizCarLicense.DTOs.Api;

/// <summary>
/// Lịch sử một lần thi của người dùng.
/// </summary>
public sealed record TakeHistoryItemResponse(
    int TakeId,
    int QuizId,
    string QuizTitle,
    int Score,
    int TotalQuestions,
    DateTimeOffset StartedAt,
    DateTimeOffset? FinishedAt);

/// <summary>
/// Danh sách dữ liệu có phân trang.
/// </summary>
public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages);

/// <summary>
/// Chi tiết một lần thi trong lịch sử kèm đáp án đúng/sai của từng câu.
/// </summary>
public sealed record TakeDetailResponse(
    int TakeId,
    int QuizId,
    string QuizTitle,
    int Score,
    int TotalQuestions,
    DateTimeOffset StartedAt,
    DateTimeOffset? FinishedAt,
    IReadOnlyList<GradedQuestionResponse> Questions);
