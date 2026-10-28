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
    /// Lấy danh sách câu hỏi sát hạch công khai (Có phân trang, lọc theo chương, điểm liệt, tìm kiếm, OutputCache 5 phút).
    /// </summary>
    [HttpGet]
    [OutputCache(PolicyName = "QuizzesCache")]
    [ProducesResponseType(typeof(PagedResponse<PublicQuestionItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<PublicQuestionItemResponse>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? category = null,
        [FromQuery] bool? critical = null,
        [FromQuery] string? q = null,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 50;
        if (pageSize > 100) pageSize = 100;

        var query = _context.QuizQuestions
            .AsNoTracking()
            .Where(x => x.Active);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var catCode = category.Trim();
            query = query.Where(x => x.Category != null && x.Category.Code == catCode);
        }

        if (critical.HasValue && critical.Value)
        {
            query = query.Where(x => x.IsCritical);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            if (int.TryParse(term, out var qId))
            {
                query = query.Where(x => x.QuestionId == qId || x.Content.Contains(term));
            }
            else
            {
                query = query.Where(x => x.Content.Contains(term));
            }
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderBy(x => x.QuestionId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new PublicQuestionItemResponse(
                x.QuestionId,
                x.Content,
                x.Score,
                !string.IsNullOrEmpty(x.Image) && x.Image != "none",
                x.IsCritical,
                x.Category != null ? x.Category.Code : null,
                x.Category != null ? x.Category.Title : null))
            .ToListAsync(ct);

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new PagedResponse<PublicQuestionItemResponse>(items, totalCount, page, pageSize, totalPages));
    }

    /// <summary>
    /// Lấy chi tiết câu hỏi kèm đáp án đúng, điều hướng câu hỏi liền kề và câu hỏi liên quan (OutputCache 5 phút).
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
            .Include(x => x.Category)
            .Include(x => x.QuizAnswers)
            .Include(x => x.Quizzes)
            .FirstOrDefaultAsync(x => x.QuestionId == id && x.Active, ct);

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
            .Select(x => x.Title)
            .ToList();

        var prevId = await _context.QuizQuestions
            .AsNoTracking()
            .Where(x => x.Active && x.QuestionId < id)
            .OrderByDescending(x => x.QuestionId)
            .Select(x => (int?)x.QuestionId)
            .FirstOrDefaultAsync(ct);

        var nextId = await _context.QuizQuestions
            .AsNoTracking()
            .Where(x => x.Active && x.QuestionId > id)
            .OrderBy(x => x.QuestionId)
            .Select(x => (int?)x.QuestionId)
            .FirstOrDefaultAsync(ct);

        var relatedQuery = _context.QuizQuestions
            .AsNoTracking()
            .Where(x => x.Active && x.QuestionId != id);

        if (question.CategoryId.HasValue)
        {
            relatedQuery = relatedQuery.Where(x => x.CategoryId == question.CategoryId.Value);
        }
        else if (question.IsCritical)
        {
            relatedQuery = relatedQuery.Where(x => x.IsCritical);
        }

        var relatedQuestions = await relatedQuery
            .OrderBy(x => x.QuestionId)
            .Take(4)
            .Select(x => new PublicQuestionItemResponse(
                x.QuestionId,
                x.Content,
                x.Score,
                !string.IsNullOrEmpty(x.Image) && x.Image != "none",
                x.IsCritical,
                x.Category != null ? x.Category.Code : null,
                x.Category != null ? x.Category.Title : null))
            .ToListAsync(ct);

        var response = new PublicQuestionDetailResponse(
            question.QuestionId,
            question.Content,
            question.Score,
            question.Image,
            answers,
            inQuizzes,
            question.IsCritical,
            question.Category?.Title,
            question.Explanation,
            question.Category?.Code,
            prevId,
            nextId,
            relatedQuestions);

        return Ok(response);
    }
}
