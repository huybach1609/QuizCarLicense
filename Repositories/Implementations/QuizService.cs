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

            var list = await _context.Quizzes
                .AsNoTracking()
                .Where(q => q.UserId == null || (q.User != null && q.User.Role == UserRole.Admin.ToString()))
                .OrderByDescending(q => q.UpdatedAt)
                .Select(q => new QuizSummaryResponse(
                    q.QuizId,
                    q.Title,
                    q.Detail ?? string.Empty,
                    q.Questions.Count,
                    q.UpdatedAt.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(q.UpdatedAt.Value, DateTimeKind.Utc)) : null))
                .ToListAsync(ct);

            _cache.Set(CacheKeyPublicSummaries, list, TimeSpan.FromMinutes(15));
            return list;
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
            _cache.Remove($"quiz:full:{quizId}");
            _cache.Remove($"quiz:answer_key:{quizId}");
        }
    }
}
