import { redirect } from 'next/navigation';
import { WelcomeScreen } from '@/components/welcome/welcome-screen';
import { isComplete } from '@/lib/profile/validation';
import { toAccount } from '@/lib/server/accounts';
import { currentUser } from '@/lib/server/session';

export default async function Page() {
  const user = await currentUser();
  if (user) redirect(isComplete(toAccount(user).profile) ? '/discover' : '/setup/genres');
  return <WelcomeScreen />;
}
