using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace QuizCarLicense.Models;

public partial class QuizCarLicenseContext : DbContext
{
    public QuizCarLicenseContext()
    {
    }

    public QuizCarLicenseContext(DbContextOptions<QuizCarLicenseContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Quiz> Quizzes { get; set; }

    public virtual DbSet<QuizAnswer> QuizAnswers { get; set; }

    public virtual DbSet<QuizQuestion> QuizQuestions { get; set; }

    public virtual DbSet<Take> Takes { get; set; }

    public virtual DbSet<TakeAnswer> TakeAnswers { get; set; }

    public virtual DbSet<User> Users { get; set; }

//    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
//#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
//        => optionsBuilder.UseSqlServer("server =192.168.55.220,1433;database=QuizCarLicense;uid=sa;pwd=5Z#6G%te;TrustServerCertificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Quiz>(entity =>
        {
            entity.HasKey(e => e.QuizId).HasName("PK__Quiz__8B42AE8E620FF1EE");

            entity.ToTable("Quiz");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.User).WithMany(p => p.Quizzes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__Quiz__UserId__3B75D760");

            entity.HasMany(d => d.Questions).WithMany(p => p.Quizzes)
                .UsingEntity<Dictionary<string, object>>(
                    "QuizQuizQuestion",
                    r => r.HasOne<QuizQuestion>().WithMany()
                        .HasForeignKey("QuestionId")
                        .HasConstraintName("FK__Quiz_Quiz__Quest__4316F928"),
                    l => l.HasOne<Quiz>().WithMany()
                        .HasForeignKey("QuizId")
                        .HasConstraintName("FK__Quiz_Quiz__QuizI__4222D4EF"),
                    j =>
                    {
                        j.HasKey("QuizId", "QuestionId").HasName("PK__Quiz_Qui__5B9EA87495B2FC1B");
                        j.ToTable("Quiz_QuizQuestion");
                    });
        });

        modelBuilder.Entity<QuizAnswer>(entity =>
        {
            entity.HasKey(e => e.AnswerId).HasName("PK__QuizAnsw__D4825004E35FAA66");

            entity.ToTable("QuizAnswer");

            entity.HasOne(d => d.Question).WithMany(p => p.QuizAnswers)
                .HasForeignKey(d => d.QuestionId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__QuizAnswe__Quest__45F365D3");
        });

        modelBuilder.Entity<QuizQuestion>(entity =>
        {
            entity.HasKey(e => e.QuestionId).HasName("PK__QuizQues__0DC06FAC8878AD90");

            entity.ToTable("QuizQuestion");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Take>(entity =>
        {
            entity.HasKey(e => e.TakeId).HasName("PK__Take__AC0C21A0FF1E86DF");

            entity.ToTable("Take");

            entity.Property(e => e.FinishedAt).HasColumnType("datetime");
            entity.Property(e => e.StartedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Quiz).WithMany(p => p.Takes)
                .HasForeignKey(d => d.QuizId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__Take__QuizId__48CFD27E");

            entity.HasOne(d => d.User).WithMany(p => p.Takes)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Take__UserId__49C3F6B7");
        });

        modelBuilder.Entity<TakeAnswer>(entity =>
        {
            entity.HasKey(e => e.TakeAnswerId).HasName("PK__TakeAnsw__5116992CE6CBF6E1");

            entity.ToTable("TakeAnswer");

            entity.HasOne(d => d.Answer).WithMany(p => p.TakeAnswers)
                .HasForeignKey(d => d.AnswerId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__TakeAnswe__Answe__4D94879B");

            entity.HasOne(d => d.Take).WithMany(p => p.TakeAnswers)
                .HasForeignKey(d => d.TakeId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__TakeAnswe__TakeI__4CA06362");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CC4C9DF8E4F5");

            entity.Property(e => e.Password).IsUnicode(false);
            entity.Property(e => e.Role).HasMaxLength(50);
            entity.Property(e => e.Username).IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
