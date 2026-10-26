using System.ComponentModel.DataAnnotations;

namespace QuizCarLicense.DTOs.Api;

/// <summary>
/// Thông tin đăng nhập tài khoản qua API.
/// </summary>
public sealed record LoginRequest
{
    /// <summary>Tên đăng nhập.</summary>
    [Required, MaxLength(100)]
    public required string Username { get; init; }

    /// <summary>Mật khẩu.</summary>
    [Required, MaxLength(100)]
    public required string Password { get; init; }
}

/// <summary>
/// Thông tin đăng ký tài khoản mới qua API.
/// </summary>
public sealed record RegisterRequest
{
    /// <summary>Tên đăng nhập duy nhất.</summary>
    [Required, MaxLength(100)]
    public required string Username { get; init; }

    /// <summary>Họ và tên đầy đủ của học viên.</summary>
    [Required, MaxLength(150)]
    public required string FullName { get; init; }

    /// <summary>Mật khẩu (tối thiểu 8 ký tự, tối đa 24 ký tự).</summary>
    [Required, StringLength(24, MinimumLength = 8)]
    public required string Password { get; init; }
}

/// <summary>
/// Thông tin người dùng trả về qua API.
/// </summary>
public sealed record AuthUserResponse(
    int UserId,
    string Username,
    string FullName,
    string Role);

/// <summary>
/// Kết quả đăng nhập thành công kèm JWT Bearer Token.
/// </summary>
public sealed record AuthTokenResponse(
    string AccessToken,
    string TokenType,
    DateTimeOffset ExpiresAt,
    AuthUserResponse User);
