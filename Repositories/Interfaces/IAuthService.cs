using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Identity.Client;
using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Auth;
using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface IAuthService
    {
        /// <summary>
        /// Logs in a user.
        /// </summary>
        /// <param name="username">Username.</param>
        /// <param name="password">Password.</param>
        /// <returns>Login result.</returns>
        public Task<MessageReturn> Login(string username, string password);

        /// <summary>
        /// Signs up a user.
        /// </summary>
        /// <returns>Signup result.</returns>
        public Task<MessageReturn> Signup(CreateUserRequest request);

        /// <summary>
        /// Logs out a user.
        /// </summary>
        /// <returns>Logout result.</returns>
        public MessageReturn Logout();

    }
}
