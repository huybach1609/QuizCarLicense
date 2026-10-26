--create database QuizCarLicense;
--use QuizCarLicense;

-- Create User table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY,
    Username VARCHAR(MAX) NOT NULL,
    FullName NVARCHAR(MAX) NOT NULL,
    Password VARCHAR(MAX) NOT NULL
);

-- Create Quiz table
CREATE TABLE Quiz (
    QuizId INT PRIMARY KEY IDENTITY,
    Title NVARCHAR(MAX) NOT NULL,
    Detail NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    UserId INT FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE
);

-- Create QuizQuestion table
CREATE TABLE QuizQuestion (
    QuestionId INT PRIMARY KEY IDENTITY,
    Score INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Content NVARCHAR(MAX) NOT NULL,
    Active BIT NOT NULL
);

-- Create junction table for Quiz and QuizQuestion many-to-many relationship
CREATE TABLE Quiz_QuizQuestion (
    QuizId INT FOREIGN KEY REFERENCES Quiz(QuizId) ON DELETE CASCADE,
    QuestionId INT FOREIGN KEY REFERENCES QuizQuestion(QuestionId) ON DELETE CASCADE,
    PRIMARY KEY (QuizId, QuestionId)
);

-- Create QuizAnswer table
CREATE TABLE QuizAnswer (
    AnswerId INT PRIMARY KEY IDENTITY,
    QuestionId INT FOREIGN KEY REFERENCES QuizQuestion(QuestionId) ON DELETE CASCADE,
    IsCorrect BIT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL
);

-- Create Take table
CREATE TABLE Take (
    TakeId INT PRIMARY KEY IDENTITY,
    QuizId INT FOREIGN KEY REFERENCES Quiz(QuizId) ON DELETE CASCADE,
    UserId INT FOREIGN KEY REFERENCES Users(UserId) ON DELETE NO ACTION,
    Score INT NOT NULL,
    Status INT NOT NULL,
    StartedAt DATETIME NOT NULL,
    FinishedAt DATETIME
);

-- Create TakeAnswer table
CREATE TABLE TakeAnswer (
    TakeAnswerId INT PRIMARY KEY IDENTITY,
    TakeId INT FOREIGN KEY REFERENCES Take(TakeId) ON DELETE CASCADE,
    AnswerId INT FOREIGN KEY REFERENCES QuizAnswer(AnswerId) ON DELETE CASCADE
);


