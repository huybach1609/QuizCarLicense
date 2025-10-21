using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using QuizCarLicense.Constrains;
using QuizCarLicense.Models;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations
{
    public class UserSessionManager : IUserSessionManager
    {
        private readonly IHttpContextAccessor _http;

        private readonly JsonSerializerSettings _settings = new JsonSerializerSettings
        {
            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
        };

        public UserSessionManager(IHttpContextAccessor http)
        {
            _http = http;
        }

        public User? GetUserInfo()
        {
            var userJson = _http.HttpContext?.Session.GetString("sesUser");
            return string.IsNullOrEmpty(userJson) ? null : JsonConvert.DeserializeObject<User>(userJson);
        }

        public void SetUserInfo(User u)
        {
            var userJson = JsonConvert.SerializeObject(u, _settings);
            _http.HttpContext?.Session.SetString("sesUser", userJson);
        }

        public void RemoveUserInfo()
        {
            _http.HttpContext?.Session.Remove("sesUser");
        }

        public bool HasUserInfo()
        {
            return GetUserInfo() != null;
        }

        //public bool IsAdmin()
        //{
        //    User? user = GetUserInfo();
        //    if (user != null)
        //    {
        //        return false;
        //    }
        //    return user.Role == UserRole.Admin.ToString();
        //}
    }
}
