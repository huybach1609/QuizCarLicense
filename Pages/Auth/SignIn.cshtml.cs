using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.DTOs.Auth;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Pages.Auth
{
    public class SignInModel : PageModel
    {

        [BindProperty]
        public CreateUserRequest UserInput { get; set; }
        public string Message { get; set; } = "";

        private readonly IAuthService _authService;
        public SignInModel(IAuthService authService)
        {
            _authService = authService;
        }

        public void OnGet() { }
        public async Task<IActionResult> OnPostSignUpAsync()
        {
            if (!ModelState.IsValid)
            {
                Message = string.Join("<br>",
                  ModelState.Values.SelectMany(v => v.Errors)
                                   .Select(e => e.ErrorMessage));
                return Page();
            }
            // Manually retrieve the input values from the form
            //string userName = Request.Form["UserName"];
            //string fullName = Request.Form["FullName"];
            //string password = Request.Form["password"];
            //string repassword = Request.Form["repassword"];

            var result = await _authService.Signup(UserInput);
            Message = result.Message;
            return Page();
        }
    }
}
