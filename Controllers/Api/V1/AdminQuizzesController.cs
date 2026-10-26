using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Quản trị danh sách đề thi (Yêu cầu quyền Admin).
/// </summary>
[ApiController]
[Route("api/v1/admin/quizzes")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "AdminOnly")]
[Produces("application/json")]
public sealed class AdminQuizzesController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly IOutputCacheStore _outputCacheStore;

    public AdminQuizzesController(IQuizService quizService, IOutputCacheStore outputCacheStore)
    {
        _quizService = quizService;
        _outputCacheStore = outputCacheStore;
    }

    /// <summary>
    /// Tạo một bộ đề thi mới và gán câu hỏi (nếu có).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(QuizSummaryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<QuizSummaryResponse>> Create(
        [FromBody] UpsertQuizRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId() ?? 1;

        var quiz = new Quiz
        {
            Title = request.Title,
            Detail = request.Detail,
            UserId = userId
        };

        var created = await _quizService.InsertAsync(quiz, userId, ct);
        if (!created)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Tạo đề thi thất bại",
                Detail = "Không thể lưu bộ đề thi vào cơ sở dữ liệu.",
                Instance = HttpContext.Request.Path
            });
        }

        if (request.QuestionIds is not null && request.QuestionIds.Count > 0)
        {
            await _quizService.ReplaceQuestionsAsync(quiz.QuizId, request.QuestionIds, ct);
        }

        // Xóa OutputCache danh sách đề thi
        await _outputCacheStore.EvictByTagAsync("quizzes", ct);

        var response = new QuizSummaryResponse(
            quiz.QuizId,
            quiz.Title,
            quiz.Detail ?? string.Empty,
            request.QuestionIds?.Count ?? 0,
            DateTimeOffset.UtcNow);

        return CreatedAtAction(
            actionName: nameof(QuizzesController.GetById),
            controllerName: "Quizzes",
            routeValues: new { id = quiz.QuizId },
            value: response);
    }

    /// <summary>
    /// Cập nhật thông tin đề thi và danh sách câu hỏi gán kèm.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpsertQuizRequest request,
        CancellationToken ct)
    {
        var existingQuiz = await _quizService.GetByIdAsync(id, ct);
        if (existingQuiz is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy đề thi",
                Detail = $"Không tìm thấy đề thi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        var userId = GetCurrentUserId() ?? existingQuiz.UserId ?? 1;

        existingQuiz.Title = request.Title;
        existingQuiz.Detail = request.Detail;

        var updated = await _quizService.UpdateAsync(existingQuiz, userId, ct);
        if (!updated)
        {
            return NotFound();
        }

        if (request.QuestionIds is not null)
        {
            await _quizService.ReplaceQuestionsAsync(id, request.QuestionIds, ct);
        }

        await _outputCacheStore.EvictByTagAsync("quizzes", ct);

        return Ok(new { message = "Cập nhật đề thi thành công.", quizId = id });
    }

    /// <summary>
    /// Xóa một bộ đề thi khỏi hệ thống.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var existingQuiz = await _quizService.GetByIdAsync(id, ct);
        if (existingQuiz is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy đề thi",
                Detail = $"Không tìm thấy đề thi có ID {id}.",
                Instance = HttpContext.Request.Path
            });
        }

        await _quizService.DeleteAsync(id, ct);
        await _outputCacheStore.EvictByTagAsync("quizzes", ct);

        return NoContent();
    }

    private int? GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idStr, out var id) ? id : null;
    }
}
