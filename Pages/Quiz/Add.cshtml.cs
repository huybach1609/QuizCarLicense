using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;

namespace QuizCarLicense.Pages.Quiz
{
    [Authorize(Policy = "UserOrAdmin")]
    public class AddModel : PageModel
    {
        [BindProperty] public List<int> SelectedQuestions { get; set; }

        [BindProperty] public int Code { get; set; }

        public List<Models.QuizQuestion> ListQuestion { get; set; } = new();
        public Models.Quiz QuizModel { get; set; } = new();

        private readonly QuizCarLicenseContext _context;

        public AddModel(QuizCarLicenseContext context)
        {
            _context = context;
        }

        public void OnGet(int code)
        {
            Code = code;
            LoadData();
        }
        private void LoadData()
        {
            ListQuestion = _context.QuizQuestions.ToList();

            var quiz = _context.Quizzes
                               .Include(q => q.Questions)
                               .FirstOrDefault(q => q.QuizId == Code);
            if (quiz != null)
            {
                List<int> questionSelect = new();
                foreach (var question in quiz.Questions)
                {
                    questionSelect.Add(question.QuestionId);
                }
                SelectedQuestions = questionSelect;
            }
         
        }
        public IActionResult OnPost()
        {
            if (SelectedQuestions != null && SelectedQuestions.Count > 0)
            {

                // get quiz by code
                var quiz = _context.Quizzes.Include(q => q.Questions)
                                     .FirstOrDefault(q => q.QuizId == Code);
                if (quiz == null)
                {
                    ModelState.AddModelError(string.Empty, "Quiz not found.");
                    LoadData();
                    return Page();
                }
                // get question by QuizQuestions checkbox
                var selectedQuestions = _context.QuizQuestions
                                      .Where(q => SelectedQuestions.Contains(q.QuestionId))
                                      .ToList();

                quiz.Questions.Clear();
                // add question to quiz db
                foreach (var question in selectedQuestions)
                {
                    if (!quiz.Questions.Any(q => q.QuestionId == question.QuestionId))
                    {
                        quiz.Questions.Add(question);
                    }
                }
                _context.SaveChanges();
            }
            //id = 1 & handler = ShowDetails
            return RedirectToPage("/Quiz/Detail", new { id = Code, handler = "ShowDetails" });
        }
    }
}
