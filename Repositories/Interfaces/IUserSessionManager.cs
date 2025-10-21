using QuizCarLicense.Models;

namespace QuizCarLicense.Repositories.Interfaces
{
    public interface IUserSessionManager
    {
        User? GetUserInfo();
        void SetUserInfo(User user);
        void RemoveUserInfo();
        bool HasUserInfo();
        //bool IsAdmin();
    }
}
