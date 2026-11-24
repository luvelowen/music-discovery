import type { Metadata, Viewport } from 'next';
import { Manrope, Montserrat } from 'next/font/google';
import { AppShell } from '@/components/layout/app-shell';
import { AccountProvider } from '@/lib/account/provider';
import { ChatProvider } from '@/lib/chat/provider';
import { PeopleProvider } from '@/lib/people/provider';
import { I18nProvider } from '@/lib/i18n/provider';
import { getI18n } from '@/lib/i18n/server';
import { emailCheckedAt, toAccount } from '@/lib/server/accounts';
import { getDb } from '@/lib/server/db';
import { currentUser } from '@/lib/server/session';
import './globals.css';

// Manrope for reading, Montserrat for big titles. Both really contain Ө ө Ү ү (checked in the browser).
// next/font copies them into the app, so no visitor's browser asks Google for anything.
const manrope = Manrope({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], variable: '--font-manrope', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], variable: '--font-montserrat', weight: ['700', '800'], display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.appName, template: `%s | ${t.appName}` },
    description: `${t.welcome.title} ${t.welcome.body}`,
    robots: { index: false, follow: false }, // Until the launch checklist is done.
  };
}

export const viewport: Viewport = { themeColor: '#000000', viewportFit: 'cover', interactiveWidget: 'resizes-content' };

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [{ locale }, user] = await Promise.all([getI18n(), currentUser()]);
  return (
    <html lang={locale} className={`${manrope.variable} ${montserrat.variable}`}>
      <body className="flex min-h-dvh flex-col bg-night font-sans">
        <I18nProvider initialLocale={locale}>
          {/* Only this person's own data is passed on, and never the password's scrambled value. */}
          <AccountProvider user={user ? { id: user.id, email: user.email, emailChecked: emailCheckedAt(getDb(), user.id) !== null, account: toAccount(user) } : null}>
            <PeopleProvider>
              <ChatProvider>
                <AppShell>{children}</AppShell>
              </ChatProvider>
            </PeopleProvider>
          </AccountProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
