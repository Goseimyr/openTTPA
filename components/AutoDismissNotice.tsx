"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  children: string;
  className?: string;
  delay?: number;
  param?: string;
};

export function AutoDismissNotice({ children, className = "notice", delay = 4000, param = "message" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(Boolean(children));

  useEffect(() => {
    if (!children) return;

    setVisible(true);
    const timeout = window.setTimeout(() => {
      setVisible(false);

      const params = new URLSearchParams(searchParams.toString());
      params.delete(param);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [children, delay, param, pathname, router, searchParams]);

  if (!visible) return null;

  return <p className={className}>{children}</p>;
}
