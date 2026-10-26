import type { MetadataRoute } from "next";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:5254";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quizcarlicense.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          "vi-VN": SITE_URL,
          "en-US": `${SITE_URL}/en`,
        },
      },
    },
    {
      url: `${SITE_URL}/cau-hoi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          "vi-VN": `${SITE_URL}/cau-hoi`,
          "en-US": `${SITE_URL}/en/cau-hoi`,
        },
      },
    },
  ];

  try {
    // 1. Lấy danh sách đề thi
    const quizzesRes = await fetch(`${BACKEND_URL}/api/v1/quizzes`, { next: { revalidate: 3600 } });
    if (quizzesRes.ok) {
      const quizzes = (await quizzesRes.json()) as { quizId: number; updatedAt?: string }[];
      for (const q of quizzes) {
        routes.push({
          url: `${SITE_URL}/thi-sat-hach/${q.quizId}`,
          lastModified: q.updatedAt ? new Date(q.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
          alternates: {
            languages: {
              "vi-VN": `${SITE_URL}/thi-sat-hach/${q.quizId}`,
              "en-US": `${SITE_URL}/en/thi-sat-hach/${q.quizId}`,
            },
          },
        });
      }
    }

    // 2. Lấy danh sách 600 câu hỏi công khai
    const questionsRes = await fetch(`${BACKEND_URL}/api/v1/questions?page=1&pageSize=600`, { next: { revalidate: 86400 } });
    if (questionsRes.ok) {
      const data = await questionsRes.json();
      const questions = (data.items || []) as { questionId: number }[];
      for (const q of questions) {
        routes.push({
          url: `${SITE_URL}/cau-hoi/${q.questionId}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
          alternates: {
            languages: {
              "vi-VN": `${SITE_URL}/cau-hoi/${q.questionId}`,
              "en-US": `${SITE_URL}/en/cau-hoi/${q.questionId}`,
            },
          },
        });
      }
    }
  } catch (err) {
    console.warn("Could not fetch sitemap dynamic routes from backend:", err);
  }

  return routes;
}
