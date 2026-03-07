"use client";

import { useRouter } from "next/navigation";

type Props = {
  label: string;
  className: string;
  callbackUrl?: string;
  instagramEnabled: boolean;
  fallbackUrl: string;
};

export default function InstagramAuthButton({
  label,
  className,
  callbackUrl = "/",
  instagramEnabled,
  fallbackUrl,
}: Props) {
  const router = useRouter();

  const onClick = () => {
    if (!instagramEnabled) {
      router.push(fallbackUrl);
      return;
    }

    const target = `/api/instagram/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = target;
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}
