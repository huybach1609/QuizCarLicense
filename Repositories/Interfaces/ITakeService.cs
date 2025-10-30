using QuizCarLicense.DTOs;
using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface ITakeService
    {
        Task<List<Take>> GetRecentTakesAsync(int userId, int count = 5, CancellationToken ct = default);

        Task<bool> CheckTakeAsync(int takeId, CancellationToken ct);

        Task<Take?> GetTakeWithAnswersAsync(int takeId, CancellationToken ct);

        /// <summary>
        /// Build the QuestionDTO list (answered + unfinished) for displaying results.
        /// </summary>
        Task<List<QuestionDTO>> BuildTestQuestionsAsync(Take take, CancellationToken ct);

        Task<bool> DeleteTakeAsync(int takeId, CancellationToken ct);
    }
}
