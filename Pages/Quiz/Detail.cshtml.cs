using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Identity.Client;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Pages.Quiz
{
    public class UpdateModel : PageModel
    {
        [BindProperty]
        public Models.Quiz? QuizModel { get; set; } = new();

        [TempData]
        public string Message { get; set; }

        private readonly IQuizService _quizService;
        

        public UpdateModel(IQuizService quizService)
        {
            _quizService = quizService;
        }

        public IActionResult OnGet()
        {
            Message = "";
            return Page();
        }

        public async Task<IActionResult> OnGetShowDetailsAsync(int id, CancellationToken ct)
        {
            // Handle logic here based on the quiz ID (id)

            QuizModel = await _quizService.GetByIdAsync(id, ct);
            return Page();
        }

    }
}
