using iText.Kernel.Pdf;
using iText.Layout.Element;
using QuizCarLicense.DTO;
using QuizCarLicense.Models;
using iText.IO.Font;
using iText.Kernel.Font;
using iText.Kernel.Colors;
using QuizCarLicense.Constrains;

namespace QuizCarLicense.Utils
{
    public class PdfGenerator
    {
        private readonly IWebHostEnvironment _env;

        public PdfGenerator(IWebHostEnvironment env)
        {
            _env = env;
        }

        public MemoryStream GenerateTakeReport(Take take, List<QuestionDTO> questions)
        {
            MemoryStream ms = new MemoryStream();

            // Initialize PDF writer and document
            using (PdfWriter writer = new PdfWriter(ms))
            {
                writer.SetCloseStream(false); // Prevent MemoryStream from closing
                string fontPath = Path.Combine(_env.WebRootPath, "font", "NotoSans-Regular.ttf");

                using (PdfDocument pdf = new PdfDocument(writer))
                using (iText.Layout.Document document = new iText.Layout.Document(pdf))
                {

                    PdfFont vietnameseFont = PdfFontFactory.CreateFont(fontPath, PdfEncodings.IDENTITY_H);

                    document.SetFont(vietnameseFont);

                    // Add document content
                    document.Add(new Paragraph($"Take Report for Take ID: {take.TakeId}")
                        .SetFontSize(20)
                        .SetFont(vietnameseFont)
                        );

                    document.Add(new Paragraph($"User ID: {take.UserId ?? 0}"));
                    document.Add(new Paragraph($"Quiz ID: {take.QuizId ?? 0}"));
                    document.Add(new Paragraph($"Score: {take.Score}"));
                    document.Add(new Paragraph($"Started At: {take.StartedAt}"));
                    document.Add(new Paragraph($"Finished At: {take.FinishedAt?.ToString() ?? "N/A"}"));

                    int count = 0;
                    // Process questions
                    foreach (var question in questions)
                    {
                        count++;

                        document.Add(new Paragraph($" Câu {count} - Question ID: {question.Id}"));
                        document.Add(new Paragraph($"Content: {question.Content}"));
                        if (!string.IsNullOrEmpty(question.Image))
                        {
                            document.Add(new Paragraph($"Image: {question.Image}"));
                        }
                        AnswerDTO? answerDTO = null;
                        foreach (var answer in question.Answers)
                        {
                            document.Add(new Paragraph($"- {answer.Content}"));
                            if (answer.Id == question.AnswerId)
                            {
                                answerDTO = answer;
                            }
                        }
                        if (answerDTO != null)
                        {
                            DeviceRgb color = new DeviceRgb(0, 0, 0);
                            if (question.Status == QuestionStatus.TRUE)
                            {
                                color = new DeviceRgb(167, 201, 87);
                            }
                            else if (question.Status == QuestionStatus.FALSE)
                            {
                                color = new DeviceRgb(193, 18, 31);
                            }
                            document.Add(new Paragraph($"Answer: {answerDTO.Content}").SetFontColor(color));
                        }

                    }
                }
            }

            ms.Position = 0; // Reset the stream position
            return ms;
        }
    }

}
