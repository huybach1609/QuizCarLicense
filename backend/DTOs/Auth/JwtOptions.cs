namespace QuizCarLicense.DTOs.Auth;

/// <summary>
/// Cấu hình phát hành và xác thực JWT Bearer Token.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; init; } = "QuizCarLicense.Api";
    public string Audience { get; init; } = "QuizCarLicense.Client";
    public string SecretKey { get; init; } = string.Empty;
    public int ExpireMinutes { get; init; } = 480;
}
