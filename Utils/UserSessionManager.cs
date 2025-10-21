//using Newtonsoft.Json;
//using QuizCarLicense.Models;

//namespace QuizCarLicense.Utils
//{

//    public static class UserSessionManager
//    {
//        private static readonly JsonSerializerSettings _settings = new JsonSerializerSettings
//        {
//            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
//        };

//        // add or replace user info in session
//        public static void SetUserInfo(HttpContext httpContext, User user)
//        {
//            var userJson = JsonConvert.SerializeObject(user, _settings);
//            httpContext.Session.SetString("sesUser", userJson);
//        }

//        // get user info from session
//        public static User GetUserInfo(HttpContext httpContext)
//        {
//            var userJson = httpContext.Session.GetString("sesUser");
//            return string.IsNullOrEmpty(userJson) ? null : JsonConvert.DeserializeObject<User>(userJson);
//        }

//        // remove user info from session
//        public static void RemoveUserInfo(HttpContext httpContext)
//        {
//            httpContext.Session.Remove("sesUser");
//        }
//    }

//}
