export type RequestWithQuery = {
    query: {
        [key: string]: string;
    }
    body: Record<string, any>; // You can adjust the type of body as needed

};