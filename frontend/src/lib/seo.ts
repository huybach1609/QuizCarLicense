import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quizcarlicense.vn";

export function constructSeoMetadata({
  title,
  description,
  path = "",
  locale = "vi",
  ogImage = "/og-image.png",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  locale?: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const viUrl = `${SITE_URL}${cleanPath}`;
  const enUrl = `${SITE_URL}/en${cleanPath === "/" ? "" : cleanPath}`;
  const canonical = locale === "en" ? enUrl : viUrl;

  const metadata: Metadata = {
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
          url: ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`,
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
      images: [ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`],
    },
  };

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: true,
    };
  }

  return metadata;
}

export function generateBreadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http")
        ? item.path
        : `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export function generateHomePageJsonLd({
  locale = "vi",
}: {
  locale?: string;
} = {}) {
  const isEn = locale === "en";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "QuizCarLicense",
        description: isEn
          ? "Official mock exams and 600 theory questions for Vietnam driver's license."
          : "Hệ thống thi thử sát hạch lý thuyết lái xe trực tuyến 600 câu hỏi chuẩn Cục CSGT.",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/cau-hoi?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: isEn ? "en-US" : "vi-VN",
      },
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: "QuizCarLicense",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        name: "QuizCarLicense Assessment Console",
        url: SITE_URL,
        applicationCategory: "EducationalApplication",
        operatingSystem: "All modern web browsers",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "VND",
        },
        featureList: [
          "Thi thử 11 hạng GPLX: A1, A, B, C1, C, D1, D2, D, BE, C1E, CE",
          "Kho 600 câu hỏi sát hạch lý thuyết chuẩn Cục CSGT",
          "Cảnh báo tự động 60 tình huống điểm liệt",
          "Chấm điểm thời gian thực và giải thích chi tiết",
        ],
      },
    ],
  };
}

export function generateQuestionCatalogJsonLd({
  items,
  page,
  pageSize,
  totalCount,
  path = "/cau-hoi",
}: {
  items: { questionId: number; content: string }[];
  page: number;
  pageSize: number;
  totalCount: number;
  path?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ngân hàng 600 câu hỏi sát hạch lý thuyết lái xe",
    description:
      "Tổng hợp toàn bộ 600 câu hỏi lý thuyết kèm đáp án và giải thích chuẩn Bộ Giao thông Vận tải",
    url: `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: items.map((q, idx) => ({
        "@type": "ListItem",
        position: (page - 1) * pageSize + idx + 1,
        name: `Câu hỏi #${q.questionId}: ${
          q.content.length > 80 ? `${q.content.slice(0, 80)}...` : q.content
        }`,
        url: `${SITE_URL}/cau-hoi/${q.questionId}`,
      })),
    },
  };
}

export function generateFaqJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function generateQuestionJsonLd(question: {
  questionId: number;
  content: string;
  image?: string | null;
  explanation?: string | null;
  answers: { id: number; content: string; isCorrect: boolean }[];
}) {
  const correctAnswer = question.answers.find((a) => a.isCorrect);
  const correctText = correctAnswer
    ? question.explanation
      ? `${correctAnswer.content} (Giải thích: ${question.explanation})`
      : correctAnswer.content
    : undefined;

  const imageUrl =
    question.image && question.image !== "none"
      ? question.image.startsWith("http")
        ? question.image
        : `${SITE_URL}${question.image}`
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: `Câu hỏi sát hạch số ${question.questionId}`,
      text: question.content,
      image: imageUrl,
      answerCount: question.answers.length,
      acceptedAnswer: correctAnswer
        ? {
            "@type": "Answer",
            text: correctText,
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
