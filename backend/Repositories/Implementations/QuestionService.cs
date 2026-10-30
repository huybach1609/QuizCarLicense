using QuizCarLicense.DTOs;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.DTOs.Pagination;
using Microsoft.Extensions.Caching.Memory;

namespace QuizCarLicense.Repositories.Implementations
{
    public sealed class QuestionService : IQuestionService
    {
        private readonly QuizCarLicenseContext _db;
        private readonly IMemoryCache _cache;
        private readonly string _webRoot;

        public QuestionService(QuizCarLicenseContext db, IMemoryCache cache, IWebHostEnvironment env)
        {
            _db = db;
            _cache = cache;
            _webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        public QuizQuestionInputModel BuildEmptyInput(int answersCount = 4)
        {
            var input = new QuizQuestionInputModel();
            for (int i = 0; i < answersCount; i++)
                input.QuizAnswers.Add(new QuizAnswerInputModel());
            return input;
        }

        public async Task<PagedResult<QuizQuestion>> GetPagedAsync(int pageNumber, int pageSize, string? search = null, CancellationToken ct = default)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _db.QuizQuestions
                           .Include(q => q.QuizAnswers)
                           .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim().TrimStart('#');
                if (int.TryParse(trimmed, out var qId))
                {
                    query = query.Where(q => q.QuestionId == qId);
                }
                else
                {
                    query = query.Where(q => EF.Functions.ILike(q.Content, $"%{search.Trim()}%"));
                }
            }

            query = query.OrderBy(q => q.QuestionId);

            var total = await query.CountAsync(ct);
            var data = await query.Skip((pageNumber - 1) * pageSize)
                                  .Take(pageSize)
                                  .ToListAsync(ct);

            return new PagedResult<QuizQuestion>
            {
                Data = data,
                TotalCount = total,
                PageSize = pageSize,
                CurrentPage = pageNumber
            };
        }

        public Task<QuizQuestion?> GetWithAnswersAsync(int id, CancellationToken ct = default)
        {
            return _db.QuizQuestions
                      .Include(q => q.QuizAnswers)
                      .FirstOrDefaultAsync(q => q.QuestionId == id, ct);
        }

        public async Task<QuizQuestion> CreateAsync(QuizQuestionInputModel input, CancellationToken ct = default)
        {
            var entity = new QuizQuestion
            {
                Content = input.Content,
                Score = input.Score,
                CategoryId = input.CategoryId,
                IsCritical = input.IsCritical,
                Explanation = input.Explanation,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Active = true,
                QuizAnswers = input.QuizAnswers.Select(a => new QuizAnswer
                {
                    Content = a.Content ?? "none",
                    IsCorrect = a.IsCorrect
                }).ToList()
            };

            _db.QuizQuestions.Add(entity);
            await _db.SaveChangesAsync(ct);

            if (input.ImageFile != null && input.ImageFile.Length > 0)
            {
                var imgRelPath = await SaveImageAsync(entity.QuestionId, input.ImageFile, ct);
                entity.Image = imgRelPath;
                await _db.SaveChangesAsync(ct);
            }

            InvalidateQuestionCaches();
            return entity;
        }

        public async Task UpdateAsync(QuizQuestionInputModel input, CancellationToken ct = default)
        {
            var entity = await _db.QuizQuestions
                                  .Include(q => q.QuizAnswers)
                                  .FirstOrDefaultAsync(q => q.QuestionId == input.QuestionId, ct);

            if (entity == null) return;

            entity.Content = input.Content;
            entity.Score = input.Score;
            entity.CategoryId = input.CategoryId;
            entity.IsCritical = input.IsCritical;
            entity.Explanation = input.Explanation;
            entity.UpdatedAt = DateTime.UtcNow;

            foreach (var ans in input.QuizAnswers)
            {
                var exist = entity.QuizAnswers.FirstOrDefault(x => x.AnswerId == ans.AnswerId);
                if (exist != null)
                {
                    exist.Content = ans.Content ?? "none";
                    exist.IsCorrect = ans.IsCorrect;
                }
                else
                {
                    entity.QuizAnswers.Add(new QuizAnswer
                    {
                        Content = ans.Content ?? "none",
                        IsCorrect = ans.IsCorrect
                    });
                }
            }

            if (input.ImageFile != null && input.ImageFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(entity.Image))
                    DeleteImage(entity.Image);

                var imgRelPath = await SaveImageAsync(entity.QuestionId, input.ImageFile, ct);
                entity.Image = imgRelPath;
            }

            await _db.SaveChangesAsync(ct);
            InvalidateQuestionCaches();
        }

        public async Task<string?> UpdateImageAsync(int questionId, IFormFile file, CancellationToken ct = default)
        {
            var entity = await _db.QuizQuestions.FirstOrDefaultAsync(q => q.QuestionId == questionId, ct);
            if (entity == null) return null;

            if (!string.IsNullOrEmpty(entity.Image))
                DeleteImage(entity.Image);

            var imgRelPath = await SaveImageAsync(questionId, file, ct);
            entity.Image = imgRelPath;
            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            InvalidateQuestionCaches();
            return imgRelPath;
        }

        public async Task DeleteAsync(int id, CancellationToken ct = default)
        {
            var entity = await _db.QuizQuestions.FirstOrDefaultAsync(q => q.QuestionId == id, ct);
            if (entity == null) return;

            if (!string.IsNullOrEmpty(entity.Image))
                DeleteImage(entity.Image);

            _db.QuizQuestions.Remove(entity);
            await _db.SaveChangesAsync(ct);
            InvalidateQuestionCaches();
        }

        private async Task<string> SaveImageAsync(int questionId, IFormFile file, CancellationToken ct)
        {
            var ext = Path.GetExtension(file.FileName);
            var fileName = $"question-{questionId}{ext}";
            var relDir = "Image";
            var relPath = $"/{relDir}/{fileName}";
            var absDir = Path.Combine(_webRoot, relDir);
            var absPath = Path.Combine(absDir, fileName);

            if (!Directory.Exists(absDir))
                Directory.CreateDirectory(absDir);

            using (var fs = new FileStream(absPath, FileMode.Create))
                await file.CopyToAsync(fs, ct);

            return relPath.Replace('\\', '/');
        }

        private void DeleteImage(string relativePath)
        {
            var trimmed = relativePath.TrimStart('/', '\\');
            var abs = Path.Combine(_webRoot, trimmed);
            if (File.Exists(abs))
                File.Delete(abs);
        }

        private void InvalidateQuestionCaches()
        {
            _cache.Remove("quizzes:all");
            _cache.Remove("quizzes:public_summaries");
        }
    }
}
