declare module "adm-zip" {
  export default class AdmZip {
    constructor(buffer?: Buffer | string);

    getEntries(): { entryName: string; getData(): Buffer }[];
  }
}
