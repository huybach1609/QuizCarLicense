using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public sealed class TestService : ITestService
    {
        private readonly QuizCarLicenseContext _context;
        private readonly IMemoryCache _cache;

        public TestService(QuizCarLicenseContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<Quiz?> GetQuizWithQuestionsAsync(int quizId, CancellationToken ct)
        {
            string cacheKey = $"quiz:full:{quizId}";
            if (_cache.TryGetValue(cacheKey, out Quiz? cachedQuiz) && cachedQuiz != null)
            {
                return cachedQuiz;
            }

            var quiz = await _context.Quizzes
                .AsNoTracking()
                .Include(q => q.User)
                .Include(q => q.Questions)
                    .ThenInclude(q => q.QuizAnswers)
                .FirstOrDefaultAsync(q => q.QuizId == quizId, ct);

            if (quiz != null)
            {
                _cache.Set(cacheKey, quiz, TimeSpan.FromHours(1));
            }

            return quiz;
        }

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

        private record QuizAnswerKeyCache(
            Dictionary<int, int> AnswerToQuestionMap,
            Dictionary<int, HashSet<int>> CorrectAnswersByQuestion);

        private async Task<QuizAnswerKeyCache> GetQuizAnswerKeyAsync(int quizId, CancellationToken ct)
        {
            string cacheKey = $"quiz:answer_key:{quizId}";
            if (_cache.TryGetValue(cacheKey, out QuizAnswerKeyCache? cachedKey) && cachedKey != null)
            {
                return cachedKey;
            }

            var answers = await _context.QuizAnswers
                .AsNoTracking()
                .Where(a => a.QuestionId.HasValue && a.Question != null && a.Question.Quizzes.Any(q => q.QuizId == quizId))
                .Select(a => new { a.AnswerId, QuestionId = a.QuestionId!.Value, a.IsCorrect })
                .ToListAsync(ct);

            var answerToQuestion = answers
                .GroupBy(a => a.AnswerId)
                .ToDictionary(g => g.Key, g => g.First().QuestionId);

            var correctByQuestion = answers
                .Where(a => a.IsCorrect)
                .GroupBy(a => a.QuestionId)
                .ToDictionary(g => g.Key, g => g.Select(a => a.AnswerId).ToHashSet());

            var answerKey = new QuizAnswerKeyCache(answerToQuestion, correctByQuestion);
            _cache.Set(cacheKey, answerKey, TimeSpan.FromHours(2));
            return answerKey;
        }

        public async Task<float> CalculateScoreAsync(TestResutlResponse result, CancellationToken ct)
        {
            var answerKey = await GetQuizAnswerKeyAsync(result.QuizId, ct);

            // Group user selected answers by QuestionId in memory
            var selectedByQuestion = new Dictionary<int, HashSet<int>>();
            foreach (var answer in result.ListAnswers)
            {
                if (answerKey.AnswerToQuestionMap.TryGetValue(answer.AnswerId, out int qId))
                {
                    if (!selectedByQuestion.TryGetValue(qId, out var set))
                    {
                        set = new HashSet<int>();
                        selectedByQuestion[qId] = set;
                    }
                    set.Add(answer.AnswerId);
                }
            }

            int score = 0;
            foreach (var (questionId, selectedSet) in selectedByQuestion)
            {
                if (answerKey.CorrectAnswersByQuestion.TryGetValue(questionId, out var correctSet))
                {
                    if (selectedSet.SetEquals(correctSet))
                    {
                        score++;
                    }
                }
            }

            return score;
        }

        public async Task<Take> SaveResultAsync(float score, TestResutlResponse result, int userId, CancellationToken ct)
        {
            var answerIds = result.ListAnswers.Select(a => a.AnswerId).Distinct().ToList();

            var answers = answerIds
                .Select(id => new TakeAnswer { AnswerId = id })
                .ToList();

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
                .AsNoTracking()
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
