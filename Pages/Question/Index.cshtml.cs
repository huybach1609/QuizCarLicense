using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using System.Security.Claims;

namespace QuizCarLicense.Pages.Question
{
    public class Index : PageModel
    {
        [BindProperty] public QuizQuestionInputModel QuestionInput { get; set; } = new();
        public List<QuizQuestion> ListQuestion { get; set; } = new();
        public QuizQuestion QuestionStore { get; set; } = new();

        public string Message { get; set; } = "";
        public bool ViewAsAdmin { get; set; }

        public int PageSize { get; set; } = 2;
        public int PageTotal { get; set; }
        public int PageNum { get; set; } = 1;

        private readonly IQuestionService _questionService;

        public Index(IQuestionService questionService)
        {
            _questionService = questionService;
        }

        public async Task<IActionResult> OnGet()
        {
            await LoadDataAsync(1);
            return Page();
        }

        public async Task<IActionResult> OnGetPage(int pageNum)
        {
            var user = HttpContext.User;
            ViewAsAdmin = user.FindFirstValue(ClaimTypes.Role) == UserRole.Admin.ToString();

            await LoadDataAsync(pageNum);
            return Page();
        }

        public async Task<IActionResult> OnGetPreview(int id)
        {
            var q = await _questionService.GetWithAnswersAsync(id);
            if (q != null)
                QuestionStore = q;

            await LoadDataAsync(PageNum);
            return Page();
        }

        public async Task<IActionResult> OnPost()
        {
            if (!ModelState.IsValid)
            {
                await LoadDataAsync(PageNum);
                Message = "ModelState is not valid.";
                return Page();
            }

            if (Request.Form["insert"].Count > 0)
            {
                await _questionService.CreateAsync(QuestionInput);
            }
            else if (Request.Form["update"].Count > 0)
            {
                await _questionService.UpdateAsync(QuestionInput);
            }

            return RedirectToPage();
        }

        public async Task<IActionResult> OnGetDelete(int code)
        {
            await _questionService.DeleteAsync(code);
            return RedirectToPage();
        }

        private async Task LoadDataAsync(int pageNum)
        {
            var paged = await _questionService.GetPagedAsync(pageNum, PageSize);
            ListQuestion = paged.Data.ToList();

            PageTotal = paged.TotalPages;
            PageNum = pageNum;

            QuestionInput = _questionService.BuildEmptyInput();
        }
    }
}
