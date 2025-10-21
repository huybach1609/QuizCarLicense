using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTO;
using QuizCarLicense.Filters;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;
using System.Collections;

namespace QuizCarLicense.Pages.Test
{

    [ServiceFilter(typeof(UserFilter))]
    public class TestPageModel : PageModel
    {

        private readonly IUserSessionManager _userSessionManager;
        private readonly QuizCarLicenseContext _context;

        public TestPageModel(IUserSessionManager userSessionManager, QuizCarLicenseContext context  )
        {
            _userSessionManager = userSessionManager;
            _context = context;
        }

        public List<QuestionDTO> TestQuestion { get; set; } = new();

        public int QuizId { get; set; }

        private int takeId;

        public Models.Quiz QuizObject { get; set; } = new();

        public IActionResult OnGet(int quizId)
        {
   

            var quiz = _context.Quizzes.Include(q => q.Questions)
                .ThenInclude(question => question.QuizAnswers)
                .FirstOrDefault(q => q.QuizId == quizId);
            if (quiz != null)
            {
                QuizObject = quiz;
                foreach (var question in quiz.Questions)
                {
                    var questionDto = new QuestionDTO
                    {
                        Id = question.QuestionId,
                        Content = question.Content,
                        Image = question.Image ?? "none",
                        Answers = new List<AnswerDTO>(),
                    };
                    foreach (var ans in question.QuizAnswers)
                    {
                        var ansDto = new AnswerDTO
                        {
                            Content = ans.Content,
                            Id = ans.AnswerId
                        };
                        questionDto.Answers.Add(ansDto);
                    }
                    TestQuestion.Add(questionDto);
                }
                TestQuestion.OrderBy(test => test.Id);
            }
            QuizId = quizId;
            return Page();
        }

        public IActionResult OnPostSubmitTest([FromBody] TestResutlResponse result)
        {
            if (result == null)
            {
                return BadRequest(new { message = "No answers received." });
            }
            // get answer
            // check answer true false + score
            float score = CalcScore(result);
            var takeResult =  SaveResult(score, result);
          

            var response = new
            {
                message = $"Answers submitted successfully! score: {score}",
                success = true,
                takeData = takeResult,
                redirect = takeResult == null ? $"/Take/ShowResult?takeId={takeId}" : null
            };

            return new JsonResult(response);
        }
        private Models.Take SaveResult(float score, TestResutlResponse result)
        {


            int userId;
            var user = _userSessionManager.GetUserInfo();
            if (user == null)
            {
                return null;
            }
            else
            {
                userId = user.UserId;
            }
            var anslist = result.ListAnswers.
                Select(ans => _context.QuizAnswers.FirstOrDefault(a => a.AnswerId == ans.AnswerId)).
                Where(ansDB => ansDB != null).
                Select(ansDB => new TakeAnswer()
                {
                    AnswerId = ansDB.AnswerId,
                }).ToList();
            DateTime adjustedStartTime = result.StartTime.AddHours(-5);
            Models.Take take = new()
            {
                QuizId = result.QuizId,
                UserId = userId,
                Score = Convert.ToInt32(score),
                Status = (int)TakeStatus.COMPLETED,
                StartedAt = adjustedStartTime ,
                FinishedAt = DateTime.Now,
                TakeAnswers = anslist
            };
            if (user != null)
            {
                _context.Takes.Add(take);
                _context.SaveChanges();
                takeId = take.TakeId;
            }
            else
            {
                return take;
            }
            return null;
        }

        private float CalcScore(TestResutlResponse result)
        {
            float score = 0;
            foreach (var ans in result.ListAnswers)
            {
                var answerDB = _context.QuizAnswers.FirstOrDefault(a => a.AnswerId == ans.AnswerId);
                if (answerDB != null && answerDB.IsCorrect)
                {
                    score += 1;
                }
            }
            return score;
        }
    }
}
