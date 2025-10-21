using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using QuizCarLicense.Constrains;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Implementations;
using QuizCarLicense.Repositories.Interfaces;
using System.Reflection.Metadata.Ecma335;

namespace QuizCarLicense.Filters
{
    public class UserFilter : IAsyncPageFilter
    {
        private readonly IUserSessionManager _userSessionManager;

        public UserFilter(IUserSessionManager userSessionManager)
        {
            _userSessionManager = userSessionManager;
        }

        public async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context, PageHandlerExecutionDelegate next)
        {
            var req = context.HttpContext.Request;
            var returnUrl = req.Path + req.QueryString;

            User? user = _userSessionManager.GetUserInfo();
            // not sign in
            if (user == null)
            {
                context.Result = new 
                RedirectToPageResult("/Auth/Login", new { status = 1 });
                return;
            }
            // signin but not admin 
            if (!(user.Role == UserRole.Admin.ToString()))
            {
                context.Result = new ForbidResult();
                return;
            }

            await next();
        }

        public Task OnPageHandlerSelectionAsync(PageHandlerSelectedContext context)
            => Task.CompletedTask;
    }
}
