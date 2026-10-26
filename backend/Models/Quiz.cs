using System;
using System.Collections.Generic;

namespace QuizCarLicense.Models;

public partial class Quiz
{
    public int QuizId { get; set; }

    public string Title { get; set; } = null!;

    public string? Detail { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UserId { get; set; }

    public int? LicenseClassId { get; set; }

    public int? CategoryId { get; set; }

    public string QuizType { get; set; } = "OfficialExam";

    public int? ExamNumber { get; set; }

    public int DurationMinutes { get; set; } = 20;

    public int PassScore { get; set; } = 27;

    public virtual LicenseClass? LicenseClass { get; set; }

    public virtual QuestionCategory? Category { get; set; }

    public virtual ICollection<Take> Takes { get; set; } = new List<Take>();

    public virtual User? User { get; set; }

    public virtual ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
}
