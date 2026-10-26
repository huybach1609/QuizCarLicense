using System;
using System.Collections.Generic;

namespace QuizCarLicense.Models;

public partial class QuizQuestion
{
    public int QuestionId { get; set; }

    public int Score { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string Content { get; set; } = null!;

    public bool Active { get; set; }

    public string? Image { get; set; }

    public int? CategoryId { get; set; }

    public bool IsCritical { get; set; }

    public string? Explanation { get; set; }

    public virtual QuestionCategory? Category { get; set; }

    public virtual ICollection<QuizAnswer> QuizAnswers { get; set; } = new List<QuizAnswer>();

    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();

    public virtual ICollection<LicenseClass> AllowedLicenseClasses { get; set; } = new List<LicenseClass>();
}
