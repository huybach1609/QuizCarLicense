using Microsoft.AspNetCore.Authentication.Cookies;
using QuizCarLicense.Constrains;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Implementations;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Extensions;

//var builder = WebApplication.CreateBuilder(args);

//// Add services to the container.
//builder.Services.AddRazorPages();

//builder.Services.AddSqlServer<QuizCarLicenseContext>(builder.Configuration.GetConnectionString("Default"));

//builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
//    .AddCookie(options =>
//    {
//        options.LoginPath = "/Auth/Login";
//        options.AccessDeniedPath = "/Auth/Denied";
//        options.ExpireTimeSpan = TimeSpan.FromHours(8);
//        options.SlidingExpiration = true;
//        // options.Cookie.Name = ".QuizCarLicense.Auth";
//    });

//builder.Services.AddAuthorizationBuilder()
//    .AddPolicy("AdminOnly", policy =>
//        policy.RequireRole(UserRole.Admin.ToString()))
//    .AddPolicy("UserOnly", policy =>
//        policy.RequireRole(UserRole.User.ToString()))
//    .AddPolicy("UserOrAdmin", policy =>
//        policy.RequireRole(UserRole.User.ToString(), UserRole.Admin.ToString()));


//builder.Services.AddHttpContextAccessor();
//builder.Services.AddDistributedMemoryCache();
//builder.Services.AddSession(options =>
//{
//    options.IdleTimeout = TimeSpan.FromMinutes(30);
//    options.Cookie.HttpOnly = true;
//    options.Cookie.IsEssential = true;
//});

//// DI
//builder.Services.AddScoped<RedirectIfAuthenticatedFilter>();
//builder.Services.AddScoped<IQuestionService, QuestionService>();
//builder.Services.AddScoped<IAuthService, AuthService>();
//builder.Services.AddScoped<IQuizService, QuizService>();
//builder.Services.AddScoped<ITestService, TestService>();
//builder.Services.AddScoped<ITakeService, TakeService>();

//var app = builder.Build();


//if (!app.Environment.IsDevelopment())
//{
//    app.UseExceptionHandler("/Error");
//    app.UseHsts();
//}


//app.UseHttpsRedirection();
//app.UseStaticFiles();

//app.UseRouting();

//app.UseSession();
//app.UseAuthentication();
//app.UseAuthorization();


//app.MapRazorPages();
//app.UseExceptionHandler("/Error");
//app.Run();

var builder = WebApplication.CreateBuilder(args);

// add confiugration per environment
builder.AddConfigurationPerEnvironment();

// Add logging
builder.AddLoggingPerEnvironment();

// Register services
builder.Services.AddAppOptions(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration, builder.Environment);
builder.Services.AddApplicationServices();
builder.Services.AddExternalServices();
builder.Services.AddPolicies();


var app = builder.Build();

app.ConfigurePipeline(app.Environment);
app.MapRazorPages();
app.Run();

