// Extensions/LoggingExtensions.cs
using Serilog;

namespace QuizCarLicense.Extensions;

public static class LoggingExtensions
{
    public static WebApplicationBuilder AddLoggingPerEnvironment(this WebApplicationBuilder builder)
    {
        var loggerConfig = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database", Serilog.Events.LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", Serilog.Events.LogEventLevel.Error); ;

        if (builder.Environment.IsDevelopment())
        {
            loggerConfig = loggerConfig.WriteTo.Console();
        }
        else
        {
            // Production sinks (Seq, ELK, blob, etc.)
            loggerConfig = loggerConfig.WriteTo.Console();
        }

        Log.Logger = loggerConfig.CreateLogger();
        builder.Host.UseSerilog();
        return builder;
    }
}
