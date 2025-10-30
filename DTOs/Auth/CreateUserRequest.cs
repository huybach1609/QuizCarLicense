using QuizCarLicense.Constrains;
using System.ComponentModel.DataAnnotations;

namespace QuizCarLicense.DTOs.Auth
{
    public class CreateUserRequest
    {
        [Required(ErrorMessage = MessageKeys.LOGOUT_USERNAME_REQUIRED)]
        public string UserName { get; set; } = null!;
        [Required(ErrorMessage = MessageKeys.FULLNAME_REQUIRED)]
        public string FullName { get; set; } =null!;
        [Required(ErrorMessage = MessageKeys.PASSWORD_REQUIRED)]
        [Length(minimumLength: 8, maximumLength: 24, ErrorMessage = MessageKeys.PASSWORD_LENGTH)]
        public string Password { get; set; } = null!;

        [Compare("Password", ErrorMessage = "Passwords do not match")]
        public string? RePassword { get; set; }
    }
}
