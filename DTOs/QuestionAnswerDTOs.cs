using QuizCarLicense.Constrains;
using System;
using System.Collections.Generic;

namespace QuizCarLicense.DTOs
{
    public class AnswerDTO
    {
        public int Id { get; set; }
        public string Content { get; set; } = "";
        public bool IsCorrect { get; set; }
    }

    public class QuestionDTO
    {
        public int Id { get; set; }
        public string Content { get; set; } = "";
        public string? Image { get; set; }
        public List<AnswerDTO> Answers { get; set; } = new();
        public int? AnswerId { get; set; }
        public QuestionStatus Status { get; set; }
    }
}


