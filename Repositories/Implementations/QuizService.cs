using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public class QuizService : IQuizService
    {
        private QuizCarLicenseContext _context;

        public QuizService(QuizCarLicenseContext context)
        {
            _context = context;
        }

        public async Task<List<Quiz>> GetAllAsync(CancellationToken ct = default)
        {
            return await _context.Quizzes
                .Include(q=> q.User)
                .Where(q => q.User.Role == UserRole.Admin.ToString())
                .AsNoTracking()
                .OrderByDescending(q => q.UpdatedAt)
                .ToListAsync(ct);
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
            quiz.QuizId = new();                       // ensure new
            quiz.UserId = userId;
            quiz.CreatedAt = DateTime.UtcNow;
            quiz.UpdatedAt = DateTime.UtcNow;

            _context.Quizzes.Add(quiz);
            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> UpdateAsync(Quiz input, int userId, CancellationToken ct = default)
        {
            var quizDb = await _context.Quizzes.FirstOrDefaultAsync(q => q.QuizId == input.QuizId, ct);
            if (quizDb == null) return false;

            quizDb.Title = input.Title;
            quizDb.Detail = input.Detail;
            quizDb.UserId = userId;               // keep owner updated if that’s intended
            quizDb.UpdatedAt = DateTime.UtcNow;   // do NOT touch CreatedAt

            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            var quizDb = await _context.Quizzes.FirstOrDefaultAsync(x => x.QuizId == id, ct);
            if (quizDb == null) return false;

            _context.Quizzes.Remove(quizDb);
            await _context.SaveChangesAsync(ct);
            return true;
        }

        //public async Task<Quiz> GetQuizzes(int QuizId)
        //{
        //    var quiz = await _context.Quizzes.Include(q => q.Questions)
        //        .FirstOrDefaultAsync(q => q.QuizId == QuizId);
        //    return quiz;
        //}
        //public async Task<bool> InsertQuiz(Models.Quiz quizDb, int userId)
        //{
        //    //Models.Quiz quizDb = QuizInput;
        //    quizDb.QuizId = new();
        //    quizDb.CreatedAt = DateTime.Now;
        //    quizDb.UpdatedAt = DateTime.Now;
        //    quizDb.UserId = userId;
        //    _context.Quizzes.Add(quizDb);
        //    await _context.SaveChangesAsync();
        //    return true;
        //}

        //public async Task<bool> DeleteQuiz(int id)
        //{
        //    var quizDb = _context.Quizzes.FirstOrDefault(x => x.QuizId == id);
        //    if (quizDb == null) { return false; }
        //    _context.Quizzes.Remove(quizDb);
        //    var result = await _context.SaveChangesAsync();

        //    Console.WriteLine(result);
        //    return true;
        //}

        //public async Task<bool> UpdateQuiz(Models.Quiz quizInput, int userId)
        //{
        //    Models.Quiz? quizDb = _context.Quizzes.FirstOrDefault(q => q.QuizId == quizInput.QuizId);
        //    if (quizDb == null) return false;
        //    quizDb.Title = quizInput.Title;
        //    quizDb.Detail = quizInput.Detail;
        //    quizDb.CreatedAt = DateTime.Now;
        //    quizDb.UpdatedAt = DateTime.Now;
        //    quizDb.UserId = userId;
        //    await _context.SaveChangesAsync();
        //    return true;
        //}


    }
}
