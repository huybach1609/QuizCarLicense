using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Quản lý lịch sử và chi tiết các lần thi của học viên.
/// </summary>
[ApiController]
[Route("api/v1/takes")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[Produces("application/json")]
public sealed class TakesController : ControllerBase
{
    private readonly ITakeService _takeService;

    public TakesController(ITakeService takeService)
    {
        _takeService = takeService;
    }

    /// <summary>
    /// Lấy danh sách lịch sử thi có phân trang của người dùng hiện tại.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<TakeHistoryItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResponse<TakeHistoryItemResponse>>> GetUserTakes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _takeService.GetUserTakesPagedAsync(userId.Value, page, pageSize, ct);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết một lần thi kèm trạng thái đúng/sai từng câu hỏi.
    /// </summary>
    [HttpGet("{takeId:int}")]
    [ProducesResponseType(typeof(TakeDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TakeDetailResponse>> GetTakeDetail(
        int takeId,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var take = await _takeService.GetTakeWithAnswersAsync(takeId, ct);
        if (take is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy lượt thi",
                Detail = $"Không tìm thấy kết quả lượt thi có ID {takeId}.",
                Instance = HttpContext.Request.Path
            });
        }

        // Kiểm tra quyền sở hữu (chỉ chính chủ hoặc Admin mới được xem)
        var isAdmin = User.IsInRole(UserRole.Admin.ToString());
        if (take.UserId != userId.Value && !isAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Không có quyền truy cập",
                Detail = "Bạn không có quyền xem kết quả lượt thi của người khác.",
                Instance = HttpContext.Request.Path
            });
        }

        var questions = await _takeService.BuildTestQuestionsAsync(take, ct);

        var gradedQuestions = questions.Select(q => new GradedQuestionResponse(
            q.Id,
            q.Content,
            q.Image,
            q.Status,
            q.AnswerId,
            q.Answers.Select(a => new GradedAnswerOptionResponse(a.Id, a.Content, a.IsCorrect)).ToList()
        )).ToList();

        var response = new TakeDetailResponse(
            take.TakeId,
            take.QuizId ?? 0,
            take.Quiz?.Title ?? "Không có tiêu đề",
            take.Score,
            gradedQuestions.Count,
            new DateTimeOffset(DateTime.SpecifyKind(take.StartedAt, DateTimeKind.Utc)),
            take.FinishedAt.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(take.FinishedAt.Value, DateTimeKind.Utc)) : null,
            gradedQuestions);

        return Ok(response);
    }

    /// <summary>
    /// Xóa một lượt thi trong lịch sử.
    /// </summary>
    [HttpDelete("{takeId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTake(int takeId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var take = await _takeService.GetTakeWithAnswersAsync(takeId, ct);
        if (take is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy lượt thi",
                Detail = $"Không tìm thấy kết quả lượt thi có ID {takeId}.",
                Instance = HttpContext.Request.Path
            });
        }

        var isAdmin = User.IsInRole(UserRole.Admin.ToString());
        if (take.UserId != userId.Value && !isAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Không có quyền truy cập",
                Detail = "Bạn không có quyền xóa kết quả lượt thi của người khác.",
                Instance = HttpContext.Request.Path
            });
        }

        await _takeService.DeleteTakeAsync(takeId, ct);
        return NoContent();
    }

    private int? GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idStr, out var id) ? id : null;
    }
}
