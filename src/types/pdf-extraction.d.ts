declare module 'pdf-extraction' {
const pdf: (buffer: Buffer) => Promise<{
    text: string;
    metadata: any;
    version: string;
    info: any;
    pages: {
    pageId: number;
    text: string;
    width: number;
    height: number;
    metadata: any;
    }[];
}>;

export default pdf;
}