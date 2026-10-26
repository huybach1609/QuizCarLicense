using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Manage quesion and image admin role.
/// </summary>
[ApiController]
[Route("api/v1/admin/questions")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "AdminOnly")]
[Produces("application/json")]
public sealed class AdminQuestionsController : ControllerBase
{
    private readonly IQuestionService _questionService;

    public AdminQuestionsController(IQuestionService questionService)
    {
        _questionService = questionService;
    }

    /// <summary>
    /// Lấy danh sách câu hỏi sát hạch có phân trang.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<AdminQuestionResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<AdminQuestionResponse>>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var paged = await _questionService.GetPagedAsync(page, pageSize, ct);

        var list = paged.Data.Select(q => new AdminQuestionResponse(
            q.QuestionId,
            q.Content,
            q.Score,
            q.Image,
            q.Active,
            q.QuizAnswers.Select(a => new GradedAnswerOptionResponse(a.AnswerId, a.Content, a.IsCorrect)).ToList()
        )).ToList();

        var response = new PagedResponse<AdminQuestionResponse>(
            list,
            paged.TotalCount,
            paged.CurrentPage,
            paged.PageSize,
            paged.TotalPages);

        return Ok(response);
    }

    /// <summary>
    /// Lấy chi tiết một câu hỏi kèm danh sách đáp án và cờ đúng/sai.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AdminQuestionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminQuestionResponse>> GetById(int id, CancellationToken ct)
    {
        var question = await _questionService.GetWithAnswersAsync(id, ct);
        if (question is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy câu hỏi",
                Detail = $"Không tìm thấy câu hỏi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        var response = new AdminQuestionResponse(
            question.QuestionId,
            question.Content,
            question.Score,
            question.Image,
            question.Active,
            question.QuizAnswers.Select(a => new GradedAnswerOptionResponse(a.AnswerId, a.Content, a.IsCorrect)).ToList());

        return Ok(response);
    }

    /// <summary>
    /// Tạo câu hỏi mới trong ngân hàng đề thi.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AdminQuestionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdminQuestionResponse>> Create(
        [FromBody] UpsertQuestionRequest request,
        CancellationToken ct)
    {
        var inputModel = new QuizQuestionInputModel
        {
            Content = request.Content,
            Score = request.Score,
            QuizAnswers = request.Answers.Select(a => new QuizAnswerInputModel
            {
                Content = a.Content,
                IsCorrect = a.IsCorrect
            }).ToList()
        };

        var created = await _questionService.CreateAsync(inputModel, ct);

        var response = new AdminQuestionResponse(
            created.QuestionId,
            created.Content,
            created.Score,
            created.Image,
            created.Active,
            created.QuizAnswers.Select(a => new GradedAnswerOptionResponse(a.AnswerId, a.Content, a.IsCorrect)).ToList());

        return CreatedAtAction(nameof(GetById), new { id = created.QuestionId }, response);
    }

    /// <summary>
    /// Cập nhật nội dung câu hỏi và danh sách đáp án.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpsertQuestionRequest request,
        CancellationToken ct)
    {
        var existing = await _questionService.GetWithAnswersAsync(id, ct);
        if (existing is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy câu hỏi",
                Detail = $"Không tìm thấy câu hỏi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        var inputModel = new QuizQuestionInputModel
        {
            QuestionId = id,
            Content = request.Content,
            Score = request.Score,
            QuizAnswers = request.Answers.Select(a => new QuizAnswerInputModel
            {
                AnswerId = a.AnswerId,
                Content = a.Content,
                IsCorrect = a.IsCorrect
            }).ToList()
        };

        await _questionService.UpdateAsync(inputModel, ct);
        return Ok(new { message = "Cập nhật câu hỏi thành công.", questionId = id });
    }

    /// <summary>
    /// Xóa một câu hỏi khỏi ngân hàng câu hỏi.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var existing = await _questionService.GetWithAnswersAsync(id, ct);
        if (existing is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy câu hỏi",
                Detail = $"Không tìm thấy câu hỏi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        await _questionService.DeleteAsync(id, ct);
        return NoContent();
    }

    /// <summary>
    /// Tải lên hoặc thay thế hình ảnh biển báo/sa hình cho câu hỏi.
    /// </summary>
    [HttpPost("{id:int}/image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadImage(
        int id,
        IFormFile image,
        CancellationToken ct)
    {
        if (image == null || image.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "File không hợp lệ",
                Detail = "Vui lòng chọn một file hình ảnh hợp lệ để tải lên.",
                Instance = HttpContext.Request.Path
            });
        }

        var imagePath = await _questionService.UpdateImageAsync(id, image, ct);
        if (imagePath is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy câu hỏi",
                Detail = $"Không tìm thấy câu hỏi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        return Ok(new { message = "Tải lên hình ảnh thành công.", imagePath });
    }
}
