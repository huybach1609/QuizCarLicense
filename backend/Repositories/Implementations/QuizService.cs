using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public sealed class QuizService : IQuizService
    {
        private readonly QuizCarLicenseContext _context;
        private readonly IMemoryCache _cache;
        private const string CacheKeyAllQuizzes = "quizzes:all";
        private const string CacheKeyPublicSummaries = "quizzes:public_summaries";

        public QuizService(QuizCarLicenseContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<List<Quiz>> GetAllAsync(CancellationToken ct = default)
        {
            if (_cache.TryGetValue(CacheKeyAllQuizzes, out List<Quiz>? cached) && cached != null)
            {
                return cached;
            }

            var list = await _context.Quizzes
                .Include(q => q.User)
                .Where(q => q.UserId == null || (q.User != null && q.User.Role == UserRole.Admin.ToString()))
                .AsNoTracking()
                .OrderByDescending(q => q.UpdatedAt)
                .ToListAsync(ct);

            _cache.Set(CacheKeyAllQuizzes, list, TimeSpan.FromMinutes(15));
            return list;
        }

        public async Task<IReadOnlyList<QuizSummaryResponse>> GetPublicQuizSummariesAsync(CancellationToken ct = default)
        {
            if (_cache.TryGetValue(CacheKeyPublicSummaries, out IReadOnlyList<QuizSummaryResponse>? cached) && cached != null)
            {
                return cached;
            }

            var rawList = await _context.Quizzes
                .AsNoTracking()
                .Include(q => q.Questions)
                .Include(q => q.LicenseClass)
                .Where(q => q.UserId == null || (q.User != null && q.User.Role == UserRole.Admin.ToString()))
                .OrderBy(q => q.LicenseClass != null ? q.LicenseClass.DisplayOrder : 99)
                .ThenBy(q => q.ExamNumber ?? 99)
                .ThenByDescending(q => q.UpdatedAt)
                .ToListAsync(ct);

            // Lấy danh sách ID các chương hợp lệ trong danh mục CSDL
            var validCatIds = (await _context.QuestionCategories
                .Select(c => c.CategoryId)
                .ToListAsync(ct)).ToHashSet();

            // Loại bỏ các bộ đề ChapterPractice mồ côi (CategoryId null hoặc không thuộc danh mục) và trùng lặp
            var seenChapterCats = new HashSet<int>();
            var filteredList = new List<Quiz>();
            foreach (var q in rawList)
            {
                if (q.QuizType == QuizTypes.ChapterPractice)
                {
                    if (!q.CategoryId.HasValue || !validCatIds.Contains(q.CategoryId.Value))
                        continue;
                    if (!seenChapterCats.Add(q.CategoryId.Value))
                        continue;
                }
                filteredList.Add(q);
            }

            var list = filteredList
                .Select(q => new QuizSummaryResponse(
                    q.QuizId,
                    q.Title,
                    q.Detail ?? string.Empty,
                    q.QuizType == QuizTypes.RandomTemplate && q.LicenseClass != null
                        ? q.LicenseClass.TotalQuestions
                        : q.Questions.Count,
                    q.UpdatedAt.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(q.UpdatedAt.Value, DateTimeKind.Utc)) : null,
                    q.LicenseClass != null ? q.LicenseClass.Code : null,
                    q.LicenseClass != null ? q.LicenseClass.Name : null,
                    q.QuizType,
                    q.ExamNumber,
                    q.DurationMinutes,
                    q.PassScore,
                    q.QuizType == QuizTypes.ChapterPractice
                        || q.QuizType == QuizTypes.CriticalPractice
                        || q.QuizType == QuizTypes.FrequentMistakes))
                .ToList();

            _cache.Set(CacheKeyPublicSummaries, list, TimeSpan.FromMinutes(15));
            return list;
        }

        public async Task<IReadOnlyDictionary<string, PracticeLicenseSummaryResponse>> GetPracticeMatrixAsync(CancellationToken ct = default)
        {
            const string cacheKey = "practice:matrix:cache";
            if (_cache.TryGetValue(cacheKey, out IReadOnlyDictionary<string, PracticeLicenseSummaryResponse>? cached) && cached != null)
            {
                return cached;
            }

            var licenses = await _context.LicenseClasses
                .AsNoTracking()
                .Where(l => l.Active)
                .Include(l => l.AllowedQuestions)
                .OrderBy(l => l.DisplayOrder)
                .ToListAsync(ct);

            var practiceQuizzes = await _context.Quizzes
                .AsNoTracking()
                .Include(q => q.Category)
                .Include(q => q.Questions)
                .Where(q => q.QuizType == QuizTypes.CriticalPractice
                         || q.QuizType == QuizTypes.FrequentMistakes
                         || q.QuizType == QuizTypes.ChapterPractice)
                .ToListAsync(ct);

            var criticalQuiz = practiceQuizzes.FirstOrDefault(q => q.QuizType == QuizTypes.CriticalPractice);
            var frequentMistakesQuiz = practiceQuizzes.FirstOrDefault(q => q.QuizType == QuizTypes.FrequentMistakes);
            var chapterQuizzes = practiceQuizzes
                .Where(q => q.QuizType == QuizTypes.ChapterPractice && q.CategoryId.HasValue && q.Category != null)
                .GroupBy(q => q.CategoryId!.Value)
                .Select(g => g.First())
                .OrderBy(q => q.Category != null ? q.Category.DisplayOrder : q.ExamNumber ?? 99)
                .ToList();

            var result = new Dictionary<string, PracticeLicenseSummaryResponse>(StringComparer.OrdinalIgnoreCase);

            foreach (var lic in licenses)
            {
                var allowedIds = lic.AllowedQuestions.Select(q => q.QuestionId).ToHashSet();
                bool hasRestrictedSet = allowedIds.Count > 0;

                int critCount = criticalQuiz == null ? 0 :
                    hasRestrictedSet ? criticalQuiz.Questions.Count(q => allowedIds.Contains(q.QuestionId)) : criticalQuiz.Questions.Count;

                int freqCount = frequentMistakesQuiz == null ? 0 :
                    hasRestrictedSet ? frequentMistakesQuiz.Questions.Count(q => allowedIds.Contains(q.QuestionId)) : frequentMistakesQuiz.Questions.Count;

                var chapters = new List<PracticeChapterSummaryResponse>(chapterQuizzes.Count);
                int totalAllowed = hasRestrictedSet ? allowedIds.Count : (criticalQuiz?.Questions.Count ?? 600);

                foreach (var ch in chapterQuizzes)
                {
                    int chCount = hasRestrictedSet
                        ? ch.Questions.Count(q => allowedIds.Contains(q.QuestionId))
                        : ch.Questions.Count;

                    chapters.Add(new PracticeChapterSummaryResponse(
                        QuizId: ch.QuizId,
                        ExamNumber: ch.ExamNumber ?? 0,
                        CategoryCode: ch.Category?.Code ?? $"CH{ch.ExamNumber}",
                        Title: ch.Title,
                        Detail: ch.Detail ?? string.Empty,
                        TotalQuestions: chCount,
                        IsApplicable: chCount > 0
                    ));
                }

                result[lic.Code] = new PracticeLicenseSummaryResponse(
                    LicenseCode: lic.Code,
                    LicenseName: lic.Name,
                    TotalQuestions: totalAllowed,
                    CriticalQuizId: criticalQuiz?.QuizId ?? 0,
                    CriticalCount: critCount,
                    FrequentMistakesQuizId: frequentMistakesQuiz?.QuizId ?? 0,
                    FrequentMistakesCount: freqCount,
                    Chapters: chapters
                );
            }

            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
            return result;
        }

        public async Task<PracticeLicenseSummaryResponse?> GetPracticeSummaryByLicenseAsync(string licenseCode, CancellationToken ct = default)
        {
            var matrix = await GetPracticeMatrixAsync(ct);
            var normalized = licenseCode.Trim().ToUpperInvariant();
            return matrix.TryGetValue(normalized, out var summary) ? summary : null;
        }

        public async Task<List<Quiz>> GetByUserAsync(int userId, CancellationToken ct = default)
        {
            return await _context.Quizzes
                .AsNoTracking()
                .Where(q => q.UserId == userId)
                .OrderByDescending(q => q.UpdatedAt)
                .ToListAsync(ct);
        }

        public async Task<Quiz?> GetByIdAsync(int quizId, CancellationToken ct = default)
        {
            return await _context.Quizzes
                .Include(q => q.Questions)
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.QuizId == quizId, ct);
        }

        public async Task<bool> InsertAsync(Quiz quiz, int userId, CancellationToken ct = default)
        {
            quiz.QuizId = new();
            quiz.UserId = userId;
            quiz.CreatedAt = DateTime.UtcNow;
            quiz.UpdatedAt = DateTime.UtcNow;

            _context.Quizzes.Add(quiz);
            await _context.SaveChangesAsync(ct);
            InvalidateCache(quiz.QuizId);
            return true;
        }

        public async Task<bool> UpdateAsync(Quiz input, int userId, CancellationToken ct = default)
        {
            var quizDb = await _context.Quizzes.FirstOrDefaultAsync(q => q.QuizId == input.QuizId, ct);
            if (quizDb == null) return false;

            quizDb.Title = input.Title;
            quizDb.Detail = input.Detail;
            quizDb.UserId = userId;
            quizDb.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            InvalidateCache(input.QuizId);
            return true;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            var quizDb = await _context.Quizzes.FirstOrDefaultAsync(x => x.QuizId == id, ct);
            if (quizDb == null) return false;

            _context.Quizzes.Remove(quizDb);
            await _context.SaveChangesAsync(ct);
            InvalidateCache(id);
            return true;
        }

        public async Task<List<QuizQuestion>> GetAllQuestionsAsync(CancellationToken ct = default) =>
            await _context.QuizQuestions
                .AsNoTracking()
                .OrderBy(q => q.QuestionId)
                .ToListAsync(ct);

        public async Task<Quiz?> GetWithQuestionsAsync(int quizId, CancellationToken ct = default) =>
            await _context.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.QuizId == quizId, ct);

        public async Task<bool> ReplaceQuestionsAsync(int quizId, IEnumerable<int> questionIds, CancellationToken ct = default)
        {
            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.QuizId == quizId, ct);
            if (quiz is null) return false;

            var selected = await _context.QuizQuestions
                .Where(q => questionIds.Contains(q.QuestionId))
                .ToListAsync(ct);

            quiz.Questions.Clear();
            foreach (var q in selected)
                quiz.Questions.Add(q);

            quiz.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            InvalidateCache(quizId);
            return true;
        }

        private void InvalidateCache(int quizId)
        {
            _cache.Remove(CacheKeyAllQuizzes);
            _cache.Remove(CacheKeyPublicSummaries);
            _cache.Remove("practice:matrix:cache");
            _cache.Remove($"quiz:full:{quizId}");
            _cache.Remove($"quiz:answer_key:{quizId}");
        }
    }
}
