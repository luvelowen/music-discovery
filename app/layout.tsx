import type { Metadata, Viewport } from 'next';
import { Fira_Sans_Extra_Condensed, Golos_Text } from 'next/font/google';
import { AppNav } from '@/components/layout/app-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { I18nProvider } from '@/lib/i18n/provider';
import { getI18n } from '@/lib/i18n/server';
import './globals.css';

// Both really contain Ө ө Ү ү. Check that before changing either font. See DESIGN.md.
const golos = Golos_Text({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], variable: '--font-golos' });
const fira = Fira_Sans_Extra_Condensed({
  weight: '800',
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-fira',
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.appName, template: `%s | ${t.appName}` },
    description: `${t.welcome.title} ${t.welcome.body}`,
  };
}

export const viewport: Viewport = { themeColor: '#000000', viewportFit: 'cover' };

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { locale } = await getI18n();
  return (
    <html lang={locale} className={`${golos.variable} ${fira.variable}`}>
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
