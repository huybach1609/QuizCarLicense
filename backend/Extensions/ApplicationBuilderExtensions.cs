namespace QuizCarLicense.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder ConfigurePipeline(this IApplicationBuilder app, IWebHostEnvironment env)
    {
        // 1. Nén phản hồi
        app.UseResponseCompression();

        // 2. Xử lý lỗi (ApiExceptionHandler sẽ tự bắt các lỗi /api, Razor Pages dùng UseGlobalExceptionHandling)
        app.UseExceptionHandler();
        app.UseGlobalExceptionHandling(env);

        app.UseHttpsRedirection();
        app.UseStaticFiles();

        app.UseRouting();

        // 3. CORS
        app.UseCors("AllowReactClient");

        // 4. Rate Limiting
        app.UseRateLimiter();

        // 5. Output Cache
        app.UseOutputCache();

        // 6. Session & Auth
        app.UseSession();
        app.UseAuthentication();
        app.UseAuthorization();

        // 7. Swagger UI trong Development
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "QuizCarLicense API v1");
                c.RoutePrefix = "swagger";
            });
        }

        return app;
    }

    public static IApplicationBuilder UseGlobalExceptionHandling(this IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        else
        {
            app.UseExceptionHandler("/Error");
            app.UseHsts();
        }
        return app;
    }
}
