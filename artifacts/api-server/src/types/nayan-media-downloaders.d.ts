declare module "nayan-media-downloaders" {
  export interface YtdownData {
    title?: string;
    thumbnail?: string;
    thumb?: string;
    duration?: string | number;
    video?: string;
    audio?: string;
    low?: string;
    high?: string;
    quality?: number;
    channel?: string;
    desc?: string | null;
    video_hd?: string;
  }

  export interface YtdownResult {
    status: boolean;
    developer?: string;
    data?: YtdownData;
  }

  export function ytdown(url: string): Promise<YtdownResult>;
}
