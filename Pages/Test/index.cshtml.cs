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

            float score = await _testService.CalculateScoreAsync(result, ct);

            // Get userId; if not logged in then return 401
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdStr))
            {
                // Store guest result in session
                var guestResult = new
                {
                    Score = score,
                    QuizId = result.QuizId,
                    StartTime = result.StartTime,
                    CompletedAt = DateTime.UtcNow,
                    Answers = result.ListAnswers
                };

                HttpContext.Session.SetString("GuestTestResult",
                    System.Text.Json.JsonSerializer.Serialize(guestResult));

                var response1 = new
                {
                    message = $"Answers submitted successfully! Score: {score}. Sign in to save your results permanently.",
                    success = true,
                    takeData = new { takeId = -1, score = score }, // Use -1 to indicate guest
                    redirect = "/Take/GuestResult" // New page for guest results
                };

                return new JsonResult(response1);
            }
            int userId = int.Parse(userIdStr);

            // Calculate score + save result
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
