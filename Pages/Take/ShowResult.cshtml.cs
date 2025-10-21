using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTO;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;
using QuizCarLicense.Utils;
using System.Diagnostics.Eventing.Reader;

namespace QuizCarLicense.Pages.Take
{
    [ServiceFilter(typeof(UserFilter))]
    public class ShowResultModel : PageModel
    {
        public List<QuestionDTO> TestQuestion { get; set; } = new();

        public Models.Take TakeObject { get; set; } = new();

        public int TakeId { get; set; }

        private readonly QuizCarLicenseContext _context;

        public ShowResultModel(QuizCarLicenseContext context)
        {
            _context = context;
        }

        public IActionResult OnGet(int takeId)
        {
            TestQuestion = new List<QuestionDTO>();
            TakeId = takeId;
            if (!checkTake(takeId))
            {
                return RedirectToPage("/Error");
            }
            LoadData(takeId);
            return Page();
        }

        public bool checkTake(int takeId)
        {
            var takeObject = _context.Takes.FirstOrDefault(t => t.TakeId == takeId);
            if (takeObject != null)
            {
                return true;
            }
            return false;
        }
        public IActionResult OnGetDelete(int id)
        {
            var take = _context.Takes.FirstOrDefault(t => t.TakeId == id);
            if (take != null)
            {
                _context.Takes.Remove(take);
                _context.SaveChanges();
            }
            return RedirectToPage("/Take/Index");
        }
        // get result (list<questionDTO>) then display 
        private void LoadData(int takeId)
        {
            var takeObject = _context.Takes
                .Include(t => t.Quiz)
                .Include(t => t.TakeAnswers)
                    .ThenInclude(ta => ta.Answer)
                        .ThenInclude(a => a.Question)
                .Include(t => t.TakeAnswers)
                    .ThenInclude(ta => ta.Answer.Question.QuizAnswers)
                .FirstOrDefault(t => t.TakeId == takeId);

            if (takeObject != null)
            {
                TakeObject = takeObject;
                //a dictionary to store questions and their statuses
                var questionDict = new Dictionary<int, QuestionDTO>();

                // conver QuizQuestion => QuestionDTO
                foreach (var takeAnswer in TakeObject.TakeAnswers)
                {
                    var questionId = takeAnswer.Answer.QuestionId ?? -1;
                    if (!questionDict.ContainsKey(questionId))
                    {
                        questionDict[questionId] = new QuestionDTO()
                        {
                            Id = questionId,
                            Content = takeAnswer.Answer.Question.Content,
                            Status = takeAnswer.Answer.IsCorrect ? QuestionStatus.TRUE : QuestionStatus.FALSE,
                            AnswerId = takeAnswer.AnswerId ?? -1,
                            Answers = takeAnswer.Answer.Question.QuizAnswers
                            .Select(qa => new AnswerDTO
                            {
                                Id = qa.AnswerId,
                                Content = qa.Content,
                                IsCorrect = qa.IsCorrect
                            }).ToList()
                        };
                    }
                }


                // Add unfinished questions
                List<QuizQuestion> unfinishedQuestions = LoadUnTakeQuestions(takeObject, _context);
                foreach (var question in unfinishedQuestions)
                {
                    if (!questionDict.ContainsKey(question.QuestionId))
                    {
                        questionDict[question.QuestionId] = new QuestionDTO
                        {
                            Id = question.QuestionId,
                            Content = question.Content,
                            Status = QuestionStatus.NOTFINISH,
                            Answers = question.QuizAnswers.Select(qa => new AnswerDTO
                            {
                                Id = qa.AnswerId,
                                Content = qa.Content,
                                IsCorrect = qa.IsCorrect
                            }).ToList()
                        };
                    }
                }

                TestQuestion = questionDict.Values.OrderBy(q => q.Id).ToList();
                Console.WriteLine(TestQuestion);
            }
        }
        private readonly IWebHostEnvironment _env;

        public ShowResultModel(IWebHostEnvironment env)
        {
            _env = env;
        }

        public IActionResult OnGetPrint(int id)
        {
            TestQuestion = new List<QuestionDTO>();
            TakeId = id;

            if (!checkTake(id))
            {
                return RedirectToPage("/Error");
            }

            Models.Take takeDb;
            takeDb = _context.Takes.FirstOrDefault(p => p.TakeId == id);

            LoadData(id);

            PdfGenerator pdfGenerator = new PdfGenerator(_env);
            MemoryStream pdfStream = pdfGenerator.GenerateTakeReport(takeDb, TestQuestion);

            // Return the PDF as a downloadable file
            return File(pdfStream, "application/pdf", $"TakeReport_{id}.pdf");
        }

        private List<QuizQuestion> LoadUnTakeQuestions(Models.Take takeObject, QuizCarLicenseContext context)
        {
            // get question where quiz.quizId = take.QuizId
            var quizQuestions = context.Quizzes
                .Where(q => q.QuizId == takeObject.QuizId)
                .SelectMany(q => q.Questions)
                .Include(q => q.QuizAnswers)
                .ToList();

            // get question in takeObject
            var completedQuestionIds = takeObject.TakeAnswers
                .Select(takeAns => takeAns.Answer.QuestionId)
                .Where(id => id.HasValue)
                .Select(id => id.Value)
                .Distinct();

            // left anti join 
            return quizQuestions
                .Where(q => !completedQuestionIds.Contains(q.QuestionId))
                .ToList();
        }
    }
}
