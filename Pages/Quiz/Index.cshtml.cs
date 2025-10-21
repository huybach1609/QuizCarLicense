using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;

namespace QuizCarLicense.Pages.Quiz;

public class Index : PageModel
{
    [BindProperty]
    public Models.Quiz QuizInput { get; set; } = new();
    public List<Models.Quiz> Quizzes { get; set; } = new();
    public List<Models.Quiz> YourQuizzes { get; set; } = new();

    // params
    public string Message { get; set; } = "";

    // di
    private readonly IQuizService _quizService;

    public Index(IQuizService quizService)
    {
        _quizService = quizService;
    }

    public async Task<IActionResult> OnGet(CancellationToken ct)
    {
        await LoadDataAsync(ct);
        return Page();
    }

    private async Task LoadDataAsync(CancellationToken ct)
    {
        Quizzes = await _quizService.GetAllAsync(ct);

        // load your quizzes
        var uid = User.GetUserId();
        if (uid is int userId)
            YourQuizzes = await _quizService.GetByUserAsync(userId, ct);
        else
            YourQuizzes.Clear();
    }
    /// <summary>
    /// Insert Quiz
    /// </summary>
    /// <param name="ct"></param>
    /// <returns></returns>
    public async Task<IActionResult> OnPostInsertAsync(CancellationToken ct)
    {
        var uid = User.GetUserId();
        if (uid is not int)
        {
            ModelState.AddModelError(string.Empty, "You must be signed in to create a quiz.");
        }
        await _quizService.InsertAsync(QuizInput, uid.Value, ct);
        Message = "Created successfully.";
        return await ReloadAsync(ct);

    }

    /// <summary>
    /// Update Quiz infor
    /// </summary>
    /// <param name="ct"></param>
    /// <returns></returns>
    public async Task<IActionResult> OnPostUpdateAsync(CancellationToken ct)
    {
        var uid = User.GetUserId();
        if (uid is not int)
        {
            ModelState.AddModelError(string.Empty, "You must be signed in to update a quiz.");
        }

        if (!ModelState.IsValid)
        {
            await LoadDataAsync(ct);
            return Page();
        }

        var ok = await _quizService.UpdateAsync(QuizInput, uid.Value, ct);
        Message = ok ? "Updated successfully." : "Quiz not found.";
        return await ReloadAsync(ct);
    }
    /// <summary>
    /// To reload data after do an action
    /// </summary>
    /// <param name="ct"></param>
    /// <returns></returns>
    private async Task<IActionResult> ReloadAsync(CancellationToken ct)
    {
        await LoadDataAsync(ct);
        return Page();
    }

    /// <summary>
    // GET: /Quiz/Index?handler=Delete&id=123
    /// </summary>
    /// <param name="id">id of quiz</param>
    /// <param name="ct">canclelationToken</param>
    /// <returns></returns>
    public async Task<IActionResult> OnGetDeleteAsync(int id, CancellationToken ct)
    {
        var ok = await _quizService.DeleteAsync(id, ct);
        Message = ok ? "Deleted." : "Quiz not found or cannot delete.";
        return await ReloadAsync(ct);
    }

    /// <summary>
    /// GET: /Quiz/Index?handler=ShowDetails&id=123
    /// </summary>
    /// <param name="id"></param>
    /// <param name="ct"></param>
    /// <returns></returns>
    public async Task<IActionResult> OnGetShowDetailsAsync(int id, CancellationToken ct)
    {
        var quiz = await _quizService.GetByIdAsync(id, ct);
        if (quiz is null)
        {
            Message = "Not found.";
            return await ReloadAsync(ct);
        }

        QuizInput = quiz;
        await LoadDataAsync(ct);
        return Page();
    }
}
