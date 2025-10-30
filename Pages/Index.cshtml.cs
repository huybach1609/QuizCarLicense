using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.Repositories.Interfaces;
using System.Security.Claims;

namespace QuizCarLicense.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        private readonly ITakeService _takeService;

        public IndexModel(ILogger<IndexModel> logger, ITakeService takeService)
        {
            _logger = logger;
            _takeService = takeService;
        }

        public List<Models.Take> ListTake { get; set; } = new List<Models.Take>();
        public List<CardQuiz> ListCard { get; set; } = new();
        public bool IsLogin { get; private set; }


        public async Task<IActionResult> OnGetAsync(CancellationToken ct)
        {
            LoadListQuiz();

            bool IsLogin = User?.Identity?.IsAuthenticated == true;

            if (!IsLogin)
                return Page();

            // try parse userId from Claims
            var idStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(idStr, out int userId))
            {
                _logger.LogWarning("Authenticated user has no valid NameIdentifier claim.");
                return Page();
            }
            // query take history by 5
            try
            {
                ListTake = await _takeService.GetRecentTakesAsync(userId, 5, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load recent takes for user {UserId}", userId);
                // Keep page functional even on failure
                ListTake = new();
            }

            return Page();
        }
        public void LoadListQuiz()
        {

            ListCard = new() {
                  new() { Title = "Ôn tập câu điểm liệt",  Url ="/Quiz/Detail?id=2003&handler=ShowDetails" ,
                    Icon = SvgIcons.BoxIcon
                  },
                  new() { Title = "Câu hỏi bị sai nhiều",  Url ="/Quiz/Detail?id=2003&handler=ShowDetails" ,
                      Icon =SvgIcons.BoxCheck
                  },
                  new() { Title = "Thi thử bộ đề tạo sẵn",  Url="/Quiz" ,
                      Icon =SvgIcons.StackIcon
                  }
            };

        }
    }
}
