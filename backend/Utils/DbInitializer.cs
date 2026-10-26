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

    private static string? FindDemoFile(string filename)
    {
        string[] candidatePaths = [
            Path.Combine(Directory.GetCurrentDirectory(), "Demo", filename),
            Path.Combine(AppContext.BaseDirectory, "Demo", filename),
            Path.Combine(Directory.GetCurrentDirectory(), "backend", "Demo", filename),
            Path.Combine(AppContext.BaseDirectory, "backend", "Demo", filename)
        ];
        return candidatePaths.FirstOrDefault(File.Exists);
    }

    public static async Task SeedAsync(QuizCarLicenseContext context)
    {
        // 0. Đảm bảo toàn bộ bảng trong database đã được tạo qua Migrations
        await context.Database.MigrateAsync();

        var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        // 1. Khởi tạo / Đồng bộ 6 Chương kiến thức chuẩn (Bộ Công an 2025/2026)
        var catFilePath = FindDemoFile("categories.json");
        List<SeedCategoryDto> seedCats = [];
        if (!string.IsNullOrEmpty(catFilePath))
        {
            var catJson = await File.ReadAllTextAsync(catFilePath);
            seedCats = JsonSerializer.Deserialize<List<SeedCategoryDto>>(catJson, jsonOpts) ?? [];
        }

        if (seedCats.Count > 0)
        {
            var existingCats = await context.QuestionCategories.ToListAsync();
            var existingMap = existingCats.ToDictionary(c => c.Code, c => c);

            foreach (var sc in seedCats)
            {
                if (existingMap.TryGetValue(sc.Code, out var existing))
                {
                    existing.Title = sc.Title;
                    existing.Description = sc.Description;
                    existing.DisplayOrder = sc.DisplayOrder;
                }
                else
                {
                    context.QuestionCategories.Add(new QuestionCategory
                    {
                        Code = sc.Code,
                        Title = sc.Title,
                        Description = sc.Description,
                        DisplayOrder = sc.DisplayOrder
                    });
                }
            }

            // Gỡ bỏ các chương thừa không còn trong chuẩn mới (ví dụ CH2_TRANSPORT cũ của bộ 7 chương)
            var newCatCodes = seedCats.Select(c => c.Code).ToHashSet();
            var obsoleteCats = existingCats.Where(c => !newCatCodes.Contains(c.Code)).ToList();
            if (obsoleteCats.Count > 0)
            {
                context.QuestionCategories.RemoveRange(obsoleteCats);
            }

            await context.SaveChangesAsync();
        }

        var categoryMap = await context.QuestionCategories.ToDictionaryAsync(c => c.Code, c => c.CategoryId);

        // 2. Khởi tạo / Đồng bộ 11 Hạng Giấy Phép Lái Xe (Thông tư 108/2026/TT-BCA)
        var licFilePath = FindDemoFile("license_classes.json");
        List<SeedLicenseClassDto> seedLics = [];
        if (!string.IsNullOrEmpty(licFilePath))
        {
            var licJson = await File.ReadAllTextAsync(licFilePath);
            seedLics = JsonSerializer.Deserialize<List<SeedLicenseClassDto>>(licJson, jsonOpts) ?? [];
        }

        if (seedLics.Count > 0)
        {
            var existingLics = await context.LicenseClasses.ToListAsync();
            var existingLicMap = existingLics.ToDictionary(l => l.Code, l => l);

            foreach (var sl in seedLics)
            {
                if (existingLicMap.TryGetValue(sl.Code, out var existing))
                {
                    existing.Name = sl.Name;
                    existing.VehicleGroup = sl.VehicleGroup;
                    existing.TotalQuestions = sl.TotalQuestions;
                    existing.DurationMinutes = sl.DurationMinutes;
                    existing.PassScore = sl.PassScore;
                    existing.DisplayOrder = sl.DisplayOrder;
                    existing.Description = sl.Description;
                }
                else
                {
                    context.LicenseClasses.Add(new LicenseClass
                    {
                        Code = sl.Code,
                        Name = sl.Name,
                        VehicleGroup = sl.VehicleGroup,
                        TotalQuestions = sl.TotalQuestions,
                        DurationMinutes = sl.DurationMinutes,
                        PassScore = sl.PassScore,
                        DisplayOrder = sl.DisplayOrder,
                        Description = sl.Description
                    });
                }
            }

            await context.SaveChangesAsync();
        }

        var licenseMap = await context.LicenseClasses.Include(l => l.AllowedQuestions).ToDictionaryAsync(l => l.Code, l => l);

        // 3. Khởi tạo / Đồng bộ 600 câu hỏi với đầy đủ CategoryId, IsCritical, Explanation, và AllowedQuestions
        var qFilePath = FindDemoFile("questions.json");
        List<SeedQuestionDto> seedQuestions = [];
        if (!string.IsNullOrEmpty(qFilePath))
        {
            var qJson = await File.ReadAllTextAsync(qFilePath);
            seedQuestions = JsonSerializer.Deserialize<List<SeedQuestionDto>>(qJson, jsonOpts) ?? [];
        }

        var existingQuestions = await context.QuizQuestions
            .Include(q => q.QuizAnswers)
            .Include(q => q.AllowedLicenseClasses)
            .OrderBy(q => q.QuestionId)
            .ToListAsync();

        var existingQMap = existingQuestions.ToDictionary(q => q.QuestionId, q => q);

        if (seedQuestions.Count > 0)
        {
            var criticalSet = DiemLietIds.ToHashSet();

            foreach (var sq in seedQuestions)
            {
                int? catId = null;
                if (!string.IsNullOrEmpty(sq.CategoryCode) && categoryMap.TryGetValue(sq.CategoryCode, out var cId))
                {
                    catId = cId;
                }
                else
                {
                    // Fallback theo dải 6 chương
                    catId = sq.QuestionId switch
                    {
                        <= 180 => categoryMap.GetValueOrDefault("CH1_RULES"),
                        <= 205 => categoryMap.GetValueOrDefault("CH2_CULTURE"),
                        <= 263 => categoryMap.GetValueOrDefault("CH3_TECHNIQUE"),
                        <= 300 => categoryMap.GetValueOrDefault("CH4_STRUCTURE"),
                        <= 485 => categoryMap.GetValueOrDefault("CH5_SIGNS"),
                        _ => categoryMap.GetValueOrDefault("CH6_SAHINH")
                    };
                }

                bool isCrit = sq.IsCritical || criticalSet.Contains(sq.QuestionId);

                if (existingQMap.TryGetValue(sq.QuestionId, out var eq))
                {
                    eq.Content = sq.Content;
                    eq.Score = sq.Score;
                    eq.Active = sq.Active;
                    eq.Image = sq.Image;
                    eq.CategoryId = catId;
                    eq.IsCritical = isCrit;
                    if (!string.IsNullOrEmpty(sq.Explanation))
                    {
                        eq.Explanation = sq.Explanation;
                    }

                    // Đồng bộ AllowedLicenseClasses
                    if (sq.ApplicableLicenseClasses != null && sq.ApplicableLicenseClasses.Count > 0)
                    {
                        eq.AllowedLicenseClasses.Clear();
                        foreach (var lCode in sq.ApplicableLicenseClasses)
                        {
                            if (licenseMap.TryGetValue(lCode, out var lic))
                            {
                                eq.AllowedLicenseClasses.Add(lic);
                            }
                        }
                    }
                }
                else
                {
                    var newQ = new QuizQuestion
                    {
                        Content = sq.Content,
                        Score = sq.Score,
                        Active = sq.Active,
                        Image = sq.Image,
                        CategoryId = catId,
                        IsCritical = isCrit,
                        Explanation = sq.Explanation,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        QuizAnswers = sq.Answers.Select(a => new QuizAnswer
                        {
                            Content = a.Content,
                            IsCorrect = a.IsCorrect
                        }).ToList()
                    };

                    if (sq.ApplicableLicenseClasses != null && sq.ApplicableLicenseClasses.Count > 0)
                    {
                        foreach (var lCode in sq.ApplicableLicenseClasses)
                        {
                            if (licenseMap.TryGetValue(lCode, out var lic))
                            {
                                newQ.AllowedLicenseClasses.Add(lic);
                            }
                        }
                    }

                    context.QuizQuestions.Add(newQ);
                }
            }

            await context.SaveChangesAsync();
        }

        // Tải lại allQuestions sau khi lưu
        var allQuestions = await context.QuizQuestions
            .Include(q => q.QuizAnswers)
            .OrderBy(q => q.QuestionId)
            .ToListAsync();

        // 4. Khởi tạo / Đồng bộ Ma trận bốc câu hỏi (LicenseExamMatrix) từ exam_matrices.json
        var matrixFilePath = FindDemoFile("exam_matrices.json");
        List<SeedMatrixDto> seedMatrices = [];
        if (!string.IsNullOrEmpty(matrixFilePath))
        {
            var matJson = await File.ReadAllTextAsync(matrixFilePath);
            seedMatrices = JsonSerializer.Deserialize<List<SeedMatrixDto>>(matJson, jsonOpts) ?? [];
        }

        if (seedMatrices.Count > 0)
        {
            var oldMatrices = await context.LicenseExamMatrices.ToListAsync();
            context.LicenseExamMatrices.RemoveRange(oldMatrices);

            var newMatrices = new List<LicenseExamMatrix>();
            foreach (var sm in seedMatrices)
            {
                if (!licenseMap.TryGetValue(sm.LicenseCode, out var lic)) continue;
                foreach (var rule in sm.Rules)
                {
                    newMatrices.Add(new LicenseExamMatrix
                    {
                        LicenseClassId = lic.LicenseClassId,
                        CategoryId = !string.IsNullOrEmpty(rule.CategoryCode) && categoryMap.TryGetValue(rule.CategoryCode, out var cId) ? cId : null,
                        IsCriticalPool = rule.IsCriticalPool,
                        QuestionCount = rule.QuestionCount
                    });
                }
            }

            context.LicenseExamMatrices.AddRange(newMatrices);
            await context.SaveChangesAsync();
        }

        // 5. Khởi tạo Bộ Đề Đặc Biệt & Bộ Đề Ôn Tập Theo 6 Chương
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin.ToString());

        var quizDiemLiet = await context.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Title == "Ôn tập câu điểm liệt");
        var criticalQuestions = allQuestions.Where(q => q.IsCritical).ToList();
        if (quizDiemLiet == null)
        {
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
        else
        {
            quizDiemLiet.QuizType = QuizTypes.CriticalPractice;
            quizDiemLiet.DurationMinutes = 45;
            quizDiemLiet.PassScore = 60;
            quizDiemLiet.Questions = criticalQuestions;
        }

        var quizSaiNhieu = await context.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Title == "Câu hỏi bị sai nhiều");
        int[] saiNhieuIds = [
            1, 2, 3, 4, 5, 8, 9, 10, 11, 14, 15, 16, 36, 37, 40,
            105, 106, 110, 115, 120, 125, 130, 135, 140, 145, 150,
            301, 302, 303, 304, 305, 306, 310, 312, 315, 320, 325,
            486, 487, 488, 489, 490, 506, 507, 508, 509, 510, 520, 530, 540
        ];
        var saiNhieuQuestions = allQuestions.Where(q => saiNhieuIds.Contains(q.QuestionId)).ToList();
        if (quizSaiNhieu == null)
        {
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
        else
        {
            quizSaiNhieu.QuizType = QuizTypes.FrequentMistakes;
            quizSaiNhieu.DurationMinutes = 40;
            quizSaiNhieu.PassScore = 45;
            quizSaiNhieu.Questions = saiNhieuQuestions;
        }

        // Đồng bộ 6 Bộ đề Ôn tập theo Chương (ChapterPractice)
        var categoriesList = await context.QuestionCategories.OrderBy(c => c.DisplayOrder).ToListAsync();
        var existingChapterQuizzes = await context.Quizzes
            .Where(q => q.QuizType == QuizTypes.ChapterPractice)
            .Include(q => q.Questions)
            .ToListAsync();

        foreach (var cat in categoriesList)
        {
            var catQuestions = allQuestions.Where(q => q.CategoryId == cat.CategoryId).ToList();
            var existingCh = existingChapterQuizzes.FirstOrDefault(q => q.CategoryId == cat.CategoryId);
            if (existingCh == null)
            {
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
            else
            {
                existingCh.Title = cat.Title;
                existingCh.Detail = cat.Description ?? $"Ôn tập toàn bộ {catQuestions.Count} câu hỏi thuộc {cat.Title}.";
                existingCh.PassScore = catQuestions.Count;
                existingCh.Questions = catQuestions;
            }
        }

        // Xóa các đề ôn tập chương cũ không còn trong danh mục (ví dụ chương 7 cũ)
        var validCatIds = categoriesList.Select(c => c.CategoryId).ToHashSet();
        var obsoleteChQuizzes = existingChapterQuizzes.Where(q => q.CategoryId.HasValue && !validCatIds.Contains(q.CategoryId.Value)).ToList();
        if (obsoleteChQuizzes.Count > 0)
        {
            context.Quizzes.RemoveRange(obsoleteChQuizzes);
        }

        await context.SaveChangesAsync();

        // 6. Khởi tạo / Đồng bộ Bộ đề Cố định từ exam_presets.json & Đề Ngẫu Nhiên cho 11 Hạng
        var presetFilePath = FindDemoFile("exam_presets.json");
        List<SeedPresetGroupDto> seedPresets = [];
        if (!string.IsNullOrEmpty(presetFilePath))
        {
            var presetJson = await File.ReadAllTextAsync(presetFilePath);
            seedPresets = JsonSerializer.Deserialize<List<SeedPresetGroupDto>>(presetJson, jsonOpts) ?? [];
        }

        var qMap = allQuestions.ToDictionary(q => q.QuestionId, q => q);

        foreach (var lic in licenseMap.Values.OrderBy(l => l.DisplayOrder))
        {
            // Kiểm tra Đề ngẫu nhiên đại diện (RandomTemplate)
            var randomTemplate = await context.Quizzes
                .FirstOrDefaultAsync(q => q.LicenseClassId == lic.LicenseClassId && q.QuizType == QuizTypes.RandomTemplate);

            if (randomTemplate == null)
            {
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
            }

            // Đồng bộ các bộ đề cố định (OfficialExam) từ presets
            var presetGroup = seedPresets.FirstOrDefault(p => string.Equals(p.LicenseCode, lic.Code, StringComparison.OrdinalIgnoreCase));
            if (presetGroup != null && presetGroup.ExamSets.Count > 0)
            {
                var existingOfficial = await context.Quizzes
                    .Where(q => q.LicenseClassId == lic.LicenseClassId && q.QuizType == QuizTypes.OfficialExam)
                    .Include(q => q.Questions)
                    .ToListAsync();

                var officialMap = existingOfficial
                    .Where(q => q.ExamNumber.HasValue)
                    .ToDictionary(q => q.ExamNumber!.Value, q => q);

                foreach (var es in presetGroup.ExamSets)
                {
                    var setQuestions = es.QuestionIds
                        .Where(id => qMap.ContainsKey(id))
                        .Select(id => qMap[id])
                        .ToList();

                    if (officialMap.TryGetValue(es.ExamNumber, out var existingQuiz))
                    {
                        existingQuiz.Title = es.Title;
                        existingQuiz.DurationMinutes = lic.DurationMinutes;
                        existingQuiz.PassScore = lic.PassScore;
                        existingQuiz.Questions = setQuestions;
                    }
                    else
                    {
                        context.Quizzes.Add(new Quiz
                        {
                            Title = es.Title,
                            Detail = $"Bộ đề sát hạch tiêu chuẩn số {es.ExamNumber} dành cho {lic.Name}: {lic.TotalQuestions} câu hỏi, thời gian {lic.DurationMinutes} phút, điểm đạt {lic.PassScore}/{lic.TotalQuestions}.",
                            LicenseClassId = lic.LicenseClassId,
                            QuizType = QuizTypes.OfficialExam,
                            ExamNumber = es.ExamNumber,
                            DurationMinutes = lic.DurationMinutes,
                            PassScore = lic.PassScore,
                            UserId = adminUser?.UserId,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                            Questions = setQuestions
                        });
                    }
                }
            }
        }

        await context.SaveChangesAsync();
    }

    #region Seed DTOs
    private class SeedCategoryDto
    {
        public string Code { get; set; } = "";
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }

    private class SeedLicenseClassDto
    {
        public string Code { get; set; } = "";
        public string Name { get; set; } = "";
        public string VehicleGroup { get; set; } = "";
        public int TotalQuestions { get; set; }
        public int DurationMinutes { get; set; }
        public int PassScore { get; set; }
        public int ExamSetCount { get; set; }
        public int DisplayOrder { get; set; }
        public string? Description { get; set; }
    }

    private class SeedMatrixDto
    {
        public string LicenseCode { get; set; } = "";
        public List<SeedMatrixRuleDto> Rules { get; set; } = [];
    }

    private class SeedMatrixRuleDto
    {
        public string? CategoryCode { get; set; }
        public bool IsCriticalPool { get; set; }
        public int QuestionCount { get; set; }
    }

    private class SeedQuestionDto
    {
        public int QuestionId { get; set; }
        public string Content { get; set; } = "";
        public int Score { get; set; } = 1;
        public bool Active { get; set; } = true;
        public string? Image { get; set; }
        public string? CategoryCode { get; set; }
        public bool IsCritical { get; set; }
        public List<string>? ApplicableLicenseClasses { get; set; }
        public string? Explanation { get; set; }
        public List<SeedAnswerDto> Answers { get; set; } = [];
    }

    private class SeedAnswerDto
    {
        public int AnswerId { get; set; }
        public string Content { get; set; } = "";
        public bool IsCorrect { get; set; }
    }

    private class SeedPresetGroupDto
    {
        public string LicenseCode { get; set; } = "";
        public string LicenseName { get; set; } = "";
        public List<SeedPresetExamDto> ExamSets { get; set; } = [];
    }

    private class SeedPresetExamDto
    {
        public int ExamNumber { get; set; }
        public string Title { get; set; } = "";
        public int QuestionCount { get; set; }
        public List<int> QuestionIds { get; set; } = [];
    }
    #endregion
}
