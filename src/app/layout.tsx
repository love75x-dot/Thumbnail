import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "유튜브 썸네일 추출기 - 무료 고화질 다운로드",
  description: "유튜브 영상의 썸네일을 고화질로 무료 다운로드하세요. 최고화질(1280x720), 표준화질, 고화질, 중간화질까지 모든 해상도 지원. 빠르고 간편한 유튜브 썸네일 저장 도구.",
  keywords: ["유튜브 썸네일", "썸네일 다운로드", "유튜브 이미지 저장", "고화질 썸네일", "무료 썸네일 추출"],
  authors: [{ name: "유튜브 썸네일 추출기" }],
  creator: "유튜브 썸네일 추출기",
  publisher: "유튜브 썸네일 추출기",
  metadataBase: new URL('https://yourdomain.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "유튜브 썸네일 추출기 - 무료 고화질 다운로드",
    description: "유튜브 영상의 썸네일을 고화질로 무료 다운로드하세요. 최고화질부터 중간화질까지 모든 해상도 지원.",
    url: 'https://yourdomain.com',
    siteName: '유튜브 썸네일 추출기',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '유튜브 썸네일 추출기',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "유튜브 썸네일 추출기 - 무료 고화질 다운로드",
    description: "유튜브 영상의 썸네일을 고화질로 무료 다운로드하세요",
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#FF0000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '유튜브 썸네일 추출기',
  description: '유튜브 영상의 고화질 썸네일을 무료로 다운로드하세요',
  url: 'https://yourdomain.com',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
