using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Quản lý thông tin 11 hạng giấy phép lái xe, danh mục 7 chương câu hỏi và sinh đề thi ngẫu nhiên theo ma trận.
/// </summary>
[ApiController]
[Route("api/v1/license-classes")]
[Produces("application/json")]
public sealed class LicenseClassesController : ControllerBase
{
    private readonly QuizCarLicenseContext _context;
    private readonly ITestService _testService;

    public LicenseClassesController(QuizCarLicenseContext context, ITestService testService)
    {
        _context = context;
        _testService = testService;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ 11 hạng giấy phép lái xe kèm thông số quy định (Thông tư 108/2026/TT-BCA).
    /// </summary>
    [HttpGet]
    [OutputCache(PolicyName = "QuizzesCache")]
    [ProducesResponseType(typeof(IReadOnlyList<LicenseClassResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LicenseClassResponse>>> GetAll(CancellationToken ct)
    {
        var items = await _context.LicenseClasses
            .AsNoTracking()
            .Where(l => l.Active)
            .OrderBy(l => l.DisplayOrder)
            .Select(l => new LicenseClassResponse(
                l.LicenseClassId,
                l.Code,
                l.Name,
                l.Description,
                l.VehicleGroup,
                l.TotalQuestions,
                l.DurationMinutes,
                l.PassScore,
                l.DisplayOrder,
                l.Quizzes.Count(q => q.QuizType == QuizTypes.OfficialExam)))
            .ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>
    /// Lấy danh sách 7 chương kiến thức trong bộ 600 câu hỏi kèm ID đề ôn tập tương ứng.
    /// </summary>
    [HttpGet("categories")]
    [OutputCache(PolicyName = "QuizzesCache")]
    [ProducesResponseType(typeof(IReadOnlyList<QuestionCategoryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<QuestionCategoryResponse>>> GetCategories(CancellationToken ct)
    {
        var items = await _context.QuestionCategories
            .AsNoTracking()
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new QuestionCategoryResponse(
                c.CategoryId,
                c.Code,
                c.Title,
                c.Description,
                c.DisplayOrder,
                c.Questions.Count(q => q.Active),
                c.Quizzes
                    .Where(q => q.QuizType == QuizTypes.ChapterPractice)
                    .Select(q => (int?)q.QuizId)
                    .FirstOrDefault()))
            .ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>
    /// Sinh một đề thi ngẫu nhiên theo đúng ma trận phân bổ câu hỏi và câu điểm liệt của hạng GPLX.
    /// </summary>
    [HttpPost("{code}/random-exam")]
    [ProducesResponseType(typeof(QuizExamDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuizExamDetailResponse>> GenerateRandomExam(
        string code,
        CancellationToken ct)
    {
        var generated = await _testService.GenerateRandomExamByLicenseAsync(code, ct);
        if (generated is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy hạng giấy phép lái xe",
                Detail = $"Không tìm thấy cấu hình đề thi cho hạng '{code}'.",
                Instance = HttpContext.Request.Path
            });
        }

        var (templateQuiz, questions) = generated.Value;

        var examQuestions = questions.Select(q => new ExamQuestionResponse(
            q.QuestionId,
            q.Content,
            q.Image ?? "none",
            q.QuizAnswers.Select(a => new ExamAnswerOptionResponse(a.AnswerId, a.Content)).ToList(),
            IsCritical: false,
            Explanation: null,
            CorrectAnswerId: null
        )).ToList();

        var response = new QuizExamDetailResponse(
            QuizId: templateQuiz.QuizId,
            Title: templateQuiz.Title,
            Detail: templateQuiz.Detail ?? string.Empty,
            TotalQuestions: examQuestions.Count,
            Questions: examQuestions,
            LicenseClassCode: templateQuiz.LicenseClass?.Code ?? code.ToUpperInvariant(),
            LicenseClassName: templateQuiz.LicenseClass?.Name,
            QuizType: QuizTypes.RandomTemplate,
            DurationMinutes: templateQuiz.DurationMinutes,
            PassScore: templateQuiz.PassScore,
            IsPracticeMode: false);

        return Ok(response);
    }
}
