using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Pages.Quiz
{
    [Authorize(Policy = "UserOrAdmin")]
    public class AddModel : PageModel
    {
        [BindProperty] public List<int> SelectedQuestions { get; set; } = new();
        [BindProperty(SupportsGet = true)] public int Code { get; set; }

        public List<QuizQuestion> ListQuestion { get; private set; } = new();
        public Models.Quiz QuizModel { get; private set; } = new();

        private readonly IQuizService _quizService;

        public AddModel(IQuizService quizService) => _quizService = quizService;

        public async Task<IActionResult> OnGetAsync(int code, CancellationToken ct)
        {
            Code = code;
            var quiz = await _quizService.GetWithQuestionsAsync(Code, ct);
            if (quiz is null) return NotFound();

            QuizModel = quiz;
            ListQuestion = await _quizService.GetAllQuestionsAsync(ct);

            // Pre-select existing questions
            SelectedQuestions = quiz.Questions.Select(q => q.QuestionId).ToList();
            return Page();
        }

        public async Task<IActionResult> OnPostAsync(CancellationToken ct)
        {
            // Validate the quiz exists
            var quiz = await _quizService.GetWithQuestionsAsync(Code, ct);
            if (quiz is null)
            {
                ModelState.AddModelError(string.Empty, "Quiz not found.");
                // reload data for redisplay
                ListQuestion = await _quizService.GetAllQuestionsAsync(ct);
                return Page();
            }

            // Replace questions (empty list means clear all)
            await _quizService.ReplaceQuestionsAsync(Code, SelectedQuestions ?? Enumerable.Empty<int>(), ct);

            // redirect to detail
            return RedirectToPage("/Quiz/Detail", new { id = Code, handler = "ShowDetails" });
        }
    }
}
