using QuizCarLicense.DTOs;
using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface ITestService
    {
        Task<Quiz?> GetQuizWithQuestionsAsync(int quizId, CancellationToken ct);

        Task<List<QuestionDTO>> BuildTestQuestionsAsync(Quiz quiz, CancellationToken ct);

        Task<float> CalculateScoreAsync(TestResutlResponse result, CancellationToken ct);

        /// <summary> save resutl test to take record </summary>
        Task<Take> SaveResultAsync(float score, TestResutlResponse result, int userId, CancellationToken ct);
        Task<List<QuestionDTO>> BuildGuestTestResultAsync(Models.Quiz quiz, List<TestAnswerRequest> userAnswers, CancellationToken ct);
    }
}
