using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
            //// Get all the answers the user chooses
            //var selectedIds = result.ListAnswers.Select(a => a.AnswerId).ToList();

            //// Get the corresponding correct answer list at once
            //var correctIds = await _context.QuizAnswers
            //    .Where(a => selectedIds.Contains(a.AnswerId) && a.IsCorrect)
            //    .Select(a => a.AnswerId)
            //    .ToListAsync(ct);

            //return correctIds.Count; // each correct quizanswer +1



            // All selected awner IDs froms sumitted result
            var selectedAnswerIds = result.ListAnswers.Select(a => a.AnswerId).ToList();

            // create list map of Quiestion and Slected Answer
            var selectedMeta = await _context.QuizAnswers
                .AsNoTracking()
                .Where(a => selectedAnswerIds.Contains(a.AnswerId))
                .Select(a => new { a.AnswerId, a.QuestionId })
                .ToListAsync(ct);

            // create dictionary QuestionId -> list of AsnswerIds
            var selectedByQuestion = selectedMeta
                .GroupBy(x => x.QuestionId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.AnswerId).ToHashSet()
                );
            var questionIds = selectedByQuestion.Keys.ToList();

            // get list correct answersid to list of object {questionId, answerId}
            var correctPairs = await _context.QuizAnswers
                .AsNoTracking()
                .Where(a => questionIds.Contains(a.QuestionId) && a.IsCorrect)
                .Select(a => new { a.QuestionId, a.AnswerId })
                .ToListAsync();

            // distionary key: questionId, value: list of correct answerIds
            var correctByQuestion = correctPairs
                .GroupBy(x => x.QuestionId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.AnswerId).ToHashSet()
                );

            // way to calculate score
            // + 1 for each question where that set answer (selectedByQuestion) is the same with set answer (correctByQuestion) 
            int score = 0;
            foreach (var (questionId, selectedSet) in selectedByQuestion)
            {
                if (!correctByQuestion.TryGetValue(questionId, out var correctSet))
                {
                    continue; // skip if no questionId found in correctByQuestion set
                }
                if (selectedSet.SetEquals(correctSet))
                                {
                    score ++;
                }
            }
            return score;
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

        public async Task<List<QuestionDTO>> BuildGuestTestResultAsync(Quiz quiz, List<TestAnswerRequest> userAnswers, CancellationToken ct)
        {
            var questions = await _context.QuizQuestions
                .Where(q => q.Quizzes.Any(qz => qz.QuizId == quiz.QuizId))
                .Include(q => q.QuizAnswers)
                .ToListAsync(ct);
            var result = new List<QuestionDTO>();

            foreach (var question in questions)
            {
                var userAnswer = userAnswers.FirstOrDefault(a =>
                    question.QuizAnswers.Any(qa => qa.AnswerId == a.AnswerId)
                );

                var correctAnswer = question.QuizAnswers.FirstOrDefault(a => a.IsCorrect);

                QuestionStatus status = QuestionStatus.NOTFINISH;
                int? selectedAnswerId = null;

                if (userAnswer != null)
                {
                    selectedAnswerId = userAnswer.AnswerId;
                    status = userAnswer.AnswerId == correctAnswer?.AnswerId
                        ? QuestionStatus.TRUE
                        : QuestionStatus.FALSE;
                }

                var questionDTO = new QuestionDTO
                {
                    Id = question.QuestionId,
                    Content = question.Content,
                    Image = question.Image,
                    Status = status,
                    AnswerId = selectedAnswerId,
                    Answers = question.QuizAnswers.Select(a => new AnswerDTO
                    {
                        Id = a.AnswerId,
                        Content = a.Content,
                        IsCorrect = a.IsCorrect
                    }).ToList()
                };

                result.Add(questionDTO);
            }

            return result;
        }
    }
}
