namespace QuizCarLicense.DTOs
{
    public class GuestTestResultDto
    {
        public float Score { get; set; }
        public int QuizId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime CompletedAt { get; set; }
        public List<TestAnswerRequest> Answers { get; set; } = new();
    }
}