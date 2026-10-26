using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using QuizCarLicense.DTOs;
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
    /// Lấy danh sách tất cả các bộ đề thi công khai (Được cache 5 phút).
    /// </summary>
    [HttpGet]
    [OutputCache(PolicyName = "QuizzesCache")]
    [ProducesResponseType(typeof(IReadOnlyList<QuizSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<QuizSummaryResponse>>> GetAll(CancellationToken ct)
    {
        var summaries = await _quizService.GetPublicQuizSummariesAsync(ct);
        return Ok(summaries);
    }

    /// <summary>
    /// Lấy chi tiết đề thi và danh sách câu hỏi để bắt đầu làm bài (Không kèm đáp án đúng).
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

        var questions = await _testService.BuildTestQuestionsAsync(quiz, ct);

        var examQuestions = questions.Select(q => new ExamQuestionResponse(
            q.Id,
            q.Content,
            q.Image,
            q.Answers.Select(a => new ExamAnswerOptionResponse(a.Id, a.Content)).ToList()
        )).ToList();

        var response = new QuizExamDetailResponse(
            quiz.QuizId,
            quiz.Title,
            quiz.Detail ?? string.Empty,
            examQuestions.Count,
            examQuestions);

        return Ok(response);
    }

    /// <summary>
    /// Nộp bài thi để chấm điểm trên RAM.
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

        // Chuyển đổi payload sang DTO nội bộ của TestService
        var answerRequests = request.SelectedAnswerIds
            .Distinct()
            .Select(aId => new TestAnswerRequest { AnswerId = aId })
            .ToList();

        var testResultRequest = new TestResutlResponse
        {
            QuizId = id,
            StartTime = request.StartTime.UtcDateTime,
            ListAnswers = answerRequests
        };

        // Chấm điểm hoàn toàn trên RAM
        float score = await _testService.CalculateScoreAsync(testResultRequest, ct);

        // Dựng kết quả chi tiết từng câu hỏi đúng/sai hoàn toàn trên RAM (Zero DB Read)
        var gradedQuestionDtos = await _testService.BuildGuestTestResultAsync(quiz, answerRequests, ct);

        var gradedQuestions = gradedQuestionDtos.Select(q => new GradedQuestionResponse(
            q.Id,
            q.Content,
            q.Image,
            q.Status,
            q.AnswerId,
            q.Answers.Select(a => new GradedAnswerOptionResponse(a.Id, a.Content, a.IsCorrect)).ToList()
        )).ToList();

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
            // Người dùng đã đăng nhập: Lưu kết quả vào DB
            var take = await _testService.SaveResultAsync(score, testResultRequest, userId.Value, ct);
            takeId = take.TakeId;
            isGuest = false;
        }

        var response = new TestSubmitResultResponse(
            TakeId: takeId,
            QuizId: quiz.QuizId,
            QuizTitle: quiz.Title,
            Score: (int)score,
            TotalQuestions: quiz.Questions.Count,
            IsGuest: isGuest,
            StartedAt: request.StartTime,
            CompletedAt: completedAt,
            Questions: gradedQuestions);

        return Ok(response);
    }
}
