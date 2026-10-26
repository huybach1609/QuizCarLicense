using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.DTOs;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using System.Text.Json;

namespace QuizCarLicense.Pages.Take
{
    public class GuestResultModel : PageModel
    {
        private readonly QuizCarLicenseContext _context;
        private readonly ITestService _testService;

        public GuestResultModel(QuizCarLicenseContext context, ITestService testService)
        {
            _context = context;
            _testService = testService;
        }

        public float Score { get; set; }
        public int QuizId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime CompletedAt { get; set; }
        public List<QuestionDTO> TestQuestion { get; set; } = new();
        public Models.Quiz QuizObject { get; set; } = new();

        public async Task<IActionResult> OnGetAsync()
        {
            var guestResultJson = HttpContext.Session.GetString("GuestTestResult");

            if (string.IsNullOrEmpty(guestResultJson))
            {
                TempData["Error"] = "No test result found. Please take a test first.";
                return RedirectToPage("/Index");
            }

            var guestResult = JsonSerializer.Deserialize<GuestTestResultDto>(guestResultJson);

            Score = guestResult.Score;
            QuizId = guestResult.QuizId;
            StartTime = guestResult.StartTime;
            CompletedAt = guestResult.CompletedAt;

            // Load quiz information
            QuizObject = await _context.Quizzes
                .Include(q => q.User)
                .FirstOrDefaultAsync(q => q.QuizId == QuizId);

            if (QuizObject == null)
            {
                return NotFound();
            }

            // Build test questions with user's answers
            TestQuestion = await _testService.BuildGuestTestResultAsync(
                QuizObject,
                guestResult.Answers,
                default
            );

            return Page();
        }
    }
}
