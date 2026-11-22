import type { Metadata, Viewport } from 'next';
import { Onest } from 'next/font/google';
import { AppNav } from '@/components/layout/app-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { I18nProvider } from '@/lib/i18n/provider';
import { getI18n } from '@/lib/i18n/server';
import './globals.css';

// Onest really contains the Mongolian letters Ө ө Ү ү. Check this before changing the font.
const onest = Onest({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-onest',
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.appName, template: `%s | ${t.appName}` },
    description: `${t.welcome.title} ${t.welcome.subtitle}`,
  };
}

export const viewport: Viewport = { themeColor: '#ffffff', viewportFit: 'cover' };

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { locale } = await getI18n();
  return (
    <html lang={locale} className={onest.variable}>
      <body className="flex min-h-dvh flex-col font-sans">
        <I18nProvider initialLocale={locale}>
          <SiteHeader />
          <main id="content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </main>
          <AppNav placement="bottom" />
        </I18nProvider>
      </body>
    </html>
  );
}
