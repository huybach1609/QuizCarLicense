using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Models;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Cung cấp thông tin công khai về 600 câu hỏi sát hạch phục vụ trang tra cứu và SEO SSG/ISR.
/// </summary>
[ApiController]
[Route("api/v1/questions")]
[Produces("application/json")]
public sealed class PublicQuestionsController : ControllerBase
{
    private readonly QuizCarLicenseContext _context;

    public PublicQuestionsController(QuizCarLicenseContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách câu hỏi sát hạch công khai (Có phân trang, OutputCache 5 phút).
    /// </summary>
    [HttpGet]
    [OutputCache(PolicyName = "QuizzesCache")]
    [ProducesResponseType(typeof(PagedResponse<PublicQuestionItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<PublicQuestionItemResponse>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 50;
        if (pageSize > 100) pageSize = 100;

        var query = _context.QuizQuestions
            .AsNoTracking()
            .Where(q => q.Active);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderBy(q => q.QuestionId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new PublicQuestionItemResponse(
                q.QuestionId,
                q.Content,
                q.Score,
                !string.IsNullOrEmpty(q.Image) && q.Image != "none"))
            .ToListAsync(ct);

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new PagedResponse<PublicQuestionItemResponse>(items, totalCount, page, pageSize, totalPages));
    }

    /// <summary>
    /// Lấy chi tiết câu hỏi kèm đáp án đúng và danh sách các đề thi chứa câu hỏi đó (OutputCache 5 phút).
    /// </summary>
    [HttpGet("{id:int}")]
    [OutputCache(PolicyName = "QuizzesCache")]
    [ProducesResponseType(typeof(PublicQuestionDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicQuestionDetailResponse>> GetById(
        int id,
        CancellationToken ct = default)
    {
        var question = await _context.QuizQuestions
            .AsNoTracking()
            .Include(q => q.QuizAnswers)
            .Include(q => q.Quizzes)
            .FirstOrDefaultAsync(q => q.QuestionId == id && q.Active, ct);

        if (question is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy câu hỏi",
                Detail = $"Không tìm thấy câu hỏi có mã số {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        var answers = question.QuizAnswers
            .OrderBy(a => a.AnswerId)
            .Select(a => new GradedAnswerOptionResponse(a.AnswerId, a.Content, a.IsCorrect))
            .ToList();

        var inQuizzes = question.Quizzes
            .Select(q => q.Title)
            .ToList();

        var response = new PublicQuestionDetailResponse(
            question.QuestionId,
            question.Content,
            question.Score,
            question.Image,
            answers,
            inQuizzes);

        return Ok(response);
    }
}
