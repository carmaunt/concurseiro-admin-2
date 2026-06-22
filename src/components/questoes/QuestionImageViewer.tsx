import TextoApoioViewer from '@/components/questoes/TextoApoioViewer';
import type { QuestaoListItem } from '@/types/api';

type Props = {
  item: Pick<QuestaoListItem, 'questaoImagemConteudo' | 'questaoImagemJson'>;
  compact?: boolean;
};

export default function QuestionImageViewer({ item, compact = false }: Props) {
  if (!item.questaoImagemJson) return null;

  return (
    <TextoApoioViewer
      titulo="Imagem do item"
      tipo="IMAGEM"
      conteudo={item.questaoImagemConteudo}
      conteudoJson={item.questaoImagemJson}
      compact={compact}
    />
  );
}
