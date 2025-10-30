
namespace QuizCarLicense.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder ConfigurePipeline(this IApplicationBuilder app, IWebHostEnvironment env)
    {

        app.UseHttpsRedirection();
        app.UseGlobalExceptionHandling(env);

        app.UseStaticFiles();
        app.UseRouting();
        app.UseSession();
        app.UseAuthentication();
        app.UseAuthorization();


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
            //app.UseExceptionHandler(errorApp =>
            //{
            //    errorApp.Run(async context =>
            //    {
            //        var feature = context.Features.Get<IExceptionHandlerFeature>();
            //        var problem = new ProblemDetails
            //        {
            //            Status = StatusCodes.Status500InternalServerError,
            //            Title = "An unexpected error occurred.",
            //            Detail = env.IsDevelopment() ? feature?.Error.ToString() : null
            //        };
            //        context.Response.StatusCode = problem.Status ?? 500;
            //        context.Response.ContentType = "application/problem+json";
            //        await context.Response.WriteAsJsonAsync(problem);
            //    });
            //});
            app.UseExceptionHandler("/Error");
            app.UseHsts();
        }
        return app;
    }

}
