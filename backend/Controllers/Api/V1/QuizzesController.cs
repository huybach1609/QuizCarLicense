using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Quản lý danh sách đề thi công khai, làm bài thi và nộp bài chấm điểm.
/// </summary>
[ApiController]
[Route("api/v1/quizzes")]
[Produces("application/json")]
public sealed class QuizzesController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly ITestService _testService;

    public QuizzesController(IQuizService quizService, ITestService testService)
    {
        _quizService = quizService;
        _testService = testService;
    }

    /// <summary>
    /// Lấy danh sách tất cả các bộ đề thi công khai, hỗ trợ lọc theo hạng GPLX và loại đề.
    /// </summary>
    [HttpGet]
    [OutputCache(PolicyName = "QuizzesCache")]
    [ProducesResponseType(typeof(IReadOnlyList<QuizSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<QuizSummaryResponse>>> GetAll(
        [FromQuery] string? licenseCode = null,
        [FromQuery] string? quizType = null,
        CancellationToken ct = default)
    {
        var summaries = await _quizService.GetPublicQuizSummariesAsync(ct);

        IEnumerable<QuizSummaryResponse> filtered = summaries;

        if (!string.IsNullOrWhiteSpace(licenseCode))
        {
            var code = licenseCode.Trim().ToUpperInvariant();
            filtered = filtered.Where(q => string.Equals(q.LicenseClassCode, code, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(quizType))
        {
            filtered = filtered.Where(q => string.Equals(q.QuizType, quizType.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        return Ok(filtered.ToList());
    }

    /// <summary>
    /// Lấy chi tiết đề thi và danh sách câu hỏi để bắt đầu làm bài.
    /// Nếu đề có loại RandomTemplate, tự động rút ngẫu nhiên bộ câu hỏi theo ma trận của hạng bằng.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(QuizExamDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuizExamDetailResponse>> GetById(int id, CancellationToken ct)
    {
        var quiz = await _testService.GetQuizWithQuestionsAsync(id, ct);
        if (quiz is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy đề thi",
                Detail = $"Không tìm thấy bộ đề thi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        bool isPractice = QuizTypes.IsPractice(quiz.QuizType);
        List<ExamQuestionResponse> examQuestions;

        if (quiz.QuizType == QuizTypes.RandomTemplate && quiz.LicenseClass != null)
        {
            var randomResult = await _testService.GenerateRandomExamByLicenseAsync(quiz.LicenseClass.Code, ct);
            var randomQuestions = randomResult?.Questions ?? [];
            examQuestions = randomQuestions.Select(q => new ExamQuestionResponse(
                q.QuestionId,
                q.Content,
                q.Image ?? "none",
                q.QuizAnswers.Select(a => new ExamAnswerOptionResponse(a.AnswerId, a.Content)).ToList(),
                IsCritical: false,
                Explanation: null,
                CorrectAnswerId: null
            )).ToList();
        }
        else
        {
            var questions = await _testService.BuildTestQuestionsAsync(quiz, ct);
            examQuestions = questions.Select(q => new ExamQuestionResponse(
                q.Id,
                q.Content,
                q.Image,
                q.Answers.Select(a => new ExamAnswerOptionResponse(a.Id, a.Content)).ToList(),
                IsCritical: isPractice && q.IsCritical,
                Explanation: isPractice ? q.Explanation : null,
                CorrectAnswerId: isPractice ? q.Answers.FirstOrDefault(a => a.IsCorrect)?.Id : null
            )).ToList();
        }

        var response = new QuizExamDetailResponse(
            QuizId: quiz.QuizId,
            Title: quiz.Title,
            Detail: quiz.Detail ?? string.Empty,
            TotalQuestions: examQuestions.Count,
            Questions: examQuestions,
            LicenseClassCode: quiz.LicenseClass?.Code,
            LicenseClassName: quiz.LicenseClass?.Name,
            QuizType: quiz.QuizType,
            DurationMinutes: quiz.DurationMinutes,
            PassScore: quiz.PassScore,
            IsPracticeMode: isPractice);

        return Ok(response);
    }

    /// <summary>
    /// Nộp bài thi để chấm điểm trên RAM (kiểm tra đồng thời Điểm đạt và lỗi Câu hỏi điểm liệt).
    /// Hỗ trợ cả học viên đã đăng nhập (lưu lượt thi) và khách vãng lai (Stateless JSON, không lưu Session).
    /// </summary>
    [HttpPost("{id:int}/submit")]
    [EnableRateLimiting("SubmitLimit")]
    [ProducesResponseType(typeof(TestSubmitResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestSubmitResultResponse>> Submit(
        int id,
        [FromBody] SubmitTestRequest request,
        CancellationToken ct)
    {
        var quiz = await _testService.GetQuizWithQuestionsAsync(id, ct);
        if (quiz is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy đề thi",
                Detail = $"Không tìm thấy bộ đề thi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        // Chấm điểm + xét lỗi câu điểm liệt hoàn toàn trên RAM (Zero DB Read)
        var evaluation = await _testService.EvaluateExamAsync(
            quiz,
            request.SelectedAnswerIds,
            request.QuestionIds,
            ct);

        // Kiểm tra xem request có gửi kèm JWT Bearer Token hợp lệ hay không
        var authResult = await HttpContext.AuthenticateAsync(JwtBearerDefaults.AuthenticationScheme);
        int? userId = null;
        if (authResult.Succeeded && authResult.Principal != null)
        {
            var userIdStr = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out var parsedId))
            {
                userId = parsedId;
            }
        }

        int? takeId = null;
        bool isGuest = true;
        var completedAt = DateTimeOffset.UtcNow;

        if (userId.HasValue)
        {
            var take = await _testService.SaveExamTakeAsync(
                quiz,
                evaluation,
                request.StartTime.UtcDateTime,
                request.SelectedAnswerIds,
                userId.Value,
                ct);
            takeId = take.TakeId;
            isGuest = false;
        }

        var response = new TestSubmitResultResponse(
            TakeId: takeId,
            QuizId: quiz.QuizId,
            QuizTitle: quiz.Title,
            Score: evaluation.Score,
            TotalQuestions: evaluation.TotalQuestions,
            IsGuest: isGuest,
            StartedAt: request.StartTime,
            CompletedAt: completedAt,
            Questions: evaluation.GradedQuestions,
            PassScore: evaluation.PassScore,
            IsPassed: evaluation.IsPassed,
            HasCriticalError: evaluation.HasCriticalError,
            LicenseClassCode: quiz.LicenseClass?.Code);

        return Ok(response);
    }
}
