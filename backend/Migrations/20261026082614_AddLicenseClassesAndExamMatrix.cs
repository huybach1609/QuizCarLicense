using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace QuizCarLicense.Migrations
{
    /// <inheritdoc />
    public partial class AddLicenseClassesAndExamMatrix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasCriticalError",
                table: "Take",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPassed",
                table: "Take",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PassScore",
                table: "Take",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalQuestions",
                table: "Take",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "QuizQuestion",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Explanation",
                table: "QuizQuestion",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCritical",
                table: "QuizQuestion",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Quiz",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "Quiz",
                type: "integer",
                nullable: false,
                defaultValue: 20);

            migrationBuilder.AddColumn<int>(
                name: "ExamNumber",
                table: "Quiz",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LicenseClassId",
                table: "Quiz",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PassScore",
                table: "Quiz",
                type: "integer",
                nullable: false,
                defaultValue: 27);

            migrationBuilder.AddColumn<string>(
                name: "QuizType",
                table: "Quiz",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "OfficialExam");

            migrationBuilder.CreateTable(
                name: "LicenseClass",
                columns: table => new
                {
                    LicenseClassId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    VehicleGroup = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TotalQuestions = table.Column<int>(type: "integer", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    PassScore = table.Column<int>(type: "integer", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LicenseClass", x => x.LicenseClassId);
                });

            migrationBuilder.CreateTable(
                name: "QuestionCategory",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionCategory", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "LicenseClass_QuizQuestion",
                columns: table => new
                {
                    LicenseClassId = table.Column<int>(type: "integer", nullable: false),
                    QuestionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LicenseClass_QuizQuestion", x => new { x.LicenseClassId, x.QuestionId });
                    table.ForeignKey(
                        name: "FK_LicenseClass_QuizQuestion_LicenseClass_LicenseClassId",
                        column: x => x.LicenseClassId,
                        principalTable: "LicenseClass",
                        principalColumn: "LicenseClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LicenseClass_QuizQuestion_QuizQuestion_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "QuizQuestion",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LicenseExamMatrix",
                columns: table => new
                {
                    MatrixId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LicenseClassId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    IsCriticalPool = table.Column<bool>(type: "boolean", nullable: false),
                    QuestionCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LicenseExamMatrix", x => x.MatrixId);
                    table.ForeignKey(
                        name: "FK_LicenseExamMatrix_LicenseClass_LicenseClassId",
                        column: x => x.LicenseClassId,
                        principalTable: "LicenseClass",
                        principalColumn: "LicenseClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LicenseExamMatrix_QuestionCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "QuestionCategory",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestion_Category_IsCritical",
                table: "QuizQuestion",
                columns: new[] { "CategoryId", "IsCritical" });

            migrationBuilder.CreateIndex(
                name: "IX_Quiz_CategoryId",
                table: "Quiz",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Quiz_LicenseClass_QuizType",
                table: "Quiz",
                columns: new[] { "LicenseClassId", "QuizType", "ExamNumber" });

            migrationBuilder.CreateIndex(
                name: "UX_LicenseClass_Code",
                table: "LicenseClass",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LicenseClass_QuizQuestion_QuestionId",
                table: "LicenseClass_QuizQuestion",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_LicenseExamMatrix_CategoryId",
                table: "LicenseExamMatrix",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_LicenseExamMatrix_LicenseClassId",
                table: "LicenseExamMatrix",
                column: "LicenseClassId");

            migrationBuilder.CreateIndex(
                name: "UX_QuestionCategory_Code",
                table: "QuestionCategory",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Quiz_LicenseClass_LicenseClassId",
                table: "Quiz",
                column: "LicenseClassId",
                principalTable: "LicenseClass",
                principalColumn: "LicenseClassId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Quiz_QuestionCategory_CategoryId",
                table: "Quiz",
                column: "CategoryId",
                principalTable: "QuestionCategory",
                principalColumn: "CategoryId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_QuizQuestion_QuestionCategory_CategoryId",
                table: "QuizQuestion",
                column: "CategoryId",
                principalTable: "QuestionCategory",
                principalColumn: "CategoryId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quiz_LicenseClass_LicenseClassId",
                table: "Quiz");

            migrationBuilder.DropForeignKey(
                name: "FK_Quiz_QuestionCategory_CategoryId",
                table: "Quiz");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizQuestion_QuestionCategory_CategoryId",
                table: "QuizQuestion");

            migrationBuilder.DropTable(
                name: "LicenseClass_QuizQuestion");

            migrationBuilder.DropTable(
                name: "LicenseExamMatrix");

            migrationBuilder.DropTable(
                name: "LicenseClass");

            migrationBuilder.DropTable(
                name: "QuestionCategory");

            migrationBuilder.DropIndex(
                name: "IX_QuizQuestion_Category_IsCritical",
                table: "QuizQuestion");

            migrationBuilder.DropIndex(
                name: "IX_Quiz_CategoryId",
                table: "Quiz");

            migrationBuilder.DropIndex(
                name: "IX_Quiz_LicenseClass_QuizType",
                table: "Quiz");

            migrationBuilder.DropColumn(
                name: "HasCriticalError",
                table: "Take");

            migrationBuilder.DropColumn(
                name: "IsPassed",
                table: "Take");

            migrationBuilder.DropColumn(
                name: "PassScore",
                table: "Take");

            migrationBuilder.DropColumn(
                name: "TotalQuestions",
                table: "Take");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "QuizQuestion");

            migrationBuilder.DropColumn(
                name: "Explanation",
                table: "QuizQuestion");

            migrationBuilder.DropColumn(
                name: "IsCritical",
                table: "QuizQuestion");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Quiz");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "Quiz");

            migrationBuilder.DropColumn(
                name: "ExamNumber",
                table: "Quiz");

            migrationBuilder.DropColumn(
                name: "LicenseClassId",
                table: "Quiz");

            migrationBuilder.DropColumn(
                name: "PassScore",
                table: "Quiz");

            migrationBuilder.DropColumn(
                name: "QuizType",
                table: "Quiz");
        }
    }
}
