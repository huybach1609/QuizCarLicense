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

    public virtual ICollection<Take> Takes { get; set; } = new List<Take>();

    public virtual User? User { get; set; }

    public virtual ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
}
