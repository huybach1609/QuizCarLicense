namespace QuizCarLicense.Extensions;


public static class ConfigurationBuilderExtensions
{
    public static WebApplicationBuilder AddConfigurationPerEnvironment(this WebApplicationBuilder builder)
    {
        // .NET loads appsettings.json + appsettings.{ENV}.json + env vars.
        // Explicit layering here if you want full control:
        builder.Configuration
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables();

        if (builder.Environment.IsDevelopment())
        {
            // UserSecrets for local only
            builder.Configuration.AddUserSecrets<Program>(optional: true);
        }

        if (builder.Environment.IsProduction())
        {
            builder.AddKeyVault();
        }
        return builder;
    }

    public static WebApplicationBuilder AddKeyVault(this WebApplicationBuilder builder)
    {
        //var kvUrl = builder.Configuration["KeyVault:VaultUri"];
        //if (!string.IsNullOrWhiteSpace(kvUrl))
        //{
        //    builder.Configuration.AddAzureKeyVault(
        //        new Uri(kvUrl),
        //        new DefaultAzureCredential());
        //}
        return builder;
    }
}
