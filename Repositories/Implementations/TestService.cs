using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public sealed class TestService : ITestService
    {
        private readonly QuizCarLicenseContext _context;
        public TestService(QuizCarLicenseContext context) => _context = context;

        public async Task<Quiz?> GetQuizWithQuestionsAsync(int quizId, CancellationToken ct)
            => await _context.Quizzes
                .Include(q => q.User)
                .Include(q => q.Questions)
                    .ThenInclude(q => q.QuizAnswers)
                .FirstOrDefaultAsync(q => q.QuizId == quizId, ct);

        public Task<List<QuestionDTO>> BuildTestQuestionsAsync(Quiz quiz, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            var list = quiz.Questions
                .Select(q => new QuestionDTO
                {
                    Id = q.QuestionId,
                    Content = q.Content,
                    Image = q.Image ?? "none",
                    Answers = q.QuizAnswers
                        .Select(a => new AnswerDTO { Id = a.AnswerId, Content = a.Content })
                        .ToList()
                })
                .OrderBy(q => q.Id)
                .ToList();

            return Task.FromResult(list);
        }

        public async Task<float> CalculateScoreAsync(TestResutlResponse result, CancellationToken ct)
        {
            // Get all the answers the user chooses
            var selectedIds = result.ListAnswers.Select(a => a.AnswerId).ToList();

            // Get the corresponding correct answer list at once
            var correctIds = await _context.QuizAnswers
                .Where(a => selectedIds.Contains(a.AnswerId) && a.IsCorrect)
                .Select(a => a.AnswerId)
                .ToListAsync(ct);

            return correctIds.Count; // each correct quizanswer +1
        }

        public async Task<Take> SaveResultAsync(float score, TestResutlResponse result, int userId, CancellationToken ct)
        {
            // Map the user submitted AnswerIds to TakeAnswers
            var answerIds = result.ListAnswers.Select(a => a.AnswerId).ToList();

            var answers = await _context.QuizAnswers
                .Where(a => answerIds.Contains(a.AnswerId))
                .Select(a => new TakeAnswer { AnswerId = a.AnswerId })
                .ToListAsync(ct);

            // Keep the StartTime sent by the client
            var take = new Take
            {
                QuizId = result.QuizId,
                UserId = userId,
                Score = (int)score,
                Status = (int)TakeStatus.COMPLETED,
                StartedAt = result.StartTime,
                FinishedAt = DateTime.UtcNow,
                TakeAnswers = answers
            };

            _context.Takes.Add(take);
            await _context.SaveChangesAsync(ct);
            return take;
        }
    }
}
