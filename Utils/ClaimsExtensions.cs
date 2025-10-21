using System.Security.Claims;

namespace QuizCarLicense.Utils
{
    public static class ClaimsExtensions
    {
        /// <summary>
        /// Get the user ID from the claims principal.
        /// </summary>
        /// <param name="user">The claims principal.</param>
        /// <returns>The user ID.</returns>
        public static int? GetUserId(this ClaimsPrincipal user)
        {
            var value = user?.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
