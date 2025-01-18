export enum Viewability {
    Public = 'PUBLIC',
    Friends = 'FRIENDS',
    Private = 'PRIVATE',
};

export type Video = {
    date: string,
    url: string,
    likes: string,
    whoCanView: Viewability,
    canComment: boolean,
    canStitch: boolean,
    canDuet: boolean,
    canSticker: boolean,
    canShareToStory: boolean,
}
