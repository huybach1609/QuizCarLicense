using System;
using System.Collections.Generic;

namespace QuizCarLicense.Models;

public partial class QuizAnswer
{
    public int AnswerId { get; set; }

    public int? QuestionId { get; set; }

    public bool IsCorrect { get; set; }

    public string Content { get; set; } = null!;

    public virtual QuizQuestion? Question { get; set; }

    public virtual ICollection<TakeAnswer> TakeAnswers { get; set; } = new List<TakeAnswer>();
}
