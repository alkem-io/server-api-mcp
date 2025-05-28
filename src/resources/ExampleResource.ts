import { MCPResource, ResourceContent } from "mcp-framework";

class ExampleResource extends MCPResource {
  uri = "resource://example";
  name = "Example";
  description = "Example resource description";
  mimeType = "application/json";

  async read(): Promise<ResourceContent[]> {
    return [
      {
        uri: this.uri,
        mimeType: this.mimeType,
        text: JSON.stringify({ message: "Hello from Example resource" }),
      },
    ];
  }
}

export default ExampleResource;