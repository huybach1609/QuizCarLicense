using System;
using System.Collections.Generic;

namespace QuizCarLicense.Models;

public partial class TakeAnswer
{
    public int TakeAnswerId { get; set; }

    public int? TakeId { get; set; }

    public int? AnswerId { get; set; }

    public virtual QuizAnswer? Answer { get; set; }

    public virtual Take? Take { get; set; }
}
