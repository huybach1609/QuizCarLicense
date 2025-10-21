using System;
using System.Collections.Generic;

namespace QuizCarLicense.DTO
{
    public class TestAnswerRequest
    {
        public int AnswerId { get; set; }
    }

    public class TestResutlResponse
    {
        public int QuizId { get; set; }
        public DateTime StartTime { get; set; }
        public List<TestAnswerRequest> ListAnswers { get; set; } = new();
    }
}


