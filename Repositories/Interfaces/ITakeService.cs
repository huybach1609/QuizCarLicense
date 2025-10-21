using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface ITakeService
    {
        Task<List<Take>> GetRecentTakesAsync(int userId, int count = 5, CancellationToken ct = default);
    }
}
