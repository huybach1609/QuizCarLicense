using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Identity.Client;
using QuizCarLicense.DTO;
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
        /// Signs in a user.
        /// </summary>
        /// <returns>Sign in result.</returns>
        public MessageReturn SignIn();

        /// <summary>
        /// Logs out a user.
        /// </summary>
        /// <returns>Logout result.</returns>
        public MessageReturn Logout();

    }
}
