import { cn } from '@/components/ui/cn';
import type { Profile } from '@/lib/profile/types';

/** Someone's own photo once you may see it. Until then, the first letter of their username. */
export function Avatar({ profile, className }: { profile: Pick<Profile, 'photo' | 'username'>; className?: string }) {
  return (
    <div aria-hidden className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full bg-raised text-muted', className)}>
      {profile.photo ? (
        // next/image cannot optimise a picture that is saved as text inside the account.
        <img src={profile.photo} alt="" className="size-full object-cover" />
      ) : (
        ([...profile.username][0] ?? '').toLocaleUpperCase()
      )}
    </div>
  );
}
