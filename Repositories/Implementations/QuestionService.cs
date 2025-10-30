using QuizCarLicense.DTOs;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.DTOs.Pagination;


namespace QuizCarLicense.Repositories.Implementations
{
    public class QuestionService : IQuestionService
    {
        private readonly QuizCarLicenseContext _db;
        private readonly string _webRoot;

        public QuestionService(QuizCarLicenseContext db, IWebHostEnvironment env)
        {
            _db = db;
            _webRoot = env.WebRootPath; // points to wwwroot
        }

        public QuizQuestionInputModel BuildEmptyInput(int answersCount = 4)
        {
            var input = new QuizQuestionInputModel();
            for (int i = 0; i < answersCount; i++)
                input.QuizAnswers.Add(new QuizAnswerInputModel());
            return input;
        }

        public async Task<PagedResult<QuizQuestion>> GetPagedAsync(int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _db.QuizQuestions
                           .Include(q => q.QuizAnswers)
                           .AsNoTracking()
                           .OrderByDescending(q => q.QuestionId);

            var total = await query.CountAsync();
            var data = await query.Skip((pageNumber - 1) * pageSize)
                                  .Take(pageSize)
                                  .ToListAsync();

            return new PagedResult<QuizQuestion>
            {
                Data = data,
                TotalCount = total,
                PageSize = pageSize,
                CurrentPage = pageNumber
            };
        }

        public Task<QuizQuestion?> GetWithAnswersAsync(int id)
        {
            return _db.QuizQuestions
                      .Include(q => q.QuizAnswers)
                      .FirstOrDefaultAsync(q => q.QuestionId == id);
        }

        public async Task<QuizQuestion> CreateAsync(QuizQuestionInputModel input)
        {
            var entity = new QuizQuestion
            {
                Content = input.Content,
                Score = input.Score,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Active = true,
                QuizAnswers = input.QuizAnswers.Select(a => new QuizAnswer
                {
                    Content = a.Content ?? "none",
                    IsCorrect = a.IsCorrect
                }).ToList()
            };

            _db.QuizQuestions.Add(entity);
            await _db.SaveChangesAsync();

            // image handling
            if (input.ImageFile != null && input.ImageFile.Length > 0)
            {
                var imgRelPath = await SaveImageAsync(entity.QuestionId, input.ImageFile);
                entity.Image = imgRelPath;
                await _db.SaveChangesAsync();
            }

            return entity;
        }

        public async Task UpdateAsync(QuizQuestionInputModel input)
        {
            var entity = await _db.QuizQuestions
                                  .Include(q => q.QuizAnswers)
                                  .FirstOrDefaultAsync(q => q.QuestionId == input.QuestionId);

            if (entity == null) return;

            entity.Content = input.Content;
            entity.Score = input.Score;
            entity.UpdatedAt = DateTime.Now;

            // update or add answers
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

            // replace image if providedh
            if (input.ImageFile != null && input.ImageFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(entity.Image))
                    DeleteImage(entity.Image);

                var imgRelPath = await SaveImageAsync(entity.QuestionId, input.ImageFile);
                entity.Image = imgRelPath;
            }

            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _db.QuizQuestions.FirstOrDefaultAsync(q => q.QuestionId == id);
            if (entity == null) return;

            if (!string.IsNullOrEmpty(entity.Image))
                DeleteImage(entity.Image);

            _db.QuizQuestions.Remove(entity);
            await _db.SaveChangesAsync();
        }

        private async Task<string> SaveImageAsync(int questionId, IFormFile file)
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
                await file.CopyToAsync(fs);

            return relPath.Replace('\\', '/');
        }

        private void DeleteImage(string relativePath)
        {
            var trimmed = relativePath.TrimStart('/', '\\');
            var abs = Path.Combine(_webRoot, trimmed);
            if (File.Exists(abs))
                File.Delete(abs);
        }
    }
}

