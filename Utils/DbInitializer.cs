using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.Models;

namespace QuizCarLicense.Utils;

public static class DbInitializer
{
    public static async Task SeedAsync(QuizCarLicenseContext context)
    {
        // 0. Đảm bảo toàn bộ bảng trong database đã được tạo qua Migrations
        await context.Database.MigrateAsync();

        // 1. Nạp danh sách câu hỏi nếu database chưa có
        if (!await context.QuizQuestions.AnyAsync())
        {
            string[] candidatePaths = [
                Path.Combine(Directory.GetCurrentDirectory(), "Demo", "questions.json"),
                Path.Combine(AppContext.BaseDirectory, "Demo", "questions.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "Data", "questions.json"),
                Path.Combine(AppContext.BaseDirectory, "Data", "questions.json")
            ];

            var jsonPath = candidatePaths.FirstOrDefault(File.Exists);

            if (!string.IsNullOrEmpty(jsonPath))
            {
                var json = await File.ReadAllTextAsync(jsonPath);
                var seedData = JsonSerializer.Deserialize<List<SeedQuestionDto>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (seedData != null)
                {
                    foreach (var item in seedData)
                    {
                        var question = new QuizQuestion
                        {
                            Content = item.Content,
                            Score = item.Score,
                            Active = item.Active,
                            Image = item.Image,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                            QuizAnswers = item.Answers.Select(a => new QuizAnswer
                            {
                                Content = a.Content,
                                IsCorrect = a.IsCorrect
                            }).ToList()
                        };

                        context.QuizQuestions.Add(question);
                    }

                    await context.SaveChangesAsync();
                }
            }
        }

        // 2. Lấy tài khoản Admin (nếu đã được tạo) để làm chủ sở hữu bộ đề mặc định
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin.ToString());

        // 3. Khởi tạo bộ đề 1: "Ôn tập câu điểm liệt" (gồm 60 câu điểm liệt chính thức)
        if (!await context.Quizzes.AnyAsync(q => q.Title == "Ôn tập câu điểm liệt"))
        {
            int[] diemLietIds = [
                19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
                30, 32, 34, 35, 47, 48, 52, 53, 55, 58,
                63, 64, 65, 66, 67, 68, 70, 71, 72, 73, 74,
                85, 86, 87, 88, 89, 90, 91, 92, 93, 97, 98,
                102, 117, 163, 165, 167, 197, 198, 206, 215,
                226, 234, 245, 246, 252, 253, 254, 255, 260
            ];

            var questions = await context.QuizQuestions
                .Where(q => diemLietIds.Contains(q.QuestionId))
                .ToListAsync();

            var quizDiemLiet = new Quiz
            {
                Title = "Ôn tập câu điểm liệt",
                Detail = "Tổng hợp 60 câu hỏi điểm liệt (tình huống mất an toàn giao thông nghiêm trọng). Sai 1 câu sẽ bị đánh giá không đạt.",
                UserId = adminUser?.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Questions = questions
            };

            context.Quizzes.Add(quizDiemLiet);
            await context.SaveChangesAsync();
        }

        // 4. Khởi tạo bộ đề 2: "Câu hỏi bị sai nhiều" (50 câu trắc nghiệm hay nhầm lẫn nhất)
        if (!await context.Quizzes.AnyAsync(q => q.Title == "Câu hỏi bị sai nhiều"))
        {
            int[] saiNhieuIds = [
                1, 2, 3, 4, 5, 8, 9, 10, 11, 14, 15, 16, 36, 37, 40,
                105, 106, 110, 115, 120, 125, 130, 135, 140, 145, 150,
                301, 302, 303, 304, 305, 306, 310, 312, 315, 320, 325,
                486, 487, 488, 489, 490, 506, 507, 508, 509, 510, 520, 530, 540
            ];

            var questions = await context.QuizQuestions
                .Where(q => saiNhieuIds.Contains(q.QuestionId))
                .ToListAsync();

            var quizSaiNhieu = new Quiz
            {
                Title = "Câu hỏi bị sai nhiều",
                Detail = "Tổng hợp 50 câu hỏi lý thuyết, biển báo và sa hình thường xuyên bị trả lời sai nhiều nhất.",
                UserId = adminUser?.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Questions = questions
            };

            context.Quizzes.Add(quizSaiNhieu);
            await context.SaveChangesAsync();
        }
    }

    private class SeedQuestionDto
    {
        public string Content { get; set; } = "";
        public int Score { get; set; } = 1;
        public bool Active { get; set; } = true;
        public string? Image { get; set; }
        public List<SeedAnswerDto> Answers { get; set; } = new();
    }

    private class SeedAnswerDto
    {
        public string Content { get; set; } = "";
        public bool IsCorrect { get; set; }
    }
}
