using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Auth;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;
using System.Threading.Tasks;

namespace QuizCarLicense.Pages.Auth
{
    [ServiceFilter(typeof(RedirectIfAuthenticatedFilter))]
    public class LoginModel : PageModel
    {
        private readonly IAuthService _authService;
        public LoginModel(IAuthService authService)
        {
            _authService = authService;
        }

        public string Message { get; set; } = "";
        public string Message1 { get; set; } = "";

        public async Task<IActionResult> OnGetAsync(int status, string? message = null)
        {
            if (!await _authService.HasAdminAsync())
            {
                return RedirectToPage("/Auth/SetupAdmin");
            }

            if (User.Identity != null && User.Identity.IsAuthenticated)
                return RedirectToPage("/Index");

            if (!string.IsNullOrEmpty(message))
                Message = message;
            else if (status == 1)
                Message = "You must have account to perform this";
            else if (status == 0)
                Message = "";

            return Page();
        }

        public async Task<IActionResult> OnPostLogin()
        {
            if (!await _authService.HasAdminAsync())
            {
                return RedirectToPage("/Auth/SetupAdmin");
            }

            // Manually retrieve the input values from the form
            string? email = Request.Form["email"];
            string? password = Request.Form["password"];


            var resutl = await _authService.Login(email ?? "", password ?? "");
            if (resutl.Result == false)
            {
                Message1 = resutl.Message;
                return Page();
            }
            else
            {

                var principal = ((LoginResponse)resutl).claimsPrincipal;
                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    principal,
                    new AuthenticationProperties
                    {
                        IsPersistent = true, // remember me - set later
                        ExpiresUtc = DateTime.UtcNow.AddHours(8)
                    });

                return RedirectToPage("/Index");
            }
        }
    }
}
