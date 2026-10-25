using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.DTOs.Auth;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Pages.Auth
{
    public class SetupAdminModel : PageModel
    {
        private readonly IAuthService _authService;

        public SetupAdminModel(IAuthService authService)
        {
            _authService = authService;
        }

        [BindProperty]
        public CreateUserRequest UserInput { get; set; } = new();

        public string Message { get; set; } = "";

        public async Task<IActionResult> OnGetAsync()
        {
            // If admin already exists, do not allow setup
            if (await _authService.HasAdminAsync())
            {
                return RedirectToPage("/Auth/Login");
            }

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (await _authService.HasAdminAsync())
            {
                return RedirectToPage("/Auth/Login");
            }

            if (!ModelState.IsValid)
            {
                Message = string.Join("<br>",
                    ModelState.Values.SelectMany(v => v.Errors)
                                     .Select(e => e.ErrorMessage));
                return Page();
            }

            var result = await _authService.CreateAdminAsync(UserInput);
            if (!result.Result)
            {
                Message = result.Message;
                return Page();
            }

            return RedirectToPage("/Auth/Login", new { message = "Initial administrator account created successfully. Please sign in." });
        }
    }
}
