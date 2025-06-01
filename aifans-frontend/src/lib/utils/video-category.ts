/**
 * 视频类别枚举类型
 */
export type VideoCategory = "IMAGE_TO_VIDEO" | "TEXT_TO_VIDEO" | "FRAME_INTERPOLATION" | "MULTI_IMAGE_REF";

/**
 * 将视频类别枚举转换为中文显示
 * @param category 视频类别枚举值
 * @returns 对应的中文名称
 */
export function getVideoCategoryText(category?: string): string {
  if (!category) return "视频";
  
  switch (category) {
    case "IMAGE_TO_VIDEO":
      return "图生视频";
    case "TEXT_TO_VIDEO":
      return "文生视频";
    case "FRAME_INTERPOLATION":
      return "首尾帧";
    case "MULTI_IMAGE_REF":
      return "多图参考";
    default:
      return "视频";
  }
} 