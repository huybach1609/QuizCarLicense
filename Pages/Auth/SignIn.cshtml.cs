using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using QuizCarLicense.Constrains;
using QuizCarLicense.Models;
using QuizCarLicense.Utils;

namespace QuizCarLicense.Pages.Auth
{
    public class SignInModel : PageModel
    {

        public string Message { get; set; } = "";

        public void OnGet()
        {
        }

        public IActionResult OnPostSignUp()
        {
            // Manually retrieve the input values from the form
            string userName = Request.Form["UserName"];
            string fullName = Request.Form["FullName"];
            string password = Request.Form["password"];
            string repassword = Request.Form["repassword"];

            // Validate the sign-up input
            if (password == repassword)
            {
                using (var context = new QuizCarLicenseContext())
                {
                    var userDb = context.Users.FirstOrDefault(u => u.Username.Equals(userName));
                    if (userDb != null)
                    {
                        Message = "UserName already exist";
                        return Page();
                    }
                    Models.User user = new()
                    {
                        Username = userName,
                        FullName = fullName,
                        Password = StringUtils.ComputeSha256Hash(password ?? "123"),
                        Role = UserRole.User.ToString()
                    };
                    context.Users.Add(user);
                    context.SaveChanges();
                }
            }
            else
            {
                Message = "password mismatch error";
            }
            return Page();
        }
         }
}
