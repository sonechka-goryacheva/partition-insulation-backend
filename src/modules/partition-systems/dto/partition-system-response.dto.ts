// Единый ответ для списка, ленты и черновика: набор полей всегда одинаковый,
// пустые значения приходят как null. Статус и создатель клиенту не передаются.
export class PartitionSystemResponseDto {
  partitionSystemId: number;
  partitionName: string;
  partitionDescription: string | null;
  partitionThicknessMm: number | null;
  soundIndexRw: number | null;
  partitionPhotoUrl: string | null;
  partitionVideoUrl: string | null;
  partitionLikesCount: number;
  partitionIsLiked: 0 | 1;
  partitionIsMine: 0 | 1;

  constructor(fields: PartitionSystemResponseDto) {
    Object.assign(this, fields);
  }
}
