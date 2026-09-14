export interface ArchitectureComponent {
  id: string;
  technologyId: string;
  name: string;
  purpose: string;
  reason: string;
  alternatives: string[]; // technology names, not ids - ready to display
  tradeoffs: string;
  failureBehavior: string;
  scalingStrategy: string;
}

export interface ArchitectureConnection {
  from: string; // component id
  to: string; // component id
  label?: string;
}

export interface Architecture {
  components: ArchitectureComponent[];
  connections: ArchitectureConnection[];
}
