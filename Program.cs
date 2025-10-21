using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.DependencyInjection;
using QuizCarLicense.Constrains;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Implementations;
using QuizCarLicense.Repositories.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

builder.Services.AddSqlServer<QuizCarLicenseContext>(builder.Configuration.GetConnectionString("Default"));

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Auth/Login";
        options.AccessDeniedPath = "/Auth/Denied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        // options.Cookie.Name = ".QuizCarLicense.Auth";
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOnly", policy =>
        policy.RequireRole(UserRole.Admin.ToString()))
    .AddPolicy("UserOnly", policy =>
        policy.RequireRole(UserRole.User.ToString()))
    .AddPolicy("UserOrAdmin", policy =>
        policy.RequireRole(UserRole.User.ToString(), UserRole.Admin.ToString()));


builder.Services.AddHttpContextAccessor();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// DI
builder.Services.AddScoped<AdminFilter>();
builder.Services.AddScoped<UserFilter>();
builder.Services.AddScoped<IUserSessionManager, UserSessionManager>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<ITakeService, TakeService>();

var app = builder.Build();


if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}


app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();


app.MapRazorPages();

app.UseExceptionHandler("/Error");
app.Run();
