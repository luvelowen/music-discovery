import { Sleeve } from '@/components/artwork/sleeve';
import { cn } from '@/components/ui/cn';
import type { Profile } from '@/lib/profile/types';

export function Avatar({ profile, className }: { profile: Pick<Profile, 'photo' | 'genres'>; className?: string }) {
  const top = profile.genres[0];
  return (
    <div className={cn('shrink-0 overflow-hidden rounded-full bg-seam', className)}>
      {profile.photo ? (
        // next/image cannot optimise a picture that exists only in this browser.
        <img src={profile.photo} alt="" className="size-full object-cover" />
      ) : (
        top && <Sleeve genre={top} className="size-full" />
      )}
    </div>
  );
}
