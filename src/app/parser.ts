import { Viewability, Video } from '@/app/types'

type vidObj = {
    [key: string]: string;
}

const parsePost = (text: string) : Video => {
    const vidObj: vidObj = text.split('\n').reduce((acc, str) => {
        const [key, value] = str.split(/:(.+)/).map((item, index) => index === 0 ? item.trim() : item.trimStart());
        acc[key] = value;
        return acc;
    }, {} as { [key: string]: string });

    return {
        date: vidObj['Date'],
        url: vidObj['Link'],
        likes: vidObj['Like(s)'],
        whoCanView: vidObj['Who can view'] == 'Public'
        ? Viewability.Public : vidObj['Who can view'] == 'Friends'
        ? Viewability.Friends : Viewability.Private,
        canComment: vidObj['Allow comments'] == 'Yes',
        canStitch: vidObj['Allow stitches'] == 'Yes',
        canDuet: vidObj['Allow duets'] == 'Yes',
        canSticker: vidObj['Allow stickers'] == 'Yes',
        canShareToStory: vidObj['Allow sharing to story'] == 'Yes',
    }
}

export const parsePostTXT = (text: string) : Video[] => {
    return text.split("\n\n").map(x => parsePost(x)).filter(x => x['url'])
}