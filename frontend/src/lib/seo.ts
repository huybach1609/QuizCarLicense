import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quizcarlicense.vn";

export function constructSeoMetadata({
  title,
  description,
  path = "",
  locale = "vi",
  ogImage = "/og-image.png",
}: {
  title: string;
  description: string;
  path?: string;
  locale?: string;
  ogImage?: string;
}): Metadata {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const viUrl = `${SITE_URL}${cleanPath}`;
  const enUrl = `${SITE_URL}/en${cleanPath === "/" ? "" : cleanPath}`;
  const canonical = locale === "en" ? enUrl : viUrl;

  return {
    title: `${title} | QuizCarLicense`,
    description,
    alternates: {
      canonical,
      languages: {
        "vi-VN": viUrl,
        "en-US": enUrl,
      },
    },
    openGraph: {
      title: `${title} | QuizCarLicense`,
      description,
      url: canonical,
      siteName: "QuizCarLicense",
      locale: locale === "en" ? "en_US" : "vi_VN",
      type: "website",
      images: [
        {
          url: `${SITE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}${ogImage}`],
    },
  };
}

export function generateQuestionJsonLd(question: {
  questionId: number;
  content: string;
  answers: { id: number; content: string; isCorrect: boolean }[];
}) {
  const correctAnswer = question.answers.find((a) => a.isCorrect);

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: `Câu hỏi sát hạch số ${question.questionId}`,
      text: question.content,
      answerCount: question.answers.length,
      acceptedAnswer: correctAnswer
        ? {
            "@type": "Answer",
            text: correctAnswer.content,
            url: `${SITE_URL}/cau-hoi/${question.questionId}#answer-${correctAnswer.id}`,
          }
        : undefined,
      suggestedAnswer: question.answers
        .filter((a) => !a.isCorrect)
        .map((a) => ({
          "@type": "Answer",
          text: a.content,
        })),
    },
  };
}
