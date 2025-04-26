declare module 'interfax' {
  export default class InterFAX {
    constructor(options: { username: string, password: string });
    
    delivery: {
      send(params: any): Promise<string>;
    };
    
    outbound: {
      find(id: string): Promise<any>;
      completed(params: any): Promise<any[]>;
      image(id: string, filePath: string): Promise<void>;
    };
  }
}