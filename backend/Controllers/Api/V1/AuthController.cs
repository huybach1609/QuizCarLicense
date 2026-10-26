using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.DTOs.Auth;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Controllers.Api.V1;

/// <summary>
/// Quản lý xác thực, đăng ký, đăng nhập và thông tin phiên làm việc qua JWT Bearer.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthController(IAuthService authService, IJwtTokenService jwtTokenService)
    {
        _authService = authService;
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Đăng nhập tài khoản và nhận JWT Bearer Access Token.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("AuthLimit")]
    [ProducesResponseType(typeof(AuthTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthTokenResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var result = await _authService.Login(request.Username, request.Password, ct);
        if (!result.Result)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Đăng nhập thất bại",
                Detail = result.Message ?? "Tên đăng nhập hoặc mật khẩu không chính xác.",
                Instance = HttpContext.Request.Path
            });
        }

        if (result is not LoginResponse loginResponse || loginResponse.User is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Đăng nhập thất bại",
                Detail = "Không thể khởi tạo thông tin phiên đăng nhập.",
                Instance = HttpContext.Request.Path
            });
        }

        var (token, expiresAt) = _jwtTokenService.GenerateAccessToken(loginResponse.User);
        var authUser = new AuthUserResponse(
            loginResponse.User.UserId,
            loginResponse.User.Username,
            loginResponse.User.FullName,
            loginResponse.User.Role);

        return Ok(new AuthTokenResponse(token, "Bearer", expiresAt, authUser));
    }

    /// <summary>
    /// Đăng ký tài khoản học viên mới.
    /// </summary>
    [HttpPost("register")]
    [EnableRateLimiting("AuthLimit")]
    [ProducesResponseType(typeof(AuthTokenResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthTokenResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        var createRequest = new CreateUserRequest
        {
            UserName = request.Username,
            FullName = request.FullName,
            Password = request.Password,
            RePassword = request.Password
        };

        var signupResult = await _authService.Signup(createRequest, ct);
        if (!signupResult.Result)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Đăng ký không thành công",
                Detail = signupResult.Message ?? "Tên đăng nhập đã tồn tại trong hệ thống.",
                Instance = HttpContext.Request.Path
            });
        }

        // Tự động đăng nhập sau khi đăng ký thành công
        var loginResult = await _authService.Login(request.Username, request.Password, ct);
        if (loginResult is LoginResponse loginResponse && loginResponse.User is not null)
        {
            var (token, expiresAt) = _jwtTokenService.GenerateAccessToken(loginResponse.User);
            var authUser = new AuthUserResponse(
                loginResponse.User.UserId,
                loginResponse.User.Username,
                loginResponse.User.FullName,
                loginResponse.User.Role);

            return CreatedAtAction(nameof(GetMe), new AuthTokenResponse(token, "Bearer", expiresAt, authUser));
        }

        return StatusCode(StatusCodes.Status201Created, new { message = "Đăng ký tài khoản thành công." });
    }

    /// <summary>
    /// Lấy thông tin tài khoản hiện tại từ JWT Bearer Token.
    /// </summary>
    [HttpGet("me")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(AuthUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<AuthUserResponse> GetMe()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";
        var fullName = User.FindFirstValue("FullName") ?? username;

        return Ok(new AuthUserResponse(userId, username, fullName, role));
    }

    /// <summary>
    /// Đăng xuất tài khoản (Xóa phiên đăng nhập).
    /// </summary>
    [HttpPost("logout")]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{CookieAuthenticationDefaults.AuthenticationScheme}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }
}
