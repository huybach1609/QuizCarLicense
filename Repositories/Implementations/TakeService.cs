using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public class TakeService : ITakeService
    {
        private readonly QuizCarLicenseContext _context;

        public TakeService(QuizCarLicenseContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves the most recent takes for a given user.
        /// </summary>
        /// <param name="userId">The ID of the user.</param>
        /// <param name="count">The number of takes to retrieve.</param>
        /// <param name="ct">The cancellation token.</param>
        /// <returns>A list of recent takes.</returns>
        public async Task<List<Take>> GetRecentTakesAsync(int userId, int count = 5, CancellationToken ct = default)
        {
            return await _context.Takes.AsNoTracking()
                 .Where(t => t.UserId == userId)
                 .OrderByDescending(t => t.StartedAt)
                 .Include(t => t.Quiz)
                 .ThenInclude(q => q.Questions)
                 .Take(count)
                 .ToListAsync(ct);
        }
    }
}
