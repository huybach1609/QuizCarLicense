using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.Models;

namespace QuizCarLicense.Utils;

public static class DbInitializer
{
    public static readonly int[] DiemLietIds = [
        19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        30, 32, 34, 35, 47, 48, 52, 53, 55, 58,
        63, 64, 65, 66, 67, 68, 70, 71, 72, 73, 74,
        85, 86, 87, 88, 89, 90, 91, 92, 93, 97, 98,
        102, 117, 163, 165, 167, 197, 198, 206, 215,
        226, 234, 245, 246, 252, 253, 254, 255, 260
    ];

    public static async Task SeedAsync(QuizCarLicenseContext context)
    {
        // 0. Đảm bảo toàn bộ bảng trong database đã được tạo qua Migrations
        await context.Database.MigrateAsync();

        // 1. Nạp danh sách 600 câu hỏi nếu database chưa có
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

        // 2. Khởi tạo 7 Chương kiến thức chuẩn trong bộ 600 câu hỏi
        if (!await context.QuestionCategories.AnyAsync())
        {
            QuestionCategory[] categories = [
                new() { Code = "CH1_RULES", Title = "Chương I: Quy định chung và quy tắc giao thông", Description = "Khái niệm, quy tắc giao thông, tốc độ, khoảng cách an toàn (Câu 1 - 166)", DisplayOrder = 1 },
                new() { Code = "CH2_TRANSPORT", Title = "Chương II: Nghiệp vụ vận tải", Description = "Quy định về kinh doanh vận tải hành khách và hàng hóa bằng ô tô (Câu 167 - 192)", DisplayOrder = 2 },
                new() { Code = "CH3_CULTURE", Title = "Chương III: Văn hóa giao thông, đạo đức & PCCC", Description = "Đạo đức người lái xe, kỹ năng phòng cháy chữa cháy và cứu hộ cứu nạn (Câu 193 - 213)", DisplayOrder = 3 },
                new() { Code = "CH4_TECHNIQUE", Title = "Chương IV: Kỹ thuật lái xe", Description = "Thao tác điều khiển xe an toàn trên các địa hình và thời tiết phức tạp (Câu 214 - 269)", DisplayOrder = 4 },
                new() { Code = "CH5_STRUCTURE", Title = "Chương V: Cấu tạo và sửa chữa", Description = "Cấu tạo cơ bản của xe cơ giới và cách bảo dưỡng, khắc phục sự cố thông thường (Câu 270 - 304)", DisplayOrder = 5 },
                new() { Code = "CH6_SIGNS", Title = "Chương VI: Hệ thống biển báo hiệu đường bộ", Description = "Biển báo cấm, biển nguy hiểm, biển hiệu lệnh, biển chỉ dẫn, biển phụ (Câu 305 - 486)", DisplayOrder = 6 },
                new() { Code = "CH7_SAHINH", Title = "Chương VII: Giải các thế sa hình và tình huống", Description = "Quy tắc nhường đường tại nơi giao nhau và xử lý tình huống giao thông thực tế (Câu 487 - 600)", DisplayOrder = 7 },
            ];

            context.QuestionCategories.AddRange(categories);
            await context.SaveChangesAsync();
        }

        var categoryMap = await context.QuestionCategories.ToDictionaryAsync(c => c.Code, c => c.CategoryId);

        // 3. Phân loại 600 câu hỏi vào 7 Chương & Đánh dấu 60 câu điểm liệt (nếu chưa được gắn)
        var uncategorizedQuestions = await context.QuizQuestions
            .Where(q => q.CategoryId == null)
            .OrderBy(q => q.QuestionId)
            .ToListAsync();

        if (uncategorizedQuestions.Count > 0)
        {
            var criticalSet = DiemLietIds.ToHashSet();

            foreach (var q in uncategorizedQuestions)
            {
                q.IsCritical = criticalSet.Contains(q.QuestionId);
                q.CategoryId = q.QuestionId switch
                {
                    <= 166 => categoryMap["CH1_RULES"],
                    <= 192 => categoryMap["CH2_TRANSPORT"],
                    <= 213 => categoryMap["CH3_CULTURE"],
                    <= 269 => categoryMap["CH4_TECHNIQUE"],
                    <= 304 => categoryMap["CH5_STRUCTURE"],
                    <= 486 => categoryMap["CH6_SIGNS"],
                    _ => categoryMap["CH7_SAHINH"]
                };

                if (string.IsNullOrEmpty(q.Explanation))
                {
                    q.Explanation = q.IsCritical
                        ? "Đây là câu hỏi ĐIỂM LIỆT về tình huống mất an toàn giao thông nghiêm trọng. Bắt buộc phải chọn đáp án đúng để không bị đánh trượt bài thi."
                        : null;
                }
            }

            await context.SaveChangesAsync();
        }

        // 4. Khởi tạo 11 Hạng Giấy Phép Lái Xe (Thông tư 108/2026/TT-BCA)
        if (!await context.LicenseClasses.AnyAsync())
        {
            LicenseClass[] licenses = [
                new() { Code = "A1", Name = "Hạng A1", VehicleGroup = "Motorbike", TotalQuestions = 40, DurationMinutes = 27, PassScore = 36, DisplayOrder = 1, Description = "Xe mô tô hai bánh có dung tích xi-lanh đến 125 cm³ hoặc công suất động cơ điện đến 11 kW." },
                new() { Code = "A", Name = "Hạng A", VehicleGroup = "Motorbike", TotalQuestions = 40, DurationMinutes = 27, PassScore = 36, DisplayOrder = 2, Description = "Xe mô tô hai bánh có dung tích xi-lanh trên 125 cm³ hoặc công suất động cơ điện trên 11 kW và các loại xe hạng A1." },
                new() { Code = "B", Name = "Hạng B", VehicleGroup = "Car", TotalQuestions = 30, DurationMinutes = 20, PassScore = 27, DisplayOrder = 3, Description = "Ô tô chở người đến 08 chỗ (không kể chỗ của người lái xe); xe ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế đến 3.500 kg." },
                new() { Code = "C1", Name = "Hạng C1", VehicleGroup = "Car", TotalQuestions = 35, DurationMinutes = 22, PassScore = 32, DisplayOrder = 4, Description = "Ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế trên 3.500 kg đến 7.500 kg; các loại xe quy định cho giấy phép lái xe hạng B." },
                new() { Code = "C", Name = "Hạng C", VehicleGroup = "Car", TotalQuestions = 40, DurationMinutes = 24, PassScore = 36, DisplayOrder = 5, Description = "Ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế trên 7.500 kg; các loại xe quy định cho giấy phép lái xe hạng B, C1." },
                new() { Code = "D1", Name = "Hạng D1", VehicleGroup = "Car", TotalQuestions = 45, DurationMinutes = 26, PassScore = 41, DisplayOrder = 6, Description = "Ô tô chở người trên 08 chỗ đến 16 chỗ (không kể chỗ của người lái xe); các loại xe quy định cho giấy phép lái xe các hạng B, C1, C." },
                new() { Code = "D2", Name = "Hạng D2", VehicleGroup = "Car", TotalQuestions = 45, DurationMinutes = 26, PassScore = 41, DisplayOrder = 7, Description = "Ô tô chở người (kể cả xe buýt) trên 16 chỗ đến 29 chỗ (không kể chỗ của người lái xe); các loại xe quy định cho hạng B, C1, C, D1." },
                new() { Code = "D", Name = "Hạng D", VehicleGroup = "Car", TotalQuestions = 45, DurationMinutes = 26, PassScore = 41, DisplayOrder = 8, Description = "Ô tô chở người (kể cả xe buýt) trên 29 chỗ; xe ô tô chở người giường nằm; các loại xe quy định cho các hạng B, C1, C, D1, D2." },
                new() { Code = "BE", Name = "Hạng BE", VehicleGroup = "Car", TotalQuestions = 45, DurationMinutes = 26, PassScore = 41, DisplayOrder = 9, Description = "Các loại xe ô tô quy định cho giấy phép lái xe hạng B kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg." },
                new() { Code = "C1E", Name = "Hạng C1E", VehicleGroup = "Car", TotalQuestions = 45, DurationMinutes = 26, PassScore = 41, DisplayOrder = 10, Description = "Các loại xe ô tô quy định cho giấy phép lái xe hạng C1 kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg." },
                new() { Code = "CE", Name = "Hạng CE", VehicleGroup = "Car", TotalQuestions = 45, DurationMinutes = 26, PassScore = 41, DisplayOrder = 11, Description = "Các loại xe ô tô quy định cho giấy phép lái xe hạng C kéo rơ moóc trên 750 kg; xe ô tô đầu kéo kéo sơ mi rơ moóc." }
            ];

            context.LicenseClasses.AddRange(licenses);
            await context.SaveChangesAsync();
        }

        var licenseMap = await context.LicenseClasses.ToDictionaryAsync(l => l.Code, l => l);

        // 5. Khởi tạo Ma trận phân bổ câu hỏi (LicenseExamMatrix) cho 11 hạng
        if (!await context.LicenseExamMatrices.AnyAsync())
        {
            var matrices = new List<LicenseExamMatrix>();

            void AddMatrix(string licenseCode, params (string? catCode, bool isCritical, int count)[] rules)
            {
                if (!licenseMap.TryGetValue(licenseCode, out var lic)) return;
                foreach (var (catCode, isCritical, count) in rules)
                {
                    matrices.Add(new LicenseExamMatrix
                    {
                        LicenseClassId = lic.LicenseClassId,
                        CategoryId = catCode != null && categoryMap.TryGetValue(catCode, out var cId) ? cId : null,
                        IsCriticalPool = isCritical,
                        QuestionCount = count
                    });
                }
            }

            // A1, A: 40 câu (1 điểm liệt, 12 quy tắc, 2 văn hóa, 2 kỹ thuật, 13 biển báo, 10 sa hình)
            foreach (var code in new[] { "A1", "A" })
            {
                AddMatrix(code,
                    (null, true, 1),
                    ("CH1_RULES", false, 12),
                    ("CH3_CULTURE", false, 2),
                    ("CH4_TECHNIQUE", false, 2),
                    ("CH6_SIGNS", false, 13),
                    ("CH7_SAHINH", false, 10));
            }

            // B: 30 câu (1 điểm liệt, 9 quy tắc, 1 văn hóa, 2 kỹ thuật, 1 cấu tạo, 8 biển báo, 8 sa hình)
            AddMatrix("B",
                (null, true, 1),
                ("CH1_RULES", false, 9),
                ("CH3_CULTURE", false, 1),
                ("CH4_TECHNIQUE", false, 2),
                ("CH5_STRUCTURE", false, 1),
                ("CH6_SIGNS", false, 8),
                ("CH7_SAHINH", false, 8));

            // C1: 35 câu (1 điểm liệt, 10 quy tắc, 1 vận tải, 1 văn hóa, 2 kỹ thuật, 1 cấu tạo, 10 biển báo, 9 sa hình)
            AddMatrix("C1",
                (null, true, 1),
                ("CH1_RULES", false, 10),
                ("CH2_TRANSPORT", false, 1),
                ("CH3_CULTURE", false, 1),
                ("CH4_TECHNIQUE", false, 2),
                ("CH5_STRUCTURE", false, 1),
                ("CH6_SIGNS", false, 10),
                ("CH7_SAHINH", false, 9));

            // C: 40 câu (1 điểm liệt, 10 quy tắc, 1 vận tải, 1 văn hóa, 2 kỹ thuật, 1 cấu tạo, 14 biển báo, 10 sa hình)
            AddMatrix("C",
                (null, true, 1),
                ("CH1_RULES", false, 10),
                ("CH2_TRANSPORT", false, 1),
                ("CH3_CULTURE", false, 1),
                ("CH4_TECHNIQUE", false, 2),
                ("CH5_STRUCTURE", false, 1),
                ("CH6_SIGNS", false, 14),
                ("CH7_SAHINH", false, 10));

            // D1, D2, D, BE, C1E, CE: 45 câu (1 điểm liệt, 10 quy tắc, 1 vận tải, 1 văn hóa, 2 kỹ thuật, 1 cấu tạo, 16 biển báo, 13 sa hình)
            foreach (var code in new[] { "D1", "D2", "D", "BE", "C1E", "CE" })
            {
                AddMatrix(code,
                    (null, true, 1),
                    ("CH1_RULES", false, 10),
                    ("CH2_TRANSPORT", false, 1),
                    ("CH3_CULTURE", false, 1),
                    ("CH4_TECHNIQUE", false, 2),
                    ("CH5_STRUCTURE", false, 1),
                    ("CH6_SIGNS", false, 16),
                    ("CH7_SAHINH", false, 13));
            }

            context.LicenseExamMatrices.AddRange(matrices);
            await context.SaveChangesAsync();
        }

        // 6. Lấy tài khoản Admin
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin.ToString());
        var allQuestions = await context.QuizQuestions.OrderBy(q => q.QuestionId).ToListAsync();

