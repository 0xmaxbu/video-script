// Create a Proxy that returns itself for any property access or function call,
// allowing infinite chaining like z.string().url().min().describe().optional()
function createZodMock(): any {
  const handler: ProxyHandler<Function> = {
    get(_target, prop) {
      if (prop === "parse" || prop === "safeParse") {
        return (val: any) => (prop === "parse" ? val : { success: true, data: val });
      }
      return createZodMock();
    },
    apply(_target, _thisArg, _argArray) {
      return createZodMock();
    },
  };
  return new Proxy(() => {}, handler);
}

const mockZod = createZodMock();

export const z = new Proxy({}, {
  get(_target, prop) {
    if (prop === "infer") {
      return (val: any) => val;
    }
    return mockZod;
  }
});

export default z;
