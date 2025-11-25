export class Desktop {
  public name: string;
  public number: number;
  public visible: boolean;

  public constructor(number: number, name: string, visible: boolean) {
    this.number = number;
    this.name = name;
    this.visible = visible;
  }

  public toString(): string {
    return `Desktop ${String(this.number)}: ${this.name} ${
      this.visible ? '(active)' : ''
    }`;
  }
}
