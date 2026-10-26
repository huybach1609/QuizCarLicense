using System;
using System.Collections.Generic;

namespace QuizCarLicense.Models;

public partial class Take
{
    public int TakeId { get; set; }

    public int? QuizId { get; set; }

    public int? UserId { get; set; }

    public int Score { get; set; }

    public int Status { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime? FinishedAt { get; set; }

    public virtual Quiz? Quiz { get; set; }

    public virtual ICollection<TakeAnswer> TakeAnswers { get; set; } = new List<TakeAnswer>();

    public virtual User? User { get; set; }
}
