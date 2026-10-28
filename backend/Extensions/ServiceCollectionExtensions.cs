using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs.Auth;
using QuizCarLicense.Middleware;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Implementations;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppOptions(this IServiceCollection services, IConfiguration cfg)
    {
        services.Configure<JwtOptions>(cfg.GetSection(JwtOptions.SectionName));
        return services;
    }

    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration cfg, IWebHostEnvironment env)
    {
        var conn = cfg.GetConnectionString(env.IsDevelopment() ? "Dev" : "Default");
        services.AddDbContext<QuizCarLicenseContext>(opt =>
            opt.UseNpgsql(conn));

        services.AddHealthChecks()
            .AddDbContextCheck<QuizCarLicenseContext>("db");

        return services;
    }

    /// <summary>
    /// Register app services 
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IQuestionService, QuestionService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IQuizService, QuizService>();
        services.AddScoped<ITestService, TestService>();
        services.AddScoped<ITakeService, TakeService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IOnlinePresenceService, OnlinePresenceService>();

        return services;
    }

    public static IServiceCollection AddExternalServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddMemoryCache();
        services.AddDistributedMemoryCache();
        services.AddSession(options =>
        {
            options.IdleTimeout = TimeSpan.FromMinutes(30);
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
        });
        return services;
    }

    public static IServiceCollection AddPolicies(this IServiceCollection services, IConfiguration cfg)
    {
        var jwtOptions = cfg.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var key = Encoding.UTF8.GetBytes(string.IsNullOrEmpty(jwtOptions.SecretKey)
            ? "QuizCarLicense_FallbackSecretSigningKey_AtLeast32Chars!"
            : jwtOptions.SecretKey);

        services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddCookie(options =>
        {
            options.ExpireTimeSpan = TimeSpan.FromHours(8);
            options.SlidingExpiration = true;

            // Đối với API request, không redirect 302 mà trả thẳng mã 401/403
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        })
        .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.FromMinutes(1)
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    // Ưu tiên Authorization header; nếu không có, đọc từ cookie qcl_access_token do BFF / Browser gửi kèm
                    if (string.IsNullOrEmpty(context.Token) &&
                        context.Request.Cookies.TryGetValue("qcl_access_token", out var cookieToken) &&
                        !string.IsNullOrWhiteSpace(cookieToken))
                    {
                        context.Token = cookieToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorizationBuilder()
            .AddPolicy("AdminOnly", policy =>
                policy.RequireRole(UserRole.Admin.ToString()))
            .AddPolicy("UserOnly", policy =>
                policy.RequireRole(UserRole.User.ToString()))
            .AddPolicy("UserOrAdmin", policy =>
                policy.RequireRole(UserRole.User.ToString(), UserRole.Admin.ToString()));

        return services;
    }

    /// <summary>
    /// Thêm toàn bộ hạ tầng cho RESTful Web API (.NET 8):
    /// - Controllers + JsonStringEnumConverter
    /// - ProblemDetails + IExceptionHandler
    /// - CORS
    /// - Rate Limiting
    /// - Response Compression
    /// - Output Caching
    /// - Swagger / OpenAPI với JWT Bearer
    /// </summary>
    public static IServiceCollection AddApiInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        // 1. Controllers & JSON Options
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            });

        // 2. Exception Handling & RFC 7807 ProblemDetails
        services.AddExceptionHandler<ApiExceptionHandler>();
        services.AddProblemDetails();

        // 3. CORS Policy
        var allowedOrigins = cfg.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
            new[] { "http://localhost:5173", "http://localhost:3000" };

        services.AddCors(options =>
        {
            options.AddPolicy("AllowReactClient", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });

        // 4. Rate Limiting
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Giới hạn xác thực: 5 requests / phút / IP
            options.AddPolicy("AuthLimit", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            // Giới hạn nộp bài: 15 requests / phút / IP
            options.AddPolicy("SubmitLimit", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 15,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));
        });

        // 5. Response Compression
        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
        });

        // 6. Output Caching
        services.AddOutputCache(options =>
        {
            options.AddPolicy("QuizzesCache", builder =>
                builder.Expire(TimeSpan.FromMinutes(5)).Tag("quizzes"));
        });

        // 7. Swagger / OpenAPI
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "QuizCarLicense RESTful API",
                Version = "v1",
                Description = "Tầng API cho ứng dụng ôn thi lý thuyết sát hạch lái xe, hỗ trợ xác thực JWT Bearer và cơ chế thi Stateless."
            });

            // Nạp file XML comments nếu có
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                c.IncludeXmlComments(xmlPath);
            }

            // Cấu hình JWT Bearer trong Swagger UI
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Nhập token JWT theo định dạng: Bearer {token}"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}
