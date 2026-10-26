using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizCarLicense.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Take_UserId",
                table: "Take");

            migrationBuilder.DropIndex(
                name: "IX_QuizAnswer_QuestionId",
                table: "QuizAnswer");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Take_UserId_StartedAt",
                table: "Take",
                columns: new[] { "UserId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAnswer_QuestionId_IsCorrect",
                table: "QuizAnswer",
                columns: new[] { "QuestionId", "IsCorrect" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Take_UserId_StartedAt",
                table: "Take");

            migrationBuilder.DropIndex(
                name: "IX_QuizAnswer_QuestionId_IsCorrect",
                table: "QuizAnswer");

            migrationBuilder.CreateIndex(
                name: "IX_Take_UserId",
                table: "Take",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAnswer_QuestionId",
                table: "QuizAnswer",
                column: "QuestionId");
        }
    }
}
