using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Api;
using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public sealed record ExamEvaluationResultDto(
        int Score,
        int TotalQuestions,
        int PassScore,
        bool IsPassed,
        bool HasCriticalError,
        IReadOnlyList<GradedQuestionResponse> GradedQuestions);

    public interface ITestService
    {
        Task<Quiz?> GetQuizWithQuestionsAsync(int quizId, CancellationToken ct);

        Task<List<QuestionDTO>> BuildTestQuestionsAsync(Quiz quiz, CancellationToken ct);

        Task<float> CalculateScoreAsync(TestResutlResponse result, CancellationToken ct);

        /// <summary> save resutl test to take record </summary>
        Task<Take> SaveResultAsync(float score, TestResutlResponse result, int userId, CancellationToken ct);

        Task<List<QuestionDTO>> BuildGuestTestResultAsync(Models.Quiz quiz, List<TestAnswerRequest> userAnswers, CancellationToken ct);

        /// <summary>
        /// Chấm điểm bài thi trên RAM (Zero DB Read), kiểm tra đồng thời Điểm đạt và lỗi Câu hỏi điểm liệt.
        /// Hỗ trợ cả bộ đề cố định lẫn đề thi ngẫu nhiên (customQuestionIds).
        /// </summary>
        Task<ExamEvaluationResultDto> EvaluateExamAsync(
            Quiz quiz,
            IReadOnlyList<int> selectedAnswerIds,
            IReadOnlyList<int>? customQuestionIds,
            CancellationToken ct);

        /// <summary>
        /// Lưu kết quả lượt thi của học viên đã đăng nhập kèm cờ IsPassed và HasCriticalError.
        /// </summary>
        Task<Take> SaveExamTakeAsync(
            Quiz quiz,
            ExamEvaluationResultDto evaluation,
            DateTime startTime,
            IReadOnlyList<int> selectedAnswerIds,
            int userId,
            CancellationToken ct);

        /// <summary>
        /// Sinh đề thi ngẫu nhiên từ ngân hàng câu hỏi theo ma trận chuẩn (LicenseExamMatrix) của hạng GPLX.
        /// </summary>
        Task<(Quiz TemplateQuiz, List<QuizQuestion> Questions)?> GenerateRandomExamByLicenseAsync(
            string licenseCode,
            CancellationToken ct);
    }
}
