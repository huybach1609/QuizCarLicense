using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTO;
using QuizCarLicense.Models;
using System.Security.Claims;

namespace QuizCarLicense.Pages.Question
{
    public class Index : PageModel
    {
        [BindProperty]
        public QuizQuestionInputModel QuestionInput { get; set; }

        public List<QuizQuestion> ListQuestion { get; set; } = new();
        public QuizQuestion QuestionStore { get; set; } = new();

        // params
        public string Message { get; set; } = "";
        public bool ViewAsAdmin { get; set; }

        private readonly QuizCarLicenseContext _context;
        public Index(QuizCarLicenseContext context)
        {
            _context = context;
        }


        public IActionResult OnGet()
        {
            LoadData(1);
            return Page();
        }
        public IActionResult OnGetPage(int pageNum)
        {
            //set is Admin
            var user = HttpContext.User;
            ViewAsAdmin = user.FindFirstValue(ClaimTypes.Role) == UserRole.Admin.ToString();

            LoadData(pageNum);
            return Page();
        }

        private void LoadData()
        {
            ListQuestion = _context.QuizQuestions.OrderByDescending(q => q.QuestionId).ToList();


            QuestionInput = new QuizQuestionInputModel();
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());
        }

        public int PageSize { get; set; } = 10;
        public int PageTotal { get; set; }
        public int PageNum { get; set; } = 1;

        private void LoadData(int pagenum)
        {

            var pagedResult = GetPagedData(_context.QuizQuestions.Include(p => p.QuizAnswers).OrderByDescending(q => q.QuestionId), pagenum, PageSize);

            ListQuestion = pagedResult.Data.ToList();

            PageTotal = pagedResult.TotalPages;
            PageNum = pagenum;


            QuestionInput = new QuizQuestionInputModel();
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());
            QuestionInput.QuizAnswers.Add(new QuizAnswerInputModel());

        }
        public PagedResult<T> GetPagedData<T>(IQueryable<T> source, int pageNumber, int pageSize)
        {
            var count = source.Count();
            var data = source
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<T>
            {
                Data = data,
                TotalCount = count,
                PageSize = pageSize,
                CurrentPage = pageNumber
            };
        }

        public IActionResult OnGetPreview(int id)
        {
            var questionKey = _context.QuizQuestions.Include(q => q.QuizAnswers).FirstOrDefault(q => q.QuestionId == id);
            if (questionKey != null)
            {
                QuestionStore = questionKey;
            }
            LoadData();
            return Page();
        }

        public async Task<IActionResult> OnPost()
        {
            if (!ModelState.IsValid)
            {
                LoadData();
                Message = "ModelState is not valid.";
                return Page();
            }

            if (Request.Form["insert"].Count > 0)
            {
                await InsertQuestion();
            }
            else if (Request.Form["update"].Count > 0)
            {
                UpdateQuestion();
            }
            return RedirectToPage();
        }
        private async Task UpdateQuestion()
        {
            var questionDB = _context.QuizQuestions.Include(q => q.QuizAnswers)
            .FirstOrDefault(a => a.QuestionId == QuestionInput.QuestionId);

            if (questionDB != null)
            {
                questionDB.Content = QuestionInput.Content;
                questionDB.Score = QuestionInput.Score;
                questionDB.UpdatedAt = DateTime.Now;

                foreach (var inputAnswer in QuestionInput.QuizAnswers)
                {
                    var existingAnswer = questionDB.QuizAnswers
                   .FirstOrDefault(ans => ans.AnswerId == inputAnswer.AnswerId);
                    if (existingAnswer != null)
                    {
                        // Update existing answer
                        existingAnswer.Content = inputAnswer.Content;
                        existingAnswer.IsCorrect = inputAnswer.IsCorrect;
                    }
                    else
                    {
                        // Add new answer if it doesn't exist
                        questionDB.QuizAnswers.Add(new QuizAnswer
                        {
                            Content = inputAnswer.Content ?? "none",
                            IsCorrect = inputAnswer.IsCorrect
                        });
                    }
                }


                // delete old image before update
                if (!string.IsNullOrEmpty(questionDB.Image))
                {
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", questionDB.Image.TrimStart('/'));

                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }

                // Check if an image file is provided
                if (QuestionInput.ImageFile != null && QuestionInput.ImageFile.Length > 0)
                {


                    var fileExtension = Path.GetExtension(QuestionInput.ImageFile.FileName);
                    // Create a unique file name for the image
                    var fileName = $"question-{questionDB.QuestionId}{fileExtension}"; // Use a unique identifier based on the question ID
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Image", fileName);

                    // Ensure the images directory exists
                    var directoryPath = Path.GetDirectoryName(filePath);
                    if (directoryPath != null && !Directory.Exists(directoryPath))
                    {
                        Directory.CreateDirectory(directoryPath);
                    }

                    // Save the uploaded image to the specified path
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await QuestionInput.ImageFile.CopyToAsync(stream);
                    }

                    questionDB.Image = $"/Image/{fileName}";

                    await _context.SaveChangesAsync();
                }
            }

        }
        public async Task InsertQuestion()
        {

            using var context = new QuizCarLicenseContext();

            // Create the QuizQuestion entity
            var quizQuestion = new QuizQuestion
            {
                Content = QuestionInput.Content,
                Score = QuestionInput.Score,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Active = true,
                QuizAnswers = QuestionInput.QuizAnswers.Select(ans => new QuizAnswer
                {
                    Content = ans.Content ?? "none",
                    IsCorrect = ans.IsCorrect
                }).ToList()
            };
            context.QuizQuestions.Add(quizQuestion);
            await context.SaveChangesAsync();



            // Check if an image file is provided
            if (QuestionInput.ImageFile != null && QuestionInput.ImageFile.Length > 0)
            {
                var fileExtension = Path.GetExtension(QuestionInput.ImageFile.FileName);
                // Create a unique file name for the image
                var fileName = $"question-{quizQuestion.QuestionId}{fileExtension}"; // Use a unique identifier based on the question ID
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Image", fileName);

                // Ensure the images directory exists
                var directoryPath = Path.GetDirectoryName(filePath);
                if (directoryPath != null && !Directory.Exists(directoryPath))
                {
                    Directory.CreateDirectory(directoryPath);
                }

                // Save the uploaded image to the specified path
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await QuestionInput.ImageFile.CopyToAsync(stream);
                }

                quizQuestion.Image = $"/Image/{fileName}";
                await context.SaveChangesAsync();
            }


        }
        public IActionResult OnGetDelete(int code)
        {
            using var context = new QuizCarLicenseContext();
            var question = context.QuizQuestions.FirstOrDefault(p => p.QuestionId == code);
            if (question != null)
            {
                if (!string.IsNullOrEmpty(question.Image))
                {
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", question.Image.TrimStart('/'));

                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }

                // Remove the question from the database
                context.QuizQuestions.Remove(question);
                context.SaveChanges();
            }
            return RedirectToPage();
        }

    }
    public class PagedResult<T>
    {
        public IEnumerable<T> Data { get; set; }
        public int TotalCount { get; set; }
        public int PageSize { get; set; }
        public int CurrentPage { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }


}
