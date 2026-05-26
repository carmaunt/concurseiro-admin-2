'use client';

import { useParams } from 'next/navigation';
import ProvaQuestaoForm from '@/components/provas/ProvaQuestaoForm';

export default function NovaQuestaoDaProvaPage() {
  const params = useParams();
  const provaId = Number(params?.id);

  return <ProvaQuestaoForm provaId={provaId} />;
}
