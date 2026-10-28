using Microsoft.AspNetCore.Mvc;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Endpoint theo dõi số lượng người dùng đang trực tuyến theo thời gian thực.
/// </summary>
[ApiController]
[Route("api/v1/presence")]
[Produces("application/json")]
public sealed class PresenceController : ControllerBase
{
    private readonly IOnlinePresenceService _presenceService;

    public PresenceController(IOnlinePresenceService presenceService)
    {
        _presenceService = presenceService;
    }

    /// <summary>
    /// Gửi tín hiệu từ client và nhận lại số lượng người dùng online hiện tại.
    /// </summary>
    [HttpPost("heartbeat")]
    [ProducesResponseType(typeof(OnlineCountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public ActionResult<OnlineCountResponse> Heartbeat(
        [FromBody] HeartbeatRequest request,
        CancellationToken ct)
    {
        var count = _presenceService.RecordHeartbeat(request.ClientId);
        return Ok(new OnlineCountResponse(count, DateTimeOffset.UtcNow));
    }

    /// <summary>
    /// Lấy số lượng người dùng đang trực tuyến hiện tại mà không làm mới phiên.
    /// </summary>
    [HttpGet("online")]
    [ProducesResponseType(typeof(OnlineCountResponse), StatusCodes.Status200OK)]
    public ActionResult<OnlineCountResponse> GetOnline(CancellationToken ct)
    {
        var count = _presenceService.GetOnlineCount();
        return Ok(new OnlineCountResponse(count, DateTimeOffset.UtcNow));
    }
}
