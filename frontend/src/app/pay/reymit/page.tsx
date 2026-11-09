'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReymitPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/cart');
  }, [router]);
  return null;
}
