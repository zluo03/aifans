/**
 * 解析可能是JSON字符串或已经是对象的字段
 * @param field 要解析的字段
 * @returns 解析后的数组
 */
export function parseJsonField(field: any): any[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * 解析创作者数据中的JSON字段
 * @param creator 创作者数据
 * @returns 解析后的创作者数据
 */
export function parseCreatorData(creator: any) {
  if (!creator) return null;
  
  return {
    ...creator,
    images: parseJsonField(creator.images),
    videos: parseJsonField(creator.videos),
    audios: parseJsonField(creator.audios),
  };
} 