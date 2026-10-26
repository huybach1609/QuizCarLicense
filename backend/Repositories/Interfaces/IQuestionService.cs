using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Pagination;
using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface IQuestionService
    {
        Task<PagedResult<QuizQuestion>> GetPagedAsync(int pageNumber, int pageSize, CancellationToken ct = default);
        Task<QuizQuestion?> GetWithAnswersAsync(int id, CancellationToken ct = default);
        Task<QuizQuestion> CreateAsync(QuizQuestionInputModel input, CancellationToken ct = default);
        Task UpdateAsync(QuizQuestionInputModel input, CancellationToken ct = default);
        Task DeleteAsync(int id, CancellationToken ct = default);
        Task<string?> UpdateImageAsync(int questionId, IFormFile file, CancellationToken ct = default);
        QuizQuestionInputModel BuildEmptyInput(int answersCount = 4);
    }
}
