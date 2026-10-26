using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace QuizCarLicense.DTOs
{
    public class QuizAnswerInputModel
    {
        public int? AnswerId { get; set; }
        public string? Content { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class QuizQuestionInputModel
    {
        public int QuestionId { get; set; } = 0;
        public string Content { get; set; } = "";
        public int Score { get; set; } = 1;
        public IFormFile? ImageFile { get; set; }
        public List<QuizAnswerInputModel> QuizAnswers { get; set; } = new();
    }
}


