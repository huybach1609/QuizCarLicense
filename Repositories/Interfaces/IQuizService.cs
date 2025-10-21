using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface IQuizService
    {
        /// <summary>
        /// Retrieves all quizzes.
        /// </summary>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>List of quizzes.</returns>
        Task<List<Quiz>> GetAllAsync(CancellationToken ct = default);

        /// <summary>
        /// Retrieves quizzes by user ID.
        /// </summary>
        /// <param name="userId">User ID.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>List of quizzes.</returns>
        Task<List<Quiz>> GetByUserAsync(int userId, CancellationToken ct = default);

        /// <summary>
        /// Retrieves a quiz by ID.
        /// </summary>
        /// <param name="quizId">Quiz ID.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Quiz or null.</returns>
        Task<Quiz?> GetByIdAsync(int quizId, CancellationToken ct = default);

        /// <summary>
        /// Inserts a new quiz.
        /// </summary>
        /// <param name="quiz">Quiz to insert.</param>
        /// <param name="userId">User ID.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>True if successful, false otherwise.</returns>
        Task<bool> InsertAsync(Quiz quiz, int userId, CancellationToken ct = default);

        /// <summary>
        /// Updates an existing quiz.
        /// </summary>
        /// <param name="quiz">Quiz to update.</param>
        /// <param name="userId">User ID.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>True if successful, false otherwise.</returns>
        Task<bool> UpdateAsync(Quiz quiz, int userId, CancellationToken ct = default);
        Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    }
}
