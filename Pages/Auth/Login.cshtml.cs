using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTO;
using QuizCarLicense.DTO.Auth;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;
using System.Threading.Tasks;

namespace QuizCarLicense.Pages.Auth
{
    [Authorize]
    public class LoginModel : PageModel
    {
        private readonly IUserSessionManager _userSessionManager;
        private readonly IAuthService _authService;
        public LoginModel(IUserSessionManager userSessionManager, IAuthService authService)
        {
            _userSessionManager = userSessionManager;
            _authService = authService;
        }

        public string Message { get; set; } = "";
        public string Message1 { get; set; } = "";

        public void OnGet(int status)
        {

            if (User.Identity != null && User.Identity.IsAuthenticated)
                Response.Redirect("/Index");

            if (status == 1)
                Message = "You must have account to perform this";
            else if (status == 0)
                Message = "";
        }

        public async Task<IActionResult> OnPostLogin()
        {
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
        public async Task<IActionResult> OnGetLogoutAsync()
        {
            _userSessionManager.RemoveUserInfo();
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToPage("/Auth/Login");
        }
        public IActionResult OnPostSignUp()
        {
            // Manually retrieve the input values from the form
            string userName = Request.Form["UserName"];
            string fullName = Request.Form["FullName"];
            string password = Request.Form["password"];
            string repassword = Request.Form["repassword"];

            // Validate the sign-up input
            if (password == repassword)
            {
                using (var context = new QuizCarLicenseContext())
                {
                    var userDb = context.Users.FirstOrDefault(u => u.Username.Equals(userName));
                    if (userDb != null)
                    {
                        Message = "UserName already exist";
                        return Page();
                    }
                    Models.User user = new()
                    {
                        Username = userName,
                        FullName = fullName,
                        Password = StringUtils.ComputeSha256Hash(password ?? "123"),
                        Role = UserRole.User.ToString()
                    };
                    context.Users.Add(user);
                    context.SaveChanges();
                }
            }
            else
            {
                Message = "password mismatch error";
            }
            return Page();
        }
    }
}