        // 7. Chuẩn hóa 2 bộ đề đặc biệt: "Ôn tập 60 câu điểm liệt" & "50 Câu hỏi bị sai nhiều"
        var quizDiemLietExisting = await context.Quizzes.FirstOrDefaultAsync(q => q.Title == "Ôn tập câu điểm liệt");
        if (quizDiemLietExisting == null)
        {
            var criticalQuestions = allQuestions.Where(q => q.IsCritical).ToList();
            context.Quizzes.Add(new Quiz
            {
                Title = "Ôn tập câu điểm liệt",
                Detail = "Tổng hợp 60 câu hỏi điểm liệt (tình huống mất an toàn giao thông nghiêm trọng). Sai 1 câu sẽ bị đánh giá không đạt.",
                QuizType = QuizTypes.CriticalPractice,
                DurationMinutes = 45,
                PassScore = 60,
                UserId = adminUser?.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Questions = criticalQuestions
            });
        }
        else if (quizDiemLietExisting.QuizType != QuizTypes.CriticalPractice)
        {
            quizDiemLietExisting.QuizType = QuizTypes.CriticalPractice;
            quizDiemLietExisting.DurationMinutes = 45;
            quizDiemLietExisting.PassScore = 60;
        }

        var quizSaiNhieuExisting = await context.Quizzes.FirstOrDefaultAsync(q => q.Title == "Câu hỏi bị sai nhiều");
        if (quizSaiNhieuExisting == null)
        {
            int[] saiNhieuIds = [
                1, 2, 3, 4, 5, 8, 9, 10, 11, 14, 15, 16, 36, 37, 40,
                105, 106, 110, 115, 120, 125, 130, 135, 140, 145, 150,
                301, 302, 303, 304, 305, 306, 310, 312, 315, 320, 325,
                486, 487, 488, 489, 490, 506, 507, 508, 509, 510, 520, 530, 540
            ];
            var saiNhieuQuestions = allQuestions.Where(q => saiNhieuIds.Contains(q.QuestionId)).ToList();
            context.Quizzes.Add(new Quiz
            {
                Title = "Câu hỏi bị sai nhiều",
                Detail = "Tổng hợp 50 câu hỏi lý thuyết, biển báo và sa hình thường xuyên bị trả lời sai nhiều nhất.",
                QuizType = QuizTypes.FrequentMistakes,
                DurationMinutes = 40,
                PassScore = 45,
                UserId = adminUser?.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Questions = saiNhieuQuestions
            });
        }
        else if (quizSaiNhieuExisting.QuizType != QuizTypes.FrequentMistakes)
        {
            quizSaiNhieuExisting.QuizType = QuizTypes.FrequentMistakes;
            quizSaiNhieuExisting.DurationMinutes = 40;
            quizSaiNhieuExisting.PassScore = 45;
        }

