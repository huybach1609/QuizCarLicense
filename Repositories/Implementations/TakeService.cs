using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public class TakeService : ITakeService
    {
        private readonly QuizCarLicenseContext _context;

        public TakeService(QuizCarLicenseContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves the most recent takes for a given user.
        /// </summary>
        /// <param name="userId">The ID of the user.</param>
        /// <param name="count">The number of takes to retrieve.</param>
        /// <param name="ct">The cancellation token.</param>
        /// <returns>A list of recent takes.</returns>
        public async Task<List<Take>> GetRecentTakesAsync(int userId, int count = 5, CancellationToken ct = default)
        {
            return await _context.Takes.AsNoTracking()
                 .Where(t => t.UserId == userId)
                 .OrderByDescending(t => t.StartedAt)
                 .Include(t => t.Quiz)
                 .ThenInclude(q => q.Questions)
                 .Take(count)
                 .ToListAsync(ct);
        }
        public async Task<bool> CheckTakeAsync(int takeId, CancellationToken ct)
    => await _context.Takes.AsNoTracking()
        .AnyAsync(t => t.TakeId == takeId, ct);

        public async Task<Take?> GetTakeWithAnswersAsync(int takeId, CancellationToken ct)
            => await _context.Takes
                .Include(t => t.Quiz)
                    .ThenInclude(q => q.User)
                .Include(t => t.TakeAnswers)
                    .ThenInclude(ta => ta.Answer)
                        .ThenInclude(a => a.Question)
                .Include(t => t.TakeAnswers)
                    .ThenInclude(ta => ta.Answer!.Question!.QuizAnswers)
                .FirstOrDefaultAsync(t => t.TakeId == takeId, ct);

        public async Task<List<QuestionDTO>> BuildTestQuestionsAsync(Take take, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            var questionDict = new Dictionary<int, QuestionDTO>();

            // answered questions -> QuestionDTO
            foreach (var ta in take.TakeAnswers)
            {
                var q = ta.Answer?.Question;
                if (q == null) continue;

                var qid = q.QuestionId;
                if (!questionDict.ContainsKey(qid))
                {
                    questionDict[qid] = new QuestionDTO
                    {
                        Id = qid,
                        Content = q.Content,
                        Status = (ta.Answer?.IsCorrect ?? false) ? QuestionStatus.TRUE : QuestionStatus.FALSE,
                        AnswerId = ta.AnswerId ?? -1,
                        Answers = q.QuizAnswers
                            .Select(qa => new AnswerDTO
                            {
                                Id = qa.AnswerId,
                                Content = qa.Content,
                                IsCorrect = qa.IsCorrect
                            })
                            .ToList()
                    };
                }
            }

            // unfinished questions (in the quiz but not answered in this take)
            var unfinished = await LoadUnTakenQuestionsAsync(take, ct);
            foreach (var q in unfinished)
            {
                if (!questionDict.ContainsKey(q.QuestionId))
                {
                    questionDict[q.QuestionId] = new QuestionDTO
                    {
                        Id = q.QuestionId,
                        Content = q.Content,
                        Status = QuestionStatus.NOTFINISH,
                        Answers = q.QuizAnswers
                            .Select(qa => new AnswerDTO
                            {
                                Id = qa.AnswerId,
                                Content = qa.Content,
                                IsCorrect = qa.IsCorrect
                            })
                            .ToList()
                    };
                }
            }

            return questionDict.Values.OrderBy(x => x.Id).ToList();
        }

        public async Task<bool> DeleteTakeAsync(int takeId, CancellationToken ct)
        {
            var take = await _context.Takes.FirstOrDefaultAsync(t => t.TakeId == takeId, ct);
            if (take == null) return false;

            _context.Takes.Remove(take);
            return await _context.SaveChangesAsync(ct) > 0;
        }

        private async Task<List<QuizQuestion>> LoadUnTakenQuestionsAsync(Take take, CancellationToken ct)
        {
            // all questions of the quiz
            var quizQuestions = await _context.Quizzes
                .Where(q => q.QuizId == take.QuizId)
                .SelectMany(q => q.Questions)
                .Include(q => q.QuizAnswers)
                .ToListAsync(ct);

            // question ids answered in this take
            var completedQuestionIds = take.TakeAnswers
                .Select(ta => ta.Answer?.QuestionId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToHashSet();

            return quizQuestions
                .Where(q => !completedQuestionIds.Contains(q.QuestionId))
                .ToList();
        }

    }
}
