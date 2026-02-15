import { AVATARS, useUser } from "@/contexts/UserContext";

interface UserAvatarProps {
  avatarId: string;
  className?: string;
}

export function UserAvatar({ avatarId, className = "w-12 h-12" }: UserAvatarProps) {
  const { customAvatar } = useUser();
  
  if (avatarId === 'custom' && customAvatar) {
    return (
      <img 
        src={customAvatar} 
        alt="Avatar" 
        className={`${className} rounded-full border-2 border-primary object-cover bg-white`}
      />
    );
  }

  const avatar = AVATARS[avatarId as keyof typeof AVATARS] || AVATARS['bear'];

  if (avatar.type === 'image') {
    return (
      <img 
        src={avatar.value} 
        alt="Avatar" 
        className={`${className} rounded-full border-2 border-primary object-cover bg-white`}
      />
    );
  }

  return (
    <div className={`${className} rounded-full border-2 border-primary flex items-center justify-center text-2xl ${avatar.bg}`}>
      {avatar.value}
    </div>
  );
}
