using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace QuizCarLicense.DTOs.Auth
{
    public class LoginResponse : MessageReturn
    {
        public ClaimsPrincipal? claimsPrincipal { get; set; }
        public UserDto? User { get; set; }
    }
}

