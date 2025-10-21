using Microsoft.EntityFrameworkCore;
using QuizCarLicense.DTO;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using QuizCarLicense.DTO.Auth;

namespace QuizCarLicense.Repositories.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IUserSessionManager _userSessionManager;
        private readonly QuizCarLicenseContext _context;

        public AuthService(QuizCarLicenseContext context, IUserSessionManager userSessionManager)
        {
            _context = context;
            _userSessionManager = userSessionManager;
        }

        public async Task<MessageReturn> Login(string username, string password)
        {
            var userDb = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username.Equals(username));
            if (userDb == null)
                return new MessageReturn { Message = "Account not exist", Result = false };
            if (!userDb.Password.Equals(StringUtils.ComputeSha256Hash(password)))
                return new MessageReturn { Message = "Password is wrong", Result = false };

            // create claimsprincipal
            // id, name, email, role
            var claims = new List<Claim>
            {
                new (ClaimTypes.NameIdentifier, userDb.UserId.ToString()),
                new (ClaimTypes.Name, userDb.Username),
                new (ClaimTypes.Role, userDb.Role?.ToString()?? "User"),
                new ("FullName", userDb.FullName),
            };
            var claimsIdentity = new ClaimsIdentity(claims,
                CookieAuthenticationDefaults.AuthenticationScheme);
            var claimsPrinciple = new ClaimsPrincipal(claimsIdentity);

            _userSessionManager.SetUserInfo(userDb);

            Console.WriteLine($"set session : {userDb.Role.ToString()}");

            return new LoginResponse { Result = true, claimsPrincipal = claimsPrinciple  };
        }

        public MessageReturn Logout()
        {
            throw new NotImplementedException();
        }

        public MessageReturn SignIn()
        {
            throw new NotImplementedException();
        }

        public MessageReturn SignOut()
        {
            throw new NotImplementedException();
        }
    }
}
