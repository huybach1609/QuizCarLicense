namespace QuizCarLicense.DTOs.Pagination
{
    public class PagedResult<T>
    {
        /// <summary>
        /// Represents a paginated result set.
        /// </summary>
        public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
        /// <summary>
        /// Total number of items across all pages.
        /// </summary>
        public int TotalCount { get; set; }
        /// <summary>
        /// Size of each page.
        /// </summary>
        public int PageSize { get; set; }
        /// <summary>
        /// Current page number.
        /// </summary>
        public int CurrentPage { get; set; }
        /// <summary>
        /// Total number of pages.
        /// </summary>
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
