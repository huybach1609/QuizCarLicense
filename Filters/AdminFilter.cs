using Microsoft.AspNetCore.Mvc.Filters;

namespace QuizCarLicense.Filters
{
    public class AdminFilter : IAsyncPageFilter
    {
        public async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context,
            PageHandlerExecutionDelegate next)
        {
            var user = context.HttpContext.User;
            // redirect ot login if not signin 
            //if ()
            //{

            //}
            // Signed in but not Admin? -> forbid (403) 


            
            await next();

        }



        public Task OnPageHandlerSelectionAsync(PageHandlerSelectedContext context)
            => Task.CompletedTask;
    }
}
