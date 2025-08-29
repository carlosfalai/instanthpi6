declare module "phaxio" {
  export default class Phaxio {
    constructor(apiKey: string, apiSecret: string);

    faxes: {
      create(params: any): Promise<any>;
      retrieve(id: string): Promise<any>;
      list(params: any): Promise<any>;
      file(id: string): Promise<any>;
    };
  }
}
