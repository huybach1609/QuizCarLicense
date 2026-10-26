using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Api;
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
                .Include(q => q.LicenseClass)
                .Include(q => q.Category)
                .Include(q => q.Questions)
                    .ThenInclude(q => q.QuizAnswers)
                .FirstOrDefaultAsync(q => q.QuizId == quizId, ct);

            if (quiz != null && quiz.QuizType != QuizTypes.RandomTemplate)
            {
                _cache.Set(cacheKey, quiz, TimeSpan.FromHours(1));
            }

            return quiz;
        }

        private async Task<List<QuizQuestion>> GetAllQuestionsCachedAsync(CancellationToken ct)
        {
            const string cacheKey = "questions:all_active:v1";
            if (_cache.TryGetValue(cacheKey, out List<QuizQuestion>? cached) && cached != null)
            {
                return cached;
            }

            var questions = await _context.QuizQuestions
                .AsNoTracking()
                .Where(q => q.Active)
                .Include(q => q.QuizAnswers)
                .OrderBy(q => q.QuestionId)
                .ToListAsync(ct);

            _cache.Set(cacheKey, questions, TimeSpan.FromHours(1));
            return questions;
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
                    IsCritical = q.IsCritical,
                    Explanation = q.Explanation,
                    Answers = q.QuizAnswers
                        .Select(a => new AnswerDTO { Id = a.AnswerId, Content = a.Content, IsCorrect = a.IsCorrect })
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

        public Task<List<QuestionDTO>> BuildGuestTestResultAsync(Quiz quiz, List<TestAnswerRequest> userAnswers, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            var questions = quiz.Questions.OrderBy(q => q.QuestionId).ToList();
            var result = new List<QuestionDTO>(questions.Count);

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
                    IsCritical = question.IsCritical,
                    Explanation = question.Explanation,
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

            return Task.FromResult(result);
        }

        public async Task<ExamEvaluationResultDto> EvaluateExamAsync(
            Quiz quiz,
            IReadOnlyList<int> selectedAnswerIds,
            IReadOnlyList<int>? customQuestionIds,
            CancellationToken ct)
        {
            List<QuizQuestion> examQuestions;

            if (customQuestionIds is { Count: > 0 })
            {
                var allQuestions = await GetAllQuestionsCachedAsync(ct);
                var questionLookup = allQuestions.ToDictionary(q => q.QuestionId);
                examQuestions = customQuestionIds
                    .Where(questionLookup.ContainsKey)
                    .Select(id => questionLookup[id])
                    .ToList();
            }
            else if (quiz.Questions.Count > 0)
            {
                examQuestions = quiz.Questions.OrderBy(q => q.QuestionId).ToList();
            }
            else
            {
                // Fallback nếu đề ngẫu nhiên không gửi kèm QuestionIds: lấy theo các câu có đáp án được chọn
                var allQuestions = await GetAllQuestionsCachedAsync(ct);
                var selectedSetLookup = selectedAnswerIds.ToHashSet();
                examQuestions = allQuestions
                    .Where(q => q.QuizAnswers.Any(a => selectedSetLookup.Contains(a.AnswerId)))
                    .OrderBy(q => q.QuestionId)
                    .ToList();
            }

            var selectedSet = selectedAnswerIds.ToHashSet();
            var gradedList = new List<GradedQuestionResponse>(examQuestions.Count);
            int score = 0;
            bool hasCriticalError = false;

            foreach (var q in examQuestions)
            {
                var chosenAnswer = q.QuizAnswers.FirstOrDefault(a => selectedSet.Contains(a.AnswerId));
                var correctAnswer = q.QuizAnswers.FirstOrDefault(a => a.IsCorrect);

                QuestionStatus status = QuestionStatus.NOTFINISH;
                int? selectedAnswerId = null;

                if (chosenAnswer != null)
                {
                    selectedAnswerId = chosenAnswer.AnswerId;
                    if (chosenAnswer.AnswerId == correctAnswer?.AnswerId)
                    {
                        status = QuestionStatus.TRUE;
                        score++;
                    }
                    else
                    {
                        status = QuestionStatus.FALSE;
                    }
                }

                // Quy tắc sát hạch: Nếu câu hỏi là Điểm liệt mà thí sinh làm sai hoặc bỏ trống -> Rớt trực tiếp
                if (q.IsCritical && status != QuestionStatus.TRUE)
                {
                    hasCriticalError = true;
                }

                gradedList.Add(new GradedQuestionResponse(
                    Id: q.QuestionId,
                    Content: q.Content,
                    Image: q.Image,
                    Status: status,
                    SelectedAnswerId: selectedAnswerId,
                    Answers: q.QuizAnswers.Select(a => new GradedAnswerOptionResponse(
                        a.AnswerId,
                        a.Content,
                        a.IsCorrect)).ToList(),
                    IsCritical: q.IsCritical,
                    Explanation: q.Explanation));
            }

            int totalQuestions = examQuestions.Count > 0
                ? examQuestions.Count
                : (quiz.LicenseClass?.TotalQuestions ?? 30);

            int passScore = quiz.PassScore > 0
                ? quiz.PassScore
                : (quiz.LicenseClass?.PassScore ?? (int)Math.Ceiling(totalQuestions * 0.9));

            bool isPractice = QuizTypes.IsPractice(quiz.QuizType);
            bool isPassed = isPractice
                ? score >= passScore
                : (score >= passScore && !hasCriticalError);

            return new ExamEvaluationResultDto(
                Score: score,
                TotalQuestions: totalQuestions,
                PassScore: passScore,
                IsPassed: isPassed,
                HasCriticalError: hasCriticalError,
                GradedQuestions: gradedList);
        }

        public async Task<Take> SaveExamTakeAsync(
            Quiz quiz,
            ExamEvaluationResultDto evaluation,
            DateTime startTime,
            IReadOnlyList<int> selectedAnswerIds,
            int userId,
            CancellationToken ct)
        {
            var answers = selectedAnswerIds
                .Distinct()
                .Select(id => new TakeAnswer { AnswerId = id })
                .ToList();

            var take = new Take
            {
                QuizId = quiz.QuizId,
                UserId = userId,
                Score = evaluation.Score,
                TotalQuestions = evaluation.TotalQuestions,
                PassScore = evaluation.PassScore,
                IsPassed = evaluation.IsPassed,
                HasCriticalError = evaluation.HasCriticalError,
                Status = (int)TakeStatus.COMPLETED,
                StartedAt = startTime,
                FinishedAt = DateTime.UtcNow,
                TakeAnswers = answers
            };

            _context.Takes.Add(take);
            await _context.SaveChangesAsync(ct);
            return take;
        }

        public async Task<(Quiz TemplateQuiz, List<QuizQuestion> Questions)?> GenerateRandomExamByLicenseAsync(
            string licenseCode,
            CancellationToken ct)
        {
            var normalizedCode = licenseCode.Trim().ToUpperInvariant();

            var license = await _context.LicenseClasses
                .AsNoTracking()
                .Include(l => l.ExamMatrices)
                .Include(l => l.AllowedQuestions)
                .FirstOrDefaultAsync(l => l.Code == normalizedCode && l.Active, ct);

            if (license == null)
            {
                return null;
            }

            var templateQuiz = await _context.Quizzes
                .AsNoTracking()
                .Include(q => q.LicenseClass)
                .FirstOrDefaultAsync(q => q.LicenseClassId == license.LicenseClassId && q.QuizType == QuizTypes.RandomTemplate, ct)
                ?? await _context.Quizzes
                    .AsNoTracking()
                    .Include(q => q.LicenseClass)
                    .FirstOrDefaultAsync(q => q.LicenseClassId == license.LicenseClassId, ct);

            if (templateQuiz == null)
            {
                return null;
            }

            var allQuestions = await GetAllQuestionsCachedAsync(ct);

            // Nếu hạng bằng đã được cấu hình bộ câu hỏi riêng trong LicenseClass_QuizQuestion thì chỉ rút từ tập đó
            List<QuizQuestion> candidatePool;
            if (license.AllowedQuestions.Count > 0)
            {
                var allowedIds = license.AllowedQuestions.Select(aq => aq.QuestionId).ToHashSet();
                candidatePool = allQuestions.Where(q => allowedIds.Contains(q.QuestionId)).ToList();
            }
            else
            {
                candidatePool = allQuestions;
            }

            var selected = new List<QuizQuestion>(license.TotalQuestions);
            var selectedIds = new HashSet<int>();

            foreach (var matrix in license.ExamMatrices)
            {
                List<QuizQuestion> subPool;
                if (matrix.IsCriticalPool)
                {
                    subPool = candidatePool
                        .Where(q => q.IsCritical && (matrix.CategoryId == null || q.CategoryId == matrix.CategoryId))
                        .ToList();
                }
                else
                {
                    subPool = candidatePool
                        .Where(q => !q.IsCritical && (matrix.CategoryId == null || q.CategoryId == matrix.CategoryId))
                        .ToList();
                }

                if (subPool.Count == 0) continue;

                // Xáo trộn ngẫu nhiên bằng Random.Shared
                var shuffled = subPool.OrderBy(_ => Random.Shared.Next()).ToList();
                int count = 0;
                foreach (var item in shuffled)
                {
                    if (count >= matrix.QuestionCount) break;
                    if (selectedIds.Add(item.QuestionId))
                    {
                        selected.Add(item);
                        count++;
                    }
                }
            }

            // Nếu tổng số câu vẫn chưa đủ TotalQuestions (do cấu hình ma trận tùy chỉnh), bù thêm từ candidatePool
            if (selected.Count < license.TotalQuestions)
            {
                var remaining = candidatePool
                    .Where(q => !q.IsCritical && !selectedIds.Contains(q.QuestionId))
                    .OrderBy(_ => Random.Shared.Next())
                    .Take(license.TotalQuestions - selected.Count);

                selected.AddRange(remaining);
            }

            return (templateQuiz, selected.OrderBy(q => q.QuestionId).ToList());
        }
    }
}
