using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.DTOs;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;

namespace QuizCarLicense.Pages.Take
{
    public class ShowResultModel : PageModel
    {
        public List<QuestionDTO> TestQuestion { get; private set; } = new();
        public Models.Take TakeObject { get; private set; } = new();
        public int TakeId { get; private set; }

        private readonly ITakeService _takeService;
        private readonly IWebHostEnvironment _env;

        public ShowResultModel(ITakeService takeService, IWebHostEnvironment env)
        {
            _takeService = takeService;
            _env = env;
        }

        // GET /Take/ShowResult?takeId=123
        public async Task<IActionResult> OnGetAsync(int takeId, CancellationToken ct)
        {
            TakeId = takeId;

            if (!await _takeService.CheckTakeAsync(takeId, ct))
                return RedirectToPage("/Error");

            var take = await _takeService.GetTakeWithAnswersAsync(takeId, ct);
            if (take is null)
                return RedirectToPage("/Error");

            TakeObject = take;
            TestQuestion = await _takeService.BuildTestQuestionsAsync(take, ct);

            return Page();
        }

        // GET /Take/ShowResult?handler=Delete&id=123
        public async Task<IActionResult> OnGetDeleteAsync(int id, CancellationToken ct)
        {
            await _takeService.DeleteTakeAsync(id, ct);
            return RedirectToPage("/Take/Index");
        }

        // GET /Take/ShowResult?handler=Print&id=123
        public async Task<IActionResult> OnGetPrintAsync(int id, CancellationToken ct)
        {
            if (!await _takeService.CheckTakeAsync(id, ct))
                return RedirectToPage("/Error");

            var take = await _takeService.GetTakeWithAnswersAsync(id, ct);
            if (take is null)
                return RedirectToPage("/Error");

            var questions = await _takeService.BuildTestQuestionsAsync(take, ct);

            var pdfGenerator = new PdfGenerator(_env);
            using var pdfStream = pdfGenerator.GenerateTakeReport(take, questions);

            return File(pdfStream.ToArray(), "application/pdf", $"TakeReport_{id}.pdf");
        }
    }
}
