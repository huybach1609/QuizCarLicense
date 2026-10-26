using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.DTOs;
using QuizCarLicense.Repositories.Interfaces;
using System.Security.Claims;

namespace QuizCarLicense.Pages.Take
{
    public class IndexModel : PageModel
    {
        private readonly ITakeService _takeService;

        public IndexModel(ITakeService takeService)
        {
            _takeService = takeService;
        }

        public List<TakeHistoryDto> ListTake { get; set; } = new();

        public async Task<IActionResult> OnGetAsync(CancellationToken ct)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return RedirectToPage("/Error");
            }

            ListTake = await _takeService.GetUserTakesAsync(userId, null, ct);
            return Page();
        }
    }
}

