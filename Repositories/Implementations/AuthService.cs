using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using QuizCarLicense.Constrains;
using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Auth;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;
using QuizCarLicense.Utils;
using System.Security.Claims;

namespace QuizCarLicense.Repositories.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly QuizCarLicenseContext _context;

        public AuthService(QuizCarLicenseContext context )
        {
            _context = context;
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


            Console.WriteLine($"set session : {userDb.Role.ToString()}");

            return new LoginResponse { Result = true, claimsPrincipal = claimsPrinciple  };
        }

        public MessageReturn Logout()
        {
            throw new NotImplementedException();
        }

        public async Task<MessageReturn> Signup(CreateUserRequest request)
        {
            var userDb =await _context.Users.FirstOrDefaultAsync(u => u.Username.Equals(request.UserName));
            if (userDb != null)
            {
                return new MessageReturn
                {
                    Message = "UserName already exist",
                    Result = false
                };
            }
            Models.User user = new()
            {
                Username = request.UserName,
                FullName = request.FullName,
                Password = StringUtils.ComputeSha256Hash(request.Password ?? "123"),
                Role = UserRole.User.ToString()
            };
            _context.Users.Add(user);
           await _context.SaveChangesAsync();
            return new MessageReturn
            {
                Message = "Signup successful",
                Result = true
            };
        }
    }
}
