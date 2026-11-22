import { redirect } from 'next/navigation';
import { STEPS } from '@/lib/steps';

export default function Page() {
  redirect(`/setup/${STEPS[0]}`);
}
