declare module "yt-search" {
  export interface VideoDuration {
    seconds: number;
    timestamp: string;
  }

  export interface VideoAuthor {
    name?: string;
    url?: string;
  }

  export interface VideoResult {
    title: string;
    url: string;
    videoId: string;
    views: number;
    duration: VideoDuration;
    author: VideoAuthor | string;
    thumbnail: string;
    ago?: string;
    description?: string;
    likes?: number;
  }

  export interface SearchResult {
    videos: VideoResult[];
  }

  export interface VideoIdQuery {
    videoId: string;
  }

  function yts(query: string): Promise<SearchResult>;
  function yts(query: VideoIdQuery): Promise<VideoResult>;

  export = yts;
}
