using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace QuizCarLicense.Middleware;

/// <summary>
/// Xử lý ngoại lệ tập trung cho toàn bộ các API endpoint (/api/*) trả về chuẩn RFC 7807 ProblemDetails.
/// </summary>
public sealed class ApiExceptionHandler : IExceptionHandler
{
    private readonly ILogger<ApiExceptionHandler> _logger;

    public ApiExceptionHandler(ILogger<ApiExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // Chỉ can thiệp vào các request gọi API (/api)
        if (!httpContext.Request.Path.StartsWithSegments("/api"))
        {
            return false;
        }

        var (statusCode, title) = exception switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Not Found"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Bad Request"),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Forbidden"),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Conflict"),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.")
        };

        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled exception occurred while processing API request: {Path}", httpContext.Request.Path);
        }
        else
        {
            _logger.LogWarning(exception, "Handled API exception: {Title} at {Path}", title, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = statusCode >= 500 ? "A server error occurred. Please contact the administrator." : exception.Message,
            Instance = httpContext.Request.Path
        };

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}