        // 8. Khởi tạo 7 Bộ đề Ôn tập theo Chương (ChapterPractice)
        if (!await context.Quizzes.AnyAsync(q => q.QuizType == QuizTypes.ChapterPractice))
        {
            var categories = await context.QuestionCategories.OrderBy(c => c.DisplayOrder).ToListAsync();
            foreach (var cat in categories)
            {
                var catQuestions = allQuestions.Where(q => q.CategoryId == cat.CategoryId).ToList();
                context.Quizzes.Add(new Quiz
                {
                    Title = cat.Title,
                    Detail = cat.Description ?? $"Ôn tập toàn bộ {catQuestions.Count} câu hỏi thuộc {cat.Title}.",
                    CategoryId = cat.CategoryId,
                    QuizType = QuizTypes.ChapterPractice,
                    ExamNumber = cat.DisplayOrder,
                    DurationMinutes = 60,
                    PassScore = catQuestions.Count,
                    UserId = adminUser?.UserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Questions = catQuestions
                });
            }
        }

        // 9. Khởi tạo Bộ đề Sát hạch Cố định (Đề số 1..6) & Đề Ngẫu Nhiên cho từng hạng trong 11 Hạng GPLX
        var allMatrices = await context.LicenseExamMatrices.ToListAsync();
        var existingLicenseQuizIds = await context.Quizzes
            .Where(q => q.LicenseClassId != null)
            .Select(q => q.LicenseClassId!.Value)
            .Distinct()
            .ToListAsync();

