using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;
using System.Security.Claims;

namespace QuizCarLicense.Pages.Take
{
    [ServiceFilter(typeof(UserFilter))]
    public class IndexModel : PageModel
    {
        private readonly QuizCarLicenseContext _context;

        public IndexModel(QuizCarLicenseContext context)
        {
            _context = context;
        }

        public List<Models.Take> ListTake { get; set; } = new List<Models.Take>();
        public IActionResult OnGet()
        {
            var user = User;
            if (user == null)
            {
                return RedirectToPage("/Error");
            }
            int userId = Convert.ToInt32(user.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            ListTake = _context.Takes.Where(t => t.UserId == userId)
                .Include(t => t.Quiz)
                .ThenInclude(q => q.Questions)
                .OrderByDescending(t => t.StartedAt)
                .ToList();

            return Page();
        }
    }
}
