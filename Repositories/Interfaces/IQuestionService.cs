using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Pagination;
using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface IQuestionService
    {
        Task<PagedResult<QuizQuestion>> GetPagedAsync(int pageNumber, int pageSize);
        Task<QuizQuestion?> GetWithAnswersAsync(int id);
        Task<QuizQuestion> CreateAsync(QuizQuestionInputModel input);
        Task UpdateAsync(QuizQuestionInputModel input);
        Task DeleteAsync(int id);
        QuizQuestionInputModel BuildEmptyInput(int answersCount = 4);
    }
}
