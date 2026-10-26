using System;
using Microsoft.AspNetCore.Identity;
using QuizCarLicense.Models;

namespace QuizCarLicense.Utils;

public static class PasswordHelper
{
    private static readonly PasswordHasher<User> Hasher = new();

    public static string HashPassword(User user, string password)
    {
        return Hasher.HashPassword(user, password);
    }

    public static (bool IsValid, bool NeedsRehash) VerifyPassword(User user, string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrEmpty(hashedPassword) || string.IsNullOrEmpty(providedPassword))
        {
            return (false, false);
        }

        // 1. Check legacy SHA-256 hash (64 hex chars)
        if (hashedPassword.Length == 64 && IsHexString(hashedPassword))
        {
            var sha256 = StringUtils.ComputeSha256Hash(providedPassword);
            if (string.Equals(sha256, hashedPassword, StringComparison.OrdinalIgnoreCase))
            {
                return (true, true); // Valid, but needs upgrade to salted PBKDF2
            }
            return (false, false);
        }

        // 2. Modern ASP.NET Core Identity PasswordHasher verification
        var result = Hasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
        return result switch
        {
            PasswordVerificationResult.Success => (true, false),
            PasswordVerificationResult.SuccessRehashNeeded => (true, true),
            _ => (false, false)
        };
    }

    private static bool IsHexString(string test)
    {
        foreach (char c in test)
        {
            if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')))
                return false;
        }
        return true;
    }
}
