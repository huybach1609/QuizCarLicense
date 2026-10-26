using QuizCarLicense.Models;
using QuizCarLicense.Extensions;
using QuizCarLicense.Utils;

var builder = WebApplication.CreateBuilder(args);

// Add configuration per environment
builder.AddConfigurationPerEnvironment();

// Add logging
builder.AddLoggingPerEnvironment();

// Register services
builder.Services.AddAppOptions(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration, builder.Environment);
builder.Services.AddApplicationServices();
builder.Services.AddExternalServices();
builder.Services.AddPolicies(builder.Configuration);
builder.Services.AddApiInfrastructure(builder.Configuration);

var app = builder.Build();

// Initial data seed when start
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<QuizCarLicenseContext>();
    await DbInitializer.SeedAsync(context);
}

app.ConfigurePipeline(app.Environment);

// Dual-Mode: Chạy song song Razor Pages và Web API Controllers
app.MapRazorPages();
app.MapControllers();

app.Run();
