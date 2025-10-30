using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuizCarLicense.Constrains;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Implementations;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppOptions(this IServiceCollection services, IConfiguration cfg)
    {
        // Example strongly-typed options
        //services.Configure<AppUrls>(cfg.GetSection("AppUrls"));
        //services.AddSingleton(sp => sp.GetRequiredService<IOptions<AppUrls>>().Value);
   

        return services;
    }

    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration cfg, IWebHostEnvironment env)
    {
        var conn = cfg.GetConnectionString(env.IsDevelopment() ? "Dev" : "Default");
        services.AddDbContext<QuizCarLicenseContext>(opt =>
            opt.UseSqlServer(conn));

        services.AddHealthChecks()
            .AddDbContextCheck<QuizCarLicenseContext>("db");

        return services;
    }

    /// <summary>
    /// Register app services 
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {

        services.AddScoped<IQuestionService, QuestionService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IQuizService, QuizService>();
        services.AddScoped<ITestService, TestService>();
        services.AddScoped<ITakeService, TakeService>();


        return services;
    }

    public static IServiceCollection AddExternalServices(this IServiceCollection services)
    {
        services.AddRazorPages();
        services.AddHttpContextAccessor();
        services.AddDistributedMemoryCache();
        services.AddSession(options =>
        {
            options.IdleTimeout = TimeSpan.FromMinutes(30);
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
        });
        services.AddScoped<RedirectIfAuthenticatedFilter>();
        // HttpClients, message bus, cache, etc.
        // services.AddHttpClient("github", c => c.BaseAddress = new Uri("https://api.github.com"));
        return services;
    }

    public static IServiceCollection AddPolicies(this IServiceCollection services)
    {
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.LoginPath = "/Auth/Login";
                options.AccessDeniedPath = "/Auth/Denied";
                options.ExpireTimeSpan = TimeSpan.FromHours(8);
                options.SlidingExpiration = true;
                // options.Cookie.Name = ".QuizCarLicense.Auth";
            });

        services.AddAuthorizationBuilder()
            .AddPolicy("AdminOnly", policy =>
                policy.RequireRole(UserRole.Admin.ToString()))
            .AddPolicy("UserOnly", policy =>
                policy.RequireRole(UserRole.User.ToString()))
            .AddPolicy("UserOrAdmin", policy =>
                policy.RequireRole(UserRole.User.ToString(), UserRole.Admin.ToString()));



        //authentication policies
        //or CORS

        return services;
    }
}

// Example options class
//public record AppUrls
//{
//    public string PublicBaseUrl { get; init; } = "";
//}
