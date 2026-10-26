using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public sealed class TakeService : ITakeService
    {
        private readonly QuizCarLicenseContext _context;

        public TakeService(QuizCarLicenseContext context)
        {
            _context = context;
        }

        public async Task<List<Take>> GetRecentTakesAsync(int userId, int count = 5, CancellationToken ct = default)
        {
            return await _context.Takes.AsNoTracking()
                 .Where(t => t.UserId == userId)
                 .OrderByDescending(t => t.StartedAt)
                 .Include(t => t.Quiz)
                 .ThenInclude(q => q!.Questions)
                 .Take(count)
                 .ToListAsync(ct);
        }

        public async Task<List<TakeHistoryDto>> GetUserTakesAsync(int userId, int? limit = null, CancellationToken ct = default)
        {
            IQueryable<Take> query = _context.Takes.AsNoTracking()
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.StartedAt);

            if (limit.HasValue && limit.Value > 0)
            {
                query = query.Take(limit.Value);
            }

            return await query
                .Select(t => new TakeHistoryDto
                {
                    TakeId = t.TakeId,
                    QuizId = t.QuizId ?? 0,
                    QuizTitle = t.Quiz != null ? t.Quiz.Title : "No Title",
                    TotalQuestions = t.Quiz != null ? t.Quiz.Questions.Count : 0,
                    Score = t.Score,
                    StartedAt = t.StartedAt,
                    FinishedAt = t.FinishedAt
                })
                .ToListAsync(ct);
        }

        public async Task<PagedResponse<TakeHistoryItemResponse>> GetUserTakesPagedAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var baseQuery = _context.Takes.AsNoTracking()
                .Where(t => t.UserId == userId);

            var totalCount = await baseQuery.CountAsync(ct);

            var items = await baseQuery
                .OrderByDescending(t => t.StartedAt)
                .ThenByDescending(t => t.TakeId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TakeHistoryItemResponse(
                    t.TakeId,
                    t.QuizId ?? 0,
                    t.Quiz != null ? t.Quiz.Title : "No Title",
                    t.Score,
                    t.Quiz != null ? t.Quiz.Questions.Count : 0,
                    new DateTimeOffset(DateTime.SpecifyKind(t.StartedAt, DateTimeKind.Utc)),
                    t.FinishedAt.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(t.FinishedAt.Value, DateTimeKind.Utc)) : null))
                .ToListAsync(ct);

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            return new PagedResponse<TakeHistoryItemResponse>(items, totalCount, pageNumber, pageSize, totalPages);
        }

        public async Task<bool> CheckTakeAsync(int takeId, CancellationToken ct)
            => await _context.Takes.AsNoTracking()
                .AnyAsync(t => t.TakeId == takeId, ct);

        public async Task<Take?> GetTakeWithAnswersAsync(int takeId, CancellationToken ct)
        {
            return await _context.Takes
                .AsNoTracking()
                .Include(t => t.Quiz)
                    .ThenInclude(q => q!.User)
                .Include(t => t.TakeAnswers)
                    .ThenInclude(ta => ta.Answer)
                .FirstOrDefaultAsync(t => t.TakeId == takeId, ct);
        }

        public async Task<List<QuestionDTO>> BuildTestQuestionsAsync(Take take, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            if (!take.QuizId.HasValue)
            {
                return new List<QuestionDTO>();
            }

            // Tải danh sách tất cả câu hỏi của đề thi kèm đáp án (Tránh cycle Include)
            var quizQuestions = await _context.QuizQuestions
                .AsNoTracking()
                .Where(q => q.Quizzes.Any(qz => qz.QuizId == take.QuizId.Value))
                .Include(q => q.QuizAnswers)
                .OrderBy(q => q.QuestionId)
                .ToListAsync(ct);

            // Tập hợp ID các đáp án đã chọn trong lượt thi này
            var selectedAnswerIds = take.TakeAnswers
                .Where(ta => ta.AnswerId.HasValue)
                .Select(ta => ta.AnswerId!.Value)
                .ToHashSet();

            var result = new List<QuestionDTO>(quizQuestions.Count);

            foreach (var question in quizQuestions)
            {
                // Tìm xem trong câu này, đáp án nào được chọn
                var selectedAnswer = question.QuizAnswers.FirstOrDefault(qa => selectedAnswerIds.Contains(qa.AnswerId));
                var correctAnswer = question.QuizAnswers.FirstOrDefault(qa => qa.IsCorrect);

                QuestionStatus status = QuestionStatus.NOTFINISH;
                int? answerId = null;

                if (selectedAnswer != null)
                {
                    answerId = selectedAnswer.AnswerId;
                    status = selectedAnswer.IsCorrect ? QuestionStatus.TRUE : QuestionStatus.FALSE;
                }

                result.Add(new QuestionDTO
                {
                    Id = question.QuestionId,
                    Content = question.Content,
                    Image = question.Image,
                    Status = status,
                    AnswerId = answerId,
                    Answers = question.QuizAnswers.Select(qa => new AnswerDTO
                    {
                        Id = qa.AnswerId,
                        Content = qa.Content,
                        IsCorrect = qa.IsCorrect
                    }).ToList()
                });
            }

            return result;
        }

        public async Task<bool> DeleteTakeAsync(int takeId, CancellationToken ct)
        {
            var take = await _context.Takes.FirstOrDefaultAsync(t => t.TakeId == takeId, ct);
            if (take == null) return false;

            _context.Takes.Remove(take);
            return await _context.SaveChangesAsync(ct) > 0;
        }
    }
}
