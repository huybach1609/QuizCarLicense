using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.DTOs;
using QuizCarLicense.Repositories.Interfaces;
using System.Security.Claims;

namespace QuizCarLicense.Pages.Test
{
    public class TestPageModel : PageModel
    {
        private readonly ITestService _testService;

        public TestPageModel(ITestService testService)
            => _testService = testService;

        public List<QuestionDTO> TestQuestion { get; private set; } = new();
        public int QuizId { get; private set; }
        public Models.Quiz QuizObject { get; private set; } = new();

        // GET /Test?quizId=xxx
        public async Task<IActionResult> OnGetAsync(int quizId, CancellationToken ct)
        {
            var quiz = await _testService.GetQuizWithQuestionsAsync(quizId, ct);
            if (quiz is null) return NotFound();

            QuizObject = quiz;
            TestQuestion = await _testService.BuildTestQuestionsAsync(quiz, ct);
            QuizId = quizId;
            return Page();
        }

        // POST /Test?handler=SubmitTest
        public async Task<IActionResult> OnPostSubmitTestAsync([FromBody] TestResutlResponse result, CancellationToken ct)
        {
            if (result is null) return BadRequest(new { message = "No answers received." });

            // Get userId; if not logged in then return 401
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
                return new UnauthorizedObjectResult(new { message = "You must sign in to submit the test." });

            int userId = int.Parse(userIdStr);

            // Calculate score + save result
            float score = await _testService.CalculateScoreAsync(result, ct);
            var take = await _testService.SaveResultAsync(score, result, userId, ct);

            var response = new
            {
                message = $"Answers submitted successfully! score: {score}",
                success = true,
                takeData = new { takeId = take.TakeId, score = take.Score },
                redirect = $"/Take/ShowResult?takeId={take.TakeId}"
            };

            return new JsonResult(response);
        }
    }
}
