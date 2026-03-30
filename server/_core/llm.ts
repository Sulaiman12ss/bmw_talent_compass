import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type MessageContent = string | TextContent | ImageContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: { name: string };
};
export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent => {
  if (typeof part === "string") return { type: "text", text: part };
  return part;
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;
  const content = Array.isArray(message.content)
    ? message.content
    : [message.content];

  if (role === "tool" || role === "function") {
    return {
      role,
      name,
      tool_call_id,
      content: content
        .map(p => (typeof p === "string" ? p : JSON.stringify(p)))
        .join("\n"),
    };
  }

  const parts = content.map(normalizeContentPart);
  if (parts.length === 1 && parts[0].type === "text") {
    return { role, name, content: parts[0].text };
  }
  return { role, name, content: parts };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none" || toolChoice === "auto") return toolChoice;
  if (toolChoice === "required") {
    if (!tools || tools.length === 0)
      throw new Error("tool_choice 'required' needs at least one tool");
    if (tools.length > 1)
      throw new Error("tool_choice 'required' needs exactly one tool or specify by name");
    return { type: "function", function: { name: tools[0].function.name } };
  }
  if ("name" in toolChoice)
    return { type: "function", function: { name: toolChoice.name } };
  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: Pick<
  InvokeParams,
  "responseFormat" | "response_format" | "outputSchema" | "output_schema"
>) => {
  const explicit = responseFormat ?? response_format;
  if (explicit) return explicit;
  const schema = outputSchema ?? output_schema;
  if (!schema) return undefined;
  return {
    type: "json_schema" as const,
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gpt-4o",
    messages: messages.map(normalizeMessage),
    max_tokens: maxTokens ?? max_tokens ?? 4096,
  };

  if (tools && tools.length > 0) payload.tools = tools;

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice ?? tool_choice,
    tools
  );
  if (normalizedToolChoice) payload.tool_choice = normalizedToolChoice;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });
  if (normalizedResponseFormat) payload.response_format = normalizedResponseFormat;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
