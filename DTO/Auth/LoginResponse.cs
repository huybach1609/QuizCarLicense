using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace QuizCarLicense.DTO.Auth
{
    public class LoginResponse : MessageReturn
    {
        public ClaimsPrincipal? claimsPrincipal { get; set; }
    }
}
