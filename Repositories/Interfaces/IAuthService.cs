using QuizCarLicense.DTOs;
using QuizCarLicense.DTOs.Auth;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface IAuthService
    {
        /// <summary>
        /// Logs in a user.
        /// </summary>
        /// <param name="username">Username.</param>
        /// <param name="password">Password.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Login result.</returns>
        public Task<MessageReturn> Login(string username, string password, CancellationToken ct = default);

        /// <summary>
        /// Signs up a user.
        /// </summary>
        /// <param name="request">User request.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Signup result.</returns>
        public Task<MessageReturn> Signup(CreateUserRequest request, CancellationToken ct = default);

        /// <summary>
        /// Logs out a user.
        /// </summary>
        /// <returns>Logout result.</returns>
        public MessageReturn Logout();

        /// <summary>
        /// Checks if an administrator account already exists.
        /// </summary>
        public Task<bool> HasAdminAsync(CancellationToken ct = default);

        /// <summary>
        /// Creates the initial administrator account.
        /// </summary>
        public Task<MessageReturn> CreateAdminAsync(CreateUserRequest request, CancellationToken ct = default);
    }
}
