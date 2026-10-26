using QuizCarLicense.DTOs.Auth;

namespace QuizCarLicense.Repositories.Interfaces;

/// <summary>
/// Service tạo và quản lý JWT Bearer Token.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Phát hành Access Token ký HMAC-SHA256 cho người dùng.
    /// </summary>
    (string Token, DateTimeOffset ExpiresAt) GenerateAccessToken(UserDto user);
}