        var existingLicenseSet = existingLicenseQuizIds.ToHashSet();
        var criticalPool = allQuestions.Where(q => q.IsCritical).ToList();

        foreach (var lic in licenseMap.Values.OrderBy(l => l.DisplayOrder))
        {
            if (existingLicenseSet.Contains(lic.LicenseClassId))
                continue;

            var licMatrices = allMatrices.Where(m => m.LicenseClassId == lic.LicenseClassId).ToList();

            // Tạo 1 đề đại diện cho chế độ Đề Ngẫu Nhiên (RandomTemplate)
            context.Quizzes.Add(new Quiz
            {
                Title = $"Đề thi ngẫu nhiên — {lic.Name}",
                Detail = $"Hệ thống tự động rút {lic.TotalQuestions} câu hỏi theo ma trận chuẩn sát hạch {lic.Name} ({lic.DurationMinutes} phút, đạt {lic.PassScore}/{lic.TotalQuestions} câu).",
                LicenseClassId = lic.LicenseClassId,
                QuizType = QuizTypes.RandomTemplate,
                ExamNumber = 0,
                DurationMinutes = lic.DurationMinutes,
                PassScore = lic.PassScore,
                UserId = adminUser?.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            // Tạo 6 Bộ đề cố định chuẩn (Đề số 1 -> Đề số 6) cho mỗi hạng bằng
            for (int examNo = 1; examNo <= 6; examNo++)
            {
                var examQuestions = BuildDeterministicExamQuestions(licMatrices, allQuestions, criticalPool, examNo, lic.DisplayOrder);

                context.Quizzes.Add(new Quiz
                {
                    Title = $"Đề số {examNo} — {lic.Name}",
                    Detail = $"Bộ đề sát hạch tiêu chuẩn số {examNo} dành cho {lic.Name}: {lic.TotalQuestions} câu hỏi, thời gian {lic.DurationMinutes} phút, điểm đạt {lic.PassScore}/{lic.TotalQuestions}.",
                    LicenseClassId = lic.LicenseClassId,
                    QuizType = QuizTypes.OfficialExam,
                    ExamNumber = examNo,
                    DurationMinutes = lic.DurationMinutes,
                    PassScore = lic.PassScore,
                    UserId = adminUser?.UserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Questions = examQuestions
                });
            }
        }

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Phân bổ câu hỏi cố định cho bộ đề số N theo ma trận để các đề không bị trùng lặp hoàn toàn.
    /// </summary>
    private static List<QuizQuestion> BuildDeterministicExamQuestions(
        List<LicenseExamMatrix> matrices,
        List<QuizQuestion> allQuestions,
        List<QuizQuestion> criticalPool,
        int examNumber,
        int licenseSeed)
    {
        var selected = new List<QuizQuestion>();
        var selectedIds = new HashSet<int>();

        foreach (var rule in matrices)
        {
            List<QuizQuestion> pool;
            if (rule.IsCriticalPool)
            {
                pool = criticalPool;
            }
            else
            {
                pool = allQuestions
                    .Where(q => !q.IsCritical && (rule.CategoryId == null || q.CategoryId == rule.CategoryId))
                    .ToList();
            }

            if (pool.Count == 0) continue;

            int offset = ((examNumber - 1) * rule.QuestionCount + licenseSeed * 3) % pool.Count;
            int added = 0;
            for (int i = 0; i < pool.Count && added < rule.QuestionCount; i++)
            {
                var candidate = pool[(offset + i) % pool.Count];
                if (selectedIds.Add(candidate.QuestionId))
                {
                    selected.Add(candidate);
                    added++;
                }
            }
        }

        return selected.OrderBy(q => q.QuestionId).ToList();
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
